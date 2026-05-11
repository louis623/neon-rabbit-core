import { NextResponse } from 'next/server'

import { loadPrelaunchIntakeReviewSubmissions } from '@/lib/prelaunch/intake-review-query'
import {
  AuthError,
  getAuthenticatedOperator,
  OperatorAuthError,
} from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await getAuthenticatedOperator()
    const submissions = await loadPrelaunchIntakeReviewSubmissions()

    return NextResponse.json({
      submissions,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    if (error instanceof OperatorAuthError) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
    console.error('[prelaunch/intake/review] Error:', error)
    return NextResponse.json(
      { error: 'Failed to load intake submissions.' },
      { status: 500 },
    )
  }
}
