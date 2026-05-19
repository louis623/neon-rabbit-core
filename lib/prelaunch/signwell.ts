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

export interface PrelaunchSignWellSandboxSubmitResult {
  providerStatus: number
  documentId: string | null
  recipientCount: number
  testMode: true
  sendEmail: false
}

export class PrelaunchSignWellProviderError extends Error {
  status?: number

  constructor(message: string, options: { status?: number } = {}) {
    super(message)
    this.name = 'PrelaunchSignWellProviderError'
    this.status = options.status
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
    metadata,
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

export async function submitPrelaunchSignWellSandboxAgreement(input: {
  config: NonNullable<ReturnType<typeof getPrelaunchSignWellConfig>>
  agreementPayload: ReturnType<typeof buildPrelaunchSignWellAgreementPayload>
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
    throw new PrelaunchSignWellProviderError(
      `SignWell sandbox provider call failed with status ${response.status}.`,
      { status: response.status },
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
  }
}
