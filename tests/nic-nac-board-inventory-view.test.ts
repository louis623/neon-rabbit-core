import { describe, expect, it } from 'vitest'
import type { TradeListingWithDesign } from '@/lib/services/types'

import {
  getBoardInventoryOptions,
  getBoardInventoryResults,
  getCarouselWindow,
  hasActiveBoardInventoryBrowse,
} from '@/lib/nic-nac/board-inventory-view'

function listing(
  id: string,
  overrides: {
    itemNumber: string
    designName: string
    typePrefix: TradeListingWithDesign['design']['type_prefix']
    collectionName: string | null
    listedAt: string | null
    status?: TradeListingWithDesign['status']
    bpMsrp?: number | null
  },
): TradeListingWithDesign {
  return {
    id,
    rep_id: 'rep-1',
    status: overrides.status ?? 'available',
    rep_notes: null,
    trade_preferences: null,
    listing_photo_url: null,
    uses_canonical_photo: true,
    listed_at: overrides.listedAt,
    removal_reason: null,
    deleted_at: null,
    created_at: overrides.listedAt ?? '2026-06-01T00:00:00.000Z',
    updated_at: overrides.listedAt ?? '2026-06-01T00:00:00.000Z',
    design: {
      id: `design-${id}`,
      item_number: overrides.itemNumber,
      design_name: overrides.designName,
      material: null,
      main_stone: null,
      bp_msrp: overrides.bpMsrp ?? 39.95,
      canonical_photo_url: null,
      type_prefix: overrides.typePrefix,
      collection: overrides.collectionName
        ? { id: `collection-${overrides.collectionName}`, name: overrides.collectionName }
        : null,
    },
  }
}

const boardListings = [
  listing('old-ring', {
    itemNumber: 'RG100',
    designName: 'Rose Glow Ring',
    typePrefix: 'RG',
    collectionName: 'Birthday',
    listedAt: '2026-06-01T12:00:00.000Z',
  }),
  listing('new-ring', {
    itemNumber: 'RG200',
    designName: 'Celestial Ring',
    typePrefix: 'RG',
    collectionName: 'Celestial',
    listedAt: '2026-06-03T12:00:00.000Z',
  }),
  listing('necklace', {
    itemNumber: 'NK300',
    designName: 'Birthday Pendant',
    typePrefix: 'NK',
    collectionName: 'Birthday',
    listedAt: '2026-06-02T12:00:00.000Z',
  }),
  listing('removed-bracelet', {
    itemNumber: 'BR400',
    designName: 'Removed Bracelet',
    typePrefix: 'BR',
    collectionName: 'Retired',
    listedAt: '2026-06-04T12:00:00.000Z',
    status: 'removed',
  }),
]

describe('board inventory browsing helpers', () => {
  it('treats blank search and blank filters as inactive browse state', () => {
    expect(
      hasActiveBoardInventoryBrowse({
        search: '   ',
        jewelryType: '',
        collection: '',
      }),
    ).toBe(false)

    expect(
      getBoardInventoryResults(boardListings, {
        search: '',
        jewelryType: '',
        collection: '',
      }),
    ).toEqual([])
  })

  it('builds dropdown options from available active board pieces only', () => {
    expect(getBoardInventoryOptions(boardListings)).toEqual({
      jewelryTypes: ['NK', 'RG'],
      collections: ['Birthday', 'Celestial'],
    })
  })

  it('combines jewelry type and collection filters and sorts newest first', () => {
    const results = getBoardInventoryResults(boardListings, {
      search: '',
      jewelryType: 'RG',
      collection: 'Birthday',
    })

    expect(results.map((item) => item.design.item_number)).toEqual(['RG100'])
  })

  it('searches item number, design name, jewelry type, and collection', () => {
    expect(
      getBoardInventoryResults(boardListings, {
        search: 'birthday',
        jewelryType: '',
        collection: '',
      }).map((item) => item.design.item_number),
    ).toEqual(['NK300', 'RG100'])

    expect(
      getBoardInventoryResults(boardListings, {
        search: 'rg',
        jewelryType: '',
        collection: '',
      }).map((item) => item.design.item_number),
    ).toEqual(['RG200', 'RG100'])
  })

  it('returns an empty result set when active filters do not match board pieces', () => {
    expect(
      getBoardInventoryResults(boardListings, {
        search: 'not-on-board',
        jewelryType: '',
        collection: '',
      }),
    ).toEqual([])
  })

  it('builds a clamped carousel window with boundary state and a range label', () => {
    const firstWindow = getCarouselWindow(['a', 'b', 'c', 'd'], 0, 3)

    expect(firstWindow).toEqual({
      startIndex: 0,
      endIndex: 3,
      visibleItems: ['a', 'b', 'c'],
      canGoPrevious: false,
      canGoNext: true,
      rangeLabel: 'Showing 1-3 of 4',
    })

    const finalWindow = getCarouselWindow(['a', 'b', 'c', 'd'], 8, 3)

    expect(finalWindow).toEqual({
      startIndex: 1,
      endIndex: 4,
      visibleItems: ['b', 'c', 'd'],
      canGoPrevious: true,
      canGoNext: false,
      rangeLabel: 'Showing 2-4 of 4',
    })
  })
})
