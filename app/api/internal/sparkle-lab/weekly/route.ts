import { NextResponse } from 'next/server'

import { runSparkleLabWeeklyScan } from '@/lib/sparkle-lab/runner'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) {
    return NextResponse.json(
      { error: 'sparkle lab cron secret is not configured.' },
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

  if (process.env.SPARKLE_LAB_WEEKLY_RUNS_ENABLED !== 'true') {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'sparkle_lab_weekly_runs_disabled',
    })
  }

  const result = await runSparkleLabWeeklyScan({
    supabase: createAdminClient(),
  })

  return NextResponse.json({
    ok: true,
    runId: result.runId,
    runType: result.runType,
    usage: result.usage,
    limitsHit: result.limitsHit,
    findingCount: result.findings.length,
  })
}
