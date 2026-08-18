import type { SupabaseClient } from '@supabase/supabase-js'
import { ServiceError } from '@/lib/services/errors'

export type WorkspaceMessageOutboxStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'

export interface WorkspaceMessageOutboxEvent {
  id: string
  eventType: string
  idempotencyKey: string
  payload: Record<string, unknown>
  status: WorkspaceMessageOutboxStatus
  attemptCount: number
  nextAttemptAt: string
  claimedAt: string | null
  claimedBy: string | null
  lastError: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

type OutboxRow = {
  id: string
  event_type: string
  idempotency_key: string
  payload: Record<string, unknown>
  status: WorkspaceMessageOutboxStatus
  attempt_count: number
  next_attempt_at: string
  claimed_at: string | null
  claimed_by: string | null
  last_error: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

const OUTBOX_SELECT =
  'id, event_type, idempotency_key, payload, status, attempt_count, next_attempt_at, claimed_at, claimed_by, last_error, completed_at, created_at, updated_at'

function outboxError(code: string, message: string, statusCode = 400) {
  return new ServiceError({ code, message, userMessage: message, statusCode })
}

function mapOutboxEvent(row: OutboxRow): WorkspaceMessageOutboxEvent {
  return {
    id: row.id,
    eventType: row.event_type,
    idempotencyKey: row.idempotency_key,
    payload: row.payload,
    status: row.status,
    attemptCount: row.attempt_count,
    nextAttemptAt: row.next_attempt_at,
    claimedAt: row.claimed_at,
    claimedBy: row.claimed_by,
    lastError: row.last_error,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function normalizeRequired(value: string, label: string) {
  const normalized = value.trim()
  if (!normalized) {
    throw outboxError(
      'WORKSPACE_MESSAGE_OUTBOX_INVALID_INPUT',
      `${label} is required.`,
    )
  }
  return normalized
}

export async function enqueueWorkspaceMessageOutboxEvent(
  supabase: SupabaseClient,
  input: {
    eventType: string
    idempotencyKey: string
    payload: Record<string, unknown>
    nextAttemptAt?: string
  },
): Promise<WorkspaceMessageOutboxEvent> {
  const eventType = normalizeRequired(input.eventType, 'Event type')
  const idempotencyKey = normalizeRequired(input.idempotencyKey, 'Idempotency key')
  if (!input.payload || typeof input.payload !== 'object' || Array.isArray(input.payload)) {
    throw outboxError(
      'WORKSPACE_MESSAGE_OUTBOX_INVALID_INPUT',
      'Outbox payload must be an object.',
    )
  }
  const nextAttemptAt = input.nextAttemptAt
    ? new Date(input.nextAttemptAt)
    : new Date()
  if (!Number.isFinite(nextAttemptAt.getTime())) {
    throw outboxError(
      'WORKSPACE_MESSAGE_OUTBOX_INVALID_INPUT',
      'Next attempt time is invalid.',
    )
  }

  const { data, error } = await supabase
    .from('workspace_message_outbox')
    .upsert(
      {
        event_type: eventType,
        idempotency_key: idempotencyKey,
        payload: input.payload,
        next_attempt_at: nextAttemptAt.toISOString(),
      },
      { onConflict: 'idempotency_key', ignoreDuplicates: true },
    )
    .select(OUTBOX_SELECT)
    .maybeSingle()
  if (error) throw error
  if (data) return mapOutboxEvent(data as OutboxRow)

  const { data: existing, error: existingError } = await supabase
    .from('workspace_message_outbox')
    .select(OUTBOX_SELECT)
    .eq('idempotency_key', idempotencyKey)
    .single()
  if (existingError || !existing) {
    throw existingError ?? new Error('Message Center outbox enqueue failed')
  }
  return mapOutboxEvent(existing as OutboxRow)
}

export async function claimWorkspaceMessageOutboxEvents(
  supabase: SupabaseClient,
  input: { workerId: string; limit?: number },
): Promise<WorkspaceMessageOutboxEvent[]> {
  const workerId = normalizeRequired(input.workerId, 'Worker ID')
  const limit = input.limit ?? 25
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw outboxError(
      'WORKSPACE_MESSAGE_OUTBOX_INVALID_LIMIT',
      'Outbox claim limit must be between 1 and 100.',
    )
  }
  const { data, error } = await supabase.rpc('claim_workspace_message_outbox', {
    p_worker_id: workerId,
    p_limit: limit,
  })
  if (error) throw error
  return ((data ?? []) as OutboxRow[]).map(mapOutboxEvent)
}

export async function completeWorkspaceMessageOutboxEvent(
  supabase: SupabaseClient,
  input: { eventId: string; workerId: string },
) {
  const eventId = normalizeRequired(input.eventId, 'Event ID')
  const workerId = normalizeRequired(input.workerId, 'Worker ID')
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('workspace_message_outbox')
    .update({
      status: 'completed',
      completed_at: now,
      claimed_at: null,
      claimed_by: null,
      last_error: null,
      updated_at: now,
    })
    .eq('id', eventId)
    .eq('status', 'processing')
    .eq('claimed_by', workerId)
    .select(OUTBOX_SELECT)
    .maybeSingle()
  if (error) throw error
  if (!data) {
    throw outboxError(
      'WORKSPACE_MESSAGE_OUTBOX_CLAIM_MISMATCH',
      'This outbox event is not claimed by that worker.',
      409,
    )
  }
  return mapOutboxEvent(data as OutboxRow)
}

export async function failWorkspaceMessageOutboxEvent(
  supabase: SupabaseClient,
  input: {
    eventId: string
    workerId: string
    error: unknown
    retryAt: string
  },
) {
  const eventId = normalizeRequired(input.eventId, 'Event ID')
  const workerId = normalizeRequired(input.workerId, 'Worker ID')
  const retryAt = new Date(input.retryAt)
  if (!Number.isFinite(retryAt.getTime())) {
    throw outboxError(
      'WORKSPACE_MESSAGE_OUTBOX_INVALID_RETRY',
      'Retry time is invalid.',
    )
  }
  const detail =
    input.error instanceof Error ? input.error.message : String(input.error)
  const { data, error } = await supabase
    .from('workspace_message_outbox')
    .update({
      status: 'failed',
      next_attempt_at: retryAt.toISOString(),
      claimed_at: null,
      claimed_by: null,
      last_error: detail.slice(0, 2_000),
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .eq('status', 'processing')
    .eq('claimed_by', workerId)
    .select(OUTBOX_SELECT)
    .maybeSingle()
  if (error) throw error
  if (!data) {
    throw outboxError(
      'WORKSPACE_MESSAGE_OUTBOX_CLAIM_MISMATCH',
      'This outbox event is not claimed by that worker.',
      409,
    )
  }
  return mapOutboxEvent(data as OutboxRow)
}
