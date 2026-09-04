import {
  handleTeamOnboardingOptions,
  handleTeamOnboardingProgressPost,
  inviteTokenFromQuery,
} from '@/app/api/team-onboarding/access/public-handlers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function POST(request: Request) {
  return handleTeamOnboardingProgressPost(request, inviteTokenFromQuery(request))
}

export function OPTIONS(request: Request) {
  return handleTeamOnboardingOptions(request)
}
