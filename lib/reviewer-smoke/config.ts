export type ReviewerSmokeState =
  | 'checkout_required'
  | 'required_setup'
  | 'dashboard_unlocked'

export const REVIEWER_SMOKE_NEXT_PATHS: Record<ReviewerSmokeState, string> = {
  checkout_required: '/nic-nac?onboarding=checkout-required',
  required_setup: '/nic-nac?onboarding=required-setup',
  dashboard_unlocked: '/nic-nac',
}

export function reviewerSmokeModeEnabled(env: NodeJS.ProcessEnv = process.env) {
  const flag = env.SPARKLE_REVIEWER_SMOKE_MODE?.trim().toLowerCase()
  if (flag !== 'true' && flag !== '1') return false
  if (env.VERCEL_ENV === 'production') return false
  return true
}

export function getReviewerSmokeToken(env: NodeJS.ProcessEnv = process.env) {
  return env.SPARKLE_REVIEWER_SMOKE_TOKEN?.trim() ?? ''
}

export function isReviewerSmokeTokenValid(
  token: unknown,
  env: NodeJS.ProcessEnv = process.env,
) {
  const expected = getReviewerSmokeToken(env)
  return (
    reviewerSmokeModeEnabled(env) &&
    expected.length >= 12 &&
    typeof token === 'string' &&
    token.trim() === expected
  )
}

export function getReviewerSmokePersona(env: NodeJS.ProcessEnv = process.env) {
  return {
    displayName:
      env.SPARKLE_REVIEWER_SMOKE_DISPLAY_NAME?.trim() || 'Britt Test Rep',
    email:
      env.SPARKLE_REVIEWER_SMOKE_EMAIL?.trim().toLowerCase() ||
      'sparkle-reviewer+preview@neonrabbit.net',
    password:
      env.SPARKLE_REVIEWER_SMOKE_PASSWORD?.trim() ||
      'SparkleReviewer2026!',
  }
}

export function normalizeReviewerSmokeState(value: unknown): ReviewerSmokeState {
  return value === 'required_setup' || value === 'dashboard_unlocked'
    ? value
    : 'checkout_required'
}
