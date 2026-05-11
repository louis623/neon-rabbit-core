import { NextResponse } from 'next/server'
import {
  getAuthenticatedThumperContext,
  AuthError,
} from '@/lib/thumper/auth'
import { ServiceError } from '@/lib/services/errors'
import {
  getCustomerAudience,
  unsubscribeCustomerAudienceMember,
} from '@/lib/services/customer-audience'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function readLimit(url: URL) {
  const raw = url.searchParams.get('limit')
  if (!raw) return undefined
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function readChannel(url: URL) {
  const raw = url.searchParams.get('channel')
  if (!raw) return undefined
  if (raw === 'all' || raw === 'sms' || raw === 'email' || raw === 'marketing') {
    return raw
  }
  return null
}

function readBoolean(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return (
      normalized === 'true' ||
      normalized === '1' ||
      normalized === 'yes' ||
      normalized === 'on'
    )
  }
  return false
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const limit = readLimit(url)
    const channelFilter = readChannel(url)

    if (limit === null) {
      return NextResponse.json(
        { error: 'limit must be a whole number.' },
        { status: 400 },
      )
    }

    if (channelFilter === null) {
      return NextResponse.json(
        { error: 'channel must be all, sms, email, or marketing.' },
        { status: 400 },
      )
    }

    const { repId, supabase } = await getAuthenticatedThumperContext()
    const audience = await getCustomerAudience(supabase, repId, {
      channelFilter,
      limit: limit ?? undefined,
    })

    return NextResponse.json(audience)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    throw err
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { repId, supabase } = await getAuthenticatedThumperContext()
    const result = await unsubscribeCustomerAudienceMember(supabase, repId, {
      audienceId:
        typeof body?.audienceId === 'string' ? body.audienceId.trim() : '',
      unsubscribeSms: readBoolean(body?.unsubscribeSms),
      unsubscribeEmail: readBoolean(body?.unsubscribeEmail),
    })

    return NextResponse.json({ ok: true, result })
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
    }

    if (err instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }

    if (err instanceof ServiceError) {
      return NextResponse.json(
        {
          code: err.code,
          error: err.userMessage,
        },
        { status: err.statusCode },
      )
    }

    throw err
  }
}
