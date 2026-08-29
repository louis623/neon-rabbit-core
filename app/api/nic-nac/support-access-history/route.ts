import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { AuthError, getAuthenticatedRep } from '@/lib/supabase/auth'

export async function GET() {
  try {
    const { repId } = await getAuthenticatedRep()
    const { data, error } = await createAdminClient()
      .from('operator_support_sessions')
      .select(
        'id, operator_display_name_snapshot, reason_code, reason_note, status, started_at, expires_at, ended_at, ended_reason, completion_summary, created_at',
      )
      .eq('target_rep_id', repId)
      .in('status', ['active', 'ended', 'expired', 'revoked'])
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return NextResponse.json({
      sessions: (data ?? []).map((session) => ({
        id: session.id,
        operatorDisplayName: session.operator_display_name_snapshot,
        reasonCode: session.reason_code,
        reasonNote: session.reason_note,
        status: session.status,
        startedAt: session.started_at,
        expiresAt: session.expires_at,
        endedAt: session.ended_at,
        endedReason: session.ended_reason,
        completionSummary: session.completion_summary,
        createdAt: session.created_at,
      })),
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    console.error('[nic-nac/support-access-history]', error)
    return NextResponse.json({ error: 'Support access history could not be loaded.' }, { status: 500 })
  }
}
