import { NextResponse } from 'next/server'
import { listMyShows } from '@/lib/services/calendar'
import {
  getAuthenticatedThumperContext,
  AuthError,
} from '@/lib/thumper/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function readLimit(url: URL, key: string) {
  const raw = url.searchParams.get(key)
  if (!raw) return undefined
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : null
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const upcomingLimit = readLimit(url, 'upcoming')
    const historyLimit = readLimit(url, 'history')

    if (upcomingLimit === null) {
      return NextResponse.json(
        { error: 'upcoming must be a whole number.' },
        { status: 400 },
      )
    }

    if (historyLimit === null) {
      return NextResponse.json(
        { error: 'history must be a whole number.' },
        { status: 400 },
      )
    }

    const { repId, supabase } = await getAuthenticatedThumperContext()
    const [upcomingResult, recentResult] = await Promise.all([
      listMyShows(supabase, repId, {
        upcoming: true,
        limit: upcomingLimit ?? 8,
      }),
      listMyShows(supabase, repId, {
        upcoming: false,
        limit: historyLimit ?? 4,
        status: ['completed', 'cancelled'],
      }),
    ])

    return NextResponse.json({
      upcomingEvents: upcomingResult.events,
      recentEvents: recentResult.events,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }

    throw error
  }
}
