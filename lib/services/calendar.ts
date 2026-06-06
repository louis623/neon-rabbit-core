import { randomUUID } from 'node:crypto'
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
  type DiscountCode,
  type RecurringShowInput,
} from './types'
import { errors } from './errors'
import {
  DEFAULT_REP_TIME_ZONE,
  assertValidTimeZone,
} from './calendar-timezone'

const EVENT_SELECT = `
  id, rep_id, platform, event_time, time_zone, duration_minutes, title, description,
  discount_codes, featured_collections, is_recurring, recurrence_group_id,
  recurrence_rule, status, created_at, updated_at
`

type CalendarEventRow = {
  id: string
  rep_id: string
  platform: string
  event_time: string
  time_zone: string | null
  duration_minutes: number | null
  title: string | null
  description: string | null
  discount_codes: DiscountCode[] | null
  featured_collections: string[] | null
  is_recurring: boolean | null
  recurrence_group_id: string | null
  recurrence_rule: string | null
  status: EventStatus
  created_at: string
  updated_at: string
}

type CalendarEventUpdate = {
  updated_at: string
  platform?: string
  event_time?: string
  time_zone?: string
  duration_minutes?: number
  title?: string | null
  description?: string | null
  discount_codes?: DiscountCode[]
  featured_collections?: string[] | null
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

function normalizeEventTimeZone(timeZone: string | undefined): string {
  try {
    return assertValidTimeZone(timeZone)
  } catch {
    throw errors.INVALID_INPUT(
      'timeZone must be a valid IANA timezone',
      'Show timezone needs to be a valid timezone like America/New_York.',
    )
  }
}

function normalizeDiscountCodes(discountCodes: DiscountCode[] | undefined): DiscountCode[] {
  if (!discountCodes) return []
  if (discountCodes.length > 10) throw errors.TOO_MANY_DISCOUNT_CODES()

  return discountCodes.map((discountCode) => {
    const code = discountCode.code.trim()
    if (!code) throw errors.EMPTY_DISCOUNT_CODE()

    return {
      code,
      description: discountCode.description.trim(),
    }
  })
}

function getRecurringOccurrenceCount(recurring: RecurringShowInput): number {
  if (recurring.cadence === 'daily') {
    if (recurring.duration === '1_month') return 30
    if (recurring.duration === '3_months') return 90
    return 180
  }

  if (recurring.duration === '1_month') return 4
  if (recurring.duration === '3_months') return 13
  return 26
}

function buildRecurringEventTimes(eventTime: string, recurring: RecurringShowInput): string[] {
  const occurrences = getRecurringOccurrenceCount(recurring)
  const stepDays = recurring.cadence === 'daily' ? 1 : 7
  const startTime = Date.parse(eventTime)

  return Array.from({ length: occurrences }, (_, index) => {
    const nextTime = startTime + index * stepDays * 24 * 60 * 60 * 1000
    return new Date(nextTime).toISOString()
  })
}

async function runListShowsQuery(
  supabase: SupabaseClient,
  repId: string,
  statuses: EventStatus[],
  opts: { upcomingOnly: boolean; nowIso: string; limit: number; ascending: boolean },
): Promise<{ rows: CalendarEventRow[]; totalCount: number }> {
  let query = supabase
    .from('calendar_events')
    .select(EVENT_SELECT, { count: 'exact' })
    .eq('rep_id', repId)

  if (opts.upcomingOnly) {
    query = query.gt('event_time', opts.nowIso)
  }

  if (statuses.length === 1) {
    query = query.eq('status', statuses[0])
  } else {
    query = query.in('status', statuses)
  }

  query = query.order('event_time', { ascending: opts.ascending })
  const { data, error, count } = await query.limit(opts.limit)
  if (error) throw error

  const rows = (data ?? []) as CalendarEventRow[]
  return { rows, totalCount: count ?? rows.length }
}

function mapEvent(row: CalendarEventRow): CalendarEvent {
  return {
    id: row.id,
    repId: row.rep_id,
    platform: row.platform,
    eventTime: row.event_time,
    timeZone: row.time_zone ?? DEFAULT_REP_TIME_ZONE,
    durationMinutes: row.duration_minutes ?? 60,
    title: row.title,
    description: row.description,
    discountCodes: row.discount_codes ?? [],
    featuredCollections: row.featured_collections,
    isRecurring: row.is_recurring ?? false,
    recurrenceGroupId: row.recurrence_group_id,
    recurrenceRule: row.recurrence_rule,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function applyUpdateToRow(
  row: CalendarEventRow,
  update: CalendarEventUpdate,
): CalendarEventRow {
  return {
    ...row,
    platform: update.platform ?? row.platform,
    event_time: update.event_time ?? row.event_time,
    time_zone: update.time_zone ?? row.time_zone,
    duration_minutes: update.duration_minutes ?? row.duration_minutes,
    title: Object.prototype.hasOwnProperty.call(update, 'title')
      ? (update.title ?? null)
      : row.title,
    description: Object.prototype.hasOwnProperty.call(update, 'description')
      ? (update.description ?? null)
      : row.description,
    discount_codes: Object.prototype.hasOwnProperty.call(update, 'discount_codes')
      ? (update.discount_codes ?? [])
      : row.discount_codes,
    featured_collections: Object.prototype.hasOwnProperty.call(update, 'featured_collections')
      ? (update.featured_collections ?? null)
      : row.featured_collections,
    updated_at: update.updated_at,
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
  const timeZone = normalizeEventTimeZone(input.timeZone)
  const platform = normalizeRequiredPlatform(input.platform)
  const durationMinutes = normalizeDuration(input.durationMinutes)
  const discountCodes = normalizeDiscountCodes(input.discountCodes)
  const title = normalizeOptionalText(input.title)
  const description = normalizeOptionalText(input.description)
  const featuredCollections = input.featuredCollections ?? null

  if (!input.recurring) {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        rep_id: repId,
        platform,
        event_time: eventTime,
        time_zone: timeZone,
        duration_minutes: durationMinutes,
        title,
        description,
        discount_codes: discountCodes,
        featured_collections: featuredCollections,
        is_recurring: false,
        recurrence_group_id: null,
        recurrence_rule: null,
        status: 'scheduled',
      })
      .select(EVENT_SELECT)
      .single()
    if (error) throw error

    return { events: [mapEvent(data as CalendarEventRow)], count: 1 }
  }

  const recurrenceGroupId = randomUUID()
  const eventRows = buildRecurringEventTimes(eventTime, input.recurring).map((nextEventTime) => ({
    id: randomUUID(),
    rep_id: repId,
    platform,
    event_time: nextEventTime,
    time_zone: timeZone,
    duration_minutes: durationMinutes,
    title,
    description,
    discount_codes: discountCodes,
    featured_collections: featuredCollections,
    is_recurring: true,
    recurrence_group_id: recurrenceGroupId,
    recurrence_rule: input.recurring!.cadence,
    status: 'scheduled' as const,
  }))

  const { data, error } = await supabase
    .from('calendar_events')
    .insert(eventRows)
    .select(EVENT_SELECT)
  if (error) throw error

  const events = ((data ?? []) as CalendarEventRow[]).map(mapEvent)
  return { events, count: events.length }
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
  const ascending = upcoming
  const nowIso = new Date().toISOString()

  if (upcoming && requestedStatuses.includes('live')) {
    const liveStatuses = requestedStatuses.filter((status) => status === 'live')
    const futureStatuses = requestedStatuses.filter((status) => status !== 'live')

    if (futureStatuses.length === 0) {
      const result = await runListShowsQuery(supabase, repId, liveStatuses, {
        upcomingOnly: false,
        nowIso,
        limit,
        ascending,
      })
      return {
        events: result.rows.map(mapEvent),
        totalCount: result.totalCount,
      }
    }

    // Live shows can already be in progress, so they need to bypass the future-time filter.
    const [liveResult, futureResult] = await Promise.all([
      runListShowsQuery(supabase, repId, liveStatuses, {
        upcomingOnly: false,
        nowIso,
        limit,
        ascending,
      }),
      runListShowsQuery(supabase, repId, futureStatuses, {
        upcomingOnly: true,
        nowIso,
        limit,
        ascending,
      }),
    ])

    const events = [...liveResult.rows, ...futureResult.rows]
      .sort((a, b) => Date.parse(a.event_time) - Date.parse(b.event_time))
      .slice(0, limit)
      .map(mapEvent)

    return {
      events,
      totalCount: liveResult.totalCount + futureResult.totalCount,
    }
  }

  const result = await runListShowsQuery(supabase, repId, requestedStatuses, {
    upcomingOnly: upcoming,
    nowIso,
    limit,
    ascending,
  })

  return {
    events: result.rows.map(mapEvent),
    totalCount: result.totalCount,
  }
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
  if (patch.applyToSeries && !current.recurrence_group_id) throw errors.NOT_A_SERIES()

  const update: CalendarEventUpdate = { updated_at: new Date().toISOString() }
  let hasPatch = false

  if (patch.platform !== undefined) {
    update.platform = normalizeRequiredPlatform(patch.platform)
    hasPatch = true
  }
  if (patch.eventTime !== undefined) {
    update.event_time = normalizeFutureEventTime(patch.eventTime)
    hasPatch = true
  }
  if (patch.timeZone !== undefined) {
    update.time_zone = normalizeEventTimeZone(patch.timeZone)
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
  if (patch.discountCodes !== undefined) {
    update.discount_codes = normalizeDiscountCodes(patch.discountCodes)
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

  if (patch.applyToSeries) {
    const { data, error } = await supabase
      .from('calendar_events')
      .update(update)
      .eq('rep_id', repId)
      .eq('recurrence_group_id', current.recurrence_group_id)
      .gt('event_time', new Date().toISOString())
      .eq('status', 'scheduled')
      .select(EVENT_SELECT)
    if (error) throw error

    const rows = ((data ?? []) as CalendarEventRow[]).map(mapEvent)
    const targetEvent =
      rows.find((event) => event.id === eventId) ?? mapEvent(applyUpdateToRow(current, update))

    return {
      event: targetEvent,
      updatedCount: rows.length,
    }
  }

  const { data, error } = await supabase
    .from('calendar_events')
    .update(update)
    .eq('id', eventId)
    .eq('rep_id', repId)
    .select(EVENT_SELECT)
    .single()
  if (error) throw error

  return { event: mapEvent(data as CalendarEventRow), updatedCount: 1 }
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
    .eq('rep_id', repId)
    .select(EVENT_SELECT)
    .single()
  if (error) throw error

  return { event: mapEvent(data as CalendarEventRow) }
}
