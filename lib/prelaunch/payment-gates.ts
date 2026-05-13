export const PRELAUNCH_PAYMENT_GATE_TYPES = [
  'start_work_fee',
  'launch_fee',
] as const

export type PrelaunchPaymentGateType =
  (typeof PRELAUNCH_PAYMENT_GATE_TYPES)[number]

type EnvLike = Record<string, string | undefined>

interface PrelaunchPaymentGateMetadataOptions {
  gateType: PrelaunchPaymentGateType
  intakeId: string
  waitlistId?: string | null
  operatorRepId?: string | null
}

const PRICE_ENV_BY_GATE_TYPE: Record<PrelaunchPaymentGateType, string> = {
  start_work_fee: 'STRIPE_PRICE_START_WORK_FEE',
  launch_fee: 'STRIPE_PRICE_LAUNCH_FEE',
}

export function normalizePrelaunchPaymentGateType(value: unknown) {
  if (typeof value !== 'string') return null
  return PRELAUNCH_PAYMENT_GATE_TYPES.find((type) => type === value) ?? null
}

export function getPrelaunchPaymentGatePriceId(
  gateType: PrelaunchPaymentGateType,
  env: EnvLike = process.env,
) {
  return env[PRICE_ENV_BY_GATE_TYPE[gateType]]?.trim() || null
}

export function buildPrelaunchPaymentGateMetadata({
  gateType,
  intakeId,
  waitlistId,
  operatorRepId,
}: PrelaunchPaymentGateMetadataOptions) {
  return {
    platform: 'sparkle_suite',
    payment_gate: gateType,
    sparkle_suite_payment_gate: 'true',
    intake_submission_id: intakeId,
    waitlist_id: waitlistId?.trim() || null,
    operator_rep_id: operatorRepId?.trim() || null,
  }
}
