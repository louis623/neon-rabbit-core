import { describe, expect, it, vi } from 'vitest'

import {
  getShowReminderPreferences,
  setShowReminderOverride,
  setShowReminderPreferences,
} from '@/lib/services/show-reminder-preferences'

function makeMaybeSingleChain(result: { data: unknown; error: unknown | null }) {
  const state = {
    eq: [] as Array<[string, unknown]>,
  }
  const chain = {
    eq: vi.fn((column: string, value: unknown) => {
      state.eq.push([column, value])
      return chain
    }),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
  }
  return { chain, state }
}

function makeUpsertChain(result: { data: unknown; error: unknown | null }) {
  const select = vi.fn(() => ({
    single: vi.fn(() => Promise.resolve(result)),
  }))
  return { select }
}

describe('show reminder preferences service', () => {
  it('returns app-owned defaults when a rep has not saved reminder preferences yet', async () => {
    const read = makeMaybeSingleChain({ data: null, error: null })
    const supabase = {
      from: vi.fn(() => ({ select: vi.fn(() => read.chain) })),
    } as never

    const result = await getShowReminderPreferences(supabase, 'rep-1')

    expect(read.state.eq).toEqual([['rep_id', 'rep-1']])
    expect(result).toMatchObject({
      repId: 'rep-1',
      enabled: true,
      channels: ['sms'],
      leadMinutes: 30,
      includeDiscountCodes: true,
      includeFeaturedCollections: true,
      source: 'default',
    })
  })

  it('reads saved reminder preferences with sms and email channels', async () => {
    const read = makeMaybeSingleChain({
      data: {
        rep_id: 'rep-1',
        enabled: true,
        channels: ['sms', 'email'],
        lead_minutes: 45,
        include_discount_codes: true,
        include_featured_collections: false,
        created_at: '2099-04-01T12:00:00.000Z',
        updated_at: '2099-04-01T12:30:00.000Z',
      },
      error: null,
    })
    const supabase = {
      from: vi.fn(() => ({ select: vi.fn(() => read.chain) })),
    } as never

    await expect(getShowReminderPreferences(supabase, 'rep-1')).resolves.toMatchObject({
      repId: 'rep-1',
      channels: ['sms', 'email'],
      leadMinutes: 45,
      includeFeaturedCollections: false,
      source: 'saved',
    })
  })

  it('upserts validated reminder preferences for Nic-Nac-managed defaults', async () => {
    const read = makeMaybeSingleChain({ data: null, error: null })
    const upserted = makeUpsertChain({
      data: {
        rep_id: 'rep-1',
        enabled: false,
        channels: ['email'],
        lead_minutes: 60,
        include_discount_codes: false,
        include_featured_collections: true,
        created_at: '2099-04-01T12:00:00.000Z',
        updated_at: '2099-04-01T12:30:00.000Z',
      },
      error: null,
    })
    const upsert = vi.fn(() => ({ select: upserted.select }))
    const supabase = {
      from: vi.fn((table: string) =>
        table === 'show_reminder_preferences'
          ? { select: vi.fn(() => read.chain), upsert }
          : {},
      ),
    } as never

    const result = await setShowReminderPreferences(supabase, 'rep-1', {
      enabled: false,
      channels: ['email'],
      leadMinutes: 60,
      includeDiscountCodes: false,
      includeFeaturedCollections: true,
    })

    expect(upsert).toHaveBeenCalledWith(
      {
        rep_id: 'rep-1',
        enabled: false,
        channels: ['email'],
        lead_minutes: 60,
        include_discount_codes: false,
        include_featured_collections: true,
      },
      { onConflict: 'rep_id' },
    )
    expect(result).toMatchObject({
      enabled: false,
      channels: ['email'],
      leadMinutes: 60,
      source: 'saved',
    })
  })

  it('rejects unsupported lead times', async () => {
    const supabase = { from: vi.fn() } as never

    await expect(
      setShowReminderPreferences(supabase, 'rep-1', {
        leadMinutes: 7,
      }),
    ).rejects.toMatchObject({ code: 'INVALID_INPUT' })
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('patches saved reminder preferences without resetting omitted fields', async () => {
    const read = makeMaybeSingleChain({
      data: {
        rep_id: 'rep-1',
        enabled: false,
        channels: ['sms', 'email'],
        lead_minutes: 60,
        include_discount_codes: true,
        include_featured_collections: true,
        created_at: '2099-04-01T12:00:00.000Z',
        updated_at: '2099-04-01T12:30:00.000Z',
      },
      error: null,
    })
    const upserted = makeUpsertChain({
      data: {
        rep_id: 'rep-1',
        enabled: false,
        channels: ['sms', 'email'],
        lead_minutes: 60,
        include_discount_codes: false,
        include_featured_collections: true,
        created_at: '2099-04-01T12:00:00.000Z',
        updated_at: '2099-04-01T12:45:00.000Z',
      },
      error: null,
    })
    const upsert = vi.fn(() => ({ select: upserted.select }))
    const supabase = {
      from: vi.fn(() => ({ select: vi.fn(() => read.chain), upsert })),
    } as never

    await setShowReminderPreferences(supabase, 'rep-1', {
      includeDiscountCodes: false,
    })

    expect(upsert).toHaveBeenCalledWith(
      {
        rep_id: 'rep-1',
        enabled: false,
        channels: ['sms', 'email'],
        lead_minutes: 60,
        include_discount_codes: false,
        include_featured_collections: true,
      },
      { onConflict: 'rep_id' },
    )
  })

  it('upserts a show-specific reminder override for one event', async () => {
    const eventRead = makeMaybeSingleChain({
      data: {
        id: 'event-1',
        rep_id: 'rep-1',
      },
      error: null,
    })
    const overrideRead = makeMaybeSingleChain({ data: null, error: null })
    const upserted = makeUpsertChain({
      data: {
        event_id: 'event-1',
        rep_id: 'rep-1',
        enabled: false,
        channels: ['email'],
        lead_minutes: 45,
        include_discount_codes: false,
        include_featured_collections: true,
        created_at: '2099-04-01T12:00:00.000Z',
        updated_at: '2099-04-01T12:30:00.000Z',
      },
      error: null,
    })
    const upsert = vi.fn(() => ({ select: upserted.select }))
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'calendar_events') return { select: vi.fn(() => eventRead.chain) }
        if (table === 'show_reminder_overrides') {
          return { select: vi.fn(() => overrideRead.chain), upsert }
        }
        return {}
      }),
    } as never

    const result = await setShowReminderOverride(supabase, 'rep-1', 'event-1', {
      enabled: false,
      channels: ['email'],
      leadMinutes: 45,
      includeDiscountCodes: false,
      includeFeaturedCollections: true,
    })

    expect(upsert).toHaveBeenCalledWith(
      {
        event_id: 'event-1',
        rep_id: 'rep-1',
        enabled: false,
        channels: ['email'],
        lead_minutes: 45,
        include_discount_codes: false,
        include_featured_collections: true,
      },
      { onConflict: 'event_id' },
    )
    expect(result).toMatchObject({
      eventId: 'event-1',
      repId: 'rep-1',
      enabled: false,
      channels: ['email'],
      leadMinutes: 45,
      source: 'event_override',
    })
  })

  it('rejects a show-specific reminder override for an event outside the rep calendar', async () => {
    const eventRead = makeMaybeSingleChain({ data: null, error: null })
    const supabase = {
      from: vi.fn((table: string) =>
        table === 'calendar_events' ? { select: vi.fn(() => eventRead.chain) } : {},
      ),
    } as never

    await expect(
      setShowReminderOverride(supabase, 'rep-1', 'foreign-event', {
        channels: ['email'],
      }),
    ).rejects.toMatchObject({ code: 'EVENT_NOT_FOUND' })
  })
})
