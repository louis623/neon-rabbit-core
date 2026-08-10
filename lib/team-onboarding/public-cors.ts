const DEFAULT_TEAM_ONBOARDING_ORIGIN =
  'https://brittwithbling-start-strong.louis526569.chatgpt.site'

function normalizedOrigin(value: string) {
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

export function getTeamOnboardingAllowedOrigins() {
  const configured = (process.env.TEAM_ONBOARDING_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => normalizedOrigin(value.trim()))
    .filter((value): value is string => Boolean(value))
  const configuredBaseUrl = normalizedOrigin(process.env.TEAM_ONBOARDING_BASE_URL ?? '')

  return new Set([
    DEFAULT_TEAM_ONBOARDING_ORIGIN,
    ...configured,
    ...(configuredBaseUrl ? [configuredBaseUrl] : []),
  ])
}

export function getTeamOnboardingCorsHeaders(request: Request) {
  const headers = new Headers()
  const origin = request.headers.get('origin')
  if (!origin || !getTeamOnboardingAllowedOrigins().has(origin)) return headers

  headers.set('Access-Control-Allow-Origin', origin)
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type')
  headers.set('Access-Control-Max-Age', '86400')
  headers.set('Vary', 'Origin')
  return headers
}
