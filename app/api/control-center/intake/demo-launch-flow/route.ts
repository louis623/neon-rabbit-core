import { NextResponse } from 'next/server'

import { runDemoLaunchRun } from '@/lib/prelaunch/demo-launch-run'
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
  return '/control-center/intake#reps'
}

async function parsePayload(request: Request) {
  if (isJsonRequest(request)) {
    const body = (await request.json()) as Record<string, unknown>

    return {
      demoRepEmail: readString(body.demoRepEmail),
      leadName: readString(body.leadName),
      businessName: readString(body.businessName),
      returnTo: '/control-center/intake#reps',
      wantsJson: true,
    }
  }

  const form = await request.formData()

  return {
    demoRepEmail: readString(form.get('demoRepEmail')),
    leadName: readString(form.get('leadName')),
    businessName: readString(form.get('businessName')),
    returnTo: sanitizeReturnTo(readString(form.get('returnTo'))),
    wantsJson: false,
  }
}

export async function POST(request: Request) {
  try {
    const operator = await getAuthenticatedOperator()
    const payload = await parsePayload(request)

    const result = await runDemoLaunchRun({
      demoRepEmail: payload.demoRepEmail,
      leadName: payload.leadName,
      businessName: payload.businessName,
      operatorRepId: operator.repId,
    })

    if (!payload.wantsJson) {
      return NextResponse.redirect(new URL(payload.returnTo, request.url), 303)
    }

    return NextResponse.json({ ok: true, result })
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

    console.error('[control-center/intake/demo-launch-flow] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create or refresh the demo launch run.' },
      { status: 500 },
    )
  }
}
