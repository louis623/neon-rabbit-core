import type { TradeListingWithDesign } from '@/lib/services/types'
import { getMyBoard } from '@/lib/services/trade-board'
import {
  getTradeListingDisplayFields,
  TRADE_LISTING_TYPE_LABELS,
} from '@/lib/services/trade-listing-display'
import { resolveAmethystPreviewRep } from '@/lib/amethyst/preview-rep'
import { createAdminClient } from '@/lib/supabase/admin'

export type AmethystTradeBoardTier = 'everyday' | 'diamond' | 'unicorn'

export interface AmethystTradeBoardListing {
  id: string
  name: string
  collection: string
  type: string
  material: string
  stone: string
  msrp: number | null
  size: string | null
  note: string
  glyph: string
  tier: AmethystTradeBoardTier
  photoUrl: string | null
  photoSource: 'listing' | 'canonical' | 'missing'
  quantityAvailable?: number
}

const TYPE_LABELS = TRADE_LISTING_TYPE_LABELS

const DEFAULT_TRADE_NOTE =
  'Item-for-item only. Requests must stay within the same collection and the same jewelry type.'

export const defaultAmethystTradeBoardListings: AmethystTradeBoardListing[] = [
  {
    id: 'trade-bloom-ring',
    name: 'Birthday Bloom Ring',
    collection: 'Birthday',
    type: 'Ring',
    material: 'Sterling silver',
    stone: 'Amethyst crystal',
    msrp: 88,
    size: '8',
    note: DEFAULT_TRADE_NOTE,
    glyph: 'B',
    tier: 'diamond',
    photoUrl: null,
    photoSource: 'missing',
    quantityAvailable: 1,
  },
  {
    id: 'trade-velvet-necklace',
    name: 'Velvet Hour Necklace',
    collection: 'OG',
    type: 'Necklace',
    material: 'Triple-plated gold',
    stone: 'Moonstone accent',
    msrp: 42,
    size: null,
    note: DEFAULT_TRADE_NOTE,
    glyph: 'V',
    tier: 'everyday',
    photoUrl: null,
    photoSource: 'missing',
    quantityAvailable: 1,
  },
  {
    id: 'trade-petal-earrings',
    name: 'Petal Drop Earrings',
    collection: 'Spring Luxe',
    type: 'Earrings',
    material: 'Sterling silver',
    stone: 'Opal shimmer',
    msrp: 54,
    size: null,
    note: DEFAULT_TRADE_NOTE,
    glyph: 'P',
    tier: 'everyday',
    photoUrl: null,
    photoSource: 'missing',
    quantityAvailable: 1,
  },
  {
    id: 'trade-aurora-stack',
    name: 'Aurora Stack',
    collection: 'Stacks',
    type: 'Stack',
    material: 'Mixed alloy plating',
    stone: 'Crystal mix',
    msrp: 68,
    size: null,
    note: DEFAULT_TRADE_NOTE,
    glyph: 'A',
    tier: 'unicorn',
    photoUrl: null,
    photoSource: 'missing',
    quantityAvailable: 1,
  },
]

export function getTradeBoardPhotoSource(
  listing: TradeListingWithDesign,
): AmethystTradeBoardListing['photoSource'] {
  const display = getTradeListingDisplayFields(listing)
  if (display.listingPhotoUrl) return 'listing'
  if (display.canonicalPhotoUrl && listing.uses_canonical_photo) {
    return 'canonical'
  }
  return 'missing'
}

function inferTradeBoardTier(listing: TradeListingWithDesign): AmethystTradeBoardTier {
  // Until rarity becomes an explicit field, keep inference conservative and
  // only tag listings when the source text explicitly says so.
  const display = getTradeListingDisplayFields(listing)
  const haystack = [
    display.designName,
    display.collectionName,
    display.mainStone,
    listing.rep_notes,
    listing.trade_preferences,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (haystack.includes('unicorn')) return 'unicorn'
  if (haystack.includes('diamond')) return 'diamond'
  return 'everyday'
}

export function mapTradeListingToAmethystTradeBoardListing(
  listing: TradeListingWithDesign,
): AmethystTradeBoardListing {
  const display = getTradeListingDisplayFields(listing)
  const displayName = display.designName.trim()
  const material = display.material?.trim() || 'Shown in photo'
  const stone = display.mainStone?.trim() || 'Shown in photo'
  const collection = display.collectionName?.trim() || 'Collection'
  const type = TYPE_LABELS[display.typePrefix]
  const note =
    listing.trade_preferences?.trim() ||
    (display.listingSource === 'catalog' ? listing.rep_notes?.trim() : null) ||
    DEFAULT_TRADE_NOTE

  return {
    id: listing.id,
    name: displayName,
    collection,
    type,
    material,
    stone,
    msrp: display.bpMsrp,
    size: display.size,
    note,
    glyph: displayName.charAt(0).toUpperCase() || '?',
    tier: inferTradeBoardTier(listing),
    photoUrl: display.photoUrl,
    photoSource: getTradeBoardPhotoSource(listing),
    quantityAvailable: Math.max(0, listing.quantity_available ?? 1),
  }
}

interface LoadAmethystTradeBoardPreviewListingsOptions {
  limit?: number
  repId?: string | null
  publicSiteSlug?: string | null
  targeted?: boolean
}

export async function loadAmethystTradeBoardPreviewListings(
  options: LoadAmethystTradeBoardPreviewListingsOptions = {},
): Promise<AmethystTradeBoardListing[]> {
  const limit = options.limit ?? 18
  const targeted = Boolean(options.targeted || options.repId || options.publicSiteSlug)
  const repId = options.repId?.trim() ?? null
  const publicSiteSlug = options.publicSiteSlug?.trim().toLowerCase() ?? null

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return targeted ? [] : defaultAmethystTradeBoardListings
  }

  try {
    const admin = createAdminClient()
    const rep = await resolveAmethystPreviewRep(admin, {
      env: process.env,
      publicSiteSlug,
      repId,
      select: 'id, email',
    })

    if (!rep?.id) {
      return targeted ? [] : defaultAmethystTradeBoardListings
    }

    const board = await getMyBoard(admin, rep.id as string, {
      statusFilter: 'available',
      sortBy: 'listed_at',
      sortOrder: 'desc',
      limit,
    })

    if (!board.listings.length) {
      return targeted ? [] : defaultAmethystTradeBoardListings
    }

    return board.listings.map(mapTradeListingToAmethystTradeBoardListing)
  } catch {
    return targeted ? [] : defaultAmethystTradeBoardListings
  }
}
