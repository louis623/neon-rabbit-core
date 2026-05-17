import { NextResponse } from 'next/server'
import {
  getAuthenticatedNicNacContext,
  AuthError,
} from '@/lib/nic-nac/auth'
import { getAuthenticatedRep } from '@/lib/supabase/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { ServiceError } from '@/lib/services/errors'
import {
  approveTrade,
  getTradeRequests,
  rejectTrade,
} from '@/lib/services/trade-requests'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function readLimit(url: URL) {
  const raw = url.searchParams.get('limit')
  if (!raw) return undefined
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function readStatus(value: string | null) {
  if (!value) return undefined
  if (value === 'pending' || value === 'approved' || value === 'denied' || value === 'cancelled') {
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
    const statusFilter = readStatus(url.searchParams.get('status'))

    if (limit === null) {
      return NextResponse.json({ error: 'limit must be a whole number.' }, { status: 400 })
    }
    if (statusFilter === null) {
      return NextResponse.json({ error: 'status is invalid.' }, { status: 400 })
    }

    const { repId, supabase } = await getAuthenticatedNicNacContext()
    const requests = await getTradeRequests(supabase, repId, {
      statusFilter,
      limit: limit ?? undefined,
    })

    return NextResponse.json(requests)
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
    const requestId = typeof body?.requestId === 'string' ? body.requestId.trim() : ''
    const repNotes = typeof body?.repNotes === 'string' ? body.repNotes : undefined

    const { repId } = await getAuthenticatedRep()
    const supabase = createAdminClient()

    if (action === 'approve') {
      const result = await approveTrade(supabase, repId, requestId, repNotes)
      return NextResponse.json({ ok: true, result })
    }

    if (action === 'reject') {
      const reason =
        body?.reason === 'msrp_mismatch' ||
        body?.reason === 'not_interested' ||
        body?.reason === 'changed_mind' ||
        body?.reason === 'other'
          ? body.reason
          : undefined

      const result = await rejectTrade(supabase, repId, requestId, reason, repNotes)
      return NextResponse.json({ ok: true, result })
    }

    return NextResponse.json(
      { error: 'action must be approve or reject.' },
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
