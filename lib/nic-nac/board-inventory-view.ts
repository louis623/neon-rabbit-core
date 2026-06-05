import type { TradeListingWithDesign } from '@/lib/services/types'

export type BoardInventoryFilters = {
  search: string
  jewelryType: string
  collection: string
}

export type BoardInventoryOptions = {
  jewelryTypes: string[]
  collections: string[]
}

export function hasActiveBoardInventoryBrowse(filters: BoardInventoryFilters) {
  return Boolean(
    filters.search.trim() ||
      filters.jewelryType.trim() ||
      filters.collection.trim(),
  )
}

export function getBoardInventoryOptions(
  listings: TradeListingWithDesign[],
): BoardInventoryOptions {
  const jewelryTypes = new Set<string>()
  const collections = new Set<string>()

  for (const listing of listings) {
    if (listing.status !== 'available') continue
    jewelryTypes.add(listing.design.type_prefix)
    const collectionName = listing.design.collection?.name?.trim()
    if (collectionName) {
      collections.add(collectionName)
    }
  }

  return {
    jewelryTypes: [...jewelryTypes].sort((a, b) => a.localeCompare(b)),
    collections: [...collections].sort((a, b) => a.localeCompare(b)),
  }
}

export function getBoardInventoryResults(
  listings: TradeListingWithDesign[],
  filters: BoardInventoryFilters,
): TradeListingWithDesign[] {
  if (!hasActiveBoardInventoryBrowse(filters)) return []

  const search = normalizeInventorySearch(filters.search)
  const jewelryType = filters.jewelryType.trim()
  const collection = filters.collection.trim()

  return listings
    .filter((listing) => listing.status === 'available')
    .filter((listing) => {
      if (jewelryType && listing.design.type_prefix !== jewelryType) return false
      if (collection && listing.design.collection?.name !== collection) return false
      if (!search) return true

      return getSearchableListingText(listing).includes(search)
    })
    .sort(sortNewestListingsFirst)
}

export function getCarouselWindow<T>(
  items: T[],
  requestedStartIndex: number,
  requestedPageSize: number,
) {
  const pageSize = Math.max(1, requestedPageSize)
  const maxStartIndex = Math.max(0, items.length - pageSize)
  const startIndex = clampIndex(requestedStartIndex, maxStartIndex)
  const endIndex = Math.min(items.length, startIndex + pageSize)
  const visibleItems = items.slice(startIndex, endIndex)

  return {
    startIndex,
    endIndex,
    visibleItems,
    canGoPrevious: startIndex > 0,
    canGoNext: endIndex < items.length,
    rangeLabel:
      items.length === 0
        ? 'Showing 0 of 0'
        : `Showing ${startIndex + 1}-${endIndex} of ${items.length}`,
  }
}

function normalizeInventorySearch(value: string) {
  return value.trim().toLowerCase()
}

function getSearchableListingText(listing: TradeListingWithDesign) {
  return [
    listing.design.item_number,
    listing.design.design_name,
    listing.design.type_prefix,
    listing.design.collection?.name ?? '',
  ]
    .join(' ')
    .toLowerCase()
}

function sortNewestListingsFirst(
  a: TradeListingWithDesign,
  b: TradeListingWithDesign,
) {
  const listedComparison = getListingTime(b) - getListingTime(a)
  if (listedComparison !== 0) return listedComparison
  return a.design.item_number.localeCompare(b.design.item_number)
}

function getListingTime(listing: TradeListingWithDesign) {
  const parsed = Date.parse(listing.listed_at ?? listing.created_at)
  return Number.isNaN(parsed) ? 0 : parsed
}

function clampIndex(value: number, maxStartIndex: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(0, Math.floor(value)), maxStartIndex)
}
