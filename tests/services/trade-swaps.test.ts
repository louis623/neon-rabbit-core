import { beforeEach, describe, expect, it, vi } from 'vitest'
import { errors } from '@/lib/services/errors'

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
  resolveTradeSwapReplacementListing,
} from '@/lib/services/trade-swaps'

function makeApproveSupabase(
  design: Record<string, unknown> | Array<Record<string, unknown>> | null = null,
) {
  const designRows = Array.isArray(design) ? design : design ? [design] : []
  const designLimit = vi.fn().mockResolvedValue({ data: designRows, error: null })
  const designEq = vi.fn().mockReturnValue({ limit: designLimit })
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
    spies: { from, designEq, designLimit, insert, insertSingle },
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

function makeResolveReplacementSupabase(options: {
  replacementListing?: Record<string, unknown> | null
  swap?: Record<string, unknown> | null
  fulfillment?: Record<string, unknown> | null
} = {}) {
  const replacementListing =
    options.replacementListing === undefined
      ? { id: 'replacement-listing-1', rep_id: 'rep-1' }
      : options.replacementListing
  const swap =
    options.swap === undefined
      ? {
          id: 'swap-1',
          request_id: 'request-1',
          request: { listing: { rep_id: 'rep-1' } },
        }
      : options.swap
  const fulfillment =
    options.fulfillment === undefined
      ? { id: 'fulfillment-1' }
      : options.fulfillment

  const listingMaybeSingle = vi
    .fn()
    .mockResolvedValue({ data: replacementListing, error: null })
  const listingEq = vi.fn().mockReturnValue({ maybeSingle: listingMaybeSingle })
  const listingSelect = vi.fn().mockReturnValue({ eq: listingEq })

  const swapMaybeSingle = vi.fn().mockResolvedValue({ data: swap, error: null })
  const swapReadEq = vi.fn().mockReturnValue({ maybeSingle: swapMaybeSingle })
  const swapReadSelect = vi.fn().mockReturnValue({ eq: swapReadEq })
  const swapUpdateSingle = vi.fn().mockResolvedValue({
    data: {
      id: 'swap-1',
      request_id: 'request-1',
      replacement_listing_id: 'replacement-listing-1',
      replacement_status: 'added_to_board',
    },
    error: null,
  })
  const swapUpdateSelect = vi
    .fn()
    .mockReturnValue({ single: swapUpdateSingle })
  const swapUpdateEq = vi.fn().mockReturnValue({ select: swapUpdateSelect })
  const swapUpdate = vi.fn().mockReturnValue({ eq: swapUpdateEq })

  const fulfillmentMaybeSingle = vi
    .fn()
    .mockResolvedValue({ data: fulfillment, error: null })
  const fulfillmentSelect = vi
    .fn()
    .mockReturnValue({ maybeSingle: fulfillmentMaybeSingle })
  const fulfillmentEq = vi.fn().mockReturnValue({ select: fulfillmentSelect })
  const fulfillmentUpdate = vi.fn().mockReturnValue({ eq: fulfillmentEq })

  const from = vi.fn((table: string) => {
    if (table === 'trade_listings') return { select: listingSelect }
    if (table === 'trade_swaps') {
      return {
        select: swapReadSelect,
        update: swapUpdate,
      }
    }
    if (table === 'trade_fulfillment') return { update: fulfillmentUpdate }
    throw new Error(`unexpected table ${table}`)
  })

  return {
    client: { from } as never,
    spies: {
      from,
      listingEq,
      swapReadEq,
      swapUpdate,
      swapUpdateEq,
      fulfillmentUpdate,
      fulfillmentEq,
    },
  }
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
      design_name: 'Moonlit Pendant',
      material: null,
      main_stone: null,
      bp_msrp: 138,
      canonical_photo_url: null,
      type_prefix: 'NK',
      collection_id: 'collection-1',
      search_tags: [],
      collection: { name: 'Lustre', collection_year: 2026 },
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
      material: undefined,
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
      swapId: 'swap-1',
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
      design_name: 'Moon Ring',
      material: null,
      main_stone: null,
      bp_msrp: 138,
      canonical_photo_url: null,
      type_prefix: 'RG',
      collection_id: 'collection-1',
      search_tags: [],
      collection: { name: 'Lustre', collection_year: 2026 },
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
      design_name: 'Moon Ring',
      material: null,
      main_stone: null,
      bp_msrp: 138,
      canonical_photo_url: null,
      type_prefix: 'RG',
      collection_id: 'collection-1',
      search_tags: [],
      collection: { name: 'Lustre', collection_year: 2026 },
    })

    const result = await approveTradeWithRevealedItemCapture(client, 'rep-1', {
      requestId: 'request-1',
      revealedItemNumber: 'RG99999',
      revealedRingSize: ' 8 ',
    })

    expect(addListingMock).toHaveBeenCalledWith(client, 'rep-1', {
      itemNumber: 'RG99999',
      material: undefined,
      ringSize: '8',
      repNotes: 'Added from approved trade swap for Jamie.',
    })
    expect(spies.insert.mock.calls[0][0]).toMatchObject({
      revealed_ring_size: '8',
      replacement_status: 'added_to_board',
    })
    expect(result.replacementStatus).toBe('added_to_board')
  })

  it('uses revealed material to choose the correct catalog variant', async () => {
    approveTradeMock.mockResolvedValueOnce({
      requestId: 'request-1',
      fulfillmentId: 'fulfillment-1',
      listingId: 'outgoing-listing-1',
      customerName: 'Jamie',
    })
    addListingMock.mockResolvedValueOnce({
      listingId: 'replacement-listing-1',
      designId: 'design-hematite',
      itemNumber: 'NK12032',
      designName: 'Reveal Necklace',
      status: 'available',
      usesCanonicalPhoto: true,
    })
    const { client, spies } = makeApproveSupabase([
      {
        id: 'design-rhodium',
        item_number: 'NK12032',
        design_name: 'Reveal Necklace',
        material: 'Rhodium Plating',
        main_stone: null,
        bp_msrp: 138,
        canonical_photo_url: null,
        type_prefix: 'NK',
        collection_id: 'collection-1',
        search_tags: [],
        collection: { name: 'July Birthday 2026', collection_year: 2026 },
      },
      {
        id: 'design-hematite',
        item_number: 'NK12032',
        design_name: 'Reveal Necklace',
        material: 'Hematite Plating',
        main_stone: null,
        bp_msrp: 138,
        canonical_photo_url: null,
        type_prefix: 'NK',
        collection_id: 'collection-1',
        search_tags: [],
        collection: { name: 'July Birthday 2026', collection_year: 2026 },
      },
    ])

    const result = await approveTradeWithRevealedItemCapture(client, 'rep-1', {
      requestId: 'request-1',
      revealedItemNumber: 'NK12032',
      revealedMaterial: 'hematite plating',
    })

    expect(addListingMock).toHaveBeenCalledWith(client, 'rep-1', {
      itemNumber: 'NK12032',
      material: 'hematite plating',
      ringSize: undefined,
      repNotes: 'Added from approved trade swap for Jamie.',
    })
    expect(spies.insert.mock.calls[0][0]).toMatchObject({
      revealed_design_id: 'design-hematite',
      replacement_status: 'added_to_board',
    })
    expect(result.revealedDesignId).toBe('design-hematite')
  })

  it('records cleanup when replacement auto-add hits an expected catalog gap after approval', async () => {
    approveTradeMock.mockResolvedValueOnce({
      requestId: 'request-1',
      fulfillmentId: 'fulfillment-1',
      listingId: 'outgoing-listing-1',
      customerName: 'Jamie',
    })
    addListingMock.mockRejectedValueOnce(
      errors.NEEDS_COLLECTION('design-1', 'Moonlit Pendant'),
    )
    const { client, spies } = makeApproveSupabase({
      id: 'design-1',
      item_number: 'NK12345',
      design_name: 'Moonlit Pendant',
      material: null,
      main_stone: null,
      bp_msrp: 138,
      canonical_photo_url: null,
      type_prefix: 'NK',
      collection_id: null,
      search_tags: [],
      collection: null,
    })

    const result = await approveTradeWithRevealedItemCapture(client, 'rep-1', {
      requestId: 'request-1',
      revealedItemNumber: 'NK12345',
    })

    expect(spies.insert.mock.calls[0][0]).toMatchObject({
      request_id: 'request-1',
      revealed_item_number: 'NK12345',
      revealed_design_id: 'design-1',
      replacement_listing_id: null,
      replacement_status: 'needs_catalog_details',
    })
    expect(result.replacementStatus).toBe('needs_catalog_details')
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

describe('resolveTradeSwapReplacementListing', () => {
  it('links the replacement listing to the swap and received fulfillment row', async () => {
    const { client, spies } = makeResolveReplacementSupabase()

    const result = await resolveTradeSwapReplacementListing(client, 'rep-1', {
      swapId: 'swap-1',
      replacementListingId: 'replacement-listing-1',
    })

    expect(spies.listingEq).toHaveBeenCalledWith(
      'id',
      'replacement-listing-1',
    )
    expect(spies.swapReadEq).toHaveBeenCalledWith('id', 'swap-1')
    expect(spies.swapUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        replacement_listing_id: 'replacement-listing-1',
        replacement_status: 'added_to_board',
        updated_at: expect.any(String),
      }),
    )
    expect(spies.swapUpdateEq).toHaveBeenCalledWith('id', 'swap-1')
    expect(spies.fulfillmentUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        received_listing_id: 'replacement-listing-1',
        status_updated_at: expect.any(String),
      }),
    )
    expect(spies.fulfillmentEq).toHaveBeenCalledWith(
      'request_id',
      'request-1',
    )
    expect(result).toEqual({
      swapId: 'swap-1',
      requestId: 'request-1',
      replacementListingId: 'replacement-listing-1',
      replacementStatus: 'added_to_board',
      fulfillmentId: 'fulfillment-1',
    })
  })
})
