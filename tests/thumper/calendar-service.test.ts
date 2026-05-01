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
    discount_codes: [
      { code: 'SPARKLE10', description: 'Ten percent off' },
    ],
    featured_collections: ['Celestial'],
    is_recurring: false,
    recurrence_group_id: null,
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

function makeInsertManyChain(result: { data: unknown[]; error: unknown | null }) {
  const select = vi.fn(() => Promise.resolve(result))
  return { select }
}

function makeUpdateSingleChain(result: { data: unknown; error: unknown | null }) {
  const single = vi.fn(() => Promise.resolve(result))
  const select = vi.fn(() => ({ single }))
  const eq = vi.fn(() => chain)
  const chain: Chain = { eq, select }
  return { chain, eq, select, single }
}

function makeUpdateManyChain(result: { data: unknown[]; error: unknown | null }) {
  const state = {
    eq: [] as Array<[string, unknown]>,
    gt: [] as Array<[string, unknown]>,
  }
  const select = vi.fn(() => Promise.resolve(result))
  const chain: Chain = {
    eq: vi.fn((column: string, value: unknown) => {
      state.eq.push([column, value])
      return chain
    }),
    gt: vi.fn((column: string, value: unknown) => {
      state.gt.push([column, value])
      return chain
    }),
    select,
  }
  return { chain, state, select }
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

  it('addShow inserts a scheduled event with default duration and returns discount code arrays', async () => {
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
      discountCodes: [{ code: 'SPARKLE10', description: 'Ten percent off' }],
      featuredCollections: ['Celestial'],
    })

    expect(insert).toHaveBeenCalledWith({
      rep_id: 'rep-1',
      platform: 'TikTok',
      event_time: '2099-05-01T20:00:00.000Z',
      duration_minutes: 60,
      title: 'Friday Sparkles',
      description: null,
      discount_codes: [{ code: 'SPARKLE10', description: 'Ten percent off' }],
      featured_collections: ['Celestial'],
      is_recurring: false,
      recurrence_group_id: null,
      recurrence_rule: null,
      status: 'scheduled',
    })
    expect(result.count).toBe(1)
    expect(result.events[0]).toMatchObject({
      id: 'event-1',
      repId: 'rep-1',
      eventTime: '2099-05-01T20:00:00.000Z',
      durationMinutes: 60,
      discountCodes: [{ code: 'SPARKLE10', description: 'Ten percent off' }],
      recurrenceGroupId: null,
      featuredCollections: ['Celestial'],
      status: 'scheduled',
    })
  })

  it('addShow spawns recurring weekly shows that share a recurrence group', async () => {
    const rows = Array.from({ length: 4 }, (_, index) =>
      baseRow({
        id: `event-${index + 1}`,
        title: 'Weekly Sparkles',
        is_recurring: true,
        recurrence_group_id: 'group-1',
        recurrence_rule: 'weekly',
        event_time: new Date(Date.parse('2099-05-01T20:00:00.000Z') + index * 7 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    )
    const insertMany = makeInsertManyChain({ data: rows, error: null })
    const insert = vi.fn(() => ({ select: insertMany.select }))
    const supabase = {
      from: vi.fn(() => ({ insert })),
    } as never

    const result = await addShow(supabase, 'rep-1', {
      platform: 'TikTok',
      eventTime: '2099-05-01T20:00:00.000Z',
      title: 'Weekly Sparkles',
      discountCodes: [{ code: 'BOGO', description: 'Buy one get one' }],
      recurring: { cadence: 'weekly', duration: '1_month' },
    })

    const insertPayload = (insert as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0] as Array<
      Record<string, unknown>
    >
    expect(insertPayload).toHaveLength(4)
    expect(insertPayload.every((row) => row.is_recurring === true)).toBe(true)
    expect(insertPayload.every((row) => row.recurrence_rule === 'weekly')).toBe(true)
    expect(insertPayload.every((row) => row.status === 'scheduled')).toBe(true)
    expect(insertPayload.every((row) => row.discount_codes instanceof Array)).toBe(true)
    expect(new Set(insertPayload.map((row) => row.recurrence_group_id))).toHaveLength(1)
    expect(new Set(insertPayload.map((row) => row.id))).toHaveLength(4)

    expect(result.count).toBe(4)
    expect(result.events).toHaveLength(4)
    expect(result.events[0]).toMatchObject({
      title: 'Weekly Sparkles',
      isRecurring: true,
      recurrenceGroupId: 'group-1',
      recurrenceRule: 'weekly',
    })
  })

  it('addShow rejects more than 10 discount codes', async () => {
    const supabase = {
      from: vi.fn(),
    }

    await expect(
      addShow(supabase as never, 'rep-1', {
        platform: 'TikTok',
        eventTime: '2099-05-01T20:00:00.000Z',
        discountCodes: Array.from({ length: 11 }, (_, index) => ({
          code: `CODE${index + 1}`,
          description: `Code ${index + 1}`,
        })),
      }),
    ).rejects.toMatchObject({ code: 'TOO_MANY_DISCOUNT_CODES' })
    expect(supabase.from).not.toHaveBeenCalled()
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
    expect(state.in).toEqual([['status', ['scheduled', 'live']]])
    expect(state.order).toEqual([['event_time', { ascending: true }]])
    expect(state.limit).toEqual([10])
    expect(result.totalCount).toBe(7)
    expect(result.events[0]).toMatchObject({
      id: 'event-1',
      title: 'Friday Sparkles',
      discountCodes: [{ code: 'SPARKLE10', description: 'Ten percent off' }],
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

  it('updateShow applies a patch to all future events in a recurrence group when applyToSeries is true', async () => {
    const current = makeSelectSingleChain({
      data: baseRow({
        id: 'event-1',
        recurrence_group_id: 'group-1',
        is_recurring: true,
        recurrence_rule: 'weekly',
      }),
      error: null,
    })
    const updatedRows = [
      baseRow({
        id: 'event-1',
        title: 'Wednesday Sparkles',
        recurrence_group_id: 'group-1',
        is_recurring: true,
        recurrence_rule: 'weekly',
        discount_codes: [{ code: 'NEWCODE', description: 'Updated' }],
      }),
      baseRow({
        id: 'event-2',
        title: 'Wednesday Sparkles',
        recurrence_group_id: 'group-1',
        is_recurring: true,
        recurrence_rule: 'weekly',
        discount_codes: [{ code: 'NEWCODE', description: 'Updated' }],
      }),
    ]
    const updated = makeUpdateManyChain({ data: updatedRows, error: null })

    const from = vi
      .fn()
      .mockReturnValueOnce({ select: vi.fn(() => current.chain) })
      .mockReturnValueOnce({ update: vi.fn(() => updated.chain) })
      .mockReturnValueOnce({ select: vi.fn(() => current.chain) })

    const supabase = { from } as never

    const result = await updateShow(supabase, 'rep-1', 'event-1', {
      title: 'Wednesday Sparkles',
      discountCodes: [{ code: 'NEWCODE', description: 'Updated' }],
      applyToSeries: true,
    })

    const updateCall = (from.mock.results[1].value.update as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(updateCall.title).toBe('Wednesday Sparkles')
    expect(updateCall.discount_codes).toEqual([{ code: 'NEWCODE', description: 'Updated' }])
    expect(typeof updateCall.updated_at).toBe('string')
    expect(updated.state.eq).toEqual([
      ['rep_id', 'rep-1'],
      ['recurrence_group_id', 'group-1'],
      ['status', 'scheduled'],
    ])
    expect(updated.state.gt[0][0]).toBe('event_time')
    expect(result.updatedCount).toBe(2)
    expect(result.event.title).toBe('Wednesday Sparkles')
    expect(result.event.discountCodes).toEqual([{ code: 'NEWCODE', description: 'Updated' }])
  })

  it('updateShow rejects applyToSeries for a non-recurring event', async () => {
    const current = makeSelectSingleChain({
      data: baseRow({ recurrence_group_id: null, is_recurring: false }),
      error: null,
    })
    const supabase = {
      from: vi.fn(() => ({ select: vi.fn(() => current.chain) })),
    } as never

    await expect(
      updateShow(supabase, 'rep-1', 'event-1', {
        title: 'Moved title',
        applyToSeries: true,
      }),
    ).rejects.toMatchObject({ code: 'NOT_A_SERIES' })
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
