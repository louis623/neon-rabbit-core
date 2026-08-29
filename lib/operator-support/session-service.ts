import 'server-only'

import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

import {
  hasSupportCapability,
  normalizeSupportCapabilities,
} from './capabilities'
import {
  OPERATOR_SUPPORT_ENDED_REASONS,
  OPERATOR_SUPPORT_REASON_CODES,
  type OperatorSupportEndedReason,
  type OperatorSupportReasonCode,
  type OperatorSupportSession,
  type OperatorSupportSessionStatus,
  type SupportCapability,
  type WorkspaceActor,
} from './types'
import { assertOperatorSupportCustomerSafeText } from './redaction'

const DEFAULT_DURATION_MINUTES = 30
const MAX_DURATION_MINUTES = 60

const SESSION_SELECT = [
  'id',
  'operator_rep_id',
  'operator_email_snapshot',
  'operator_display_name_snapshot',
  'target_rep_id',
  'target_name_snapshot',
  'target_business_snapshot',
  'reason_code',
  'reason_note',
  'support_report_id',
  'status',
  'capabilities',
  'request_id',
  'started_at',
  'last_activity_at',
  'expires_at',
  'extended_at',
  'ended_at',
  'ended_reason',
  'completion_summary',
  'start_publication_id',
  'end_publication_id',
  'created_at',
  'updated_at',
].join(', ')

type SessionRow = {
  id: string
  operator_rep_id: string
  operator_email_snapshot: string
  operator_display_name_snapshot: string
  target_rep_id: string
  target_name_snapshot: string
  target_business_snapshot: string
  reason_code: OperatorSupportReasonCode
  reason_note: string | null
  support_report_id: string | null
  status: OperatorSupportSessionStatus
  capabilities: SupportCapability[]
  request_id: string
  started_at: string | null
  last_activity_at: string | null
  expires_at: string
  extended_at: string | null
  ended_at: string | null
  ended_reason: OperatorSupportEndedReason | null
  completion_summary: string | null
  start_publication_id: string | null
  end_publication_id: string | null
  created_at: string
  updated_at: string
}

export type OperatorSupportErrorCode =
  | 'SUPPORT_INVALID_INPUT'
  | 'SUPPORT_SESSION_NOT_FOUND'
  | 'SUPPORT_OPERATOR_MISMATCH'
  | 'SUPPORT_TARGET_MISMATCH'
  | 'SUPPORT_SESSION_INACTIVE'
  | 'SUPPORT_SESSION_EXPIRED'
  | 'SUPPORT_SESSION_CONFLICT'
  | 'SUPPORT_CAPABILITY_DENIED'
  | 'SUPPORT_CSRF_INVALID'
  | 'SUPPORT_TARGET_INELIGIBLE'
  | 'SUPPORT_DATA_UNAVAILABLE'

export class OperatorSupportError extends Error {
  constructor(
    public readonly code: OperatorSupportErrorCode,
    message: string,
    public readonly status: number,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'OperatorSupportError'
  }
}

function cleanRequired(value: string, field: string, maxLength: number) {
  const cleaned = value.trim()
  if (!cleaned || cleaned.length > maxLength) {
    throw new OperatorSupportError('SUPPORT_INVALID_INPUT', `${field} is invalid.`, 400)
  }
  return cleaned
}

function assertCustomerSafeText(
  value: string | null | undefined,
  label: string,
) {
  try {
    assertOperatorSupportCustomerSafeText(value, label)
  } catch (error) {
    throw new OperatorSupportError(
      'SUPPORT_INVALID_INPUT',
      error instanceof Error ? error.message : `${label} is not safe to store.`,
      400,
    )
  }
}

function mapSession(value: unknown): OperatorSupportSession {
  const row = value as SessionRow
  return {
    id: row.id,
    operatorRepId: row.operator_rep_id,
    operatorEmailSnapshot: row.operator_email_snapshot,
    operatorDisplayNameSnapshot: row.operator_display_name_snapshot,
    targetRepId: row.target_rep_id,
    targetNameSnapshot: row.target_name_snapshot,
    targetBusinessSnapshot: row.target_business_snapshot,
    reasonCode: row.reason_code,
    reasonNote: row.reason_note,
    supportReportId: row.support_report_id,
    status: row.status,
    capabilities: normalizeSupportCapabilities(row.capabilities),
    requestId: row.request_id,
    startedAt: row.started_at,
    lastActivityAt: row.last_activity_at,
    expiresAt: row.expires_at,
    extendedAt: row.extended_at,
    endedAt: row.ended_at,
    endedReason: row.ended_reason,
    completionSummary: row.completion_summary,
    startPublicationId: row.start_publication_id,
    endPublicationId: row.end_publication_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rpcFailure(message: string, cause: unknown): never {
  const databaseCode = typeof cause === 'object' && cause
    ? String((cause as { code?: unknown }).code ?? '')
    : ''
  if (databaseCode === '23505') {
    throw new OperatorSupportError(
      'SUPPORT_SESSION_CONFLICT',
      'An operator or target already has an open support session.',
      409,
      { cause },
    )
  }
  if (databaseCode === 'P0002') {
    throw new OperatorSupportError('SUPPORT_SESSION_NOT_FOUND', 'Support session was not found.', 404, { cause })
  }
  if (databaseCode === '42501') {
    throw new OperatorSupportError('SUPPORT_OPERATOR_MISMATCH', 'Support operator is not authorized.', 403, { cause })
  }
  if (databaseCode === '22023' || databaseCode === '23514') {
    throw new OperatorSupportError('SUPPORT_INVALID_INPUT', 'Support session input is invalid.', 400, { cause })
  }
  if (databaseCode === '55000') {
    throw new OperatorSupportError('SUPPORT_SESSION_INACTIVE', 'Support session cannot make that transition.', 409, { cause })
  }
  throw new OperatorSupportError('SUPPORT_DATA_UNAVAILABLE', message, 503, { cause })
}

function deterministicSessionId(operatorRepId: string, requestId: string) {
  const hex = createHash('sha256').update(`${operatorRepId}:${requestId}`).digest('hex').slice(0, 32).split('')
  hex[12] = '5'
  hex[16] = ((Number.parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16)
  const value = hex.join('')
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`
}

function csrfTokenForRequest(operatorRepId: string, requestId: string) {
  const secret = process.env.CONTROL_CENTER_SESSION_SECRET
  if (!secret) return createOperatorSupportCsrfToken()
  return createHmac('sha256', secret)
    .update(`operator-support:${operatorRepId}:${requestId}`)
    .digest('base64url')
}

export function createOperatorSupportCsrfToken() {
  return randomBytes(32).toString('base64url')
}

export function hashOperatorSupportCsrfToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function verifyOperatorSupportCsrfToken(token: string, expectedHash: string) {
  if (!token || !/^[a-f0-9]{64}$/.test(expectedHash)) return false
  const actual = Buffer.from(hashOperatorSupportCsrfToken(token), 'hex')
  const expected = Buffer.from(expectedHash, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export async function requestOperatorSupportSession(
  supabase: SupabaseClient,
  input: {
    operatorRepId: string
    operatorEmail: string
    operatorDisplayName: string
    targetRepId: string
    targetName: string
    targetBusinessName: string
    reasonCode: OperatorSupportReasonCode
    reasonNote?: string | null
    supportReportId?: string | null
    capabilities: readonly SupportCapability[]
    requestId?: string
    sessionId?: string
    csrfToken?: string
    durationMinutes?: number
  },
): Promise<{ session: OperatorSupportSession; csrfToken: string }> {
  const operatorRepId = cleanRequired(input.operatorRepId, 'Operator identity', 100)
  const targetRepId = cleanRequired(input.targetRepId, 'Target identity', 100)
  if (operatorRepId === targetRepId) {
    throw new OperatorSupportError('SUPPORT_INVALID_INPUT', 'Self-support sessions are not allowed.', 400)
  }
  if (!(OPERATOR_SUPPORT_REASON_CODES as readonly string[]).includes(input.reasonCode)) {
    throw new OperatorSupportError('SUPPORT_INVALID_INPUT', 'Support reason is invalid.', 400)
  }
  const reasonNote = input.reasonNote?.trim() || null
  if (reasonNote && reasonNote.length > 500) {
    throw new OperatorSupportError('SUPPORT_INVALID_INPUT', 'Support reason note is too long.', 400)
  }
  assertCustomerSafeText(reasonNote, 'Support reason')
  const durationMinutes = input.durationMinutes ?? DEFAULT_DURATION_MINUTES
  if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > MAX_DURATION_MINUTES) {
    throw new OperatorSupportError('SUPPORT_INVALID_INPUT', 'Support session duration is invalid.', 400)
  }

  const requestId = cleanRequired(input.requestId ?? randomUUID(), 'Request ID', 200)
  const sessionId = input.sessionId ?? deterministicSessionId(operatorRepId, requestId)
  const csrfToken = input.csrfToken ?? csrfTokenForRequest(operatorRepId, requestId)
  const capabilities = normalizeSupportCapabilities(input.capabilities)
  const result = await supabase.rpc('request_operator_support_session', {
    p_session_id: sessionId,
    p_operator_rep_id: operatorRepId,
    p_operator_email_snapshot: cleanRequired(input.operatorEmail, 'Operator email', 320).toLowerCase(),
    p_operator_display_name_snapshot: cleanRequired(input.operatorDisplayName, 'Operator name', 160),
    p_target_rep_id: targetRepId,
    p_target_name_snapshot: cleanRequired(input.targetName, 'Target name', 160),
    p_target_business_snapshot: cleanRequired(input.targetBusinessName, 'Target business', 200),
    p_reason_code: input.reasonCode,
    p_reason_note: reasonNote,
    p_support_report_id: input.supportReportId ?? null,
    p_capabilities: capabilities,
    p_csrf_token_hash: hashOperatorSupportCsrfToken(csrfToken),
    p_expires_at: new Date(Date.now() + durationMinutes * 60_000).toISOString(),
    p_request_id: requestId,
  })
  if (result.error || !result.data) rpcFailure('Support session could not be requested.', result.error)
  return { session: mapSession(result.data), csrfToken }
}

export async function activateOperatorSupportSession(
  supabase: SupabaseClient,
  input: { sessionId: string; operatorRepId: string; startPublicationId: string; requestId?: string },
) {
  const result = await supabase.rpc('activate_operator_support_session', {
    p_session_id: input.sessionId,
    p_operator_rep_id: input.operatorRepId,
    p_start_publication_id: input.startPublicationId,
    p_request_id: input.requestId ?? randomUUID(),
  })
  if (result.error || !result.data) rpcFailure('Support session could not be activated.', result.error)
  return mapSession(result.data)
}

export async function getOperatorSupportSession(
  supabase: SupabaseClient,
  input: { sessionId: string; operatorRepId?: string; targetRepId?: string },
) {
  let query = supabase
    .from('operator_support_sessions')
    .select(SESSION_SELECT)
    .eq('id', input.sessionId)
  if (input.operatorRepId) query = query.eq('operator_rep_id', input.operatorRepId)
  if (input.targetRepId) query = query.eq('target_rep_id', input.targetRepId)
  const result = await query.maybeSingle()
  if (result.error) rpcFailure('Support session could not be loaded.', result.error)
  return result.data ? mapSession(result.data) : null
}

export async function listOperatorSupportSessions(
  supabase: SupabaseClient,
  input: {
    operatorRepId: string
    targetRepId?: string
    statuses?: readonly OperatorSupportSessionStatus[]
    limit?: number
  },
) {
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100)
  let query = supabase
    .from('operator_support_sessions')
    .select(SESSION_SELECT)
    .eq('operator_rep_id', input.operatorRepId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit)
  if (input.targetRepId) query = query.eq('target_rep_id', input.targetRepId)
  if (input.statuses?.length) query = query.in('status', [...input.statuses])
  const result = await query
  if (result.error) rpcFailure('Support session history could not be loaded.', result.error)
  return (result.data ?? []).map(mapSession)
}

export async function extendOperatorSupportSession(
  supabase: SupabaseClient,
  input: { sessionId: string; operatorRepId: string; newExpiresAt: string; requestId?: string },
) {
  const result = await supabase.rpc('extend_operator_support_session', {
    p_session_id: input.sessionId,
    p_operator_rep_id: input.operatorRepId,
    p_new_expires_at: input.newExpiresAt,
    p_request_id: input.requestId ?? randomUUID(),
  })
  if (result.error || !result.data) rpcFailure('Support session could not be extended.', result.error)
  return mapSession(result.data)
}

export async function endOperatorSupportSession(
  supabase: SupabaseClient,
  input: {
    sessionId: string
    operatorRepId: string
    endedReason?: OperatorSupportEndedReason
    completionSummary?: string | null
    endPublicationId?: string | null
    requestId?: string
  },
) {
  const endedReason = input.endedReason ?? 'operator'
  if (!(OPERATOR_SUPPORT_ENDED_REASONS as readonly string[]).includes(endedReason)) {
    throw new OperatorSupportError('SUPPORT_INVALID_INPUT', 'Support end reason is invalid.', 400)
  }
  const summary = input.completionSummary?.trim() || null
  if (summary && summary.length > 1_000) {
    throw new OperatorSupportError('SUPPORT_INVALID_INPUT', 'Completion summary is too long.', 400)
  }
  assertCustomerSafeText(summary, 'Completion summary')
  const result = await supabase.rpc('end_operator_support_session', {
    p_session_id: input.sessionId,
    p_operator_rep_id: input.operatorRepId,
    p_ended_reason: endedReason,
    p_completion_summary: summary,
    p_end_publication_id: input.endPublicationId ?? null,
    p_request_id: input.requestId ?? randomUUID(),
  })
  if (result.error || !result.data) rpcFailure('Support session could not be ended.', result.error)
  return mapSession(result.data)
}

export async function recordOperatorSupportCompletionNotice(
  supabase: SupabaseClient,
  input: { sessionId: string; endPublicationId: string; requestId?: string },
) {
  const result = await supabase.rpc('record_operator_support_completion_notice', {
    p_session_id: input.sessionId,
    p_end_publication_id: input.endPublicationId,
    p_request_id: input.requestId ?? randomUUID(),
  })
  if (result.error || !result.data) rpcFailure('Support completion notice could not be recorded.', result.error)
  return mapSession(result.data)
}

export async function expireOperatorSupportSessions(supabase: SupabaseClient) {
  const result = await supabase.rpc('expire_operator_support_sessions')
  if (result.error) rpcFailure('Support sessions could not be expired.', result.error)
  return Number(result.data ?? 0)
}

export async function verifyOperatorSupportSessionAccess(
  supabase: SupabaseClient,
  input: {
    sessionId: string
    operatorRepId: string
    targetRepId?: string
    capability?: SupportCapability
    mutation?: boolean
    csrfToken?: string | null
  },
): Promise<{ session: OperatorSupportSession; actor: WorkspaceActor }> {
  const session = await getOperatorSupportSession(supabase, { sessionId: input.sessionId })
  if (!session) {
    throw new OperatorSupportError('SUPPORT_SESSION_NOT_FOUND', 'Support session was not found.', 404)
  }
  if (session.operatorRepId !== input.operatorRepId) {
    throw new OperatorSupportError('SUPPORT_OPERATOR_MISMATCH', 'Support operator does not match.', 403)
  }
  if (input.targetRepId && session.targetRepId !== input.targetRepId) {
    throw new OperatorSupportError('SUPPORT_TARGET_MISMATCH', 'Support target does not match.', 403)
  }
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    throw new OperatorSupportError('SUPPORT_SESSION_EXPIRED', 'Support session has expired.', 410)
  }
  if (session.status !== 'active') {
    throw new OperatorSupportError('SUPPORT_SESSION_INACTIVE', 'Support session is not active.', 410)
  }
  if (input.capability && !hasSupportCapability(session.capabilities, input.capability)) {
    throw new OperatorSupportError('SUPPORT_CAPABILITY_DENIED', 'Support action is not allowed.', 403)
  }
  if (input.mutation) {
    const hashResult = await supabase
      .from('operator_support_sessions')
      .select('csrf_token_hash')
      .eq('id', session.id)
      .eq('operator_rep_id', input.operatorRepId)
      .maybeSingle()
    if (hashResult.error) rpcFailure('Support mutation could not be verified.', hashResult.error)
    const expectedHash = (hashResult.data as { csrf_token_hash?: string } | null)?.csrf_token_hash
    if (!expectedHash || !input.csrfToken || !verifyOperatorSupportCsrfToken(input.csrfToken, expectedHash)) {
      throw new OperatorSupportError('SUPPORT_CSRF_INVALID', 'Support mutation verification failed.', 403)
    }
  }

  return {
    session,
    actor: {
      mode: 'operator_support',
      operatorRepId: session.operatorRepId,
      operatorEmail: session.operatorEmailSnapshot,
      operatorDisplayName: session.operatorDisplayNameSnapshot,
      subjectRepId: session.targetRepId,
      supportSessionId: session.id,
      capabilities: session.capabilities,
    },
  }
}
