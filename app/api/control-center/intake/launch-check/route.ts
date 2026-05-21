import { NextResponse } from 'next/server'

import {
  type PrelaunchLaunchCheckStatus,
  upsertPrelaunchLaunchCheck,
} from '@/lib/prelaunch/launch-checks'
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

function readStatus(value: unknown): PrelaunchLaunchCheckStatus {
  const status = readString(value)
  if (status === 'passed' || status === 'blocked') return status
  return 'not_started'
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
      launchBuildId: readString(body.launchBuildId),
      checkKey: readString(body.checkKey),
      status: readStatus(body.status),
      notes: readString(body.notes),
      returnTo: '/control-center/intake',
      wantsJson: true,
    }
  }

  const form = await request.formData()

  return {
    launchBuildId: readString(form.get('launchBuildId')),
    checkKey: readString(form.get('checkKey')),
    status: readStatus(form.get('status')),
    notes: readString(form.get('notes')),
    returnTo: sanitizeReturnTo(readString(form.get('returnTo'))),
    wantsJson: false,
  }
}

export async function POST(request: Request) {
  try {
    await getAuthenticatedOperator()
    const payload = await parsePayload(request)

    if (!payload.launchBuildId) {
      return NextResponse.json(
        { error: 'launchBuildId is required.' },
        { status: 400 },
      )
    }

    if (!payload.checkKey) {
      return NextResponse.json(
        { error: 'checkKey is required.' },
        { status: 400 },
      )
    }

    const check = await upsertPrelaunchLaunchCheck({
      launchBuildId: payload.launchBuildId,
      checkKey: payload.checkKey,
      status: payload.status,
      notes: payload.notes,
    })

    if (!payload.wantsJson) {
      return NextResponse.redirect(new URL(payload.returnTo, request.url), 303)
    }

    return NextResponse.json({ ok: true, check })
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

    console.error('[control-center/intake/launch-check] Error:', error)
    return NextResponse.json(
      { error: 'Failed to save this launch check.' },
      { status: 500 },
    )
  }
}
