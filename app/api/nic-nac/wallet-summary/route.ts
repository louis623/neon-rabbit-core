import { NextResponse } from 'next/server'
import { getWalletDashboard } from '@/lib/services/wallet-dashboard'
import { getAuthenticatedRep, AuthError } from '@/lib/supabase/auth'

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
      return NextResponse.json(
        { error: 'limit must be a whole number.' },
        { status: 400 },
      )
    }

    const { repId } = await getAuthenticatedRep()
    const summary = await getWalletDashboard(repId, { limit: limit ?? undefined })
    return NextResponse.json(summary)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    throw error
  }
}
