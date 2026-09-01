import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'

import { DEFAULT_OPERATOR_SUPPORT_CAPABILITIES } from '@/lib/operator-support/capabilities'
import { enqueueMissingOperatorSupportCompletionNotices } from '@/lib/operator-support/completion-retry'
import {
  mapOperatorSupportSessionSummary as summary,
  OPERATOR_SUPPORT_CSRF_COOKIE_PREFIX as CSRF_COOKIE_PREFIX,
  operatorSupportWorkspaceUrl as workspaceUrl,
} from '@/lib/operator-support/http'
import {
  publishOperatorSupportEndNotice,
  publishOperatorSupportStartNotice,
} from '@/lib/operator-support/messages'
import {
  activateOperatorSupportSession,
  endOperatorSupportSession,
  listOperatorSupportSessions,
  OperatorSupportError,
  recordOperatorSupportCompletionNotice,
  requestOperatorSupportSession,
} from '@/lib/operator-support/session-service'
import { enqueueWorkspaceMessageOutboxEvent } from '@/lib/services/workspace-message-outbox'
import type { OperatorSupportReasonCode } from '@/lib/operator-support/types'
import { createAdminClient } from '@/lib/supabase/admin'
import { AuthError, getControlCenterAccess } from '@/lib/supabase/operator-auth'
import { resolveWorkspaceAccess } from '@/lib/services/workspace-access'

function errorResponse(error: unknown) {
  if (error instanceof OperatorSupportError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
  }
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
  console.error('[control-center/support-sessions]', error)
  return NextResponse.json(
    { error: 'Support access could not be completed safely.' },
    { status: 500 },
  )
}

export async function GET(request: Request) {
  try {
    const access = await getControlCenterAccess()
    const targetRepId = new URL(request.url).searchParams.get('targetRepId')?.trim()
    const admin = createAdminClient()
    await enqueueMissingOperatorSupportCompletionNotices(admin)
    const [sessions, openSessions] = await Promise.all([
      listOperatorSupportSessions(admin, {
        operatorRepId: access.operator.repId,
        targetRepId: targetRepId || undefined,
        limit: 50,
      }),
      listOperatorSupportSessions(admin, {
        operatorRepId: access.operator.repId,
        statuses: ['pending_notice', 'active'],
        limit: 1,
      }),
    ])
    const activeSession = openSessions[0]
    if (
      targetRepId &&
      activeSession &&
      activeSession.targetRepId !== targetRepId
    ) {
      return NextResponse.json(
        {
          error: `End the active support session for ${activeSession.targetNameSnapshot} before opening another account.`,
          activeSession: summary(activeSession),
        },
        { status: 409 },
      )
    }
    return NextResponse.json({
      sessions: sessions.map(summary),
      activeSession: activeSession ? summary(activeSession) : null,
    })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  let pending:
    | { id: string; operatorRepId: string }
    | null = null
  let startNoticePublished = false
  try {
    const access = await getControlCenterAccess()
    const body = (await request.json().catch(() => null)) as
      | {
          targetRepId?: unknown
          reasonCode?: unknown
          reasonNote?: unknown
          supportReportId?: unknown
        }
      | null
    if (!body || typeof body.targetRepId !== 'string' || typeof body.reasonCode !== 'string') {
      return NextResponse.json({ error: 'Target rep and support reason are required.' }, { status: 400 })
    }

    const admin = createAdminClient()
    await enqueueMissingOperatorSupportCompletionNotices(admin)
    const [{ data: operator, error: operatorError }, { data: target, error: targetError }] =
      await Promise.all([
        admin
          .from('reps')
          .select('id, email, display_name, business_name')
          .eq('id', access.operator.repId)
          .maybeSingle(),
        admin
          .from('reps')
          .select('id, display_name, business_name, status')
          .eq('id', body.targetRepId.trim())
          .maybeSingle(),
      ])
    if (operatorError || !operator) throw operatorError ?? new Error('Operator was not found.')
    if (targetError || !target) {
      return NextResponse.json({ error: 'That rep account was not found.' }, { status: 404 })
    }
    const targetAccess = await resolveWorkspaceAccess({
      supabase: admin,
      repId: target.id as string,
    })
    if (target.status !== 'active' || !targetAccess.hasFullAccess) {
      return NextResponse.json(
        {
          error: 'Support access is available only for an active Workspace account. Billing and entitlement changes remain outside support access.',
          code: 'SUPPORT_TARGET_INELIGIBLE',
        },
        { status: 409 },
      )
    }

    const requested = await requestOperatorSupportSession(admin, {
      operatorRepId: operator.id as string,
      operatorEmail: operator.email as string,
      operatorDisplayName:
        (operator.display_name as string | null)?.trim() || 'Louis',
      targetRepId: target.id as string,
      targetName:
        (target.display_name as string | null)?.trim() ||
        (target.business_name as string | null)?.trim() ||
        'Sparkle Suite rep',
      targetBusinessName:
        (target.business_name as string | null)?.trim() ||
        (target.display_name as string | null)?.trim() ||
        'Sparkle Suite Workspace',
      reasonCode: body.reasonCode as OperatorSupportReasonCode,
      reasonNote: typeof body.reasonNote === 'string' ? body.reasonNote : null,
      supportReportId:
        typeof body.supportReportId === 'string' ? body.supportReportId : null,
      capabilities: DEFAULT_OPERATOR_SUPPORT_CAPABILITIES,
      requestId: randomUUID(),
    })
    pending = {
      id: requested.session.id,
      operatorRepId: requested.session.operatorRepId,
    }

    const publication = await publishOperatorSupportStartNotice(
      admin,
      requested.session,
    )
    startNoticePublished = true
    const session = await activateOperatorSupportSession(admin, {
      sessionId: requested.session.id,
      operatorRepId: requested.session.operatorRepId,
      startPublicationId: publication.id,
    })
    const response = NextResponse.json({
      session: summary(session),
      workspaceUrl: workspaceUrl(session.id),
    })
    response.cookies.set(`${CSRF_COOKIE_PREFIX}${session.id}`, requested.csrfToken, {
      httpOnly: true,
      maxAge: 400 * 24 * 60 * 60,
      path: '/control-center',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    })
    return response
  } catch (error) {
    if (pending) {
      try {
        const admin = createAdminClient()
        const ended = await endOperatorSupportSession(admin, {
          sessionId: pending.id,
          operatorRepId: pending.operatorRepId,
          endedReason: 'failure',
        })
        if (startNoticePublished) {
          try {
            const completion = await publishOperatorSupportEndNotice(
              admin,
              ended,
              false,
            )
            await recordOperatorSupportCompletionNotice(admin, {
              sessionId: ended.id,
              endPublicationId: completion.id,
            })
          } catch (noticeError) {
            console.error('[control-center/support-sessions] failed-session correction notice failed', noticeError)
            await enqueueWorkspaceMessageOutboxEvent(admin, {
              eventType: 'operator_support_completion_notice',
              idempotencyKey: `support-access-end:${ended.id}`,
              payload: { sessionId: ended.id, changedAnything: false },
            })
          }
        }
      } catch (closeError) {
        console.error('[control-center/support-sessions] failed to close pending session', closeError)
      }
    }
    return errorResponse(error)
  }
}
