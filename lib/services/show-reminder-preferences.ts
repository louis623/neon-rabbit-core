import type { SupabaseClient } from '@supabase/supabase-js'
import { errors } from './errors'
import type {
  SetShowReminderOverrideInput,
  SetShowReminderPreferencesInput,
  ShowReminderChannel,
  ShowReminderOverride,
  ShowReminderPreferences,
} from './types'

const DEFAULT_PREFERENCES: Omit<ShowReminderPreferences, 'repId'> = {
  enabled: true,
  channels: ['sms'],
  leadMinutes: 30,
  includeDiscountCodes: true,
  includeFeaturedCollections: true,
  source: 'default',
  createdAt: null,
  updatedAt: null,
}

type ShowReminderPreferencesRow = {
  rep_id: string
  enabled: boolean | null
  channels: string[] | null
  lead_minutes: number | null
  include_discount_codes: boolean | null
  include_featured_collections: boolean | null
  created_at: string | null
  updated_at: string | null
}

type ShowReminderOverrideRow = ShowReminderPreferencesRow & {
  event_id: string
}

const VALID_CHANNELS = new Set<ShowReminderChannel>(['sms', 'email'])

function normalizeChannels(
  channels: ShowReminderChannel[] | undefined,
  fallback: ShowReminderChannel[] = DEFAULT_PREFERENCES.channels,
): ShowReminderChannel[] {
  if (channels === undefined) return [...fallback]
  const unique = [...new Set(channels)]
  if (unique.length === 0 || unique.some((channel) => !VALID_CHANNELS.has(channel))) {
    throw errors.INVALID_INPUT(
      'channels must contain sms and/or email',
      'Reminder channels need to be SMS, email, or both.',
    )
  }
  return unique
}

function normalizeLeadMinutes(
  leadMinutes: number | undefined,
  fallback = DEFAULT_PREFERENCES.leadMinutes,
): number {
  if (leadMinutes === undefined) return fallback
  if (!Number.isInteger(leadMinutes) || leadMinutes < 15 || leadMinutes > 180) {
    throw errors.INVALID_INPUT(
      'leadMinutes must be a whole number between 15 and 180',
      'Reminder timing needs to be between 15 minutes and 3 hours before the show.',
    )
  }
  return leadMinutes
}

function validateReminderPatchInput(input: {
  channels?: ShowReminderChannel[]
  leadMinutes?: number
}) {
  if (input.channels !== undefined) normalizeChannels(input.channels)
  if (input.leadMinutes !== undefined) normalizeLeadMinutes(input.leadMinutes)
}

function mapRow(row: ShowReminderPreferencesRow): ShowReminderPreferences {
  return {
    repId: row.rep_id,
    enabled: row.enabled ?? DEFAULT_PREFERENCES.enabled,
    channels: normalizeChannels((row.channels ?? DEFAULT_PREFERENCES.channels) as ShowReminderChannel[]),
    leadMinutes: row.lead_minutes ?? DEFAULT_PREFERENCES.leadMinutes,
    includeDiscountCodes:
      row.include_discount_codes ?? DEFAULT_PREFERENCES.includeDiscountCodes,
    includeFeaturedCollections:
      row.include_featured_collections ?? DEFAULT_PREFERENCES.includeFeaturedCollections,
    source: 'saved',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapOverrideRow(row: ShowReminderOverrideRow): ShowReminderOverride {
  return {
    eventId: row.event_id,
    repId: row.rep_id,
    enabled: row.enabled ?? DEFAULT_PREFERENCES.enabled,
    channels: normalizeChannels((row.channels ?? DEFAULT_PREFERENCES.channels) as ShowReminderChannel[]),
    leadMinutes: row.lead_minutes ?? DEFAULT_PREFERENCES.leadMinutes,
    includeDiscountCodes:
      row.include_discount_codes ?? DEFAULT_PREFERENCES.includeDiscountCodes,
    includeFeaturedCollections:
      row.include_featured_collections ?? DEFAULT_PREFERENCES.includeFeaturedCollections,
    source: 'event_override',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function defaultShowReminderPreferences(repId: string): ShowReminderPreferences {
  return {
    repId,
    ...DEFAULT_PREFERENCES,
    channels: [...DEFAULT_PREFERENCES.channels],
  }
}

export async function getShowReminderPreferences(
  supabase: SupabaseClient,
  repId: string,
): Promise<ShowReminderPreferences> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')

  const { data, error } = await supabase
    .from('show_reminder_preferences')
    .select(
      [
        'rep_id',
        'enabled',
        'channels',
        'lead_minutes',
        'include_discount_codes',
        'include_featured_collections',
        'created_at',
        'updated_at',
      ].join(', '),
    )
    .eq('rep_id', repId)
    .maybeSingle()
  if (error) throw error
  if (!data) return defaultShowReminderPreferences(repId)

  return mapRow(data as unknown as ShowReminderPreferencesRow)
}

async function getShowReminderOverride(
  supabase: SupabaseClient,
  eventId: string,
): Promise<ShowReminderOverride | null> {
  const { data, error } = await supabase
    .from('show_reminder_overrides')
    .select(
      [
        'event_id',
        'rep_id',
        'enabled',
        'channels',
        'lead_minutes',
        'include_discount_codes',
        'include_featured_collections',
        'created_at',
        'updated_at',
      ].join(', '),
    )
    .eq('event_id', eventId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  return mapOverrideRow(data as unknown as ShowReminderOverrideRow)
}

export async function setShowReminderPreferences(
  supabase: SupabaseClient,
  repId: string,
  input: SetShowReminderPreferencesInput,
): Promise<ShowReminderPreferences> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')
  validateReminderPatchInput(input)
  const current = await getShowReminderPreferences(supabase, repId)

  const row = {
    rep_id: repId,
    enabled: input.enabled ?? current.enabled,
    channels: normalizeChannels(input.channels, current.channels),
    lead_minutes: normalizeLeadMinutes(input.leadMinutes, current.leadMinutes),
    include_discount_codes:
      input.includeDiscountCodes ?? current.includeDiscountCodes,
    include_featured_collections:
      input.includeFeaturedCollections ?? current.includeFeaturedCollections,
  }

  const { data, error } = await supabase
    .from('show_reminder_preferences')
    .upsert(row, { onConflict: 'rep_id' })
    .select(
      [
        'rep_id',
        'enabled',
        'channels',
        'lead_minutes',
        'include_discount_codes',
        'include_featured_collections',
        'created_at',
        'updated_at',
      ].join(', '),
    )
    .single()
  if (error) throw error

  return mapRow(data as unknown as ShowReminderPreferencesRow)
}

export async function setShowReminderOverride(
  supabase: SupabaseClient,
  repId: string,
  eventId: string,
  input: SetShowReminderOverrideInput,
): Promise<ShowReminderOverride> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')
  if (!eventId) throw errors.EVENT_NOT_FOUND()
  validateReminderPatchInput(input)

  const { data: event, error: eventError } = await supabase
    .from('calendar_events')
    .select('id, rep_id')
    .eq('id', eventId)
    .eq('rep_id', repId)
    .maybeSingle()
  if (eventError) throw eventError
  if (!event) throw errors.EVENT_NOT_FOUND()

  const current =
    (await getShowReminderOverride(supabase, eventId)) ??
    defaultShowReminderPreferences(repId)

  const row = {
    event_id: eventId,
    rep_id: repId,
    enabled: input.enabled ?? current.enabled,
    channels: normalizeChannels(input.channels, current.channels),
    lead_minutes: normalizeLeadMinutes(input.leadMinutes, current.leadMinutes),
    include_discount_codes:
      input.includeDiscountCodes ?? current.includeDiscountCodes,
    include_featured_collections:
      input.includeFeaturedCollections ?? current.includeFeaturedCollections,
  }

  const { data, error } = await supabase
    .from('show_reminder_overrides')
    .upsert(row, { onConflict: 'event_id' })
    .select(
      [
        'event_id',
        'rep_id',
        'enabled',
        'channels',
        'lead_minutes',
        'include_discount_codes',
        'include_featured_collections',
        'created_at',
        'updated_at',
      ].join(', '),
    )
    .single()
  if (error) throw error

  return mapOverrideRow(data as unknown as ShowReminderOverrideRow)
}

export async function listShowReminderOverrides(
  supabase: SupabaseClient,
  eventIds: string[],
): Promise<Record<string, ShowReminderOverride>> {
  if (eventIds.length === 0) return {}

  const { data, error } = await supabase
    .from('show_reminder_overrides')
    .select(
      [
        'event_id',
        'rep_id',
        'enabled',
        'channels',
        'lead_minutes',
        'include_discount_codes',
        'include_featured_collections',
        'created_at',
        'updated_at',
      ].join(', '),
    )
    .in('event_id', eventIds)
  if (error) throw error

  return ((data ?? []) as unknown as ShowReminderOverrideRow[]).reduce(
    (byEventId, row) => {
      byEventId[row.event_id] = mapOverrideRow(row)
      return byEventId
    },
    {} as Record<string, ShowReminderOverride>,
  )
}
