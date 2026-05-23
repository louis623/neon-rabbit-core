import { NextResponse } from 'next/server'

import { ServiceError } from '@/lib/services/errors'
import {
  getTradeRequestNotificationSummary,
  submitTradeRequest,
} from '@/lib/services/trade-requests'
import { notifyRepOfTradeRequest } from '@/lib/nic-nac/trade-request-notifications'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const admin = createAdminClient()

    const result = await submitTradeRequest(admin, {
      listingId: typeof body?.listingId === 'string' ? body.listingId : '',
      customerName: typeof body?.customerName === 'string' ? body.customerName : '',
      customerDescription:
        typeof body?.customerDescription === 'string' ? body.customerDescription : '',
    })

    try {
      const summary = await getTradeRequestNotificationSummary(
        admin,
        result.requestId,
      )
      if (summary) {
        await notifyRepOfTradeRequest(admin, summary)
      }
    } catch (notificationError) {
      console.error(
        '[amethyst/trade-requests] Notification error:',
        notificationError,
      )
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
    }
    if (error instanceof ServiceError) {
      return NextResponse.json(
        {
          code: error.code,
          error: error.userMessage,
        },
        { status: error.statusCode },
      )
    }

    console.error('[amethyst/trade-requests] Error:', error)
    return NextResponse.json(
      { error: 'Failed to submit trade request.' },
      { status: 500 },
    )
  }
}
