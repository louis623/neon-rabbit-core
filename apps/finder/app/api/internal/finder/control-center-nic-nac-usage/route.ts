import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'

import { createSupabaseServiceRoleClient } from '@/lib/supabase/service-role'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_ROWS = 10_000
const MAX_WINDOW_MS = 32 * 24 * 60 * 60 * 1_000

function safeEqual(value: string, expected: string) {
  const actual = Buffer.from(value)
  const comparison = Buffer.from(expected)
  return actual.length === comparison.length && timingSafeEqual(actual, comparison)
}

function authorize(request: Request) {
  const expected = process.env.SPARKLE_FINDER_CONTROL_CENTER_USAGE_TOKEN?.trim()
  if (!expected) return { configured: false, authorized: false }
  const authorization = request.headers.get('authorization') ?? ''
  const [scheme, token = ''] = authorization.split(/\s+/, 2)
  return {
    configured: true,
    authorized: scheme.toLowerCase() === 'bearer' && Boolean(token) && safeEqual(token, expected),
  }
}

export async function GET(request: Request) {
  const auth = authorize(request)
  if (!auth.configured) return NextResponse.json({ error: 'usage_bridge_not_configured' }, { status: 503 })
  if (!auth.authorized) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const start = new Date(url.searchParams.get('start') ?? '')
  const end = new Date(url.searchParams.get('end') ?? '')
  if (
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    start >= end ||
    end.getTime() - start.getTime() > MAX_WINDOW_MS
  ) {
    return NextResponse.json({ error: 'A valid start/end window of no more than 32 days is required.' }, { status: 400 })
  }

  const admin = createSupabaseServiceRoleClient()
  if (!admin) return NextResponse.json({ error: 'service_role_not_configured' }, { status: 503 })

  const { data, error } = await admin
    .from('sparkle_finder_nic_nac_runs')
    .select('id,status,model_provider,model_name,model_policy_key,prompt_tokens,completion_tokens,estimated_cost_usd,error_code,started_at')
    .gte('started_at', start.toISOString())
    .lt('started_at', end.toISOString())
    .order('started_at', { ascending: false })
    .limit(MAX_ROWS + 1)

  if (error) {
    console.error('[finder/control-center-nic-nac-usage] read failed', error)
    return NextResponse.json({ error: 'finder_usage_read_failed' }, { status: 500 })
  }

  const rows = data ?? []
  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      rows: rows.slice(0, MAX_ROWS),
      truncated: rows.length > MAX_ROWS,
    },
    { headers: { 'cache-control': 'no-store, private' } },
  )
}
