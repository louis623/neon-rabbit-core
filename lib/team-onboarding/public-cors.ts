import { getTeamOnboardingAllowedOrigins } from '@/lib/team-onboarding/invite-url'

export function getTeamOnboardingCorsHeaders(request: Request) {
  const headers = new Headers()
  const origin = request.headers.get('origin')
  if (!origin) return headers

  headers.set('Vary', 'Origin')
  if (!getTeamOnboardingAllowedOrigins().has(origin)) return headers

  headers.set('Access-Control-Allow-Origin', origin)
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Content-Type')
  headers.set('Access-Control-Max-Age', '86400')
  return headers
}

export function getTeamOnboardingPublicHeaders(request: Request) {
  const headers = getTeamOnboardingCorsHeaders(request)
  headers.set('Cache-Control', 'no-store, max-age=0')
  headers.set('Pragma', 'no-cache')
  headers.set('Referrer-Policy', 'no-referrer')
  return headers
}
