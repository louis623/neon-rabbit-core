import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  CalendarWorkflowIntent,
  CalendarWorkflowKnownFields,
  CalendarWorkflowPhase,
  CalendarWorkflowSessionState,
  CalendarWorkflowStatus,
} from './calendar-workflow-types'

type CalendarWorkflowRow = {
  id: string
  rep_id: string
  conversation_id: string
  workflow_type: 'calendar_event_work'
  status: CalendarWorkflowStatus
  phase: CalendarWorkflowPhase
  intent: CalendarWorkflowIntent | null
  known_fields: CalendarWorkflowKnownFields | null
  missing_fields: string[] | null
  candidate_event_ids: string[] | null
  last_user_message_id: string | null
  expires_at: string
  created_at: string
  updated_at: string
}

function mapCalendarWorkflow(row: CalendarWorkflowRow): CalendarWorkflowSessionState {
  return {
    id: row.id,
    repId: row.rep_id,
    conversationId: row.conversation_id,
    workflowType: row.workflow_type,
    status: row.status,
    phase: row.phase,
    intent: row.intent ?? 'unknown',
    knownFields: row.known_fields ?? {},
    missingFields: row.missing_fields ?? [],
    candidateEventIds: row.candidate_event_ids ?? [],
    lastUserMessageId: row.last_user_message_id ?? undefined,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getActiveCalendarWorkflowSession(
  supabase: SupabaseClient,
  args: { repId: string; conversationId: string; nowIso: string },
): Promise<CalendarWorkflowSessionState | null> {
  const { data, error } = await supabase
    .from('nic_nac_calendar_workflows')
    .select('*')
    .eq('rep_id', args.repId)
    .eq('conversation_id', args.conversationId)
    .eq('status', 'active')
    .gt('expires_at', args.nowIso)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ? mapCalendarWorkflow(data as CalendarWorkflowRow) : null
}

export async function createCalendarWorkflowSession(
  supabase: SupabaseClient,
  args: { repId: string; conversationId: string; lastUserMessageId?: string },
): Promise<CalendarWorkflowSessionState> {
  const { data, error } = await supabase
    .from('nic_nac_calendar_workflows')
    .insert({
      rep_id: args.repId,
      conversation_id: args.conversationId,
      last_user_message_id: args.lastUserMessageId ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapCalendarWorkflow(data as CalendarWorkflowRow)
}

export async function updateCalendarWorkflowSession(
  supabase: SupabaseClient,
  state: CalendarWorkflowSessionState,
): Promise<CalendarWorkflowSessionState> {
  const updatedAt = new Date()
  const expiresAt = new Date(updatedAt.getTime() + 2 * 60 * 60 * 1000)
  const { data, error } = await supabase
    .from('nic_nac_calendar_workflows')
    .update({
      status: state.status,
      phase: state.phase,
      intent: state.intent,
      known_fields: state.knownFields,
      missing_fields: state.missingFields,
      candidate_event_ids: state.candidateEventIds,
      last_user_message_id: state.lastUserMessageId ?? null,
      expires_at: expiresAt.toISOString(),
      updated_at: updatedAt.toISOString(),
    })
    .eq('id', state.id)
    .eq('rep_id', state.repId)
    .select('*')
    .single()
  if (error) throw error
  return mapCalendarWorkflow(data as CalendarWorkflowRow)
}

export function isMissingCalendarWorkflowSchemaError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err)
  return (
    message.includes('nic_nac_calendar_workflows') &&
    (message.includes('does not exist') ||
      message.includes('schema cache') ||
      message.includes('Could not find'))
  )
}
