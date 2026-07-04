import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  TradeWorkflowApprovalState,
  TradeWorkflowCandidate,
  TradeWorkflowIntent,
  TradeWorkflowKnownFields,
  TradeWorkflowMutationId,
  TradeWorkflowPhase,
  TradeWorkflowSessionState,
  TradeWorkflowStatus,
  TradeWorkflowType,
} from './trade-workflow-types'

type TradeWorkflowRow = {
  id: string
  rep_id: string
  conversation_id: string
  workflow_type: TradeWorkflowType
  status: TradeWorkflowStatus
  phase: TradeWorkflowPhase
  intent: TradeWorkflowIntent | null
  known_fields: TradeWorkflowKnownFields | null
  missing_fields: string[] | null
  blockers: string[] | null
  candidates: TradeWorkflowCandidate[] | null
  approval_state: TradeWorkflowApprovalState | null
  db_assertions?: Record<string, unknown> | null
  public_proof?: Record<string, unknown> | null
  created_mutation_ids?: TradeWorkflowMutationId[] | null
  last_user_message_id: string | null
  expires_at: string
  created_at: string
  updated_at: string
}

function mapTradeWorkflow(row: TradeWorkflowRow): TradeWorkflowSessionState {
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
    blockers: row.blockers ?? [],
    candidates: row.candidates ?? [],
    approvalState: row.approval_state ?? 'not_required',
    dbAssertions: row.db_assertions ?? {},
    publicProof: row.public_proof ?? {},
    createdMutationIds: row.created_mutation_ids ?? [],
    lastUserMessageId: row.last_user_message_id ?? undefined,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getActiveTradeWorkflowSession(
  supabase: SupabaseClient,
  args: {
    repId: string
    conversationId: string
    nowIso: string
    workflowTypes?: TradeWorkflowType[]
  },
): Promise<TradeWorkflowSessionState | null> {
  let query = supabase
    .from('nic_nac_trade_workflows')
    .select('*')
    .eq('rep_id', args.repId)
    .eq('conversation_id', args.conversationId)
    .eq('status', 'active')
    .gt('expires_at', args.nowIso)

  if (args.workflowTypes?.length) {
    query = query.in('workflow_type', args.workflowTypes)
  }

  const { data, error } = await query
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ? mapTradeWorkflow(data as TradeWorkflowRow) : null
}

export async function createTradeWorkflowSession(
  supabase: SupabaseClient,
  args: {
    repId: string
    conversationId: string
    workflowType: TradeWorkflowType
    intent?: TradeWorkflowIntent
    lastUserMessageId?: string
  },
): Promise<TradeWorkflowSessionState> {
  const { data, error } = await supabase
    .from('nic_nac_trade_workflows')
    .insert({
      rep_id: args.repId,
      conversation_id: args.conversationId,
      workflow_type: args.workflowType,
      intent: args.intent ?? null,
      last_user_message_id: args.lastUserMessageId ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapTradeWorkflow(data as TradeWorkflowRow)
}

export async function updateTradeWorkflowSession(
  supabase: SupabaseClient,
  state: TradeWorkflowSessionState,
): Promise<TradeWorkflowSessionState> {
  const updatedAt = new Date()
  const expiresAt = new Date(updatedAt.getTime() + 2 * 60 * 60 * 1000)
  const { data, error } = await supabase
    .from('nic_nac_trade_workflows')
    .update({
      status: state.status,
      phase: state.phase,
      intent: state.intent,
      known_fields: state.knownFields,
      missing_fields: state.missingFields,
      blockers: state.blockers,
      candidates: state.candidates,
      approval_state: state.approvalState,
      db_assertions: state.dbAssertions ?? {},
      public_proof: state.publicProof ?? {},
      created_mutation_ids: state.createdMutationIds ?? [],
      last_user_message_id: state.lastUserMessageId ?? null,
      expires_at: expiresAt.toISOString(),
      updated_at: updatedAt.toISOString(),
    })
    .eq('id', state.id)
    .eq('rep_id', state.repId)
    .select('*')
    .single()
  if (error) throw error
  return mapTradeWorkflow(data as TradeWorkflowRow)
}

export async function completeTradeWorkflowSession(
  supabase: SupabaseClient,
  state: TradeWorkflowSessionState,
  patch: {
    knownFields?: TradeWorkflowKnownFields
    candidates?: TradeWorkflowCandidate[]
    approvalState?: TradeWorkflowApprovalState
    dbAssertions?: Record<string, unknown>
    publicProof?: Record<string, unknown>
    createdMutationIds?: TradeWorkflowMutationId[]
  } = {},
): Promise<TradeWorkflowSessionState> {
  const updatedAt = new Date()
  const { data, error } = await supabase
    .from('nic_nac_trade_workflows')
    .update({
      status: 'completed',
      phase: 'completed',
      known_fields: {
        ...state.knownFields,
        ...(patch.knownFields ?? {}),
      },
      missing_fields: [],
      blockers: [],
      candidates: patch.candidates ?? state.candidates,
      approval_state: patch.approvalState ?? state.approvalState,
      db_assertions: {
        ...(state.dbAssertions ?? {}),
        ...(patch.dbAssertions ?? {}),
      },
      public_proof: {
        ...(state.publicProof ?? {}),
        ...(patch.publicProof ?? {}),
      },
      created_mutation_ids:
        patch.createdMutationIds ?? state.createdMutationIds ?? [],
      last_user_message_id: state.lastUserMessageId ?? null,
      updated_at: updatedAt.toISOString(),
    })
    .eq('id', state.id)
    .eq('rep_id', state.repId)
    .select('*')
    .single()
  if (error) throw error
  return mapTradeWorkflow(data as TradeWorkflowRow)
}

export function isMissingTradeWorkflowSchemaError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err)
  return (
    message.includes('nic_nac_trade_workflows') &&
    (message.includes('does not exist') ||
      message.includes('schema cache') ||
      message.includes('Could not find'))
  )
}
