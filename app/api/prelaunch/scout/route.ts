import { NextResponse } from 'next/server'

import { runPrelaunchScoutForIntake } from '@/lib/prelaunch/scout'
import { ServiceError } from '@/lib/services/errors'
import {
  AuthError,
  getAuthenticatedOperator,
  OperatorAuthError,
} from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function parseIntakeId(body: unknown) {
  if (
    body &&
    typeof body === 'object' &&
    'intakeId' in body &&
    typeof body.intakeId === 'string' &&
    body.intakeId.trim()
  ) {
    return body.intakeId.trim()
  }

  return null
}

export async function POST(request: Request) {
  try {
    const operator = await getAuthenticatedOperator()
    const body = await request.json()
    const intakeId = parseIntakeId(body)

    if (!intakeId) {
      return NextResponse.json(
        { error: 'intakeId is required.' },
        { status: 400 },
      )
    }

    const result = await runPrelaunchScoutForIntake({
      intakeId,
      operatorRepId: operator.repId,
    })

    return NextResponse.json({
      ok: true,
      runKey: result.runKey,
      output: result.output,
    })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request payload.' },
        { status: 400 },
      )
    }
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    if (error instanceof OperatorAuthError) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { code: error.code, error: error.userMessage },
        { status: error.statusCode },
      )
    }

    console.error('[prelaunch/scout] Error:', error)
    return NextResponse.json(
      { error: 'Failed to run Scout for this intake.' },
      { status: 500 },
    )
  }
}
