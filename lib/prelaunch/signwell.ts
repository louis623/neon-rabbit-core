export const PRELAUNCH_AGREEMENT_GATE_TYPES = ['service_agreement'] as const

export type PrelaunchAgreementGateType =
  (typeof PRELAUNCH_AGREEMENT_GATE_TYPES)[number]

type EnvLike = Record<string, string | undefined>

export type PrelaunchSignWellMode = 'sandbox' | 'dry_run' | 'live_blocked'
export const DEFAULT_SIGNWELL_TEMPLATE_RECIPIENT_PLACEHOLDER =
  'sparkle_suite_rep'

interface PrelaunchSignWellMetadataOptions {
  gateType: PrelaunchAgreementGateType
  intakeId: string
  waitlistId?: string | null
  operatorRepId?: string | null
}

interface PrelaunchSignWellAgreementPayloadOptions {
  templateId: string
  recipientPlaceholderName?: string | null
  recipient: {
    name?: string | null
    email: string
  }
  metadata: ReturnType<typeof buildPrelaunchSignWellMetadata>
  mode: Extract<PrelaunchSignWellMode, 'sandbox' | 'dry_run'>
}

type PrelaunchSignWellAgreementPayload = ReturnType<
  typeof buildPrelaunchSignWellAgreementPayload
>

export interface PrelaunchSignWellSandboxSubmitResult {
  providerStatus: number
  documentId: string | null
  recipientCount: number
  testMode: true
  sendEmail: boolean
  draft: boolean
}

export class PrelaunchSignWellProviderError extends Error {
  status?: number
  safeProviderDetail?: string

  constructor(
    message: string,
    options: { status?: number; safeProviderDetail?: string } = {},
  ) {
    super(message)
    this.name = 'PrelaunchSignWellProviderError'
    this.status = options.status
    this.safeProviderDetail = options.safeProviderDetail
  }
}

export function normalizePrelaunchAgreementGateType(value: unknown) {
  if (typeof value !== 'string') return null
  return PRELAUNCH_AGREEMENT_GATE_TYPES.find((type) => type === value) ?? null
}

export function getPrelaunchSignWellConfig(env: EnvLike = process.env) {
  const apiKey = env.SIGNWELL_API_KEY?.trim()
  const apiBaseUrl = env.SIGNWELL_API_BASE_URL?.trim()
  const templateId = env.SIGNWELL_TEMPLATE_ID?.trim()

  if (!apiKey || !apiBaseUrl || !templateId) return null

  return {
    apiKey,
    apiBaseUrl,
    templateId,
    recipientPlaceholderName:
      env.SIGNWELL_TEMPLATE_RECIPIENT_PLACEHOLDER?.trim() ||
      DEFAULT_SIGNWELL_TEMPLATE_RECIPIENT_PLACEHOLDER,
  }
}

export function getPrelaunchSignWellLiveSendMode(env: EnvLike = process.env): {
  allowLiveSend: boolean
  mode: Extract<PrelaunchSignWellMode, 'sandbox' | 'live_blocked'>
} {
  const allowLiveSend = env.SIGNWELL_ALLOW_LIVE_SEND?.trim() === 'true'

  return {
    allowLiveSend,
    mode: allowLiveSend ? 'sandbox' : 'live_blocked',
  }
}

export function buildPrelaunchSignWellMetadata({
  gateType,
  intakeId,
  waitlistId,
  operatorRepId,
}: PrelaunchSignWellMetadataOptions) {
  return {
    platform: 'sparkle_suite',
    agreement_gate: gateType,
    sparkle_suite_agreement_gate: 'true',
    intake_submission_id: intakeId,
    waitlist_id: waitlistId?.trim() || null,
    operator_rep_id: operatorRepId?.trim() || null,
  }
}

function buildProviderMetadata(
  metadata: ReturnType<typeof buildPrelaunchSignWellMetadata>,
) {
  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== null),
  ) as Record<string, string>
}

export function buildPrelaunchSignWellAgreementPayload({
  templateId,
  recipientPlaceholderName,
  recipient,
  metadata,
  mode,
}: PrelaunchSignWellAgreementPayloadOptions) {
  return {
    test_mode: mode !== 'dry_run',
    template_id: templateId,
    send_email: false,
    draft: true,
    recipients: [
      {
        id: 'sparkle_suite_rep',
        placeholder_name:
          recipientPlaceholderName?.trim() ||
          DEFAULT_SIGNWELL_TEMPLATE_RECIPIENT_PLACEHOLDER,
        name: recipient.name?.trim() || recipient.email,
        email: recipient.email,
      },
    ],
    metadata: buildProviderMetadata(metadata),
  }
}

function buildSignWellApiUrl(apiBaseUrl: string, path: string) {
  const normalizedBaseUrl = apiBaseUrl.replace(/\/+$/, '')
  const normalizedPath = path.replace(/^\/+/, '')
  return `${normalizedBaseUrl}/${normalizedPath}`
}

async function readJsonObject(response: Response) {
  const text = await response.text()
  if (!text.trim()) return null

  try {
    const parsed = JSON.parse(text) as unknown
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

function redactProviderMessage(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
      '[uuid]',
    )
    .replace(/\b(?:tmpl|template|doc|document|price|whsec)_[A-Za-z0-9_-]+\b/g, '[id]')
    .slice(0, 180)
}

function collectProviderMessages(
  value: unknown,
  messages: string[],
  allowStrings = false,
) {
  if (messages.length >= 4) return

  if (typeof value === 'string') {
    if (!allowStrings) return
    const redacted = redactProviderMessage(value.trim())
    if (redacted) messages.push(redacted)
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) collectProviderMessages(item, messages, allowStrings)
    return
  }

  if (value && typeof value === 'object') {
    for (const [key, nestedValue] of Object.entries(value)) {
      const isErrorContainer = ['error', 'errors'].includes(key.toLowerCase())
      if (
        isErrorContainer ||
        ['message', 'messages', 'detail', 'details'].includes(key.toLowerCase())
      ) {
        collectProviderMessages(nestedValue, messages, true)
      }
    }
  }
}

function collectProviderErrorFields(
  value: unknown,
  fields: string[],
  prefix = '',
) {
  if (fields.length >= 8) return
  if (!value || typeof value !== 'object' || Array.isArray(value)) return

  for (const [key, nestedValue] of Object.entries(value)) {
    const safeKey = key.replace(/[^A-Za-z0-9_.-]/g, '_').slice(0, 60)
    const path = prefix ? `${prefix}.${safeKey}` : safeKey
    if (!['error', 'errors', 'message', 'messages', 'detail', 'details'].includes(safeKey.toLowerCase())) {
      fields.push(path)
    }
    collectProviderErrorFields(nestedValue, fields, path)
  }
}

export function summarizeSignWellProviderErrorBody(
  body: Record<string, unknown> | null,
) {
  if (!body) return null

  const keys = Object.keys(body).slice(0, 8)
  const messages: string[] = []
  collectProviderMessages(body, messages)
  const fields: string[] = []
  collectProviderErrorFields(body.errors, fields)

  return [
    keys.length > 0 ? `keys=${keys.join(',')}` : null,
    fields.length > 0 ? `error_fields=${fields.join(',')}` : null,
    messages.length > 0 ? `messages=${messages.join(' | ')}` : null,
  ]
    .filter(Boolean)
    .join('; ')
}

export async function submitPrelaunchSignWellSandboxAgreement(input: {
  config: NonNullable<ReturnType<typeof getPrelaunchSignWellConfig>>
  agreementPayload: PrelaunchSignWellAgreementPayload
  fetchImpl?: typeof fetch
}): Promise<PrelaunchSignWellSandboxSubmitResult> {
  if (input.agreementPayload.test_mode !== true) {
    throw new PrelaunchSignWellProviderError(
      'SignWell sandbox provider smoke requires test_mode=true.',
    )
  }
  if (input.agreementPayload.send_email !== false) {
    throw new PrelaunchSignWellProviderError(
      'SignWell sandbox provider smoke requires send_email=false.',
    )
  }
  if (input.agreementPayload.draft !== true) {
    throw new PrelaunchSignWellProviderError(
      'SignWell sandbox provider smoke requires draft=true.',
    )
  }

  const fetchImpl = input.fetchImpl ?? fetch
  const response = await fetchImpl(
    buildSignWellApiUrl(
      input.config.apiBaseUrl,
      '/document_templates/documents',
    ),
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': input.config.apiKey,
      },
      body: JSON.stringify(input.agreementPayload),
    },
  )
  const body = await readJsonObject(response)

  if (!response.ok) {
    const safeProviderDetail = summarizeSignWellProviderErrorBody(body)
    throw new PrelaunchSignWellProviderError(
      [
        `SignWell sandbox provider call failed with status ${response.status}.`,
        safeProviderDetail ? `Provider detail: ${safeProviderDetail}.` : null,
      ]
        .filter(Boolean)
        .join(' '),
      { status: response.status, safeProviderDetail: safeProviderDetail ?? undefined },
    )
  }

  const documentId = typeof body?.id === 'string' ? body.id : null
  const recipients = Array.isArray(body?.recipients) ? body.recipients : []

  return {
    providerStatus: response.status,
    documentId,
    recipientCount: recipients.length,
    testMode: true,
    sendEmail: false,
    draft: true,
  }
}

export async function submitPrelaunchSignWellTestAgreementEmail(input: {
  config: NonNullable<ReturnType<typeof getPrelaunchSignWellConfig>>
  agreementPayload: PrelaunchSignWellAgreementPayload
  fetchImpl?: typeof fetch
}): Promise<PrelaunchSignWellSandboxSubmitResult> {
  const agreementPayload = {
    ...input.agreementPayload,
    test_mode: true,
    send_email: true,
    draft: false,
  }
  const fetchImpl = input.fetchImpl ?? fetch
  const response = await fetchImpl(
    buildSignWellApiUrl(input.config.apiBaseUrl, '/document_templates/documents'),
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': input.config.apiKey,
      },
      body: JSON.stringify(agreementPayload),
    },
  )
  const body = await readJsonObject(response)

  if (!response.ok) {
    const safeProviderDetail = summarizeSignWellProviderErrorBody(body)
    throw new PrelaunchSignWellProviderError(
      [
        `SignWell test agreement email failed with status ${response.status}.`,
        safeProviderDetail ? `Provider detail: ${safeProviderDetail}.` : null,
      ]
        .filter(Boolean)
        .join(' '),
      { status: response.status, safeProviderDetail: safeProviderDetail ?? undefined },
    )
  }

  const documentId = typeof body?.id === 'string' ? body.id : null
  const recipients = Array.isArray(body?.recipients) ? body.recipients : []

  return {
    providerStatus: response.status,
    documentId,
    recipientCount: recipients.length,
    testMode: true,
    sendEmail: true,
    draft: false,
  }
}
