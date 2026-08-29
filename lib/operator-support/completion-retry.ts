import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import { operatorSupportSessionHasSuccessfulMutation } from './audit'
import { enqueueWorkspaceMessageOutboxEvent } from '@/lib/services/workspace-message-outbox'

export async function enqueueMissingOperatorSupportCompletionNotices(
  supabase: SupabaseClient,
) {
  const { data, error } = await supabase
    .from('operator_support_sessions')
    .select('id, completion_summary, start_publication_id')
    .in('status', ['ended', 'expired', 'revoked'])
    .is('end_publication_id', null)
    .not('start_publication_id', 'is', null)
    .order('ended_at', { ascending: true })
    .limit(100)
  if (error) throw error

  for (const session of data ?? []) {
    const changedAnything = await operatorSupportSessionHasSuccessfulMutation(
      supabase,
      String(session.id),
    )
    await enqueueWorkspaceMessageOutboxEvent(supabase, {
      eventType: 'operator_support_completion_notice',
      idempotencyKey: `support-access-end:${session.id}`,
      payload: {
        sessionId: session.id,
        changedAnything,
      },
    })
  }
  return data?.length ?? 0
}
