export const PRELAUNCH_AGREEMENT_GATE_TYPES = ['service_agreement'] as const

export type PrelaunchAgreementGateType =
  (typeof PRELAUNCH_AGREEMENT_GATE_TYPES)[number]

type EnvLike = Record<string, string | undefined>

export type PrelaunchSignWellMode = 'sandbox' | 'dry_run' | 'live_blocked'

interface PrelaunchSignWellMetadataOptions {
  gateType: PrelaunchAgreementGateType
  intakeId: string
  waitlistId?: string | null
  operatorRepId?: string | null
}

interface PrelaunchSignWellAgreementPayloadOptions {
  templateId: string
  recipient: {
    name?: string | null
    email: string
  }
  metadata: ReturnType<typeof buildPrelaunchSignWellMetadata>
  mode: Extract<PrelaunchSignWellMode, 'sandbox' | 'dry_run'>
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
        name: recipient.name?.trim() || recipient.email,
        email: recipient.email,
      },
    ],
    metadata,
  }
}
