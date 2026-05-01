import { describe, it, expect, vi } from 'vitest'
import {
  addShow,
  listMyShows,
  updateShow,
  cancelShow,
} from '@/lib/services/calendar'

type Chain = Record<string, unknown>

function baseRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'event-1',
    rep_id: 'rep-1',
    platform: 'TikTok',
    event_time: '2099-05-01T20:00:00.000Z',
    duration_minutes: 60,
    title: 'Friday Sparkles',
    description: 'Main show',
    discount_code: 'SPARKLE10',
    discount_description: 'Ten percent off',
    featured_collections: ['Celestial'],
    is_recurring: false,
    recurrence_rule: null,
    status: 'scheduled',
    created_at: '2099-04-01T12:00:00.000Z',
    updated_at: '2099-04-01T12:00:00.000Z',
    ...overrides,
  }
}

function makeListChain(result: { data: unknown[]; count?: number | null; error: unknown | null }) {
  const state = {
    eq: [] as Array<[string, unknown]>,
    gt: [] as Array<[string, unknown]>,
    in: [] as Array<[string, unknown[]]>,
    order: [] as Array<[string, { ascending: boolean }]>,
    limit: [] as number[],
  }

  const chain: Chain = {
    eq: vi.fn((column: string, value: unknown) => {
      state.eq.push([column, value])
      return chain
    }),
    gt: vi.fn((column: string, value: unknown) => {
      state.gt.push([column, value])
      return chain
    }),
    in: vi.fn((column: string, value: unknown[]) => {
      state.in.push([column, value])
      return chain
    }),
    order: vi.fn((column: string, opts: { ascending: boolean }) => {
      state.order.push([column, opts])
      return chain
    }),
    limit: vi.fn((value: number) => {
      state.limit.push(value)
      return Promise.resolve(result)
    }),
  }

  return { chain, state }
}

function makeSelectSingleChain(result: { data: unknown; error: unknown | null }) {
  const eq = vi.fn(() => chain)
  const maybeSingle = vi.fn(() => Promise.resolve(result))
  const chain: Chain = { eq, maybeSingle }
  return { chain, eq, maybeSingle }
}

function makeInsertSingleChain(result: { data: unknown; error: unknown | null }) {
  const single = vi.fn(() => Promise.resolve(result))
  const select = vi.fn(() => ({ single }))
  return { select, single }
}

function makeUpdateSingleChain(result: { data: unknown; error: unknown | null }) {
  const single = vi.fn(() => Promise.resolve(result))
  const select = vi.fn(() => ({ single }))
  const eq = vi.fn(() => chain)
  const chain: Chain = { eq, select }
  return { chain, eq, select, single }
}

describe('calendar service', () => {
  it('addShow rejects event times in the past', async () => {
    const supabase = {
      from: vi.fn(),
    }

    await expect(
      addShow(supabase as never, 'rep-1', {
        platform: 'TikTok',
        eventTime: '2000-01-01T00:00:00.000Z',
      }),
    ).rejects.toMatchObject({ code: 'EVENT_TIME_PAST' })
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('addShow inserts a scheduled event with default duration and returns camelCase fields', async () => {
    const row = baseRow()
    const insertSingle = makeInsertSingleChain({ data: row, error: null })
    const insert = vi.fn(() => ({ select: insertSingle.select }))
    const supabase = {
      from: vi.fn(() => ({ insert })),
    } as never

    const result = await addShow(supabase, 'rep-1', {
      platform: 'TikTok',
      eventTime: row.event_time as string,
      title: 'Friday Sparkles',
      featuredCollections: ['Celestial'],
    })

    expect(insert).toHaveBeenCalledWith({
      rep_id: 'rep-1',
      platform: 'TikTok',
      event_time: '2099-05-01T20:00:00.000Z',
      duration_minutes: 60,
      title: 'Friday Sparkles',
      description: null,
      discount_code: null,
      discount_description: null,
      featured_collections: ['Celestial'],
      status: 'scheduled',
    })
    expect(result.event).toMatchObject({
      id: 'event-1',
      repId: 'rep-1',
      eventTime: '2099-05-01T20:00:00.000Z',
      durationMinutes: 60,
      featuredCollections: ['Celestial'],
      status: 'scheduled',
    })
  })

  it('listMyShows defaults to upcoming scheduled/live events ordered ascending and returns totalCount', async () => {
    const row = baseRow()
    const { chain, state } = makeListChain({ data: [row], count: 7, error: null })
    const select = vi.fn(() => chain)
    const supabase = {
      from: vi.fn(() => ({ select })),
    } as never

    const result = await listMyShows(supabase, 'rep-1')

    expect(state.eq).toEqual([['rep_id', 'rep-1']])
    expect(state.gt[0][0]).toBe('event_time')
    expect(state.in).toEqual([[ 'status', ['scheduled', 'live'] ]])
    expect(state.order).toEqual([['event_time', { ascending: true }]])
    expect(state.limit).toEqual([10])
    expect(result.totalCount).toBe(7)
    expect(result.events[0]).toMatchObject({
      id: 'event-1',
      title: 'Friday Sparkles',
      featuredCollections: ['Celestial'],
    })
  })

  it('updateShow rejects events that are no longer scheduled', async () => {
    const current = makeSelectSingleChain({
      data: baseRow({ status: 'live' }),
      error: null,
    })
    const supabase = {
      from: vi.fn(() => ({ select: vi.fn(() => current.chain) })),
    } as never

    await expect(
      updateShow(supabase, 'rep-1', 'event-1', { title: 'Moved title' }),
    ).rejects.toMatchObject({ code: 'EVENT_NOT_EDITABLE' })
  })

  it('updateShow maps patch fields to snake_case and returns the updated row', async () => {
    const current = makeSelectSingleChain({
      data: baseRow(),
      error: null,
    })
    const updatedRow = baseRow({
      title: 'Wednesday Sparkles',
      featured_collections: ['Galaxy', 'Celestial'],
    })
    const updated = makeUpdateSingleChain({ data: updatedRow, error: null })

    const from = vi
      .fn()
      .mockReturnValueOnce({ select: vi.fn(() => current.chain) })
      .mockReturnValueOnce({ update: vi.fn(() => updated.chain) })

    const supabase = { from } as never

    const result = await updateShow(supabase, 'rep-1', 'event-1', {
      title: 'Wednesday Sparkles',
      featuredCollections: ['Galaxy', 'Celestial'],
    })

    const updateCall = (from.mock.results[1].value.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(updateCall.title).toBe('Wednesday Sparkles')
    expect(updateCall.featured_collections).toEqual(['Galaxy', 'Celestial'])
    expect(typeof updateCall.updated_at).toBe('string')
    expect(result.event.title).toBe('Wednesday Sparkles')
    expect(result.event.featuredCollections).toEqual(['Galaxy', 'Celestial'])
  })

  it('cancelShow only allows scheduled/live events and returns the cancelled row', async () => {
    const current = makeSelectSingleChain({
      data: baseRow({ status: 'scheduled' }),
      error: null,
    })
    const cancelledRow = baseRow({ status: 'cancelled' })
    const updated = makeUpdateSingleChain({ data: cancelledRow, error: null })

    const from = vi
      .fn()
      .mockReturnValueOnce({ select: vi.fn(() => current.chain) })
      .mockReturnValueOnce({ update: vi.fn(() => updated.chain) })

    const supabase = { from } as never

    const result = await cancelShow(supabase, 'rep-1', 'event-1', 'sick kid')

    const updateCall = (from.mock.results[1].value.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(updateCall.status).toBe('cancelled')
    expect(typeof updateCall.updated_at).toBe('string')
    expect(result.event.status).toBe('cancelled')
  })
})
