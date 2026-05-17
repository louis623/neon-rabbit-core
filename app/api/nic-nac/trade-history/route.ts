import { NextResponse } from 'next/server'
import {
  getAuthenticatedNicNacContext,
  AuthError,
} from '@/lib/nic-nac/auth'
import { ServiceError } from '@/lib/services/errors'
import { getTradeHistory } from '@/lib/services/trade-requests'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function readLimit(url: URL) {
  const raw = url.searchParams.get('limit')
  if (!raw) return undefined
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : null
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const limit = readLimit(url)
    if (limit === null) {
      return NextResponse.json({ error: 'limit must be a whole number.' }, { status: 400 })
    }

    const { repId, supabase } = await getAuthenticatedNicNacContext()
    const history = await getTradeHistory(supabase, repId, { limit: limit ?? undefined })
    return NextResponse.json(history)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { code: error.code, error: error.userMessage },
        { status: error.statusCode },
      )
    }
    throw error
  }
}
