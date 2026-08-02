import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { PAID_WORKSPACE_STATUSES } from '@/lib/nic-nac/subscription-access'
import { buildPublicSiteUrl, validatePublicSiteSlug } from '@/lib/public-site/show-link'
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
  design_id: string | null
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

export type FinderCatalogLabel = 'diamond' | 'unicorn' | 'standard'

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

export interface SparkleFinderCatalogFacetOption {
  value: string
  count: number
}

export interface SparkleFinderCatalogFacets {
  collections: SparkleFinderCatalogFacetOption[]
  materials: SparkleFinderCatalogFacetOption[]
  stones: SparkleFinderCatalogFacetOption[]
  types: SparkleFinderCatalogFacetOption[]
  labels: SparkleFinderCatalogFacetOption[]
  years: SparkleFinderCatalogFacetOption[]
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
  jewelryType?: FinderJewelryType
  collection?: string
  material?: string
  mainStone?: string
  label?: FinderCatalogLabel
  collectionYear?: number
  limit?: number
  supabase?: SupabaseClient
}

export type SparkleFinderCatalogFacetOptions = Omit<
  SparkleFinderCatalogListOptions,
  'limit'
>

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
export const MAX_FINDER_CATALOG_FACET_SOURCE_LIMIT = 500
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

const TYPE_PREFIX_MAP: Record<FinderJewelryType, JewelryType> = {
  ring: 'RG',
  necklace: 'NK',
  earrings: 'ER',
  stack: 'ST',
  bracelet: 'BR',
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
  const designs = filterCatalogRowsByLabel(
    await loadCatalogDesignRows(supabase, options, limit),
    options.label,
  )
  const counts = await countEligibleAvailableListings(supabase, designs.map((design) => design.id))

  return designs.map((design) =>
    mapSparkleFinderDesignRow(design, counts.get(design.id) ?? 0),
  )
}

export async function listSparkleFinderCatalogFacets(
  options: SparkleFinderCatalogFacetOptions = {},
): Promise<SparkleFinderCatalogFacets> {
  if (!isFinderSupabaseConfigured(options.supabase)) return emptySparkleFinderCatalogFacets()

  const supabase = options.supabase ?? createAdminClient()
  const rows = filterCatalogRowsByLabel(
    await loadCatalogDesignRows(supabase, options, MAX_FINDER_CATALOG_FACET_SOURCE_LIMIT),
    options.label,
  )

  return deriveSparkleFinderCatalogFacets(rows)
}

export function deriveSparkleFinderCatalogFacets(
  rows: FinderDesignRow[],
): SparkleFinderCatalogFacets {
  const collectionCounts = new Map<string, number>()
  const materialCounts = new Map<string, number>()
  const stoneCounts = new Map<string, number>()
  const typeCounts = new Map<string, number>()
  const labelCounts = new Map<string, number>()
  const yearCounts = new Map<string, number>()

  for (const row of rows) {
    const collection = readSingle(row.collection)
    incrementFacet(collectionCounts, collection?.name)
    incrementFacet(materialCounts, row.material)
    incrementFacet(stoneCounts, row.main_stone)
    incrementFacet(typeCounts, TYPE_MAP[row.type_prefix])
    incrementFacet(labelCounts, deriveSparkleFinderCatalogLabel(row))
    if (collection?.collection_year) {
      incrementFacet(yearCounts, String(collection.collection_year))
    }
  }

  return {
    collections: mapFacetCounts(collectionCounts),
    materials: mapFacetCounts(materialCounts),
    stones: mapFacetCounts(stoneCounts),
    types: mapFacetCounts(typeCounts),
    labels: mapFacetCounts(labelCounts),
    years: mapFacetCounts(yearCounts),
  }
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
  options: SparkleFinderCatalogListOptions,
  limit: number,
) {
  const queryText = options.query?.trim()
  const collectionIds = await loadCatalogFilterCollectionIds(supabase, options, limit)
  if (collectionIds && collectionIds.length === 0) return []

  if (!queryText) {
    let request = supabase
      .from('jewelry_designs')
      .select(FINDER_CATALOG_SELECT)
    request = applyCatalogBrowseFilters(request, options, collectionIds)
    const { data, error } = await request.order('created_at', { ascending: false }).limit(limit)
    if (error) throw error
    return ((data ?? []) as unknown as FinderDesignRow[])
  }

  const pattern = `%${escapeIlikePattern(queryText)}%`
  let request = supabase
    .from('jewelry_designs')
    .select(FINDER_CATALOG_SELECT)
    .or(
      `item_number.ilike.${pattern},design_name.ilike.${pattern},material.ilike.${pattern},main_stone.ilike.${pattern}`,
    )
  request = applyCatalogBrowseFilters(request, options, collectionIds)
  const { data, error } = await request.order('created_at', { ascending: false }).limit(limit)
  if (error) throw error
  const rows = ((data ?? []) as unknown as FinderDesignRow[])
  if (rows.length > 0) return rows

  return loadCatalogFallbackRows(supabase, queryText, limit, options, collectionIds)
}

async function loadCatalogFallbackRows(
  supabase: SupabaseClient,
  queryText: string,
  limit: number,
  options: SparkleFinderCatalogListOptions,
  explicitCollectionIds: string[] | null,
) {
  const tag = queryText.trim().toLowerCase()
  if (tag.length >= 2 && tag.length <= 32) {
    let request = supabase
      .from('jewelry_designs')
      .select(FINDER_CATALOG_SELECT)
      .overlaps('search_tags', [tag])
    request = applyCatalogBrowseFilters(request, options, explicitCollectionIds)
    const { data, error } = await request.order('created_at', { ascending: false }).limit(limit)
    if (error) throw error
    const rows = ((data ?? []) as unknown as FinderDesignRow[])
    if (rows.length > 0) return rows
  }

  const collectionIds = await loadFallbackCollectionIds(supabase, queryText, limit)
  if (collectionIds.length > 0) {
    const narrowedCollectionIds = explicitCollectionIds
      ? collectionIds.filter((collectionId) => explicitCollectionIds.includes(collectionId))
      : collectionIds

    if (narrowedCollectionIds.length === 0) return []

    let request = supabase
      .from('jewelry_designs')
      .select(FINDER_CATALOG_SELECT)
      .in('collection_id', narrowedCollectionIds)
    request = applyCatalogBrowseFilters(request, options, null)
    const { data, error } = await request.order('created_at', { ascending: false }).limit(limit)
    if (error) throw error
    return ((data ?? []) as unknown as FinderDesignRow[])
  }

  return []
}

function applyCatalogBrowseFilters<TRequest extends FinderCatalogBrowseFilterRequest<TRequest>>(
  request: TRequest,
  options: SparkleFinderCatalogListOptions,
  collectionIds: string[] | null,
): TRequest {
  if (options.jewelryType) {
    request = request.eq('type_prefix', TYPE_PREFIX_MAP[options.jewelryType])
  }
  if (options.material?.trim()) {
    request = request.ilike('material', `%${escapeIlikePattern(options.material)}%`)
  }
  if (options.mainStone?.trim()) {
    request = request.ilike('main_stone', `%${escapeIlikePattern(options.mainStone)}%`)
  }
  if (collectionIds) {
    request = request.in('collection_id', collectionIds)
  }
  return request
}

async function loadCatalogFilterCollectionIds(
  supabase: SupabaseClient,
  options: SparkleFinderCatalogListOptions,
  limit: number,
) {
  const collection = options.collection?.trim()
  const hasCollectionFilter = Boolean(collection)
  const hasYearFilter = typeof options.collectionYear === 'number'
  if (!hasCollectionFilter && !hasYearFilter) return null

  let request = supabase.from('collections').select('id')
  if (collection) {
    request = request.ilike('name', `%${escapeIlikePattern(collection)}%`)
  }
  if (typeof options.collectionYear === 'number') {
    request = request.eq('collection_year', options.collectionYear)
  }

  const { data, error } = await request.limit(limit)
  if (error) throw error
  return ((data ?? []) as Array<{ id: string }>).map((row) => row.id)
}

async function loadFallbackCollectionIds(
  supabase: SupabaseClient,
  queryText: string,
  limit: number,
) {
  const pattern = `%${escapeIlikePattern(queryText)}%`
  let request = supabase.from('collections').select('id').ilike('name', pattern)
  if (/^20[2-4]\d$/.test(queryText)) {
    request = supabase.from('collections').select('id').eq('collection_year', Number(queryText))
  }

  const { data, error } = await request.limit(limit)
  if (error) throw error
  return ((data ?? []) as Array<{ id: string }>).map((collection) => collection.id)
}

function filterCatalogRowsByLabel(
  rows: FinderDesignRow[],
  label: FinderCatalogLabel | undefined,
) {
  if (!label) return rows

  return rows.filter((row) => {
    return deriveSparkleFinderCatalogLabel(row) === label
  })
}

function escapeIlikePattern(value: string) {
  return value.trim().replace(/[%_]/g, (match) => `\\${match}`)
}

type FinderCatalogBrowseFilterRequest<TRequest> = {
  eq(column: string, value: string): TRequest
  ilike(column: string, pattern: string): TRequest
  in(column: string, values: string[]): TRequest
}

function deriveSparkleFinderCatalogLabel(row: FinderDesignRow): FinderCatalogLabel {
  const explicitTags = Array.isArray(row.search_tags)
    ? row.search_tags.map((tag) => tag.trim().toLowerCase())
    : []
  if (explicitTags.includes('unicorn')) return 'unicorn'
  if (explicitTags.includes('diamond')) return 'diamond'
  return 'standard'
}

function incrementFacet(counts: Map<string, number>, value: string | null | undefined) {
  const normalized = value?.trim()
  if (!normalized) return
  counts.set(normalized, (counts.get(normalized) ?? 0) + 1)
}

function mapFacetCounts(counts: Map<string, number>): SparkleFinderCatalogFacetOption[] {
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => left.value.localeCompare(right.value))
}

function emptySparkleFinderCatalogFacets(): SparkleFinderCatalogFacets {
  return {
    collections: [],
    materials: [],
    stones: [],
    types: [],
    labels: [],
    years: [],
  }
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
    .select(
      'design_id, rep_id, rep:reps(id, display_name, business_name, profile_photo_url, custom_domain, public_site_slug, status)',
    )
    .eq('status', 'available')
    .eq('listing_source', 'catalog')
    .in('design_id', designIds)
    .in('rep_id', Array.from(qualifiedRepIds))
  if (error) throw error

  return countListingsByDesignForQualifiedReps(
    (data ?? []) as Array<{ design_id: string | null; rep_id: string }>,
    qualifiedRepIds,
  )
}

export function countListingsByDesignForQualifiedReps(
  rows: Array<{ design_id: string | null; rep_id: string; rep?: FinderRepRow }>,
  qualifiedRepIds: Set<string>,
) {
  const counts = new Map<string, number>()
  for (const row of rows) {
    if (!qualifiedRepIds.has(row.rep_id)) continue
    if (!row.design_id) continue
    if (row.rep !== undefined) {
      const rep = readSingle(row.rep)
      if (
        !rep ||
        !isFinderPublicRepStatus(rep.status) ||
        !hasFinderResolvablePublicSite(rep)
      ) {
        continue
      }
    }
    counts.set(row.design_id, (counts.get(row.design_id) ?? 0) + 1)
  }
  return counts
}

export async function loadPublicFinderEligibleRepIds(supabase: SupabaseClient) {
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
    const { data: trials, error: trialErr } = await supabase
      .from('workspace_trials')
      .select('rep_id')
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
    if (trialErr) throw trialErr

    for (const row of (trials ?? []) as Array<{ rep_id: string | null }>) {
      if (row.rep_id) paidRepIds.add(row.rep_id)
    }
  } catch {
    // Older/local databases may not have workspace trials yet. Paid
    // subscriptions remain sufficient for the public Finder boundary.
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
    .eq('listing_source', 'catalog')
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
    if (
      !design ||
      !rep ||
      rep.status === 'suspended' ||
      rep.status === 'churned' ||
      !hasFinderResolvablePublicSite(rep)
    ) {
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
      return Boolean(
        rep?.id &&
          isFinderPublicRepStatus(rep.status) &&
          hasFinderResolvablePublicSite(rep),
      )
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
  const slug = getFinderResolvablePublicSiteSlug(rep)
  if (!slug) {
    throw new Error('Finder public rep is missing a resolvable public site slug.')
  }
  return buildPublicSiteUrl(slug)
}

function isFinderPublicRepStatus(status: string | null) {
  return status !== 'suspended' && status !== 'churned'
}

function hasFinderResolvablePublicSite(rep: FinderRepSingle) {
  return Boolean(getFinderResolvablePublicSiteSlug(rep))
}

function getFinderResolvablePublicSiteSlug(rep: FinderRepSingle) {
  const slug = rep.public_site_slug?.trim().toLowerCase() ?? ''
  return validatePublicSiteSlug(slug).ok ? slug : null
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
