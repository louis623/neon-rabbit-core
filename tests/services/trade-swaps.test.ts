import { beforeEach, describe, expect, it, vi } from 'vitest'

const approveTradeMock = vi.fn()
const addListingMock = vi.fn()

vi.mock('@/lib/services/trade-requests', () => ({
  approveTrade: (...args: unknown[]) => approveTradeMock(...args),
}))

vi.mock('@/lib/services/trade-board', () => ({
  addListing: (...args: unknown[]) => addListingMock(...args),
}))

import {
  approveTradeWithRevealedItemCapture,
  getTradeSwapCleanupQueue,
} from '@/lib/services/trade-swaps'

function makeApproveSupabase(design: Record<string, unknown> | null = null) {
  const designMaybeSingle = vi.fn().mockResolvedValue({ data: design, error: null })
  const designEq = vi.fn().mockReturnValue({ maybeSingle: designMaybeSingle })
  const designSelect = vi.fn().mockReturnValue({ eq: designEq })
  const insertSingle = vi.fn().mockResolvedValue({
    data: { id: 'swap-1', replacement_status: 'needs_catalog_details' },
    error: null,
  })
  const insertSelect = vi.fn().mockReturnValue({ single: insertSingle })
  const insert = vi.fn().mockReturnValue({ select: insertSelect })
  const from = vi.fn((table: string) => {
    if (table === 'jewelry_designs') return { select: designSelect }
    if (table === 'trade_swaps') return { insert }
    throw new Error(`unexpected table ${table}`)
  })

  return {
    client: { from } as never,
    spies: { from, designEq, insert, insertSingle },
  }
}

function makeCleanupSupabase(rows: Array<Record<string, unknown>>) {
  const order = vi.fn().mockResolvedValue({ data: rows, error: null })
  const neq = vi.fn().mockReturnValue({ order })
  const eq = vi.fn().mockReturnValue({ neq })
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn((table: string) => {
    if (table === 'trade_swaps') return { select }
    throw new Error(`unexpected table ${table}`)
  })

  return { client: { from } as never, spies: { from, eq, neq, order } }
}

beforeEach(() => {
  approveTradeMock.mockReset()
  addListingMock.mockReset()
})

describe('approveTradeWithRevealedItemCapture', () => {
  it('approves the trade and auto-adds the revealed piece when the item number exists', async () => {
    approveTradeMock.mockResolvedValueOnce({
      requestId: 'request-1',
      fulfillmentId: 'fulfillment-1',
      listingId: 'outgoing-listing-1',
      customerName: 'Jamie',
    })
    addListingMock.mockResolvedValueOnce({
      listingId: 'replacement-listing-1',
      designId: 'design-1',
      itemNumber: 'NK12345',
      designName: 'Moonlit Pendant',
      status: 'available',
      usesCanonicalPhoto: true,
    })
    const { client, spies } = makeApproveSupabase({
      id: 'design-1',
      item_number: 'NK12345',
      type_prefix: 'NK',
    })

    const result = await approveTradeWithRevealedItemCapture(client, 'rep-1', {
      requestId: 'request-1',
      revealedItemNumber: ' nk12345 ',
    })

    expect(approveTradeMock).toHaveBeenCalledWith(
      client,
      'rep-1',
      'request-1',
      undefined,
    )
    expect(addListingMock).toHaveBeenCalledWith(client, 'rep-1', {
      itemNumber: 'NK12345',
      ringSize: undefined,
      repNotes: 'Added from approved trade swap for Jamie.',
    })
    expect(spies.designEq).toHaveBeenCalledWith('item_number', 'NK12345')
    expect(spies.insert.mock.calls[0][0]).toMatchObject({
      request_id: 'request-1',
      outgoing_listing_id: 'outgoing-listing-1',
      revealed_item_number: 'NK12345',
      revealed_ring_size: null,
      revealed_design_id: 'design-1',
      replacement_listing_id: 'replacement-listing-1',
      replacement_status: 'added_to_board',
    })
    expect(result).toMatchObject({
      replacementStatus: 'added_to_board',
      replacementListingId: 'replacement-listing-1',
      revealedDesignId: 'design-1',
      revealedItemNumber: 'NK12345',
    })
  })

  it('saves a matched ring as needs_ring_size when ring size is missing', async () => {
    approveTradeMock.mockResolvedValueOnce({
      requestId: 'request-1',
      fulfillmentId: 'fulfillment-1',
      listingId: 'outgoing-listing-1',
      customerName: 'Jamie',
    })
    const { client, spies } = makeApproveSupabase({
      id: 'design-1',
      item_number: 'RG99999',
      type_prefix: 'RG',
    })

    const result = await approveTradeWithRevealedItemCapture(client, 'rep-1', {
      requestId: 'request-1',
      revealedItemNumber: 'RG99999',
    })

    expect(addListingMock).not.toHaveBeenCalled()
    expect(spies.insert.mock.calls[0][0]).toMatchObject({
      revealed_item_number: 'RG99999',
      revealed_design_id: 'design-1',
      replacement_listing_id: null,
      replacement_status: 'needs_ring_size',
    })
    expect(result.replacementStatus).toBe('needs_ring_size')
  })

  it('saves unresolved item number when catalog does not know the revealed item yet', async () => {
    approveTradeMock.mockResolvedValueOnce({
      requestId: 'request-1',
      fulfillmentId: 'fulfillment-1',
      listingId: 'outgoing-listing-1',
      customerName: 'Jamie',
    })
    const { client, spies } = makeApproveSupabase(null)

    const result = await approveTradeWithRevealedItemCapture(client, 'rep-1', {
      requestId: 'request-1',
      revealedItemNumber: 'ER00001',
    })

    expect(addListingMock).not.toHaveBeenCalled()
    expect(spies.insert.mock.calls[0][0]).toMatchObject({
      revealed_item_number: 'ER00001',
      revealed_design_id: null,
      replacement_listing_id: null,
      replacement_status: 'needs_catalog_details',
    })
    expect(result.replacementStatus).toBe('needs_catalog_details')
  })

  it('auto-adds a matched ring when ring size is supplied', async () => {
    approveTradeMock.mockResolvedValueOnce({
      requestId: 'request-1',
      fulfillmentId: 'fulfillment-1',
      listingId: 'outgoing-listing-1',
      customerName: 'Jamie',
    })
    addListingMock.mockResolvedValueOnce({
      listingId: 'replacement-listing-1',
      designId: 'design-1',
      itemNumber: 'RG99999',
      designName: 'Moon Ring',
      status: 'available',
      usesCanonicalPhoto: true,
    })
    const { client, spies } = makeApproveSupabase({
      id: 'design-1',
      item_number: 'RG99999',
      type_prefix: 'RG',
    })

    const result = await approveTradeWithRevealedItemCapture(client, 'rep-1', {
      requestId: 'request-1',
      revealedItemNumber: 'RG99999',
      revealedRingSize: ' 8 ',
    })

    expect(addListingMock).toHaveBeenCalledWith(client, 'rep-1', {
      itemNumber: 'RG99999',
      ringSize: '8',
      repNotes: 'Added from approved trade swap for Jamie.',
    })
    expect(spies.insert.mock.calls[0][0]).toMatchObject({
      revealed_ring_size: '8',
      replacement_status: 'added_to_board',
    })
    expect(result.replacementStatus).toBe('added_to_board')
  })
})

describe('getTradeSwapCleanupQueue', () => {
  it('returns unresolved swapped-in reveal pieces owned by the rep', async () => {
    const { client, spies } = makeCleanupSupabase([
      {
        id: 'swap-1',
        request_id: 'request-1',
        outgoing_listing_id: 'outgoing-listing-1',
        revealed_item_number: 'ER00001',
        revealed_ring_size: null,
        replacement_status: 'needs_catalog_details',
        created_at: '2026-06-11T20:00:00.000Z',
        request: {
          customer_name: 'Jamie',
          listing: { rep_id: 'rep-1' },
        },
      },
      {
        id: 'swap-2',
        request_id: 'request-2',
        outgoing_listing_id: 'outgoing-listing-2',
        revealed_item_number: 'RG00002',
        revealed_ring_size: null,
        replacement_status: 'needs_ring_size',
        created_at: '2026-06-11T20:05:00.000Z',
        request: {
          customer_name: 'Alex',
          listing: { rep_id: 'other-rep' },
        },
      },
    ])

    const result = await getTradeSwapCleanupQueue(client, 'rep-1')

    expect(spies.eq).toHaveBeenCalledWith(
      'request.listing.rep_id',
      'rep-1',
    )
    expect(spies.neq).toHaveBeenCalledWith(
      'replacement_status',
      'added_to_board',
    )
    expect(result).toEqual([
      {
        swapId: 'swap-1',
        requestId: 'request-1',
        customerName: 'Jamie',
        outgoingListingId: 'outgoing-listing-1',
        revealedItemNumber: 'ER00001',
        revealedRingSize: null,
        replacementStatus: 'needs_catalog_details',
        createdAt: '2026-06-11T20:00:00.000Z',
      },
    ])
  })
})
