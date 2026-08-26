import 'server-only'
import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ServiceError } from '@/lib/services/errors'
import { assertWorkspaceConversationComposingEnabled } from '@/lib/services/workspace-conversation-feature-flags'

type TeamParticipantRow = {
  id: string
  owner_rep_id: string
  display_name: string
  status: string
  archived_at: string | null
  workspace_conversation_id: string | null
  created_at: string | null
}

async function loadParticipant(supabase: SupabaseClient, participantId: string) {
  const { data, error } = await supabase
    .from('team_onboarding_participants')
    .select('id, owner_rep_id, display_name, status, archived_at, workspace_conversation_id, created_at')
    .eq('id', participantId)
    .maybeSingle()
  if (error || !data) {
    throw new ServiceError({ code: 'TEAM_ONBOARDING_PARTICIPANT_NOT_FOUND', message: 'team onboarding participant not found', userMessage: 'That onboarding conversation could not be found.', statusCode: 404, cause: error })
  }
  const row = data as TeamParticipantRow
  if (row.status === 'archived' || row.archived_at) {
    throw new ServiceError({ code: 'TEAM_ONBOARDING_ARCHIVED', message: 'archived onboarding participant cannot message', userMessage: 'That onboarding link has been turned off.', statusCode: 403 })
  }
  return row
}

export async function ensureTeamOnboardingConversation(
  supabase: SupabaseClient,
  participantId: string,
) {
  const participant = await loadParticipant(supabase, participantId)
  if (participant.workspace_conversation_id) return participant.workspace_conversation_id
  const conversation = await supabase.from('workspace_conversations').insert({
    conversation_type: 'team_onboarding',
    state: 'open',
    subject: `New Rep Onboarding: ${participant.display_name}`,
    created_by_rep_id: participant.owner_rep_id,
    context_type: 'team_onboarding_participant',
    context_id: participant.id,
    context_snapshot: { participantName: participant.display_name },
    created_at: participant.created_at ?? undefined,
  }).select('id').single()
  if (conversation.error || !conversation.data) throw conversation.error ?? new Error('team conversation missing')
  const conversationId = conversation.data.id as string
  const linked = await supabase.from('team_onboarding_participants').update({ workspace_conversation_id: conversationId }).eq('id', participant.id).is('workspace_conversation_id', null).select('id').maybeSingle()
  if (linked.error || !linked.data) {
    const raced = await loadParticipant(supabase, participant.id)
    if (raced.workspace_conversation_id) return raced.workspace_conversation_id
    throw linked.error ?? new Error('team conversation link missing')
  }
  const participants = await supabase.from('workspace_conversation_participants').insert([
    { conversation_id: conversationId, principal_type: 'rep', rep_id: participant.owner_rep_id, role: 'team_lead', membership_state: 'active' },
    { conversation_id: conversationId, principal_type: 'onboarding_guest', team_onboarding_participant_id: participant.id, role: 'onboarding_guest', membership_state: 'active' },
  ])
  if (participants.error) throw participants.error
  await supabase.from('workspace_conversation_audit_events').insert({ conversation_id: conversationId, actor_type: 'system', actor_id: 'team_onboarding', event_type: 'team_onboarding_conversation_created', details: { participantId: participant.id }, idempotency_key: `team-onboarding-created:${participant.id}` })
  return conversationId
}

export async function sendTeamOnboardingConversationMessage(
  supabase: SupabaseClient,
  input: {
    participantId: string
    senderType: 'participant' | 'team_lead'
    body: string
    clientRequestId?: string
  },
) {
  assertWorkspaceConversationComposingEnabled('team_onboarding')
  const participant = await loadParticipant(supabase, input.participantId)
  const conversationId = await ensureTeamOnboardingConversation(supabase, participant.id)
  const body = input.body.trim()
  if (body.length < 2 || body.length > 10000) {
    throw new ServiceError({ code: 'INVALID_MESSAGE', message: 'team onboarding message invalid', userMessage: 'Write a reply first.' })
  }
  const isLead = input.senderType === 'team_lead'
  const senderIdentityKey = isLead ? `rep:${participant.owner_rep_id}` : `guest:${participant.id}`
  const clientRequestId = input.clientRequestId?.trim() || randomUUID()
  const payload = {
    conversation_id: conversationId,
    sender_principal_type: isLead ? 'rep' : 'onboarding_guest',
    sender_identity_key: senderIdentityKey,
    sender_rep_id: isLead ? participant.owner_rep_id : null,
    sender_team_onboarding_participant_id: isLead ? null : participant.id,
    sender_display_name: isLead ? 'Team lead' : participant.display_name,
    kind: 'message',
    body,
    client_request_id: clientRequestId,
  }
  const { data, error } = await supabase.from('workspace_conversation_messages').upsert(payload, { onConflict: 'conversation_id,sender_identity_key,client_request_id', ignoreDuplicates: true }).select('id, body, created_at').maybeSingle()
  if (error) throw error
  const saved = data ?? (await supabase.from('workspace_conversation_messages').select('id, body, created_at').eq('conversation_id', conversationId).eq('sender_identity_key', senderIdentityKey).eq('client_request_id', clientRequestId).single()).data
  if (!saved) throw new Error('team onboarding message missing')
  await supabase.from('team_onboarding_participants').update({ last_activity_at: saved.created_at, updated_at: saved.created_at }).eq('id', participant.id)
  return {
    id: saved.id as string,
    participantId: participant.id,
    workspaceConversationId: conversationId,
    conversationId,
    senderType: input.senderType,
    body: saved.body as string,
    readAt: null,
    createdAt: saved.created_at as string,
  }
}

export async function listTeamOnboardingConversationMessages(
  supabase: SupabaseClient,
  participantId: string,
) {
  const participant = await loadParticipant(supabase, participantId)
  if (!participant.workspace_conversation_id) return null
  const { data, error } = await supabase.from('workspace_conversation_messages').select('id, sender_principal_type, body, created_at').eq('conversation_id', participant.workspace_conversation_id).eq('kind', 'message').order('created_at', { ascending: true }).order('id', { ascending: true })
  if (error) throw error
  return (data ?? []).map((message) => ({
    id: message.id as string,
    participantId: participant.id,
    senderType: message.sender_principal_type === 'rep' ? 'team_lead' as const : 'participant' as const,
    body: message.body as string,
    readAt: null,
    createdAt: message.created_at as string,
  }))
}
