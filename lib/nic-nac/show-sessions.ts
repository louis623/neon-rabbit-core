import type { SupabaseClient } from '@supabase/supabase-js'
import { getLiveQueueSnapshot } from '@/lib/services/live-queue'
import type { LiveQueueSnapshot } from '@/lib/services/types'
import type { RepMemorySource, RepMemoryType } from './memory'

export const NIC_NAC_SHOW_EVENT_TYPES = [
  'show_started',
  'queue_snapshot',
  'inventory_note',
  'customer_request',
  'promise',
  'follow_up',
  'trade_note',
  'show_summary',
] as const

export type NicNacShowEventType = (typeof NIC_NAC_SHOW_EVENT_TYPES)[number]
export type NicNacShowSessionStatus = 'active' | 'ended'

export interface NicNacShowSession {
  id: string
  repId: string
  calendarEventId: string | null
  liveQueueSyncCode: string | null
  status: NicNacShowSessionStatus
  startedAt: string
  endedAt: string | null
  summary: string | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface NicNacShowSessionEvent {
  id: string
  sessionId: string
  repId: string
  eventType: NicNacShowEventType
  summary: string
  payload: Record<string, unknown>
  conversationId: string | null
  runId: string | null
  occurredAt: string
  createdAt: string
}

export interface NicNacShowMemoryNote {
  repId: string
  summary: string
  memoryType: RepMemoryType
  memorySource: RepMemorySource
  conversationDate: string
}

type SessionRow = {
  id: string
  rep_id: string
  calendar_event_id: string | null
  live_queue_sync_code: string | null
  status: NicNacShowSessionStatus
  started_at: string
  ended_at: string | null
  summary: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

type EventRow = {
  id: string
  session_id: string
  rep_id: string
  event_type: NicNacShowEventType
  summary: string
  payload: Record<string, unknown> | null
  conversation_id: string | null
  run_id: string | null
  occurred_at: string
  created_at: string
}

export interface StartNicNacShowSessionInput {
  repId: string
  calendarEventId?: string
  liveQueueSyncCode?: string
  startedAt?: Date
  metadata?: Record<string, unknown>
}

export interface RecordNicNacShowSessionEventInput {
  sessionId: string
  repId: string
  eventType: NicNacShowEventType
  summary: string
  payload?: Record<string, unknown>
  conversationId?: string
  runId?: string
  occurredAt?: Date
}

export interface BuildNicNacShowSessionContextInput {
  repId: string
  activeSession: NicNacShowSession | null
  recentEvents: NicNacShowSessionEvent[]
  memoryNotes: NicNacShowMemoryNote[]
  liveQueueSnapshot?: LiveQueueSnapshot | null
}

export interface LoadNicNacShowSessionContextOptions {
  eventLimit?: number
  memoryLimit?: number
}

function mapSession(row: SessionRow): NicNacShowSession {
  return {
    id: row.id,
    repId: row.rep_id,
    calendarEventId: row.calendar_event_id,
    liveQueueSyncCode: row.live_queue_sync_code,
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    summary: row.summary,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapEvent(row: EventRow): NicNacShowSessionEvent {
  return {
    id: row.id,
    sessionId: row.session_id,
    repId: row.rep_id,
    eventType: row.event_type,
    summary: row.summary,
    payload: row.payload ?? {},
    conversationId: row.conversation_id,
    runId: row.run_id,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
  }
}

export async function startNicNacShowSession(
  supabase: SupabaseClient,
  input: StartNicNacShowSessionInput,
): Promise<NicNacShowSession> {
  const startedAt = (input.startedAt ?? new Date()).toISOString()

  const { error: closeError } = await supabase
    .from('nic_nac_show_sessions')
    .update({
      status: 'ended',
      ended_at: startedAt,
      updated_at: startedAt,
    })
    .eq('rep_id', input.repId)
    .eq('status', 'active')
    .is('ended_at', null)

  if (closeError) throw closeError

  const { data, error } = await supabase
    .from('nic_nac_show_sessions')
    .insert({
      rep_id: input.repId,
      calendar_event_id: input.calendarEventId ?? null,
      live_queue_sync_code: input.liveQueueSyncCode ?? null,
      status: 'active',
      started_at: startedAt,
      metadata: input.metadata ?? {},
    })
    .select(
      [
        'id',
        'rep_id',
        'calendar_event_id',
        'live_queue_sync_code',
        'status',
        'started_at',
        'ended_at',
        'summary',
        'metadata',
        'created_at',
        'updated_at',
      ].join(', '),
    )
    .single()

  if (error || !data) throw error ?? new Error('show session insert failed')
  return mapSession(data as unknown as SessionRow)
}

export async function recordNicNacShowSessionEvent(
  supabase: SupabaseClient,
  input: RecordNicNacShowSessionEventInput,
): Promise<NicNacShowSessionEvent> {
  const occurredAt = (input.occurredAt ?? new Date()).toISOString()

  const { data, error } = await supabase
    .from('nic_nac_show_session_events')
    .insert({
      session_id: input.sessionId,
      rep_id: input.repId,
      event_type: input.eventType,
      summary: input.summary,
      payload: input.payload ?? {},
      conversation_id: input.conversationId ?? null,
      run_id: input.runId ?? null,
      occurred_at: occurredAt,
    })
    .select(
      [
        'id',
        'session_id',
        'rep_id',
        'event_type',
        'summary',
        'payload',
        'conversation_id',
        'run_id',
        'occurred_at',
        'created_at',
      ].join(', '),
    )
    .single()

  if (error || !data) throw error ?? new Error('show session event insert failed')
  return mapEvent(data as unknown as EventRow)
}

export function buildNicNacShowSessionContext(
  input: BuildNicNacShowSessionContextInput,
) {
  const activeSession =
    input.activeSession?.repId === input.repId ? input.activeSession : null
  const recentEvents = input.recentEvents.filter(
    (event) =>
      event.repId === input.repId &&
      (!activeSession || event.sessionId === activeSession.id),
  )
  const memoryNotes = input.memoryNotes.filter((note) => note.repId === input.repId)

  return {
    activeSession,
    liveQueueSnapshot:
      activeSession && input.liveQueueSnapshot?.syncCode === activeSession.liveQueueSyncCode
        ? input.liveQueueSnapshot
        : null,
    recentEvents,
    memory: {
      preferences: memoryNotes
        .filter((note) => note.memoryType === 'preference')
        .map((note) => note.summary),
      showProcesses: memoryNotes
        .filter((note) => note.memoryType === 'show_process')
        .map((note) => note.summary),
      customerPatterns: memoryNotes
        .filter((note) => note.memoryType === 'customer_pattern')
        .map((note) => note.summary),
      followUps: memoryNotes
        .filter((note) => note.memoryType === 'follow_up')
        .map((note) => note.summary),
      previousShowSummaries: memoryNotes
        .filter((note) => note.memoryType === 'show_summary')
        .map((note) => note.summary),
      guarded: memoryNotes
        .filter((note) => note.memorySource === 'guarded')
        .map((note) => note.summary),
    },
  }
}

export async function loadNicNacShowSessionContext(
  supabase: SupabaseClient,
  repId: string,
  options: LoadNicNacShowSessionContextOptions = {},
) {
  const eventLimit = options.eventLimit ?? 20
  const memoryLimit = options.memoryLimit ?? 10

  const { data: sessionData, error: sessionError } = await supabase
    .from('nic_nac_show_sessions')
    .select(
      [
        'id',
        'rep_id',
        'calendar_event_id',
        'live_queue_sync_code',
        'status',
        'started_at',
        'ended_at',
        'summary',
        'metadata',
        'created_at',
        'updated_at',
      ].join(', '),
    )
    .eq('rep_id', repId)
    .eq('status', 'active')
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (sessionError) throw sessionError
  const activeSession = sessionData
    ? mapSession(sessionData as unknown as SessionRow)
    : null

  let recentEvents: NicNacShowSessionEvent[] = []
  const liveQueueSnapshot = activeSession
    ? await getLiveQueueSnapshot(supabase, {
        repId,
        syncCode: activeSession.liveQueueSyncCode,
      })
    : null

  if (activeSession) {
    const { data: eventData, error: eventError } = await supabase
      .from('nic_nac_show_session_events')
      .select(
        [
          'id',
          'session_id',
          'rep_id',
          'event_type',
          'summary',
          'payload',
          'conversation_id',
          'run_id',
          'occurred_at',
          'created_at',
        ].join(', '),
      )
      .eq('rep_id', repId)
      .eq('session_id', activeSession.id)
      .order('occurred_at', { ascending: false })
      .limit(eventLimit)

    if (eventError) throw eventError
    recentEvents = ((eventData ?? []) as unknown as EventRow[]).map(mapEvent)
  }

  const { data: noteData, error: noteError } = await supabase
    .from('rep_notes')
    .select('summary, memory_type, memory_source, conversation_date')
    .eq('rep_id', repId)
    .order('conversation_date', { ascending: false })
    .limit(memoryLimit)

  if (noteError) throw noteError
  const memoryNotes = (
    (noteData ?? []) as unknown as Array<{
      summary: string
      memory_type: RepMemoryType
      memory_source: RepMemorySource
      conversation_date: string
    }>
  ).map((note) => ({
    repId,
    summary: note.summary,
    memoryType: note.memory_type,
    memorySource: note.memory_source,
    conversationDate: note.conversation_date,
  }))

  return buildNicNacShowSessionContext({
    repId,
    activeSession,
    liveQueueSnapshot,
    recentEvents,
    memoryNotes,
  })
}
