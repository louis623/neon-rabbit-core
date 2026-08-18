import { NextResponse } from 'next/server'
import {
  enqueueDueMonthlyReports,
  processWorkspaceMessageAutomation,
} from '@/lib/services/workspace-message-automation'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function authorize(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) {
    return NextResponse.json(
      { error: 'workspace message cron secret is not configured.' },
      { status: 503 },
    )
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  return null
}

export async function GET(request: Request) {
  const authError = authorize(request)
  if (authError) return authError
  const admin = createAdminClient()
  const now = new Date()
  const monthlyEnqueued = await enqueueDueMonthlyReports({ supabase: admin, now })
  const workerId = `vercel-workspace-messages-${now.getTime()}`
  const result = await processWorkspaceMessageAutomation({
    supabase: admin,
    workerId,
    limit: 50,
    now,
  })
  return NextResponse.json({ ok: true, monthlyEnqueued: monthlyEnqueued.length, result })
}
