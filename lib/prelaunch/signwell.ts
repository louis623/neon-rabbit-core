export const PRELAUNCH_AGREEMENT_GATE_TYPES = ['service_agreement'] as const

export type PrelaunchAgreementGateType =
  (typeof PRELAUNCH_AGREEMENT_GATE_TYPES)[number]

type EnvLike = Record<string, string | undefined>

interface PrelaunchSignWellMetadataOptions {
  gateType: PrelaunchAgreementGateType
  intakeId: string
  waitlistId?: string | null
  operatorRepId?: string | null
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
