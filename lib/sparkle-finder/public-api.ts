import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { PAID_WORKSPACE_STATUSES } from '@/lib/nic-nac/subscription-access'
import type { JewelryType } from '@/lib/services/types'

type FinderCollectionRelation =
  | { name: string | null; collection_year: number | null }
  | Array<{ name: string | null; collection_year: number | null }>
  | null

type FinderDesignRow = {
  id: string
  item_number: string
  design_name: string
  material: string | null
  main_stone: string | null
  bp_msrp: number | null
  canonical_photo_url: string | null
  type_prefix: JewelryType
  search_tags: string[] | null
  collection: FinderCollectionRelation
  created_at?: string | null
}

type FinderRepRow =
  | {
      id: string
      display_name: string | null
      business_name: string | null
      profile_photo_url: string | null
      custom_domain: string | null
      status: string | null
    }
  | Array<{
      id: string
      display_name: string | null
      business_name: string | null
      profile_photo_url: string | null
      custom_domain: string | null
      status: string | null
    }>
  | null

type FinderListingRow = {
  id: string
  rep_id: string
  design_id: string
  listing_photo_url: string | null
  uses_canonical_photo: boolean | null
  listed_at: string | null
  status: string
  design: FinderDesignRow | FinderDesignRow[] | null
  rep: FinderRepRow
}

type FinderShowRow = {
  id: string
  rep_id: string
  platform: string
  event_time: string
  duration_minutes: number | null
  title: string | null
  description: string | null
  status: string
}

export type FinderJewelryType =
  | 'ring'
  | 'necklace'
  | 'earrings'
  | 'stack'
  | 'bracelet'

export interface SparkleFinderCatalogItem {
  designId: string
  itemNumber: string
  designName: string
  collectionName: string | null
  collectionYear: number | null
  jewelryType: FinderJewelryType
  material: string | null
  mainStone: string | null
  bpMsrp: number | null
  canonicalPhotoUrl: string | null
  searchTags: string[]
  availableListingCount: number
}

export interface SparkleFinderPublicRep {
  repId: string
  displayName: string
  businessName: string
  profilePhotoUrl: string | null
  customerSitePath: string
  tradeBoardPath: string
}

export interface SparkleFinderPublicShow {
  showId: string
  repId: string
  platform: string
  startsAt: string
  durationMinutes: number
  title: string | null
  description: string | null
  status: 'scheduled' | 'live'
}

export interface SparkleFinderAvailabilityMatch {
  listingId: string
  listedAt: string | null
  photoUrl: string | null
  photoSource: 'listing' | 'canonical' | 'missing'
  item: SparkleFinderCatalogItem
  rep: SparkleFinderPublicRep
  nextShow: SparkleFinderPublicShow | null
}

export interface SparkleFinderAvailabilityResult {
  requestedItem: SparkleFinderCatalogItem | null
  exactMatches: SparkleFinderAvailabilityMatch[]
  similarMatches: SparkleFinderAvailabilityMatch[]
}

export interface SparkleFinderCatalogListOptions {
  query?: string
  limit?: number
  supabase?: SupabaseClient
}

export interface SparkleFinderCatalogDetailOptions {
  designId: string
  supabase?: SupabaseClient
}

export interface SparkleFinderAvailabilityOptions {
  designId: string
  limit?: number
  supabase?: SupabaseClient
}

const FINDER_CATALOG_SELECT =
  'id, item_number, design_name, material, main_stone, bp_msrp, canonical_photo_url, type_prefix, search_tags, created_at, collection:collections(name, collection_year)'

const FINDER_LISTING_SELECT = `
  id, rep_id, design_id, listing_photo_url, uses_canonical_photo, listed_at, status,
  design:jewelry_designs(${FINDER_CATALOG_SELECT}),
  rep:reps(id, display_name, business_name, profile_photo_url, custom_domain, status)
`

export const DEFAULT_FINDER_CATALOG_LIMIT = 24
export const MAX_FINDER_CATALOG_LIMIT = 50
export const DEFAULT_FINDER_AVAILABILITY_LIMIT = 24
export const MAX_FINDER_AVAILABILITY_LIMIT = 50

const TYPE_MAP: Record<JewelryType, FinderJewelryType> = {
  RG: 'ring',
  NK: 'necklace',
  ER: 'earrings',
  ST: 'stack',
  BR: 'bracelet',
}

export function parseSparkleFinderLimit(
  rawLimit: string | null,
  fallback: number,
  max: number,
): number | null {
  if (!rawLimit) return fallback
  const parsed = Number.parseInt(rawLimit, 10)
  if (!Number.isInteger(parsed) || parsed < 1) return null
  return Math.min(parsed, max)
}

export function mapSparkleFinderDesignRow(
  row: FinderDesignRow,
  availableListingCount = 0,
): SparkleFinderCatalogItem {
  const collection = readSingle(row.collection)

  return {
    designId: row.id,
    itemNumber: row.item_number,
    designName: row.design_name,
    collectionName: collection?.name?.trim() || null,
    collectionYear: collection?.collection_year ?? null,
    jewelryType: TYPE_MAP[row.type_prefix],
    material: row.material,
    mainStone: row.main_stone,
    bpMsrp: row.bp_msrp,
    canonicalPhotoUrl: row.canonical_photo_url,
    searchTags: Array.isArray(row.search_tags) ? row.search_tags : [],
    availableListingCount,
  }
}

export async function listSparkleFinderCatalogItems(
  options: SparkleFinderCatalogListOptions = {},
): Promise<SparkleFinderCatalogItem[]> {
  if (!isFinderSupabaseConfigured(options.supabase)) return []

  const supabase = options.supabase ?? createAdminClient()
  const limit = Math.min(
    Math.max(options.limit ?? DEFAULT_FINDER_CATALOG_LIMIT, 1),
    MAX_FINDER_CATALOG_LIMIT,
  )
  const queryText = options.query?.trim()
  const designs = await loadCatalogDesignRows(supabase, queryText, limit)
  const counts = await countEligibleAvailableListings(supabase, designs.map((design) => design.id))

  return designs.map((design) =>
    mapSparkleFinderDesignRow(design, counts.get(design.id) ?? 0),
  )
}

export async function getSparkleFinderCatalogItem(
  options: SparkleFinderCatalogDetailOptions,
): Promise<SparkleFinderCatalogItem | null> {
  if (!options.designId.trim() || !isFinderSupabaseConfigured(options.supabase)) {
    return null
  }

  const supabase = options.supabase ?? createAdminClient()
  const { data, error } = await supabase
    .from('jewelry_designs')
    .select(FINDER_CATALOG_SELECT)
    .eq('id', options.designId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  const counts = await countEligibleAvailableListings(supabase, [options.designId])
  return mapSparkleFinderDesignRow(
    data as unknown as FinderDesignRow,
    counts.get(options.designId) ?? 0,
  )
}

export async function getSparkleFinderAvailability(
  options: SparkleFinderAvailabilityOptions,
): Promise<SparkleFinderAvailabilityResult> {
  if (!options.designId.trim() || !isFinderSupabaseConfigured(options.supabase)) {
    return { requestedItem: null, exactMatches: [], similarMatches: [] }
  }

  const supabase = options.supabase ?? createAdminClient()
  const requestedItem = await getSparkleFinderCatalogItem({
    designId: options.designId,
    supabase,
  })
  if (!requestedItem) return { requestedItem: null, exactMatches: [], similarMatches: [] }

  const eligibleRepIds = await loadPublicFinderEligibleRepIds(supabase)
  if (eligibleRepIds.length === 0) {
    return { requestedItem, exactMatches: [], similarMatches: [] }
  }

  const limit = Math.min(
    Math.max(options.limit ?? DEFAULT_FINDER_AVAILABILITY_LIMIT, 1),
    MAX_FINDER_AVAILABILITY_LIMIT,
  )
  const exactRows = await loadAvailableListingRows(supabase, eligibleRepIds, {
    designId: options.designId,
    limit,
  })
  const similarRows = await loadAvailableListingRows(supabase, eligibleRepIds, {
    excludeDesignId: options.designId,
    collectionName: requestedItem.collectionName,
    jewelryType: requestedItem.jewelryType,
    limit,
  })
  const repIds = Array.from(
    new Set([...exactRows, ...similarRows].map((listing) => listing.rep_id)),
  )
  const nextShows = await loadNextShowsByRepId(supabase, repIds)

  return {
    requestedItem,
    exactMatches: exactRows.map((listing) =>
      mapSparkleFinderAvailabilityListingRow(
        listing,
        nextShows.get(listing.rep_id) ?? null,
      ),
    ),
    similarMatches: similarRows.map((listing) =>
      mapSparkleFinderAvailabilityListingRow(
        listing,
        nextShows.get(listing.rep_id) ?? null,
      ),
    ),
  }
}

async function loadCatalogDesignRows(
  supabase: SupabaseClient,
  queryText: string | undefined,
  limit: number,
) {
  if (!queryText) {
    const { data, error } = await supabase
      .from('jewelry_designs')
      .select(FINDER_CATALOG_SELECT)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return ((data ?? []) as unknown as FinderDesignRow[])
  }

  const pattern = `%${queryText.replace(/[%_]/g, (match) => `\\${match}`)}%`
  const { data, error } = await supabase
    .from('jewelry_designs')
    .select(FINDER_CATALOG_SELECT)
    .or(
      `item_number.ilike.${pattern},design_name.ilike.${pattern},material.ilike.${pattern},main_stone.ilike.${pattern}`,
    )
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  const rows = ((data ?? []) as unknown as FinderDesignRow[])
  if (rows.length > 0) return rows

  return loadCatalogFallbackRows(supabase, queryText, limit)
}

async function loadCatalogFallbackRows(
  supabase: SupabaseClient,
  queryText: string,
  limit: number,
) {
  const tag = queryText.trim().toLowerCase()
  if (tag.length >= 2 && tag.length <= 32) {
    const { data, error } = await supabase
      .from('jewelry_designs')
      .select(FINDER_CATALOG_SELECT)
      .overlaps('search_tags', [tag])
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    const rows = ((data ?? []) as unknown as FinderDesignRow[])
    if (rows.length > 0) return rows
  }

  if (/^20[2-4]\d$/.test(queryText)) {
    const { data: collections, error: collectionErr } = await supabase
      .from('collections')
      .select('id')
      .eq('collection_year', Number(queryText))
      .limit(limit)
    if (collectionErr) throw collectionErr

    const collectionIds = ((collections ?? []) as Array<{ id: string }>).map(
      (collection) => collection.id,
    )
    if (collectionIds.length > 0) {
      const { data, error } = await supabase
        .from('jewelry_designs')
        .select(FINDER_CATALOG_SELECT)
        .in('collection_id', collectionIds)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return ((data ?? []) as unknown as FinderDesignRow[])
    }
  }

  return []
}

async function countEligibleAvailableListings(
  supabase: SupabaseClient,
  designIds: string[],
) {
  const counts = new Map<string, number>()
  if (designIds.length === 0) return counts

  const eligibleRepIds = await loadPublicFinderEligibleRepIds(supabase)
  if (eligibleRepIds.length === 0) return counts

  const { data, error } = await supabase
    .from('trade_listings')
    .select('design_id, rep_id')
    .eq('status', 'available')
    .in('design_id', designIds)
    .in('rep_id', eligibleRepIds)
  if (error) throw error

  for (const row of (data ?? []) as Array<{ design_id: string }>) {
    counts.set(row.design_id, (counts.get(row.design_id) ?? 0) + 1)
  }

  return counts
}

async function loadPublicFinderEligibleRepIds(supabase: SupabaseClient) {
  const paidRepIds = new Set<string>()
  const { data: subscriptions, error: subscriptionErr } = await supabase
    .from('subscriptions')
    .select('rep_id')
    .in('status', [...PAID_WORKSPACE_STATUSES])
  if (subscriptionErr) throw subscriptionErr

  for (const row of (subscriptions ?? []) as Array<{ rep_id: string | null }>) {
    if (row.rep_id) paidRepIds.add(row.rep_id)
  }

  try {
    const { data: builds, error: buildErr } = await supabase
      .from('sparkle_suite_launch_builds')
      .select('rep_id')
      .eq('stage', 'ready_for_launch')
      .eq('status', 'ready')
      .not('rep_id', 'is', null)
    if (buildErr) throw buildErr

    for (const row of (builds ?? []) as Array<{ rep_id: string | null }>) {
      if (row.rep_id) paidRepIds.add(row.rep_id)
    }
  } catch {
    // Older/local databases may not have launch builds. Paid subscriptions are
    // enough for the public Finder boundary.
  }

  return Array.from(paidRepIds)
}

async function loadAvailableListingRows(
  supabase: SupabaseClient,
  eligibleRepIds: string[],
  options: {
    designId?: string
    excludeDesignId?: string
    collectionName?: string | null
    jewelryType?: FinderJewelryType
    limit: number
  },
) {
  let query = supabase
    .from('trade_listings')
    .select(FINDER_LISTING_SELECT)
    .eq('status', 'available')
    .in('rep_id', eligibleRepIds)
    .order('listed_at', { ascending: false, nullsFirst: false })
    .limit(options.limit)

  if (options.designId) {
    query = query.eq('design_id', options.designId)
  } else if (options.excludeDesignId) {
    query = query.neq('design_id', options.excludeDesignId)
  }

  const { data, error } = await query
  if (error) throw error

  const rows = ((data ?? []) as unknown as FinderListingRow[]).filter((row) => {
    const design = readSingle(row.design)
    const rep = readSingle(row.rep)
    if (!design || !rep || rep.status === 'suspended' || rep.status === 'churned') {
      return false
    }
    if (!options.collectionName && !options.jewelryType) return true

    const item = mapSparkleFinderDesignRow(design)
    return (
      item.collectionName === options.collectionName &&
      item.jewelryType === options.jewelryType
    )
  })

  return rows.slice(0, options.limit)
}

async function loadNextShowsByRepId(supabase: SupabaseClient, repIds: string[]) {
  const shows = new Map<string, SparkleFinderPublicShow>()
  if (repIds.length === 0) return shows

  const { data, error } = await supabase
    .from('calendar_events')
    .select('id, rep_id, platform, event_time, duration_minutes, title, description, status')
    .in('rep_id', repIds)
    .in('status', ['scheduled', 'live'])
    .gte('event_time', new Date().toISOString())
    .order('event_time', { ascending: true })
  if (error) throw error

  for (const row of (data ?? []) as FinderShowRow[]) {
    if (shows.has(row.rep_id)) continue
    shows.set(row.rep_id, {
      showId: row.id,
      repId: row.rep_id,
      platform: row.platform,
      startsAt: row.event_time,
      durationMinutes: row.duration_minutes ?? 60,
      title: row.title,
      description: row.description,
      status: row.status === 'live' ? 'live' : 'scheduled',
    })
  }

  return shows
}

export function mapSparkleFinderAvailabilityListingRow(
  row: FinderListingRow,
  nextShow: SparkleFinderPublicShow | null,
): SparkleFinderAvailabilityMatch {
  const design = readSingle(row.design)
  const rep = readSingle(row.rep)
  if (!design || !rep?.id) {
    throw new Error('Finder availability listing is missing required relations.')
  }
  const item = mapSparkleFinderDesignRow(design)
  const photoUrl = row.listing_photo_url || item.canonicalPhotoUrl

  return {
    listingId: row.id,
    listedAt: row.listed_at,
    photoUrl,
    photoSource: row.listing_photo_url
      ? 'listing'
      : item.canonicalPhotoUrl && row.uses_canonical_photo !== false
        ? 'canonical'
        : 'missing',
    item,
    rep: {
      repId: rep.id,
      displayName: rep.display_name?.trim() || rep.business_name?.trim() || 'Sparkle Suite Rep',
      businessName: rep.business_name?.trim() || rep.display_name?.trim() || 'Sparkle Suite Rep',
      profilePhotoUrl: rep.profile_photo_url,
      customerSitePath: buildCustomerSitePath(rep.id),
      tradeBoardPath: buildTradeBoardPath(rep.id),
    },
    nextShow,
  }
}

function buildCustomerSitePath(repId: string) {
  return `/amethyst?c=${encodeURIComponent(repId)}`
}

function buildTradeBoardPath(repId: string) {
  return `/amethyst/trade?c=${encodeURIComponent(repId)}`
}

function readSingle<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

function isFinderSupabaseConfigured(supabase?: SupabaseClient) {
  return Boolean(
    supabase ||
      (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
  )
}
