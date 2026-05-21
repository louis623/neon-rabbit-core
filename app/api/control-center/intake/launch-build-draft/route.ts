import { NextResponse } from 'next/server'

import { createPrelaunchLaunchBuildDraft } from '@/lib/prelaunch/launch-builds'
import {
  AuthError,
  getAuthenticatedOperator,
  OperatorAuthError,
} from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function isJsonRequest(request: Request) {
  return (
    request.headers.get('content-type')?.includes('application/json') ?? false
  )
}

function sanitizeReturnTo(value: string) {
  if (value.startsWith('/control-center/intake')) return value
  return '/control-center/intake'
}

async function parsePayload(request: Request) {
  if (isJsonRequest(request)) {
    const body = (await request.json()) as Record<string, unknown>

    return {
      waitlistId: readString(body.waitlistId),
      intakeSubmissionId: readString(body.intakeSubmissionId),
      returnTo: '/control-center/intake',
      wantsJson: true,
    }
  }

  const form = await request.formData()

  return {
    waitlistId: readString(form.get('waitlistId')),
    intakeSubmissionId: readString(form.get('intakeSubmissionId')),
    returnTo: sanitizeReturnTo(readString(form.get('returnTo'))),
    wantsJson: false,
  }
}

export async function POST(request: Request) {
  try {
    const operator = await getAuthenticatedOperator()
    const payload = await parsePayload(request)

    if (!payload.waitlistId && !payload.intakeSubmissionId) {
      return NextResponse.json(
        { error: 'waitlistId or intakeSubmissionId is required.' },
        { status: 400 },
      )
    }

    const build = await createPrelaunchLaunchBuildDraft({
      waitlistId: payload.waitlistId || null,
      intakeSubmissionId: payload.intakeSubmissionId || null,
      operatorRepId: operator.repId,
    })

    if (!payload.wantsJson) {
      return NextResponse.redirect(new URL(payload.returnTo, request.url), 303)
    }

    return NextResponse.json({ ok: true, build })
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

    console.error('[control-center/intake/launch-build-draft] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create this launch build draft.' },
      { status: 500 },
    )
  }
}
