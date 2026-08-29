import { NextResponse } from 'next/server'

import { appendOperatorSupportAuditEvent } from '@/lib/operator-support/audit'
import { loadVerifiedOperatorSupportContext } from '@/lib/operator-support/http'
import { OperatorSupportError } from '@/lib/operator-support/session-service'
import { getCustomerAudience } from '@/lib/services/customer-audience'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params
  try {
    const url = new URL(request.url)
    if (url.searchParams.has('format')) {
      return NextResponse.json(
        { error: 'Customer exports are unavailable during support access.', code: 'SUPPORT_ACTION_BLOCKED' },
        { status: 403 },
      )
    }
    const limitValue = url.searchParams.get('limit')
    const limit = limitValue ? Number.parseInt(limitValue, 10) : 25
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'limit must be between 1 and 100.' }, { status: 400 })
    }
    const channel = url.searchParams.get('channel')
    if (channel && !['all', 'sms', 'email', 'marketing'].includes(channel)) {
      return NextResponse.json({ error: 'channel is invalid.' }, { status: 400 })
    }
    const context = await loadVerifiedOperatorSupportContext(sessionId, {
      capability: 'customers.view',
      mutation: false,
      request,
    })
    const audience = await getCustomerAudience(
      context.supabase,
      context.session.targetRepId,
      {
        channelFilter: (channel || undefined) as
          | 'all'
          | 'sms'
          | 'email'
          | 'marketing'
          | undefined,
        limit,
      },
    )
    await appendOperatorSupportAuditEvent(context.supabase, {
      supportSessionId: sessionId,
      operatorRepId: context.session.operatorRepId,
      targetRepId: context.session.targetRepId,
      eventType: 'workspace_area_viewed',
      workspaceArea: 'customers',
      capability: 'customers.view',
      actionName: 'view_customer_list',
      result: 'succeeded',
      idempotencyKey: `view:${sessionId}:customers`,
    })
    return NextResponse.json(audience)
  } catch (error) {
    if (error instanceof OperatorSupportError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    console.error('[operator-support/customers]', error)
    return NextResponse.json({ error: 'Customer records could not be loaded safely.' }, { status: 500 })
  }
}
