import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ServiceError } from '@/lib/services/errors'
import { recordTeamOnboardingProgress } from '@/lib/services/team-onboarding'

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const body = await request.json()
    const { token } = await params
    const progress = await recordTeamOnboardingProgress(
      createAdminClient(),
      token,
      {
        stepId: body?.stepId,
        status: body?.status,
      },
    )
    return NextResponse.json({ ok: true, progress })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
    }
    if (error instanceof ServiceError) return serviceErrorResponse(error)
    throw error
  }
}
