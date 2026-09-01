import { NextResponse } from 'next/server'
import { operatorSupportSessionHasSuccessfulMutation } from '@/lib/operator-support/audit'

import {
  loadVerifiedOperatorSupportContext,
  mapOperatorSupportSessionSummary,
  OPERATOR_SUPPORT_CSRF_COOKIE_PREFIX,
} from '@/lib/operator-support/http'
import { publishOperatorSupportEndNotice } from '@/lib/operator-support/messages'
import {
  endOperatorSupportSession,
  OperatorSupportError,
  recordOperatorSupportCompletionNotice,
} from '@/lib/operator-support/session-service'
import { AuthError } from '@/lib/supabase/operator-auth'
import { enqueueWorkspaceMessageOutboxEvent } from '@/lib/services/workspace-message-outbox'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params
  try {
    const context = await loadVerifiedOperatorSupportContext(sessionId, {
      capability: 'nic_nac.use',
      mutation: true,
      requireEligibleTarget: false,
      request,
    })
    const body = (await request.json().catch(() => null)) as
      | { changedAnything?: unknown; completionSummary?: unknown }
      | null
    const operatorReportedChange = body?.changedAnything === true
    const auditedChange = await operatorSupportSessionHasSuccessfulMutation(
      context.supabase,
      sessionId,
    )
    const changedAnything = auditedChange || operatorReportedChange
    const completionSummary =
      typeof body?.completionSummary === 'string'
        ? body.completionSummary.trim()
        : null
    if (changedAnything && (!completionSummary || completionSummary.length < 5)) {
      return NextResponse.json(
        { error: 'Add a short customer-safe summary of what changed.' },
        { status: 400 },
      )
    }

    let ended = await endOperatorSupportSession(context.supabase, {
      sessionId,
      operatorRepId: context.session.operatorRepId,
      endedReason: 'operator',
      completionSummary,
    })

    let noticeWarning: string | null = null
    try {
      const publication = await publishOperatorSupportEndNotice(
        context.supabase,
        ended,
        changedAnything,
      )
      ended = await recordOperatorSupportCompletionNotice(context.supabase, {
        sessionId,
        endPublicationId: publication.id,
      })
    } catch (noticeError) {
      console.error('[operator-support/end] completion notice failed', noticeError)
      try {
        await enqueueWorkspaceMessageOutboxEvent(context.supabase, {
          eventType: 'operator_support_completion_notice',
          idempotencyKey: `support-access-end:${sessionId}`,
          payload: { sessionId, changedAnything },
        })
        noticeWarning = 'Access ended; the completion notice is queued for automatic retry.'
      } catch (queueError) {
        console.error('[operator-support/end] completion notice retry queue failed', queueError)
        noticeWarning = 'Access ended, but the completion notice retry could not be queued.'
      }
    }

    const response = NextResponse.json({
      session: mapOperatorSupportSessionSummary(ended),
      warning: noticeWarning,
    })
    response.cookies.set(
      `${OPERATOR_SUPPORT_CSRF_COOKIE_PREFIX}${sessionId}`,
      '',
      { expires: new Date(0), httpOnly: true, path: '/control-center', sameSite: 'strict' },
    )
    return response
  } catch (error) {
    if (error instanceof OperatorSupportError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      )
    }
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('[operator-support/end]', error)
    return NextResponse.json({ error: 'Support access could not be ended safely.' }, { status: 500 })
  }
}
