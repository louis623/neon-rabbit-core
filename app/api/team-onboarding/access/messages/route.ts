import {
  handleTeamOnboardingMessagePost,
  handleTeamOnboardingOptions,
  inviteTokenFromQuery,
} from '@/app/api/team-onboarding/access/public-handlers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function POST(request: Request) {
  return handleTeamOnboardingMessagePost(request, inviteTokenFromQuery(request))
}

export function OPTIONS(request: Request) {
  return handleTeamOnboardingOptions(request)
}
