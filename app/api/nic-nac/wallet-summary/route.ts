import { NextResponse } from 'next/server'
import { getWalletDashboard } from '@/lib/services/wallet-dashboard'
import { getPaidNicNacContext, AuthError } from '@/lib/nic-nac/auth'
import { ServiceError } from '@/lib/services/errors'

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

    const { repId } = await getPaidNicNacContext()
    const summary = await getWalletDashboard(repId, { limit: limit ?? undefined })
    return NextResponse.json(summary)
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
