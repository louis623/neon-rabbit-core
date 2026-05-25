import { NextResponse } from 'next/server'
import { processDuePreShowReminders } from '@/lib/services/pre-show-reminders'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function readLimit(url: URL) {
  const raw = url.searchParams.get('limit')
  if (!raw) return undefined
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function readMode(url: URL) {
  const mode = url.searchParams.get('mode')?.trim().toLowerCase()
  if (!mode || mode === 'dry-run') return { dryRun: true, error: null }
  if (mode === 'live') return { dryRun: false, error: null }
  return { dryRun: true, error: 'mode must be dry-run or live.' }
}

function arePreShowSmsSendsEnabled() {
  return process.env.SPARKLE_PRE_SHOW_SMS_ENABLED === 'true'
}

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) {
    return NextResponse.json(
      { error: 'show reminder cron secret is not configured.' },
      { status: 503 },
    )
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  return null
}

export async function GET(request: Request) {
  const authError = isAuthorized(request)
  if (authError) return authError

  const url = new URL(request.url)
  const limit = readLimit(url)
  if (limit === null) {
    return NextResponse.json(
      { error: 'limit must be a positive whole number.' },
      { status: 400 },
    )
  }

  const mode = readMode(url)
  if (mode.error) {
    return NextResponse.json({ error: mode.error }, { status: 400 })
  }

  const result = await processDuePreShowReminders(createAdminClient(), {
    limit: limit ?? 25,
    dryRun: mode.dryRun,
    liveSendsEnabled: arePreShowSmsSendsEnabled(),
  })

  return NextResponse.json({
    ok: true,
    result,
  })
}
