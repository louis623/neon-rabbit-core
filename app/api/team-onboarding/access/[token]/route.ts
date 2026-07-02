import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ServiceError } from '@/lib/services/errors'
import { getTeamOnboardingParticipantByToken } from '@/lib/services/team-onboarding'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function serviceErrorResponse(error: ServiceError) {
  const userMessage = error.code === 'UNAUTHORIZED'
    ? 'This onboarding link is invalid or has been turned off. Ask your team leader for a fresh link.'
    : error.userMessage

  return NextResponse.json(
    { code: error.code, error: userMessage },
    { status: error.statusCode },
  )
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const state = await getTeamOnboardingParticipantByToken(
      createAdminClient(),
      token,
    )
    return NextResponse.json(state)
  } catch (error) {
    if (error instanceof ServiceError) return serviceErrorResponse(error)
    throw error
  }
}
