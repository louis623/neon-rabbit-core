import { NextResponse } from 'next/server'
import {
  isReviewerSmokeTokenValid,
  normalizeReviewerSmokeState,
} from '@/lib/reviewer-smoke/config'
import { resetReviewerSmokeSession } from '@/lib/reviewer-smoke/session'

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
    const result = await resetReviewerSmokeSession(
      normalizeReviewerSmokeState(body?.state),
    )
    return NextResponse.json(result)
  } catch (error) {
    console.error('[reviewer-smoke/session] Error:', error)
    return NextResponse.json(
      { error: 'Unable to prepare reviewer smoke session.' },
      { status: 500 },
    )
  }
}
