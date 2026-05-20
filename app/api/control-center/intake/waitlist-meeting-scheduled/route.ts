import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import {
  AuthError,
  getAuthenticatedOperator,
  OperatorAuthError,
} from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function readString(value: FormDataEntryValue | unknown) {
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
      leadId: readString(body.leadId),
      returnTo: sanitizeReturnTo(readString(body.returnTo)),
      wantsJson: true,
    }
  }

  const form = await request.formData()

  return {
    leadId: readString(form.get('leadId')),
    returnTo: sanitizeReturnTo(readString(form.get('returnTo'))),
    wantsJson: false,
  }
}

function jsonOrRedirect(
  request: Request,
  payload: {
    leadId: string
    leadStatus: string
    returnTo: string
    wantsJson: boolean
  },
) {
  if (payload.wantsJson) {
    return NextResponse.json({
      ok: true,
      leadId: payload.leadId,
      leadStatus: payload.leadStatus,
    })
  }

  return NextResponse.redirect(new URL(payload.returnTo, request.url), 303)
}

export async function POST(request: Request) {
  try {
    await getAuthenticatedOperator()

    const payload = await parsePayload(request)

    if (!payload.leadId) {
      return NextResponse.json({ error: 'leadId is required.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('sparkle_suite_waitlist')
      .update({
        lead_status: 'meeting_scheduled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.leadId)
      .eq('lead_status', 'contacted')
      .eq('handoff_status', 'not_started')
      .is('intake_submission_id', null)
      .select('id, lead_status')
      .single()

    if (error) {
      const status = error.code === 'PGRST116' ? 409 : 500
      const message =
        status === 409
          ? 'This lead is not ready to mark as meeting scheduled.'
          : 'Failed to update this waitlist lead.'

      return NextResponse.json({ error: message }, { status })
    }

    return jsonOrRedirect(request, {
      leadId: data.id as string,
      leadStatus: data.lead_status as string,
      returnTo: payload.returnTo,
      wantsJson: payload.wantsJson,
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

    console.error(
      '[control-center/intake/waitlist-meeting-scheduled] Error:',
      error,
    )
    return NextResponse.json(
      { error: 'Failed to update this waitlist lead.' },
      { status: 500 },
    )
  }
}
