import type { SupabaseClient } from '@supabase/supabase-js'
import {
  type EventStatus,
  type CalendarEvent,
  type AddShowInput,
  type AddShowResult,
  type ListShowsInput,
  type ListShowsResult,
  type UpdateShowInput,
  type UpdateShowResult,
  type CancelShowResult,
} from './types'
import { errors } from './errors'

const EVENT_SELECT = `
  id, rep_id, platform, event_time, duration_minutes, title, description,
  discount_code, discount_description, featured_collections, is_recurring,
  recurrence_rule, status, created_at, updated_at
`

type CalendarEventRow = {
  id: string
  rep_id: string
  platform: string
  event_time: string
  duration_minutes: number | null
  title: string | null
  description: string | null
  discount_code: string | null
  discount_description: string | null
  featured_collections: string[] | null
  is_recurring: boolean | null
  recurrence_rule: string | null
  status: EventStatus
  created_at: string
  updated_at: string
}

function normalizeOptionalText(value: string | undefined): string | null {
  if (value === undefined) return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function normalizeRequiredPlatform(platform: string): string {
  const trimmed = platform.trim()
  if (!trimmed) throw errors.MISSING_PLATFORM()
  return trimmed
}

function normalizeDuration(durationMinutes: number | undefined): number {
  if (durationMinutes === undefined) return 60
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw errors.INVALID_INPUT(
      'durationMinutes must be a positive integer',
      'Show duration needs to be a whole number of minutes.',
    )
  }
  return durationMinutes
}

function validatePatchDuration(durationMinutes: number | undefined): number | undefined {
  if (durationMinutes === undefined) return undefined
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw errors.INVALID_INPUT(
      'durationMinutes must be a positive integer',
      'Show duration needs to be a whole number of minutes.',
    )
  }
  return durationMinutes
}

function normalizeFutureEventTime(eventTime: string | undefined): string {
  if (!eventTime?.trim()) throw errors.MISSING_EVENT_TIME()
  const parsed = new Date(eventTime)
  if (Number.isNaN(parsed.getTime())) {
    throw errors.INVALID_INPUT('eventTime must be a valid ISO timestamp')
  }
  if (parsed.getTime() <= Date.now()) throw errors.EVENT_TIME_PAST()
  return parsed.toISOString()
}

function mapEvent(row: CalendarEventRow): CalendarEvent {
  return {
    id: row.id,
    repId: row.rep_id,
    platform: row.platform,
    eventTime: row.event_time,
    durationMinutes: row.duration_minutes ?? 60,
    title: row.title,
    description: row.description,
    discountCode: row.discount_code,
    discountDescription: row.discount_description,
    featuredCollections: row.featured_collections,
    isRecurring: row.is_recurring ?? false,
    recurrenceRule: row.recurrence_rule,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function getOwnedEvent(
  supabase: SupabaseClient,
  repId: string,
  eventId: string,
): Promise<CalendarEventRow> {
  const { data, error } = await supabase
    .from('calendar_events')
    .select(EVENT_SELECT)
    .eq('id', eventId)
    .maybeSingle()
  if (error) throw error
  if (!data) throw errors.EVENT_NOT_FOUND()

  const row = data as CalendarEventRow
  if (row.rep_id !== repId) throw errors.EVENT_NOT_FOUND()
  return row
}

export async function addShow(
  supabase: SupabaseClient,
  repId: string,
  input: AddShowInput,
): Promise<AddShowResult> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')

  const eventTime = normalizeFutureEventTime(input.eventTime)
  const platform = normalizeRequiredPlatform(input.platform)
  const durationMinutes = normalizeDuration(input.durationMinutes)

  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      rep_id: repId,
      platform,
      event_time: eventTime,
      duration_minutes: durationMinutes,
      title: normalizeOptionalText(input.title),
      description: normalizeOptionalText(input.description),
      discount_code: normalizeOptionalText(input.discountCode),
      discount_description: normalizeOptionalText(input.discountDescription),
      featured_collections: input.featuredCollections ?? null,
      status: 'scheduled',
    })
    .select(EVENT_SELECT)
    .single()
  if (error) throw error

  return { event: mapEvent(data as CalendarEventRow) }
}

export async function listMyShows(
  supabase: SupabaseClient,
  repId: string,
  input: ListShowsInput = {},
): Promise<ListShowsResult> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')

  const upcoming = input.upcoming ?? true
  const limit = input.limit ?? 10
  if (!Number.isInteger(limit) || limit <= 0) {
    throw errors.INVALID_INPUT('limit must be a positive integer')
  }

  const requestedStatuses = input.status
    ? Array.isArray(input.status)
      ? input.status
      : [input.status]
    : upcoming
      ? (['scheduled', 'live'] as EventStatus[])
      : (['scheduled', 'live', 'completed'] as EventStatus[])

  let query = supabase
    .from('calendar_events')
    .select(EVENT_SELECT, { count: 'exact' })
    .eq('rep_id', repId)

  if (upcoming) {
    query = query.gt('event_time', new Date().toISOString())
  }

  if (requestedStatuses.length === 1) {
    query = query.eq('status', requestedStatuses[0])
  } else {
    query = query.in('status', requestedStatuses)
  }

  query = query.order('event_time', { ascending: upcoming })
  const { data, error, count } = await query.limit(limit)
  if (error) throw error

  const rows = ((data ?? []) as CalendarEventRow[]).map(mapEvent)
  return { events: rows, totalCount: count ?? rows.length }
}

export async function updateShow(
  supabase: SupabaseClient,
  repId: string,
  eventId: string,
  patch: UpdateShowInput,
): Promise<UpdateShowResult> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')
  if (!eventId) throw errors.EVENT_NOT_FOUND()

  const current = await getOwnedEvent(supabase, repId, eventId)
  if (current.status !== 'scheduled') throw errors.EVENT_NOT_EDITABLE()

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  let hasPatch = false

  if (patch.platform !== undefined) {
    update.platform = normalizeRequiredPlatform(patch.platform)
    hasPatch = true
  }
  if (patch.eventTime !== undefined) {
    update.event_time = normalizeFutureEventTime(patch.eventTime)
    hasPatch = true
  }
  if (patch.durationMinutes !== undefined) {
    update.duration_minutes = validatePatchDuration(patch.durationMinutes)
    hasPatch = true
  }
  if (patch.title !== undefined) {
    update.title = normalizeOptionalText(patch.title)
    hasPatch = true
  }
  if (patch.description !== undefined) {
    update.description = normalizeOptionalText(patch.description)
    hasPatch = true
  }
  if (patch.discountCode !== undefined) {
    update.discount_code = normalizeOptionalText(patch.discountCode)
    hasPatch = true
  }
  if (patch.discountDescription !== undefined) {
    update.discount_description = normalizeOptionalText(patch.discountDescription)
    hasPatch = true
  }
  if (patch.featuredCollections !== undefined) {
    update.featured_collections = patch.featuredCollections
    hasPatch = true
  }

  if (!hasPatch) {
    throw errors.INVALID_INPUT(
      'at least one patch field is required',
      'Tell me what you want to change on that show.',
    )
  }

  const { data, error } = await supabase
    .from('calendar_events')
    .update(update)
    .eq('id', eventId)
    .select(EVENT_SELECT)
    .single()
  if (error) throw error

  return { event: mapEvent(data as CalendarEventRow) }
}

export async function cancelShow(
  supabase: SupabaseClient,
  repId: string,
  eventId: string,
  _reason?: string,
): Promise<CancelShowResult> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')
  if (!eventId) throw errors.EVENT_NOT_FOUND()

  const current = await getOwnedEvent(supabase, repId, eventId)
  if (current.status !== 'scheduled' && current.status !== 'live') {
    throw errors.EVENT_NOT_CANCELLABLE()
  }

  const { data, error } = await supabase
    .from('calendar_events')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .select(EVENT_SELECT)
    .single()
  if (error) throw error

  return { event: mapEvent(data as CalendarEventRow) }
}
