import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { PAID_WORKSPACE_STATUSES } from '@/lib/nic-nac/subscription-access'
import { buildPublicSiteUrl, generatePublicSiteSlug } from '@/lib/public-site/show-link'
import type { JewelryType } from '@/lib/services/types'

type FinderCollectionRelation =
  | { name: string | null; collection_year: number | null }
  | Array<{ name: string | null; collection_year: number | null }>
  | null

type FinderRepSingle = {
  id: string
  display_name: string | null
  business_name: string | null
  profile_photo_url: string | null
  custom_domain: string | null
  public_site_slug: string | null
  status: string | null
}

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
  | FinderRepSingle
  | FinderRepSingle[]
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

export type FinderLeadShowRow = {
  id: string
  rep_id: string
  event_time: string
  title: string | null
  status: string
}

type FinderShowRow = FinderLeadShowRow

type FinderLiveShowRow = FinderLeadShowRow & {
  rep: FinderRepRow
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
  showName: string
  repFirstName: string
  customerSiteUrl: string
}

export interface SparkleFinderPublicShow {
  showId: string
  repId: string
  startsAt: string
  title: string | null
  status: 'scheduled' | 'live'
}

export interface SparkleFinderAvailabilityMatch {
  listingId: string
  listedAt: string | null
  photoUrl: string | null
  photoSource: 'listing' | 'canonical' | 'missing'
  item: SparkleFinderCatalogItem
  rep: SparkleFinderPublicRep
  nextShow: SparkleFinderPublicShow
}

export interface SparkleFinderAvailabilityResult {
  requestedItem: SparkleFinderCatalogItem | null
  exactMatches: SparkleFinderAvailabilityMatch[]
  similarMatches: SparkleFinderAvailabilityMatch[]
}

export interface SparkleFinderLiveShow {
  showId: string
  showName: string
  repFirstName: string
  startsAt: string
  status: 'scheduled' | 'live'
  customerSiteUrl: string
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

export interface SparkleFinderLiveShowsOptions {
  limit?: number
  supabase?: SupabaseClient
}

const FINDER_CATALOG_SELECT =
  'id, item_number, design_name, material, main_stone, bp_msrp, canonical_photo_url, type_prefix, search_tags, created_at, collection:collections(name, collection_year)'

const FINDER_LISTING_SELECT = `
  id, rep_id, design_id, listing_photo_url, uses_canonical_photo, listed_at, status,
  design:jewelry_designs(${FINDER_CATALOG_SELECT}),
  rep:reps(id, display_name, business_name, profile_photo_url, custom_domain, public_site_slug, status)
`

const FINDER_LIVE_SHOW_SELECT =
  'id, rep_id, event_time, title, status, rep:reps(id, display_name, business_name, profile_photo_url, custom_domain, public_site_slug, status)'

export const DEFAULT_FINDER_CATALOG_LIMIT = 24
export const MAX_FINDER_CATALOG_LIMIT = 50
export const DEFAULT_FINDER_AVAILABILITY_LIMIT = 24
export const MAX_FINDER_AVAILABILITY_LIMIT = 50
export const DEFAULT_FINDER_LIVE_SHOW_LIMIT = 50
export const MAX_FINDER_LIVE_SHOW_LIMIT = 100

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
  const qualifiedRepIds = await loadRepIdsWithFinderShows(supabase, eligibleRepIds)
  if (qualifiedRepIds.size === 0) {
    return { requestedItem, exactMatches: [], similarMatches: [] }
  }

  const limit = Math.min(
    Math.max(options.limit ?? DEFAULT_FINDER_AVAILABILITY_LIMIT, 1),
    MAX_FINDER_AVAILABILITY_LIMIT,
  )
  const qualifiedRepIdList = Array.from(qualifiedRepIds)
  const exactRows = await loadAvailableListingRows(supabase, qualifiedRepIdList, {
    designId: options.designId,
    limit,
  })
  const similarRows = await loadAvailableListingRows(supabase, qualifiedRepIdList, {
    excludeDesignId: options.designId,
    collectionName: requestedItem.collectionName,
    jewelryType: requestedItem.jewelryType,
    limit,
  })
  const repIds = Array.from(
    new Set([...exactRows, ...similarRows].map((listing) => listing.rep_id)),
  )
  const nextShows = await loadNextShowsByRepId(supabase, repIds)
  const exactLeadRows = filterListingsWithNextShows(exactRows, nextShows)
  const similarLeadRows = filterListingsWithNextShows(similarRows, nextShows)

  return {
    requestedItem,
    exactMatches: exactLeadRows.map((listing) =>
      mapSparkleFinderAvailabilityListingRow(
        listing,
        nextShows.get(listing.rep_id)!,
      ),
    ),
    similarMatches: similarLeadRows.map((listing) =>
      mapSparkleFinderAvailabilityListingRow(
        listing,
        nextShows.get(listing.rep_id)!,
      ),
    ),
  }
}

export async function listSparkleFinderLiveShows(
  options: SparkleFinderLiveShowsOptions = {},
): Promise<SparkleFinderLiveShow[]> {
  if (!isFinderSupabaseConfigured(options.supabase)) return []

  const supabase = options.supabase ?? createAdminClient()
  const limit = Math.min(
    Math.max(options.limit ?? DEFAULT_FINDER_LIVE_SHOW_LIMIT, 1),
    MAX_FINDER_LIVE_SHOW_LIMIT,
  )
  const eligibleRepIds = await loadPublicFinderEligibleRepIds(supabase)
  if (eligibleRepIds.length === 0) return []

  const rows = await loadFinderLiveShowRows(supabase, eligibleRepIds, limit)
  return mapSparkleFinderLiveShowRows(rows).slice(0, limit)
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
  const qualifiedRepIds = await loadRepIdsWithFinderShows(supabase, eligibleRepIds)
  if (qualifiedRepIds.size === 0) return counts

  const { data, error } = await supabase
    .from('trade_listings')
    .select('design_id, rep_id')
    .eq('status', 'available')
    .in('design_id', designIds)
    .in('rep_id', Array.from(qualifiedRepIds))
  if (error) throw error

  return countListingsByDesignForQualifiedReps(
    (data ?? []) as Array<{ design_id: string; rep_id: string }>,
    qualifiedRepIds,
  )
}

export function countListingsByDesignForQualifiedReps(
  rows: Array<{ design_id: string; rep_id: string }>,
  qualifiedRepIds: Set<string>,
) {
  const counts = new Map<string, number>()
  for (const row of rows) {
    if (!qualifiedRepIds.has(row.rep_id)) continue
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

  const now = new Date().toISOString()
  const liveResult = await supabase
    .from('calendar_events')
    .select('id, rep_id, event_time, title, status')
    .in('rep_id', repIds)
    .eq('status', 'live')
    .order('event_time', { ascending: true })
  if (liveResult.error) throw liveResult.error

  const { data, error } = await supabase
    .from('calendar_events')
    .select('id, rep_id, event_time, title, status')
    .in('rep_id', repIds)
    .eq('status', 'scheduled')
    .gte('event_time', now)
    .order('event_time', { ascending: true })
  if (error) throw error

  return mapFinderShowRowsToNextShows([
    ...((liveResult.data ?? []) as FinderShowRow[]),
    ...((data ?? []) as FinderShowRow[]),
  ])
}

async function loadFinderLiveShowRows(
  supabase: SupabaseClient,
  eligibleRepIds: string[],
  limit: number,
) {
  const now = new Date().toISOString()
  const liveResult = await supabase
    .from('calendar_events')
    .select(FINDER_LIVE_SHOW_SELECT)
    .in('rep_id', eligibleRepIds)
    .eq('status', 'live')
    .order('event_time', { ascending: true })
    .limit(limit)
  if (liveResult.error) throw liveResult.error

  const scheduledResult = await supabase
    .from('calendar_events')
    .select(FINDER_LIVE_SHOW_SELECT)
    .in('rep_id', eligibleRepIds)
    .eq('status', 'scheduled')
    .gte('event_time', now)
    .order('event_time', { ascending: true })
    .limit(limit)
  if (scheduledResult.error) throw scheduledResult.error

  return [
    ...((liveResult.data ?? []) as unknown as FinderLiveShowRow[]),
    ...((scheduledResult.data ?? []) as unknown as FinderLiveShowRow[]),
  ]
}

async function loadRepIdsWithFinderShows(
  supabase: SupabaseClient,
  eligibleRepIds: string[],
) {
  const shows = await loadNextShowsByRepId(supabase, eligibleRepIds)
  return new Set(shows.keys())
}

function mapFinderShowRow(row: FinderShowRow): SparkleFinderPublicShow {
  return {
    showId: row.id,
    repId: row.rep_id,
    startsAt: row.event_time,
    title: row.title,
    status: row.status === 'live' ? 'live' : 'scheduled',
  }
}

export function mapFinderShowRowsToNextShows(
  rows: FinderLeadShowRow[],
  nowIso = new Date().toISOString(),
) {
  const shows = new Map<string, SparkleFinderPublicShow>()
  const sortedRows = rows
    .filter((row) => isFinderLeadShowRow(row, nowIso))
    .sort((left, right) => {
      if (left.status === 'live' && right.status !== 'live') return -1
      if (right.status === 'live' && left.status !== 'live') return 1
      return left.event_time.localeCompare(right.event_time)
    })

  for (const row of sortedRows) {
    if (shows.has(row.rep_id)) continue
    shows.set(row.rep_id, mapFinderShowRow(row))
  }

  return shows
}

function isFinderLeadShowRow(row: FinderShowRow, nowIso: string) {
  if (row.status === 'live') return true
  return row.status === 'scheduled' && row.event_time >= nowIso
}

export function mapSparkleFinderLiveShowRows(
  rows: FinderLiveShowRow[],
  nowIso = new Date().toISOString(),
): SparkleFinderLiveShow[] {
  return rows
    .filter((row) => isFinderLeadShowRow(row, nowIso))
    .filter((row) => {
      const rep = readSingle(row.rep)
      return Boolean(rep?.id && isFinderPublicRepStatus(rep.status))
    })
    .sort((left, right) => {
      if (left.status === 'live' && right.status !== 'live') return -1
      if (right.status === 'live' && left.status !== 'live') return 1
      return left.event_time.localeCompare(right.event_time)
    })
    .map((row) => {
      const rep = readSingle(row.rep)
      if (!rep?.id) {
        throw new Error('Finder live show is missing a public rep relation.')
      }

      return {
        showId: row.id,
        showName: getFinderShowName(rep),
        repFirstName: getFinderRepFirstName(rep.display_name),
        startsAt: row.event_time,
        status: row.status === 'live' ? 'live' : 'scheduled',
        customerSiteUrl: buildFinderCustomerSiteUrl(rep),
      }
    })
}

export function filterListingsWithNextShows<T extends { rep_id: string }>(
  rows: T[],
  nextShows: Map<string, SparkleFinderPublicShow>,
) {
  return rows.filter((row) => nextShows.has(row.rep_id))
}

export function mapSparkleFinderAvailabilityListingRow(
  row: FinderListingRow,
  nextShow: SparkleFinderPublicShow,
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
      showName: getFinderShowName(rep),
      repFirstName: getFinderRepFirstName(rep.display_name),
      customerSiteUrl: buildFinderCustomerSiteUrl(rep),
    },
    nextShow,
  }
}

function getFinderShowName(rep: FinderRepSingle) {
  return (
    rep.business_name?.trim() ||
    rep.display_name?.trim() ||
    'Sparkle Suite Rep'
  )
}

function getFinderRepFirstName(displayName: string | null) {
  const first = displayName?.trim().split(/\s+/)[0]?.trim()
  return first || 'Sparkle Suite Rep'
}

function buildFinderCustomerSiteUrl(rep: FinderRepSingle) {
  const slug =
    rep.public_site_slug?.trim() ||
    generatePublicSiteSlug(getFinderShowName(rep)) ||
    'sparkleshow'
  return buildPublicSiteUrl(slug)
}

function isFinderPublicRepStatus(status: string | null) {
  return status !== 'suspended' && status !== 'churned'
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
