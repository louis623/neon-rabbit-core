import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { UIMessage } from 'ai'

export type OperatorSupportConversationScope = {
  supportSessionId: string
  operatorRepId: string
  targetRepId: string
}

export function getOperatorSupportConversationId(scope: OperatorSupportConversationScope) {
  return scope.supportSessionId
}

export function assertOperatorSupportConversationId(
  conversationId: string,
  scope: OperatorSupportConversationScope,
) {
  if (conversationId !== getOperatorSupportConversationId(scope)) {
    throw new Error('Operator support conversations are session-scoped.')
  }
}

export async function loadOperatorSupportConversation(
  supabase: SupabaseClient,
  scope: OperatorSupportConversationScope,
): Promise<UIMessage[]> {
  const { data, error } = await supabase
    .from('nic_nac_conversations')
    .select('message_id, role, parts, status, created_at, cleared_at')
    .eq('conversation_id', getOperatorSupportConversationId(scope))
    .eq('rep_id', scope.targetRepId)
    .eq('support_session_id', scope.supportSessionId)
    .order('created_at', { ascending: true })
  if (error) throw error
  if ((data ?? []).some((row) => row.cleared_at)) return []
  return (data ?? [])
    .filter((row) => row.role === 'user' || row.status === 'complete')
    .map((row) => ({
      id: row.message_id as string,
      role: row.role as 'user' | 'assistant',
      parts: row.parts as UIMessage['parts'],
      metadata: { created_at: row.created_at as string },
    }))
}

export async function insertOperatorSupportConversationMessage(
  supabase: SupabaseClient,
  scope: OperatorSupportConversationScope,
  message: Pick<UIMessage, 'id' | 'role' | 'parts'> & {
    status?: 'pending' | 'complete' | 'aborted'
  },
) {
  const { error } = await supabase.from('nic_nac_conversations').upsert(
    {
      conversation_id: getOperatorSupportConversationId(scope),
      message_id: message.id,
      rep_id: scope.targetRepId,
      role: message.role,
      parts: message.parts ?? [],
      status: message.status ?? (message.role === 'assistant' ? 'pending' : 'complete'),
      support_session_id: scope.supportSessionId,
      source_actor_type: 'operator_support',
      source_actor_rep_id: scope.operatorRepId,
    },
    { onConflict: 'conversation_id,message_id', ignoreDuplicates: true },
  )
  if (error) throw error
}

export async function recordOperatorSupportApprovalEvent(
  supabase: SupabaseClient,
  scope: OperatorSupportConversationScope,
  input: { approvalId: string; toolName: string; approved: boolean },
) {
  const { error } = await supabase.from('approval_events').insert({
    conversation_id: getOperatorSupportConversationId(scope),
    rep_id: scope.targetRepId,
    approval_id: input.approvalId,
    tool_name: input.toolName,
    approved: input.approved,
    support_session_id: scope.supportSessionId,
    source_actor_rep_id: scope.operatorRepId,
  })
  if ((error as { code?: string } | null)?.code === '23505') return { replayed: true }
  if (error) throw error
  return { replayed: false }
}

export async function clearOperatorSupportConversation(
  supabase: SupabaseClient,
  scope: OperatorSupportConversationScope,
) {
  const { error } = await supabase
    .from('nic_nac_conversations')
    .update({ cleared_at: new Date().toISOString() })
    .eq('conversation_id', getOperatorSupportConversationId(scope))
    .eq('rep_id', scope.targetRepId)
    .eq('support_session_id', scope.supportSessionId)
  if (error) throw error
  return [getOperatorSupportConversationId(scope)]
}
