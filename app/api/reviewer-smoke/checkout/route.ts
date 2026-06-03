import { NextResponse } from 'next/server'
import { isReviewerSmokeTokenValid, getReviewerSmokePersona } from '@/lib/reviewer-smoke/config'
import { resetReviewerSmokeSession } from '@/lib/reviewer-smoke/session'
import { AuthError, getAuthenticatedRep } from '@/lib/supabase/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!isReviewerSmokeTokenValid(body?.token)) {
    return NextResponse.json(
      {
        code: 'REVIEWER_SMOKE_DISABLED',
        error: 'Reviewer smoke mode is not available.',
      },
      { status: 403 },
    )
  }

  try {
    const { rep } = await getAuthenticatedRep()
    const persona = getReviewerSmokePersona()
    if (rep.email.trim().toLowerCase() !== persona.email) {
      return NextResponse.json(
        {
          code: 'REVIEWER_ACCOUNT_REQUIRED',
          error: 'Sign in with the reviewer smoke account before simulating checkout.',
        },
        { status: 403 },
      )
    }

    const result = await resetReviewerSmokeSession('required_setup')
    return NextResponse.json({
      ok: true,
      state: result.state,
      next: result.next,
      simulated: true,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.error('[reviewer-smoke/checkout] Error:', error)
    return NextResponse.json(
      { error: 'Unable to simulate reviewer checkout.' },
      { status: 500 },
    )
  }
}
