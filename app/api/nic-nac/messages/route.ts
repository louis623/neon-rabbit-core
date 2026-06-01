import { NextResponse } from 'next/server'
import {
  getPaidNicNacContext,
  AuthError,
} from '@/lib/nic-nac/auth'
import { ServiceError } from '@/lib/services/errors'
import {
  createRepSupportMessage,
  getRepMessages,
  markRepMessageRead,
} from '@/lib/services/rep-messages'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function readLimit(url: URL) {
  const raw = url.searchParams.get('limit')
  if (!raw) return undefined
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function readType(value: string | null) {
  if (!value) return undefined
  if (
    value === 'monthly_report' ||
    value === 'newsletter' ||
    value === 'announcement' ||
    value === 'support_request' ||
    value === 'support_response'
  ) {
    return value
  }
  return null
}

function serviceErrorResponse(error: ServiceError) {
  return NextResponse.json(
    { code: error.code, error: error.userMessage },
    { status: error.statusCode },
  )
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const limit = readLimit(url)
    const messageType = readType(url.searchParams.get('type'))
    const unreadOnly = url.searchParams.get('unread') === 'true'

    if (limit === null) {
      return NextResponse.json({ error: 'limit must be a whole number.' }, { status: 400 })
    }
    if (messageType === null) {
      return NextResponse.json({ error: 'type is invalid.' }, { status: 400 })
    }

    const { repId, supabase } = await getPaidNicNacContext()
    const result = await getRepMessages(supabase, repId, {
      limit: limit ?? undefined,
      messageType,
      unreadOnly,
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    if (error instanceof ServiceError) return serviceErrorResponse(error)
    throw error
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const action = typeof body?.action === 'string' ? body.action.trim() : ''
    const { repId, supabase } = await getPaidNicNacContext()

    if (action === 'create_support_request') {
      const result = await createRepSupportMessage(supabase, repId, {
        subject: typeof body?.subject === 'string' ? body.subject : '',
        body: typeof body?.body === 'string' ? body.body : '',
      })
      return NextResponse.json({ ok: true, result })
    }

    if (action === 'mark_read') {
      const messageId = typeof body?.messageId === 'string' ? body.messageId.trim() : ''
      const result = await markRepMessageRead(supabase, repId, messageId)
      return NextResponse.json({ ok: true, result })
    }

    return NextResponse.json(
      { error: 'action must be create_support_request or mark_read.' },
      { status: 400 },
    )
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
    }
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    if (error instanceof ServiceError) return serviceErrorResponse(error)
    throw error
  }
}
