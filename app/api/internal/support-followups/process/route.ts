import { NextResponse } from 'next/server'
import { processPendingSupportConversationFollowups } from '@/lib/services/workspace-support-conversations'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function authorize(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) {
    return NextResponse.json(
      { error: 'support follow-up cron secret is not configured.' },
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
  const result = await processPendingSupportConversationFollowups(
    createAdminClient(),
    { limit: 10 },
  )
  return NextResponse.json({ ok: true, result })
}
