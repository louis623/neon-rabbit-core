import 'server-only'

import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

import { redactOperatorSupportSafeDiff } from './redaction'
import type {
  OperatorSupportAuditEvent,
  OperatorSupportAuditInput,
} from './types'

type AuditRow = {
  id: string
  support_session_id: string
  operator_rep_id: string
  target_rep_id: string
  event_type: OperatorSupportAuditEvent['eventType']
  workspace_area: OperatorSupportAuditEvent['workspaceArea']
  capability: OperatorSupportAuditEvent['capability']
  resource_type: string | null
  resource_id: string | null
  action_name: string | null
  result: OperatorSupportAuditEvent['result']
  safe_diff: Record<string, unknown>
  error_code: string | null
  idempotency_key: string | null
  request_id: string | null
  created_at: string
}

export class OperatorSupportAuditUnavailableError extends Error {
  readonly code = 'SUPPORT_AUDIT_UNAVAILABLE'

  constructor(message = 'Operator support audit logging is unavailable.', options?: ErrorOptions) {
    super(message, options)
    this.name = 'OperatorSupportAuditUnavailableError'
  }
}

function mapAuditEvent(value: unknown): OperatorSupportAuditEvent {
  const row = value as AuditRow
  return {
    id: row.id,
    supportSessionId: row.support_session_id,
    operatorRepId: row.operator_rep_id,
    targetRepId: row.target_rep_id,
    eventType: row.event_type,
    workspaceArea: row.workspace_area,
    capability: row.capability,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    actionName: row.action_name,
    result: row.result,
    safeDiff: row.safe_diff,
    errorCode: row.error_code,
    idempotencyKey: row.idempotency_key,
    requestId: row.request_id,
    createdAt: row.created_at,
  }
}

function normalizeErrorCode(value: string | null | undefined) {
  if (!value) return null
  const normalized = value.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_').slice(0, 100)
  return normalized.length >= 2 ? normalized : 'UNKNOWN_ERROR'
}

export async function appendOperatorSupportAuditEvent(
  supabase: SupabaseClient,
  input: OperatorSupportAuditInput,
) {
  const result = await supabase.rpc('append_operator_support_audit_event', {
    p_support_session_id: input.supportSessionId,
    p_operator_rep_id: input.operatorRepId,
    p_target_rep_id: input.targetRepId,
    p_event_type: input.eventType,
    p_workspace_area: input.workspaceArea,
    p_capability: input.capability ?? null,
    p_resource_type: input.resourceType?.trim() || null,
    p_resource_id: input.resourceId?.trim() || null,
    p_action_name: input.actionName?.trim() || null,
    p_result: input.result,
    p_safe_diff: redactOperatorSupportSafeDiff(input.safeDiff),
    p_error_code: normalizeErrorCode(input.errorCode),
    p_idempotency_key: input.idempotencyKey?.trim() || null,
    p_request_id: input.requestId?.trim() || null,
  })
  if (result.error || !result.data) {
    throw new OperatorSupportAuditUnavailableError(undefined, { cause: result.error })
  }
  return mapAuditEvent(result.data)
}

export async function operatorSupportSessionHasSuccessfulMutation(
  supabase: SupabaseClient,
  sessionId: string,
) {
  const { count, error } = await supabase
    .from('operator_support_audit_events')
    .select('id', { count: 'exact', head: true })
    .eq('support_session_id', sessionId)
    .eq('event_type', 'mutation_succeeded')
    .eq('result', 'succeeded')
  if (error) {
    throw new OperatorSupportAuditUnavailableError(
      'Support change history could not be verified before closeout.',
      { cause: error },
    )
  }
  return (count ?? 0) > 0
}

export async function runAuditedOperatorSupportMutation<T>(
  supabase: SupabaseClient,
  input: Omit<OperatorSupportAuditInput, 'eventType' | 'result' | 'safeDiff' | 'errorCode'> & {
    safeDiff?: (value: T) => unknown
    errorCode?: (error: unknown) => string
  },
  work: () => Promise<T>,
) {
  const requestId = input.requestId ?? randomUUID()
  const idempotencyKey = input.idempotencyKey ?? requestId
  const auditBase = {
    supportSessionId: input.supportSessionId,
    operatorRepId: input.operatorRepId,
    targetRepId: input.targetRepId,
    workspaceArea: input.workspaceArea,
    capability: input.capability,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    actionName: input.actionName,
    idempotencyKey,
    requestId,
  }

  // This write is deliberately before business work. If it fails, the
  // mutation is never attempted.
  await appendOperatorSupportAuditEvent(supabase, {
    ...auditBase,
    eventType: 'mutation_attempted',
    result: 'attempted',
  })

  try {
    const value = await work()
    let safeDiff: unknown
    try {
      safeDiff = input.safeDiff?.(value)
    } catch (error) {
      throw new OperatorSupportAuditUnavailableError(
        'The support mutation succeeded but its safe audit diff could not be prepared.',
        { cause: error },
      )
    }
    // A successful domain write is not acknowledged until its success event
    // is durable. An audit failure here therefore returns an unresolved error.
    await appendOperatorSupportAuditEvent(supabase, {
      ...auditBase,
      eventType: 'mutation_succeeded',
      result: 'succeeded',
      safeDiff,
    })
    return value
  } catch (error) {
    if (error instanceof OperatorSupportAuditUnavailableError) throw error
    try {
      await appendOperatorSupportAuditEvent(supabase, {
        ...auditBase,
        eventType: 'mutation_failed',
        result: 'failed',
        errorCode: input.errorCode?.(error) ?? 'DOMAIN_MUTATION_FAILED',
      })
    } catch (auditError) {
      throw new OperatorSupportAuditUnavailableError(
        'The support mutation failed and its audit result could not be recorded.',
        { cause: auditError },
      )
    }
    throw error
  }
}
