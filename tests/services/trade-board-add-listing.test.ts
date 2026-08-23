import { beforeEach, describe, expect, it, vi } from 'vitest'

const analyzeServerImageQualityMock = vi.fn()

vi.mock('@/lib/services/server-image-quality', () => ({
  analyzeServerImageQuality: (...args: unknown[]) =>
    analyzeServerImageQualityMock(...args),
}))

import { addListing, addListingBatch } from '@/lib/services/trade-board'
import { resolveItemNumber } from '@/lib/services/jewelry-database'

function makeResolveSupabase(rows: Array<Record<string, unknown>> | Record<string, unknown> | null) {
  const data = Array.isArray(rows) ? rows : rows ? [rows] : []
  const limit = vi.fn().mockResolvedValue({ data, error: null })
  const eq = vi.fn().mockReturnValue({ limit })
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ select })

  return {
    client: { from } as never,
    spies: { from, select, eq, limit },
  }
}

function makeBatchSupabase(
  options: {
    existingListings?: Array<{ design_id: string }>
    canonicalPhotoUrl?: string | null
  } = {},
) {
  let availableQuantity = options.existingListings?.length ? 1 : 0
  const rpc = vi.fn().mockImplementation(async () => {
    availableQuantity += 1
    return {
      data: {
        listing_id: 'listing-1',
        status: 'available',
        quantity_available: availableQuantity,
        grouped_with_existing: availableQuantity > 1,
      },
      error: null,
    }
  })
  const designLookup = vi.fn().mockResolvedValue({
    data: [
      {
        id: 'design-1',
        item_number: 'RG31452',
        design_name: 'Celeste Ring',
        collection_id: 'collection-1',
        canonical_photo_url: options.canonicalPhotoUrl ?? null,
      },
    ],
    error: null,
  })
  const existingLookup = vi
    .fn()
    .mockResolvedValue({ data: options.existingListings ?? [], error: null })
  let insertedRows: Array<Record<string, unknown>> = []
  const insertSelect = vi.fn().mockImplementation(() =>
    Promise.resolve({
      data: insertedRows.map((row, index) => ({
        id: `listing-${index + 1}`,
        design_id: row.design_id,
        status: row.status,
      })),
      error: null,
    }),
  )
  const insert = vi.fn((rows: Array<Record<string, unknown>>) => {
    insertedRows = rows
    return { select: insertSelect }
  })
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
    client: { from, rpc } as never,
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
      rpc,
    },
  }
}

function makeAddListingWithCollectionSupabase(
  options: {
    existingListing?: Record<string, unknown> | null
    canonicalPhotoUrl?: string | null
    collection?: { id: string; name: string; collection_year: number | null }
  } = {},
) {
  const rpc = vi.fn().mockResolvedValue({
    data: {
      listing_id: 'listing-1',
      status: 'available',
      quantity_available: options.existingListing ? 2 : 1,
      grouped_with_existing: Boolean(options.existingListing),
    },
    error: null,
  })
  const resolveLimit = vi.fn().mockResolvedValue({
    data: [
      {
      id: 'design-1',
      item_number: 'RG31452',
      design_name: 'Celeste Ring',
      material: 'Sterling Silver',
      main_stone: 'Topaz',
      bp_msrp: 42,
      canonical_photo_url: options.canonicalPhotoUrl ?? null,
      type_prefix: 'RG',
      collection_id: null,
      collection: null,
      },
    ],
    error: null,
  })
  const resolveEq = vi.fn().mockReturnValue({ limit: resolveLimit })

  const collectionMaybeSingle = vi.fn().mockResolvedValue({
    data: options.collection ?? {
      id: 'collection-1',
      name: 'Lustre',
      collection_year: null,
    },
    error: null,
  })
  const collectionEq = vi.fn().mockReturnValue({
    maybeSingle: collectionMaybeSingle,
  })
  const collectionSelect = vi.fn().mockReturnValue({ eq: collectionEq })

  const patchMaybeSingle = vi.fn().mockResolvedValue({
    data: { id: 'design-1', collection_id: 'collection-1' },
    error: null,
  })
  const patchSelect = vi.fn().mockReturnValue({ maybeSingle: patchMaybeSingle })
  const patchIs = vi.fn().mockReturnValue({ select: patchSelect })
  const patchEq = vi.fn().mockReturnValue({ is: patchIs })
  const patchUpdate = vi.fn().mockReturnValue({ eq: patchEq })

  const timesListedMaybeSingle = vi.fn().mockResolvedValue({
    data: { times_listed: 1 },
    error: null,
  })
  const timesListedEq = vi
    .fn()
    .mockReturnValue({ maybeSingle: timesListedMaybeSingle })

  const jewelrySelect = vi
    .fn()
    .mockReturnValueOnce({ eq: resolveEq })
    .mockReturnValueOnce({ eq: timesListedEq })

  const timesListedUpdateEq = vi.fn().mockResolvedValue({
    data: null,
    error: null,
  })
  const timesListedUpdate = vi
    .fn()
    .mockReturnValue({ eq: timesListedUpdateEq })
  const jewelryUpdate = vi
    .fn()
    .mockImplementationOnce(patchUpdate)
    .mockImplementationOnce(timesListedUpdate)

  const duplicateMaybeSingle = vi.fn().mockResolvedValue({
    data: options.existingListing ?? null,
    error: null,
  })
  const duplicateChain: Record<string, unknown> = {
    maybeSingle: duplicateMaybeSingle,
  }
  duplicateChain.eq = vi.fn().mockReturnValue(duplicateChain)
  duplicateChain.limit = vi.fn().mockReturnValue(duplicateChain)
  const tradeListingsSelect = vi.fn().mockReturnValue(duplicateChain)

  const insertSingle = vi.fn().mockResolvedValue({
    data: { id: 'listing-1', status: 'available' },
    error: null,
  })
  const insertSelect = vi.fn().mockReturnValue({ single: insertSingle })
  const insert = vi.fn().mockReturnValue({ select: insertSelect })

  const from = vi.fn((table: string) => {
    if (table === 'jewelry_designs') {
      return {
        select: jewelrySelect,
        update: jewelryUpdate,
      }
    }

    if (table === 'collections') {
      return {
        select: collectionSelect,
      }
    }

    if (table === 'trade_listings') {
      return {
        select: tradeListingsSelect,
        insert,
      }
    }

    throw new Error(`unexpected table ${table}`)
  })

  return {
    client: { from, rpc } as never,
    spies: {
      collectionEq,
      patchUpdate,
      patchIs,
      insert,
      rpc,
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

  it('uses material as the variant key when one item number has multiple platings', async () => {
    const { client } = makeResolveSupabase([
      {
        id: 'design-rhodium',
        item_number: 'NK12032',
        design_name: 'Reveal Necklace',
        material: 'Rhodium Plating',
        main_stone: 'Ruby',
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
        main_stone: 'Ruby',
        bp_msrp: 138,
        canonical_photo_url: null,
        type_prefix: 'NK',
        collection_id: 'collection-1',
        search_tags: [],
        collection: { name: 'July Birthday 2026', collection_year: 2026 },
      },
    ])

    const result = await resolveItemNumber(client, 'NK12032', {
      material: 'hematite plating',
    })

    expect(result).toMatchObject({
      found: true,
      design: {
        id: 'design-hematite',
        itemNumber: 'NK12032',
        material: 'Hematite Plating',
      },
    })
  })

  it('uses main stone as part of the variant key when item number and plating match', async () => {
    const { client } = makeResolveSupabase([
      {
        id: 'design-rose-quartz',
        item_number: 'ER59000',
        design_name: 'Baguette Braid Sparkle',
        material: 'Rhodium Plating',
        main_stone: 'Rose Quartz Cubic Zirconia',
        bp_msrp: 126,
        canonical_photo_url: 'https://cdn.example.com/er59000-rose-quartz.png',
        type_prefix: 'ER',
        collection_id: 'collection-1',
        search_tags: [],
        collection: { name: 'July Birthday 2026', collection_year: 2026 },
      },
      {
        id: 'design-ruby',
        item_number: 'ER59000',
        design_name: 'Baguette Braid Sparkle',
        material: 'Rhodium Plating',
        main_stone: 'Lab-Created Ruby',
        bp_msrp: 126,
        canonical_photo_url: 'https://cdn.example.com/er59000-ruby.png',
        type_prefix: 'ER',
        collection_id: 'collection-1',
        search_tags: [],
        collection: { name: 'July Birthday 2026', collection_year: 2026 },
      },
    ])

    const result = await resolveItemNumber(client, 'ER59000', {
      material: 'rhodium plating',
      mainStone: 'lab-created ruby',
    })

    expect(result).toMatchObject({
      found: true,
      design: {
        id: 'design-ruby',
        itemNumber: 'ER59000',
        mainStone: 'Lab-Created Ruby',
        canonicalPhotoUrl: 'https://cdn.example.com/er59000-ruby.png',
      },
    })
  })

  it('returns an ambiguous variant result when plating is missing for a multi-plating item number', async () => {
    const { client } = makeResolveSupabase([
      {
        id: 'design-rhodium',
        item_number: 'NK12032',
        design_name: 'Reveal Necklace',
        material: 'Rhodium Plating',
        main_stone: 'Ruby',
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
        main_stone: 'Ruby',
        bp_msrp: 138,
        canonical_photo_url: null,
        type_prefix: 'NK',
        collection_id: 'collection-1',
        search_tags: [],
        collection: { name: 'July Birthday 2026', collection_year: 2026 },
      },
    ])

    const result = await resolveItemNumber(client, 'NK12032')

    expect(result).toMatchObject({
      found: false,
      itemNumber: 'NK12032',
      ambiguous: true,
      variantCandidates: [
        { designId: 'design-rhodium', material: 'Rhodium Plating' },
        { designId: 'design-hematite', material: 'Hematite Plating' },
      ],
    })
  })
})

describe('addListingBatch', () => {
  beforeEach(() => {
    vi.useRealTimers()
    analyzeServerImageQualityMock.mockReset()
  })

  it('groups repeated identical item numbers inside the same batch into one dancer quantity', async () => {
    const { client, spies } = makeBatchSupabase()

    const result = await addListingBatch(client, 'rep-1', {
      clickwrapAccepted: true,
      items: [
        { itemNumber: 'RG31452' },
        { itemNumber: ' rg31452 ' },
      ],
    })

    expect(spies.rpc).toHaveBeenCalledTimes(2)
    expect(result.added).toHaveLength(1)
    expect(result.added[0]).toMatchObject({
      itemNumber: 'RG31452',
      designName: 'Celeste Ring',
      quantityAvailable: 2,
      groupedWithExisting: true,
    })
  })

  it('increments a matching available dancer instead of adding another card', async () => {
    const { client, spies } = makeBatchSupabase({
      existingListings: [{ design_id: 'design-1' }],
    })

    const result = await addListingBatch(client, 'rep-1', {
      clickwrapAccepted: true,
      items: [{ itemNumber: 'RG31452' }],
    })

    expect(spies.rpc).toHaveBeenCalledTimes(1)
    expect(result.added).toMatchObject([
      { listingId: 'listing-1', quantityAvailable: 2, groupedWithExisting: true },
    ])
  })

  it('trusts batch canonical fallback without reclassifying the catalog photo', async () => {
    const { client, spies } = makeBatchSupabase({
      canonicalPhotoUrl: 'https://cdn.example.com/card-back.jpg',
    })

    const result = await addListingBatch(client, 'rep-1', {
      clickwrapAccepted: true,
      items: [{ itemNumber: 'RG31452' }],
    })

    expect(analyzeServerImageQualityMock).not.toHaveBeenCalled()
    expect(spies.rpc).toHaveBeenCalledTimes(1)
    expect(result.added).toHaveLength(1)
  })
})

describe('addListing', () => {
  it('patches a missing design collection before listing when the rep supplies the exact collection name', async () => {
    const { client, spies } = makeAddListingWithCollectionSupabase()

    const result = await addListing(client, 'rep-1', {
      itemNumber: ' rg31452 ',
      clickwrapAccepted: true,
      collectionName: ' Lustre ',
    })

    expect(spies.collectionEq).toHaveBeenCalledWith('name', 'Lustre')
    expect(spies.patchUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        collection_id: 'collection-1',
        updated_at: expect.any(String),
      }),
    )
    expect(spies.patchIs).toHaveBeenCalledWith('collection_id', null)
    expect(spies.rpc).toHaveBeenCalledWith(
      'rpc_add_or_increment_catalog_listing',
      expect.objectContaining({ p_rep_id: 'rep-1', p_design_id: 'design-1' }),
    )
    expect(result).toMatchObject({
      listingId: 'listing-1',
      designId: 'design-1',
      itemNumber: 'RG31452',
      designName: 'Celeste Ring',
    })
  })

  it('saves ring size on the physical listing when a ring is added', async () => {
    const { client, spies } = makeAddListingWithCollectionSupabase()

    await addListing(client, 'rep-1', {
      itemNumber: 'RG31452',
      clickwrapAccepted: true,
      collectionName: 'Lustre',
      ringSize: '8',
    })

    expect(spies.rpc).toHaveBeenCalledWith(
      'rpc_add_or_increment_catalog_listing',
      expect.objectContaining({ p_ring_size: '8' }),
    )
  })

  it('uses the Birthday collection year when patching a missing design collection', async () => {
    const { client, spies } = makeAddListingWithCollectionSupabase({
      collection: {
        id: 'collection-2026',
        name: 'July Birthday 2026',
        collection_year: 2026,
      },
    })

    await addListing(client, 'rep-1', {
      itemNumber: 'RG31452',
      clickwrapAccepted: true,
      collectionName: 'July Birthday',
      collectionYear: 2026,
    })

    expect(spies.collectionEq).toHaveBeenCalledWith(
      'name',
      'July Birthday 2026',
    )
    expect(spies.patchUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        collection_id: 'collection-2026',
      }),
    )
  })

  it('returns the grouped dancer when the rep already has the same design on the board', async () => {
    const { client, spies } = makeAddListingWithCollectionSupabase({
      existingListing: { id: 'listing-existing' },
    })

    const result = await addListing(client, 'rep-1', {
      itemNumber: 'RG31452',
      clickwrapAccepted: true,
      collectionName: 'Lustre',
    })

    expect(spies.rpc).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({
      listingId: 'listing-1',
      quantityAvailable: 2,
      groupedWithExisting: true,
    })
  })

  it('trusts canonical fallback without reclassifying the catalog photo', async () => {
    const { client, spies } = makeAddListingWithCollectionSupabase({
      canonicalPhotoUrl: 'https://cdn.example.com/card-back.jpg',
    })

    const result = await addListing(client, 'rep-1', {
      itemNumber: 'RG31452',
      clickwrapAccepted: true,
      collectionName: 'Lustre',
    })

    expect(analyzeServerImageQualityMock).not.toHaveBeenCalled()
    expect(spies.rpc).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({
      listingId: 'listing-1',
      usesCanonicalPhoto: true,
    })
  })
})
