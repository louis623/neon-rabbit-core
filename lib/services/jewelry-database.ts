// Jewelry Database service — search, resolve, create, update canonical photo.
//
// Client requirements:
//   searchJewelryDatabase — service client. The activeListingsCount aggregate
//                           crosses reps; only service can COUNT trade_listings
//                           for other reps. Validates `repId` for the
//                           isOnMyBoard flag — never returns rep PII.
//   resolveItemNumber     — accepts either client. Auth is sufficient
//                           (designs_read_all). Service is fine for callers
//                           in addListing/addListingBatch that already hold
//                           a service client.
//   createDesign          — service client. INSERT on jewelry_designs is
//                           admin-only; collection lookup is by `name` only
//                           (collections has no type_prefix column).
//   updateCanonicalPhoto  — service client. Admin-only UPDATE.

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  type JewelryType,
  type SearchJewelryInput,
  type JewelryDatabaseResult,
  type ResolveItemNumberResult,
  type CreateDesignInput,
  type CreateDesignResult,
  type UpdateDesignCollectionInput,
  type UpdateDesignCollectionResult,
  type PhotoPipelineStatePatch,
  type UpdateCanonicalPhotoResult,
  type UpdatePhotoPipelineStateResult,
} from './types'
import { errors } from './errors'
import { writeJewelryCatalogChange } from './jewelry-catalog-audit'
import {
  deriveJewelryCatalogTags,
  normalizeJewelryCatalogTags,
} from './jewelry-catalog-tags'

const VALID_TYPE_PREFIXES = new Set<JewelryType>(['RG', 'NK', 'ER', 'ST', 'BR'])

function hasPipelineSourceState(photoPipeline: PhotoPipelineStatePatch | undefined) {
  return !!(
    photoPipeline?.originalPath &&
    photoPipeline?.originalUrl &&
    photoPipeline?.status
  )
}

function isApprovedCanonicalPhotoUrl(designId: string, photoUrl: string): boolean {
  try {
    const url = new URL(photoUrl)
    return url.pathname.includes(`/approved/${designId}/`)
  } catch {
    return false
  }
}

export function normalizeItemNumber(itemNumber: string): string {
  return itemNumber.trim().toUpperCase()
}

function escapeIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, (match) => `\\${match}`)
}

function hasJewelryBrowseFilters(input: SearchJewelryInput): boolean {
  return Boolean(
    input.jewelryType ||
      input.collection?.trim() ||
      input.material?.trim() ||
      input.mainStone?.trim() ||
      input.label ||
      typeof input.collectionYear === 'number',
  )
}

function deriveCatalogLabel(row: {
  search_tags: string[] | null
}): 'diamond' | 'unicorn' | 'standard' {
  const explicitTags = Array.isArray(row.search_tags)
    ? row.search_tags.map((tag) => tag.trim().toLowerCase())
    : []
  if (explicitTags.includes('unicorn')) return 'unicorn'
  if (explicitTags.includes('diamond')) return 'diamond'
  return 'standard'
}

async function loadJewelryCollectionFilterIds(
  supabase: SupabaseClient,
  input: SearchJewelryInput,
  limit: number,
): Promise<string[] | null> {
  const collection = input.collection?.trim()
  const hasCollectionFilter = Boolean(collection)
  const hasYearFilter = typeof input.collectionYear === 'number'
  if (!hasCollectionFilter && !hasYearFilter) return null

  let request = supabase.from('collections').select('id')
  if (collection) {
    request = request.ilike('name', `%${escapeIlikePattern(collection)}%`)
  }
  if (typeof input.collectionYear === 'number') {
    request = request.eq('collection_year', input.collectionYear)
  }

  const { data, error } = await request.limit(limit)
  if (error) throw error
  return ((data ?? []) as Array<{ id: string }>).map((row) => row.id)
}

function applyJewelryBrowseFilters(
  request: any,
  input: SearchJewelryInput,
  collectionIds: string[] | null,
) {
  if (input.jewelryType) {
    request = request.eq('type_prefix', input.jewelryType)
  }
  if (input.material?.trim()) {
    request = request.ilike('material', `%${escapeIlikePattern(input.material)}%`)
  }
  if (input.mainStone?.trim()) {
    request = request.ilike('main_stone', `%${escapeIlikePattern(input.mainStone)}%`)
  }
  if (collectionIds) {
    request = request.in('collection_id', collectionIds)
  }
  return request
}

function normalizeCollectionYear(collectionYear?: number | null): number | null {
  if (collectionYear === undefined || collectionYear === null) return null
  if (!Number.isInteger(collectionYear) || collectionYear < 2020 || collectionYear > 2040) {
    throw errors.INVALID_INPUT(
      'collectionYear must be between 2020 and 2040',
      'Use a four-digit collection year between 2020 and 2040.',
    )
  }
  return collectionYear
}

async function findOrCreateCollection(
  supabase: SupabaseClient,
  rawCollectionName: string,
  collectionYear?: number | null,
): Promise<{ id: string; name: string; collectionYear: number | null }> {
  const name = rawCollectionName.trim()
  if (!name) {
    throw errors.INVALID_INPUT(
      'collectionName required',
      'I need the exact collection name before I can list that piece.',
    )
  }
  const normalizedYear = normalizeCollectionYear(collectionYear)

  const { data: existing, error: lookupErr } = await supabase
    .from('collections')
    .select('id, name, collection_year')
    .eq('name', name)
    .maybeSingle()
  if (lookupErr) throw lookupErr
  if (existing) {
    if (normalizedYear !== null && existing.collection_year === null) {
      const { data: updated, error: updateErr } = await supabase
        .from('collections')
        .update({ collection_year: normalizedYear })
        .eq('id', existing.id)
        .is('collection_year', null)
        .select('id, name, collection_year')
        .single()
      if (updateErr) throw updateErr

      return {
        id: updated.id as string,
        name: updated.name as string,
        collectionYear: (updated.collection_year as number | null) ?? null,
      }
    }

    return {
      id: existing.id as string,
      name: existing.name as string,
      collectionYear: (existing.collection_year as number | null) ?? null,
    }
  }

  const { data: created, error: insErr } = await supabase
    .from('collections')
    .insert({ name, collection_year: normalizedYear })
    .select('id, name, collection_year')
    .single()
  if (insErr) throw insErr

  return {
    id: created.id as string,
    name: created.name as string,
    collectionYear: (created.collection_year as number | null) ?? null,
  }
}

function buildPhotoPipelineUpdate(
  photoPipeline: PhotoPipelineStatePatch | undefined,
): Record<string, unknown> {
  if (!photoPipeline) return {}

  const update: Record<string, unknown> = {}

  if (photoPipeline.originalPath !== undefined) {
    update.photo_pipeline_original_path = photoPipeline.originalPath
  }
  if (photoPipeline.originalUrl !== undefined) {
    update.photo_pipeline_original_url = photoPipeline.originalUrl
  }
  if (photoPipeline.enhancedUrl !== undefined) {
    update.photo_pipeline_enhanced_url = photoPipeline.enhancedUrl
  }
  if (photoPipeline.provider !== undefined) {
    update.photo_pipeline_provider = photoPipeline.provider
  }
  if (photoPipeline.status !== undefined) {
    update.photo_pipeline_status = photoPipeline.status
  }
  if (photoPipeline.preflightScore !== undefined) {
    update.photo_pipeline_preflight_score = photoPipeline.preflightScore
  }
  if (photoPipeline.preflightIssues !== undefined) {
    update.photo_pipeline_preflight_issues = photoPipeline.preflightIssues ?? []
  }
  if (photoPipeline.qaDecision !== undefined) {
    update.photo_pipeline_qa_decision = photoPipeline.qaDecision
  }
  if (photoPipeline.qaConfidence !== undefined) {
    update.photo_pipeline_qa_confidence = photoPipeline.qaConfidence
  }
  if (photoPipeline.processedAt !== undefined) {
    update.photo_pipeline_processed_at = photoPipeline.processedAt
  }

  return update
}

export async function resolveItemNumber(
  supabase: SupabaseClient,
  itemNumber: string
): Promise<ResolveItemNumberResult> {
  const normalizedItemNumber = normalizeItemNumber(itemNumber)
  if (!normalizedItemNumber) throw errors.MISSING_ITEM_INPUT()

  const { data, error } = await supabase
    .from('jewelry_designs')
    .select(
      'id, item_number, design_name, material, main_stone, bp_msrp, canonical_photo_url, type_prefix, collection_id, search_tags, collection:collections(name, collection_year)'
    )
    .eq('item_number', normalizedItemNumber)
    .maybeSingle()
  if (error) throw error
  if (!data) return { found: false, itemNumber: normalizedItemNumber }

  const collectionRel = (
    data as {
      collection:
        | { name: string; collection_year: number | null }
        | { name: string; collection_year: number | null }[]
        | null
    }
  ).collection
  const collection = Array.isArray(collectionRel) ? collectionRel[0] : collectionRel

  return {
    found: true,
    design: {
      id: data.id as string,
      itemNumber: data.item_number as string,
      designName: data.design_name as string,
      material: (data.material as string | null) ?? null,
      mainStone: (data.main_stone as string | null) ?? null,
      bpMsrp: (data.bp_msrp as number | null) ?? null,
      canonicalPhotoUrl: (data.canonical_photo_url as string | null) ?? null,
      typePrefix: data.type_prefix as JewelryType,
      collectionId: (data.collection_id as string | null) ?? null,
      collectionName: collection?.name ?? null,
      collectionYear: collection?.collection_year ?? null,
      searchTags: Array.isArray(data.search_tags) ? (data.search_tags as string[]) : [],
    },
    hasCollection: !!data.collection_id,
  }
}

export async function searchJewelryDatabase(
  supabase: SupabaseClient,
  repId: string,
  input: SearchJewelryInput
): Promise<JewelryDatabaseResult[]> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')

  const limit = input.limit ?? 20
  const q = input.query.trim()
  const hasQuery = Boolean(q)
  const collectionIds = await loadJewelryCollectionFilterIds(supabase, input, limit)
  if (collectionIds && collectionIds.length === 0) return []

  // Try GIN full-text first via the .textSearch helper; expression must mirror
  // the indexed expression in supabase/migrations/006_*.sql:
  //   to_tsvector('english',
  //     coalesce(design_name,'') || ' ' || coalesce(material,'') || ' ' || coalesce(main_stone,''))
  // supabase-js .textSearch on a single column won't hit a multi-column GIN
  // expression index, so we fall back to ILIKE if FTS yields nothing.
  type DesignRow = {
    id: string
    item_number: string
    design_name: string
    material: string | null
    main_stone: string | null
    bp_msrp: number | null
    canonical_photo_url: string | null
    type_prefix: JewelryType
    search_tags: string[] | null
    collection:
      | { name: string; collection_year: number | null }
      | { name: string; collection_year: number | null }[]
      | null
  }
  let designs: DesignRow[] = []

  if (!hasQuery) {
    let request = supabase.from('jewelry_designs').select(
      'id, item_number, design_name, material, main_stone, bp_msrp, canonical_photo_url, type_prefix, search_tags, collection:collections(name, collection_year)',
    )
    request = applyJewelryBrowseFilters(request, input, collectionIds)
    const { data, error } = await request.order('created_at', { ascending: false }).limit(limit)
    if (error) throw error
    designs = (data ?? []) as unknown as DesignRow[]
  } else {
    try {
      let request = supabase
        .from('jewelry_designs')
        .select(
          'id, item_number, design_name, material, main_stone, bp_msrp, canonical_photo_url, type_prefix, search_tags, collection:collections(name, collection_year)'
        )
        .textSearch('design_name', q, { type: 'plain', config: 'english' })
      request = applyJewelryBrowseFilters(request, input, collectionIds)
      const { data, error } = await request.limit(limit)
      if (!error && data && data.length > 0) {
        designs = data as unknown as DesignRow[]
      }
    } catch {
      /* fall through to ILIKE */
    }
  }

  if (hasQuery && designs.length === 0) {
    const pattern = `%${escapeIlikePattern(q)}%`
    let request = supabase
      .from('jewelry_designs')
      .select(
        'id, item_number, design_name, material, main_stone, bp_msrp, canonical_photo_url, type_prefix, search_tags, collection:collections(name, collection_year)'
      )
      .or(
        `design_name.ilike.${pattern},material.ilike.${pattern},main_stone.ilike.${pattern},item_number.ilike.${pattern}`
      )
    request = applyJewelryBrowseFilters(request, input, collectionIds)
    const { data, error } = await request.limit(limit)
    if (error) throw error
    designs = (data ?? []) as unknown as DesignRow[]
  }

  if (hasQuery && designs.length === 0) {
    const normalizedTagQuery = normalizeJewelryCatalogTags([q])
    if (normalizedTagQuery.length > 0) {
      let request = supabase
        .from('jewelry_designs')
        .select(
          'id, item_number, design_name, material, main_stone, bp_msrp, canonical_photo_url, type_prefix, search_tags, collection:collections(name, collection_year)'
        )
        .overlaps('search_tags', normalizedTagQuery)
      request = applyJewelryBrowseFilters(request, input, collectionIds)
      const { data, error } = await request.limit(limit)
      if (error) throw error
      designs = (data ?? []) as unknown as DesignRow[]
    }
  }

  if (hasQuery && designs.length === 0 && /^20[2-4]\d$/.test(q) && !hasJewelryBrowseFilters(input)) {
    const { data: collections, error: collectionErr } = await supabase
      .from('collections')
      .select('id')
      .eq('collection_year', Number(q))
      .limit(limit)
    if (collectionErr) throw collectionErr

    const collectionIds = ((collections ?? []) as Array<{ id: string }>).map(
      (collection) => collection.id,
    )
    if (collectionIds.length > 0) {
      const { data, error } = await supabase
        .from('jewelry_designs')
        .select(
          'id, item_number, design_name, material, main_stone, bp_msrp, canonical_photo_url, type_prefix, search_tags, collection:collections(name, collection_year)'
        )
        .in('collection_id', collectionIds)
        .limit(limit)
      if (error) throw error
      designs = (data ?? []) as unknown as DesignRow[]
    }
  }

  if (input.label) {
    designs = designs.filter((design) => deriveCatalogLabel(design) === input.label)
  }

  if (designs.length === 0) return []

  const designIds = designs.map((d) => d.id)

  // isOnMyBoard: which of these does the requesting rep currently have available?
  const { data: myListings } = await supabase
    .from('trade_listings')
    .select('design_id')
    .eq('rep_id', repId)
    .eq('status', 'available')
    .in('design_id', designIds)
  const onMyBoard = new Set<string>(
    ((myListings ?? []) as Array<{ design_id: string }>).map((l) => l.design_id)
  )

  // activeListingsCount: aggregate count across ALL reps for these designs.
  // Group via separate filter calls (one round-trip per design would be
  // wasteful); use a single query and group in memory.
  const { data: allActive } = await supabase
    .from('trade_listings')
    .select('design_id')
    .eq('status', 'available')
    .in('design_id', designIds)
  const activeCounts = new Map<string, number>()
  for (const row of (allActive ?? []) as Array<{ design_id: string }>) {
    activeCounts.set(row.design_id, (activeCounts.get(row.design_id) ?? 0) + 1)
  }

  return designs.map((d) => {
    const collectionRel = d.collection
    const collection = Array.isArray(collectionRel) ? collectionRel[0] : collectionRel
    return {
      designId: d.id,
      itemNumber: d.item_number,
      designName: d.design_name,
      material: d.material,
      mainStone: d.main_stone,
      bpMsrp: d.bp_msrp,
      canonicalPhotoUrl: d.canonical_photo_url,
      typePrefix: d.type_prefix,
      collectionName: collection?.name ?? null,
      collectionYear: collection?.collection_year ?? null,
      searchTags: Array.isArray(d.search_tags) ? d.search_tags : [],
      isOnMyBoard: onMyBoard.has(d.id),
      activeListingsCount: activeCounts.get(d.id) ?? 0,
    }
  })
}

export async function createDesign(
  supabase: SupabaseClient,
  input: CreateDesignInput
): Promise<CreateDesignResult> {
  const normalizedItemNumber = normalizeItemNumber(input.itemNumber)
  if (!normalizedItemNumber) throw errors.MISSING_ITEM_INPUT()
  if (!input.designName?.trim()) {
    throw errors.INVALID_INPUT('designName required', "I need a design name to create that piece.")
  }
  if (!input.piecePhotoUrl?.trim()) {
    throw errors.MISSING_PIECE_PHOTO()
  }
  if (!hasPipelineSourceState(input.photoPipeline)) {
    throw errors.INVALID_INPUT(
      'new design photos must include staged photo pipeline metadata',
      'I need to run that piece photo through the image pipeline before I can create the design.',
    )
  }

  const typePrefix = normalizedItemNumber.slice(0, 2) as JewelryType
  if (!VALID_TYPE_PREFIXES.has(typePrefix)) {
    throw errors.INVALID_INPUT(
      `unknown type prefix "${typePrefix}"`,
      `Item numbers should start with RG, NK, ER, ST, or BR — got "${typePrefix}".`,
    )
  }

  // Collection lookup is by `name` only (collections has no type_prefix column).
  let collectionId: string | null = null
  let collectionName: string | null = null
  let collectionYear: number | null = null
  if (input.collectionName?.trim()) {
    const collection = await findOrCreateCollection(
      supabase,
      input.collectionName,
      input.collectionYear,
    )
    collectionId = collection.id
    collectionName = collection.name
    collectionYear = collection.collectionYear
  }

  const searchTags = deriveJewelryCatalogTags({
    typePrefix,
    designName: input.designName,
    material: input.material,
    mainStone: input.mainStone,
    collectionName,
    explicitTags: input.searchTags,
  })

  const { data: design, error: designErr } = await supabase
    .from('jewelry_designs')
    .insert({
      item_number: normalizedItemNumber,
      design_name: input.designName,
      type_prefix: typePrefix,
      collection_id: collectionId,
      search_tags: searchTags,
      material: input.material ?? null,
      main_stone: input.mainStone ?? null,
      bp_msrp: input.bpMsrp ?? null,
      canonical_photo_url: input.piecePhotoUrl,
      special_features: input.specialFeatures ?? null,
      length_info: input.lengthInfo ?? null,
      created_by_rep_id: input.createdByRepId ?? null,
      ...buildPhotoPipelineUpdate(input.photoPipeline),
    })
    .select('id, item_number, type_prefix')
    .single()
  if (designErr) throw designErr

  await writeJewelryCatalogChange(supabase, {
    designId: design.id as string,
    repId: input.createdByRepId ?? null,
    conversationId: input.conversationId ?? null,
    changeType: 'create_design',
    beforeState: {},
    afterState: {
      itemNumber: normalizedItemNumber,
      designName: input.designName,
      typePrefix,
      collectionId,
      collectionName,
      collectionYear,
      searchTags,
      material: input.material ?? null,
      mainStone: input.mainStone ?? null,
      bpMsrp: input.bpMsrp ?? null,
      canonicalPhotoUrl: input.piecePhotoUrl,
      specialFeatures: input.specialFeatures ?? null,
      lengthInfo: input.lengthInfo ?? null,
    },
  })

  return {
    designId: design.id as string,
    itemNumber: design.item_number as string,
    collectionId,
    collectionName,
    collectionYear,
    searchTags,
    typePrefix: design.type_prefix as JewelryType,
  }
}

export async function updateDesignCollection(
  supabase: SupabaseClient,
  input: UpdateDesignCollectionInput,
): Promise<UpdateDesignCollectionResult> {
  if (!input.designId) throw errors.MISSING_ITEM_INPUT()

  const collection = await findOrCreateCollection(supabase, input.collectionName)

  const { data, error } = await supabase
    .from('jewelry_designs')
    .update({
      collection_id: collection.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.designId)
    .is('collection_id', null)
    .select('id, collection_id')
    .maybeSingle()
  if (error) throw error
  if (!data) {
    throw errors.INVALID_INPUT(
      'design already has a collection or does not exist',
      "That piece already has a collection assigned, so I won't overwrite it.",
    )
  }

  return {
    designId: data.id as string,
    collectionId: collection.id,
    collectionName: collection.name,
  }
}

export async function updateCanonicalPhoto(
  supabase: SupabaseClient,
  designId: string,
  photoUrl: string
): Promise<UpdateCanonicalPhotoResult> {
  if (!designId) throw errors.MISSING_ITEM_INPUT()
  if (!photoUrl?.trim()) throw errors.MISSING_PIECE_PHOTO()
  if (!isApprovedCanonicalPhotoUrl(designId, photoUrl)) {
    throw errors.INVALID_INPUT(
      'canonical photo updates must point at an approved pipeline asset',
      'I can only promote an approved photo-pipeline image as the canonical design photo.',
    )
  }

  const { data, error } = await supabase
    .from('jewelry_designs')
    .update({ canonical_photo_url: photoUrl, updated_at: new Date().toISOString() })
    .eq('id', designId)
    .select('id, canonical_photo_url')
    .single()
  if (error) throw error
  if (!data) throw errors.LISTING_NOT_FOUND(`design ${designId}`)

  return {
    designId: data.id as string,
    canonicalPhotoUrl: data.canonical_photo_url as string,
  }
}

export async function updatePhotoPipelineState(
  supabase: SupabaseClient,
  designId: string,
  patch: PhotoPipelineStatePatch,
): Promise<UpdatePhotoPipelineStateResult> {
  if (!designId) throw errors.MISSING_ITEM_INPUT()

  const { data, error } = await supabase
    .from('jewelry_designs')
    .update({
      ...buildPhotoPipelineUpdate(patch),
      updated_at: new Date().toISOString(),
    })
    .eq('id', designId)
    .select('id, photo_pipeline_status, photo_pipeline_enhanced_url')
    .single()
  if (error) throw error
  if (!data) throw errors.LISTING_NOT_FOUND(`design ${designId}`)

  return {
    designId: data.id as string,
    photoPipelineStatus:
      data.photo_pipeline_status as UpdatePhotoPipelineStateResult['photoPipelineStatus'],
    enhancedPhotoUrl: (data.photo_pipeline_enhanced_url as string | null) ?? null,
  }
}
