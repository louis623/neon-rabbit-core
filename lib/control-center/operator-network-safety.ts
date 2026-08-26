import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

import { listOperatorConversations } from '@/lib/services/workspace-conversations'

export type OperatorMessagingSuspension = {
  repId: string
  repLabel: string
  reason: string
  suspendedAt: string
  suspendedByActor: string
  liftedAt: string | null
  liftedByActor: string | null
}

export async function listOperatorMessagingSuspensions(
  supabase: SupabaseClient,
  options: { activeOnly?: boolean; limit?: number } = {},
) {
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 200)
  let query = supabase
    .from('workspace_rep_messaging_suspensions')
    .select(
      'rep_id, reason, suspended_at, suspended_by_actor, lifted_at, lifted_by_actor',
    )
    .order('suspended_at', { ascending: false })
    .limit(limit)
  if (options.activeOnly !== false) query = query.is('lifted_at', null)
  const { data, error } = await query
  if (error) throw error
  const rows = (data ?? []) as Array<Record<string, unknown>>
  const repIds = rows.flatMap((row) =>
    typeof row.rep_id === 'string' ? [row.rep_id] : [],
  )
  const repResult = repIds.length
    ? await supabase
        .from('reps')
        .select('id, display_name, business_name')
        .in('id', repIds)
    : { data: [], error: null }
  if (repResult.error) throw repResult.error
  const labels = new Map(
    ((repResult.data ?? []) as Array<Record<string, unknown>>).map((rep) => [
      rep.id as string,
      (typeof rep.business_name === 'string' && rep.business_name.trim()) ||
        (typeof rep.display_name === 'string' && rep.display_name.trim()) ||
        'Sparkle Suite rep',
    ]),
  )
  return rows.map(
    (row): OperatorMessagingSuspension => ({
      repId: row.rep_id as string,
      repLabel: labels.get(row.rep_id as string) ?? 'Sparkle Suite rep',
      reason: row.reason as string,
      suspendedAt: row.suspended_at as string,
      suspendedByActor: row.suspended_by_actor as string,
      liftedAt: (row.lifted_at as string | null) ?? null,
      liftedByActor: (row.lifted_by_actor as string | null) ?? null,
    }),
  )
}

export async function listReportedOperatorConversations(
  supabase: SupabaseClient,
  options: { limit?: number } = {},
) {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100)
  const reportResult = await supabase
    .from('workspace_conversation_reports')
    .select('conversation_id')
    .in('status', ['open', 'reviewing'])
    .order('created_at', { ascending: false })
    .limit(500)
  if (reportResult.error) throw reportResult.error
  const reportRows = (reportResult.data ?? []) as Array<{
    conversation_id: string
  }>
  const reportedCounts = new Map<string, number>()
  for (const report of reportRows) {
    reportedCounts.set(
      report.conversation_id,
      (reportedCounts.get(report.conversation_id) ?? 0) + 1,
    )
  }
  if (reportedCounts.size === 0) {
    return { conversations: [], nextCursor: null }
  }
  const result = await listOperatorConversations(supabase, {
    type: 'rep_direct',
    reportedOnly: true,
    limit,
  })
  return {
    conversations: result.conversations
      .filter((conversation) => reportedCounts.has(conversation.id))
      .slice(0, limit)
      .map((conversation) => ({
        ...conversation,
        reportedCount: reportedCounts.get(conversation.id) ?? 0,
      })),
    nextCursor: null,
  }
}

export async function loadOperatorConversationReports(
  supabase: SupabaseClient,
  conversationId: string,
) {
  const reportResult = await supabase
    .from('workspace_conversation_reports')
    .select(
      'id, reason, details, status, message_id, reporter_rep_id, created_at',
    )
    .eq('conversation_id', conversationId)
    .in('status', ['open', 'reviewing'])
    .order('created_at', { ascending: true })
  if (reportResult.error) throw reportResult.error
  const rows = (reportResult.data ?? []) as Array<Record<string, unknown>>
  const reporterIds = rows.flatMap((row) =>
    typeof row.reporter_rep_id === 'string' ? [row.reporter_rep_id] : [],
  )
  const repResult = reporterIds.length
    ? await supabase
        .from('reps')
        .select('id, display_name, business_name')
        .in('id', reporterIds)
    : { data: [], error: null }
  if (repResult.error) throw repResult.error
  const labels = new Map(
    ((repResult.data ?? []) as Array<Record<string, unknown>>).map((rep) => [
      rep.id as string,
      (typeof rep.business_name === 'string' && rep.business_name.trim()) ||
        (typeof rep.display_name === 'string' && rep.display_name.trim()) ||
        'Sparkle Suite rep',
    ]),
  )
  return rows.map((row) => ({
    id: row.id as string,
    reason: row.reason as string,
    details: (row.details as string | null) ?? null,
    status: row.status as string,
    messageId: (row.message_id as string | null) ?? null,
    reporterLabel:
      labels.get(row.reporter_rep_id as string) ?? 'Sparkle Suite rep',
    createdAt: row.created_at as string,
  }))
}
