import type { AmethystTradeBoardListing } from './trade-board-listings'

export interface AmethystTradeBoardFilterState {
  collection: string
  type: string
  rarity: string
  material: string
  size: string
}

export interface AmethystTradeBoardFilterOptions {
  collections: string[]
  types: string[]
  materials: string[]
  sizes: string[]
  rarityTags: string[]
}

function sortValues(values: Set<string>) {
  return [...values].sort((left, right) => left.localeCompare(right))
}

export function deriveTradeBoardFilterOptions(
  listings: AmethystTradeBoardListing[],
): AmethystTradeBoardFilterOptions {
  const collections = new Set<string>()
  const types = new Set<string>()
  const materials = new Set<string>()
  const sizes = new Set<string>()
  const rarityTags = new Set<string>()

  for (const listing of listings) {
    if (listing.collection) collections.add(listing.collection)
    if (listing.type) types.add(listing.type)
    if (listing.material) materials.add(listing.material)
    if (listing.size) sizes.add(listing.size)
    if (listing.tier === 'diamond' || listing.tier === 'unicorn') {
      rarityTags.add(listing.tier)
    }
  }

  return {
    collections: sortValues(collections),
    types: sortValues(types),
    materials: sortValues(materials),
    sizes: sortValues(sizes),
    rarityTags: sortValues(rarityTags),
  }
}

export function filterCollectionOptions(
  collections: string[],
  searchTerm: string,
) {
  const normalizedSearch = searchTerm.trim().toLowerCase()
  if (!normalizedSearch) return collections

  return collections.filter((collection) =>
    collection.toLowerCase().includes(normalizedSearch),
  )
}

export function filterTradeBoardListings(
  listings: AmethystTradeBoardListing[],
  state: AmethystTradeBoardFilterState,
) {
  return listings.filter((listing) => {
    if (state.collection !== 'all' && listing.collection !== state.collection) {
      return false
    }
    if (state.type !== 'all' && listing.type !== state.type) {
      return false
    }
    if (state.rarity !== 'all' && listing.tier !== state.rarity) {
      return false
    }
    if (state.material !== 'all' && listing.material !== state.material) {
      return false
    }
    if (state.size !== 'all' && listing.size !== state.size) {
      return false
    }
    return true
  })
}

export function countActiveTradeBoardFilters(
  state: AmethystTradeBoardFilterState,
) {
  return Object.values(state).filter((value) => value !== 'all').length
}
