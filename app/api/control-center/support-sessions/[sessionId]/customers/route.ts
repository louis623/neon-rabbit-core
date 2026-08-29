import { NextResponse } from 'next/server'

import { appendOperatorSupportAuditEvent } from '@/lib/operator-support/audit'
import { loadVerifiedOperatorSupportContext } from '@/lib/operator-support/http'
import { OperatorSupportError } from '@/lib/operator-support/session-service'
import {
  formatCustomerAudienceCsv,
  getCustomerAudience,
} from '@/lib/services/customer-audience'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params
  try {
    const url = new URL(request.url)
    const format = url.searchParams.get('format')
    if (format && format !== 'csv') {
      return NextResponse.json({ error: 'format must be csv when provided.' }, { status: 400 })
    }
    const limitValue = url.searchParams.get('limit')
    const limit = limitValue ? Number.parseInt(limitValue, 10) : 25
    if (!format && (!Number.isInteger(limit) || limit < 1 || limit > 100)) {
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
        limit: format === 'csv' ? null : limit,
      },
    )
    await appendOperatorSupportAuditEvent(context.supabase, {
      supportSessionId: sessionId,
      operatorRepId: context.session.operatorRepId,
      targetRepId: context.session.targetRepId,
      eventType: 'workspace_area_viewed',
      workspaceArea: format === 'csv' ? 'exports' : 'customers',
      capability: 'customers.view',
      actionName: format === 'csv' ? 'export_customer_list' : 'view_customer_list',
      result: 'succeeded',
      idempotencyKey: `view:${sessionId}:${format === 'csv' ? 'customer_export' : 'customers'}`,
    })
    if (format === 'csv') {
      const date = new Date().toISOString().slice(0, 10)
      return new Response(`\ufeff${formatCustomerAudienceCsv(audience.customers)}`, {
        headers: {
          'content-type': 'text/csv; charset=utf-8',
          'content-disposition': `attachment; filename="sparkle-suite-customers-${date}.csv"`,
          'cache-control': 'no-store, private',
        },
      })
    }
    return NextResponse.json(audience)
  } catch (error) {
    if (error instanceof OperatorSupportError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    console.error('[operator-support/customers]', error)
    return NextResponse.json({ error: 'Customer records could not be loaded safely.' }, { status: 500 })
  }
}
