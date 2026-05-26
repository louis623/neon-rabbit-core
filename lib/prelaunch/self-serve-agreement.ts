export interface SelfServeAgreementAcceptanceInput {
  repId: string
  accountId: string
  checkoutSessionId: string
  acceptedAt: Date
  ipAddress?: string | null
  userAgent?: string | null
}

export interface SelfServeAgreementAcceptanceEvidence {
  agreementVersion: string
  acceptedAt: string
  repId: string
  accountId: string
  checkoutSessionId: string
  ipAddress: string | null
  userAgent: string | null
  provider: 'clickwrap'
  signWellRequired: false
}

export function getSelfServeAgreementVersion() {
  return 'sparkle-suite-terms-2026-05-09'
}

function cleanRequired(value: string, label: string) {
  const cleaned = value.trim()
  if (!cleaned) throw new Error(`${label} is required.`)
  return cleaned
}

function cleanOptional(value: string | null | undefined) {
  const cleaned = value?.trim()
  return cleaned || null
}

export function buildSelfServeAgreementAcceptanceEvidence(
  input: SelfServeAgreementAcceptanceInput,
): SelfServeAgreementAcceptanceEvidence {
  return {
    agreementVersion: getSelfServeAgreementVersion(),
    acceptedAt: input.acceptedAt.toISOString(),
    repId: cleanRequired(input.repId, 'repId'),
    accountId: cleanRequired(input.accountId, 'accountId'),
    checkoutSessionId: cleanRequired(
      input.checkoutSessionId,
      'checkoutSessionId',
    ),
    ipAddress: cleanOptional(input.ipAddress),
    userAgent: cleanOptional(input.userAgent),
    provider: 'clickwrap',
    signWellRequired: false,
  }
}
