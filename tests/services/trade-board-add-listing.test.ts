import { beforeEach, describe, expect, it, vi } from 'vitest'

import { addListingBatch } from '@/lib/services/trade-board'
import { resolveItemNumber } from '@/lib/services/jewelry-database'

function makeResolveSupabase(row: Record<string, unknown> | null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null })
  const eq = vi.fn().mockReturnValue({ maybeSingle })
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ select })

  return {
    client: { from } as never,
    spies: { from, select, eq, maybeSingle },
  }
}

function makeBatchSupabase() {
  const designLookup = vi.fn().mockResolvedValue({
    data: [
      {
        id: 'design-1',
        item_number: 'RG31452',
        design_name: 'Celeste Ring',
        collection_id: 'collection-1',
      },
    ],
    error: null,
  })
  const existingLookup = vi.fn().mockResolvedValue({ data: [], error: null })
  const insertSelect = vi.fn().mockResolvedValue({
    data: [{ id: 'listing-1', design_id: 'design-1', status: 'available' }],
    error: null,
  })
  const insert = vi.fn().mockReturnValue({ select: insertSelect })
  const timesListedLookup = vi.fn().mockResolvedValue({
    data: { times_listed: 2 },
    error: null,
  })
  const designUpdateEq = vi.fn().mockResolvedValue({ data: null, error: null })
  const designUpdate = vi.fn().mockReturnValue({ eq: designUpdateEq })

  const existingIn = vi.fn().mockImplementation(existingLookup)
  const existingEqStatus = vi.fn().mockReturnValue({ in: existingIn })
  const existingEqRep = vi.fn().mockReturnValue({ eq: existingEqStatus })
  const tradeListingsSelect = vi
    .fn()
    .mockReturnValueOnce({ eq: existingEqRep })

  const designIn = vi.fn().mockImplementation(designLookup)
  const jewelryDesignsSelect = vi
    .fn()
    .mockReturnValueOnce({ in: designIn })
    .mockReturnValueOnce({
      eq: vi.fn().mockReturnValue({ maybeSingle: timesListedLookup }),
    })

  const from = vi.fn((table: string) => {
    if (table === 'trade_listings') {
      return {
        select: tradeListingsSelect,
        insert,
      }
    }

    if (table === 'jewelry_designs') {
      return {
        select: jewelryDesignsSelect,
        update: designUpdate,
      }
    }

    throw new Error(`unexpected table ${table}`)
  })

  return {
    client: { from } as never,
    spies: {
      from,
      insert,
      insertSelect,
      designLookup,
      designIn,
      existingLookup,
      existingEqRep,
      existingEqStatus,
      existingIn,
      timesListedLookup,
      designUpdate,
      designUpdateEq,
    },
  }
}

describe('resolveItemNumber', () => {
  it('normalizes whitespace and casing before exact matching item_number', async () => {
    const { client, spies } = makeResolveSupabase({
      id: 'design-1',
      item_number: 'RG31452',
      design_name: 'Celeste Ring',
      material: 'Sterling Silver',
      main_stone: 'Topaz',
      bp_msrp: 42,
      canonical_photo_url: null,
      type_prefix: 'RG',
      collection_id: 'collection-1',
      collection: { name: 'Lustre' },
    })

    const result = await resolveItemNumber(client, ' rg31452 ')

    expect(spies.eq).toHaveBeenCalledWith('item_number', 'RG31452')
    expect(result).toMatchObject({
      found: true,
      design: {
        itemNumber: 'RG31452',
        designName: 'Celeste Ring',
      },
      hasCollection: true,
    })
  })
})

describe('addListingBatch', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('deduplicates repeated item numbers inside the same batch request before insert', async () => {
    const { client, spies } = makeBatchSupabase()

    const result = await addListingBatch(client, 'rep-1', {
      clickwrapAccepted: true,
      items: [
        { itemNumber: 'RG31452' },
        { itemNumber: ' rg31452 ' },
      ],
    })

    expect(spies.insert).toHaveBeenCalledTimes(1)
    expect(spies.insert.mock.calls[0][0]).toHaveLength(1)
    expect(spies.insert.mock.calls[0][0][0]).toMatchObject({
      rep_id: 'rep-1',
      design_id: 'design-1',
    })
    expect(result.added).toHaveLength(1)
    expect(result.added[0]).toMatchObject({
      itemNumber: 'RG31452',
      designName: 'Celeste Ring',
    })
  })
})
