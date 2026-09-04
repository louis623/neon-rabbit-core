import {
  handleTeamOnboardingAccessGet,
  handleTeamOnboardingOptions,
  inviteTokenFromQuery,
} from '@/app/api/team-onboarding/access/public-handlers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function GET(request: Request) {
  return handleTeamOnboardingAccessGet(request, inviteTokenFromQuery(request))
}

export function OPTIONS(request: Request) {
  return handleTeamOnboardingOptions(request)
}
