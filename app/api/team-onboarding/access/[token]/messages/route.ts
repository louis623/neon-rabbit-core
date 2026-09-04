import {
  handleTeamOnboardingMessagePost,
  handleTeamOnboardingOptions,
} from '@/app/api/team-onboarding/access/public-handlers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  return handleTeamOnboardingMessagePost(request, token)
}

export function OPTIONS(request: Request) {
  return handleTeamOnboardingOptions(request)
}
