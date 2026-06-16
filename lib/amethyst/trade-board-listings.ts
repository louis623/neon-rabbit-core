import type { TradeListingWithDesign } from '@/lib/services/types'
import { getMyBoard } from '@/lib/services/trade-board'
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
}

const TYPE_LABELS = {
  RG: 'Ring',
  NK: 'Necklace',
  ER: 'Earrings',
  ST: 'Stack',
  BR: 'Bracelet',
} as const

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
  },
]

export function getTradeBoardPhotoSource(
  listing: Pick<TradeListingWithDesign, 'listing_photo_url' | 'uses_canonical_photo'> & {
    design: Pick<TradeListingWithDesign['design'], 'canonical_photo_url'>
  },
): AmethystTradeBoardListing['photoSource'] {
  if (listing.listing_photo_url) return 'listing'
  if (listing.design.canonical_photo_url && listing.uses_canonical_photo) {
    return 'canonical'
  }
  return 'missing'
}

function inferTradeBoardTier(listing: TradeListingWithDesign): AmethystTradeBoardTier {
  // Until rarity becomes an explicit field, keep inference conservative and
  // only tag listings when the source text explicitly says so.
  const haystack = [
    listing.design.design_name,
    listing.design.collection?.name,
    listing.design.main_stone,
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
  const displayName = listing.design.design_name.trim()
  const material = listing.design.material?.trim() || 'Material pending'
  const stone = listing.design.main_stone?.trim() || 'Stone pending'
  const collection = listing.design.collection?.name?.trim() || 'Collection pending'
  const type = TYPE_LABELS[listing.design.type_prefix]
  const note =
    listing.trade_preferences?.trim() ||
    listing.rep_notes?.trim() ||
    DEFAULT_TRADE_NOTE

  return {
    id: listing.id,
    name: displayName,
    collection,
    type,
    material,
    stone,
    msrp: listing.design.bp_msrp,
    size: listing.ring_size?.trim() || null,
    note,
    glyph: displayName.charAt(0).toUpperCase() || '?',
    tier: inferTradeBoardTier(listing),
    photoUrl: listing.listing_photo_url || listing.design.canonical_photo_url,
    photoSource: getTradeBoardPhotoSource(listing),
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
