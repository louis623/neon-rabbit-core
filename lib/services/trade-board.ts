// Dance Floor service — stable facade for the existing 4 callers
// (lib/nic-nac/tools/list-my-trade-board.ts, lib/nic-nac/tools/remove-listing.ts,
// scripts/verify-trade-board.ts, scripts/red-team.ts). Public surface
// (getMyBoard, removeListing, TradeBoardError, and the legacy types) is
// preserved at this exact module path. New functions (addListing,
// addListingBatch, updateListing) live alongside.
//
// Client requirements (caller passes the right SupabaseClient):
//
//   getMyBoard      — auth client. RLS scopes by rep_id.
//   removeListing   — auth client. UPDATE on trade_listings is rep-scoped;
//                     auto-cancel on trade_requests works because
//                     supabase/migrations/020_nic_nac_conversations.sql added
//                     the `requests_rep_update` policy specifically for this.
//   addListing      — service client. Touches jewelry_designs.times_listed,
//                     for which only the admin policy permits UPDATE. The
//                     function explicitly validates `repId` so a misrouted
//                     auth client can't enable cross-rep writes.
//   addListingBatch — service client. Same reason as addListing.
//   updateListing   — auth client. Rep-scoped UPDATE on trade_listings.

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  type ListingStatus,
  type JewelryType,
  type RemovalReason,
  type TradeRequestStatus,
  type TradeListingWithDesign,
  type BoardResult,
  type RemoveListingResult,
  type RestoreListingInput,
  type RestoreListingResult,
  type PurgeRemovedListingsResult,
  type GetMyBoardFilters,
  type AddListingInput,
  type AddListingResult,
  type AddNonItemNumberListingInput,
  type AddNonItemNumberListingResult,
  type BatchListingItem,
  type AddListingBatchInput,
  type AddListingBatchResult,
  type UpdateListingInput,
  type UpdateListingResult,
} from './types'
import { TradeBoardError, errors } from './errors'
import {
  buildNonItemNumberTradeListingName,
  getTradeListingDisplayFields,
} from './trade-listing-display'
import {
  normalizeItemNumber,
  resolveItemNumber,
  updateDesignCollection,
} from './jewelry-database'

// Re-export for the existing 4 callers that import from
// '@/lib/services/trade-board'. Do not remove these without updating callers.
export { TradeBoardError } from './errors'
export type {
  ListingStatus,
  JewelryType,
  RemovalReason,
  TradeRequestStatus,
  TradeListingWithDesign,
  BoardResult,
  RemoveListingResult,
  RestoreListingInput,
  RestoreListingResult,
  PurgeRemovedListingsResult,
  GetMyBoardFilters,
  AddListingInput,
  AddListingResult,
  AddNonItemNumberListingInput,
  AddNonItemNumberListingResult,
  BatchListingItem,
  AddListingBatchInput,
  AddListingBatchResult,
  UpdateListingInput,
  UpdateListingResult,
}

const DESIGN_SELECT =
  'id, item_number, design_name, material, main_stone, bp_msrp, canonical_photo_url, type_prefix, collection:collections(id, name)'

const LISTING_SELECT = `
  id, rep_id, status, rep_notes, trade_preferences, ring_size, listing_photo_url,
  uses_canonical_photo, listing_source, manual_type_prefix, manual_collection_family,
  manual_collection_name, manual_size, manual_photo_url,
  listed_at, removal_reason, deleted_at, created_at, updated_at,
  design:jewelry_designs(${DESIGN_SELECT})
`

export type TradeListingRecoveryWindowDays = 7 | 30

export interface TradeListingRecoveryOptions {
  now?: Date
  recoveryWindowDays?: TradeListingRecoveryWindowDays
}

export const DEFAULT_TRADE_LISTING_RECOVERY_WINDOW_DAYS = 7

export function getTradeListingRecoveryWindowDays(
  env: NodeJS.ProcessEnv = process.env,
): TradeListingRecoveryWindowDays {
  const raw = env.SPARKLE_TRADE_LISTING_RECOVERY_DAYS
  if (!raw) return DEFAULT_TRADE_LISTING_RECOVERY_WINDOW_DAYS
  const parsed = Number.parseInt(raw, 10)
  if (parsed === 7 || parsed === 30) return parsed
  throw new Error(
    `SPARKLE_TRADE_LISTING_RECOVERY_DAYS must be 7 or 30; received ${raw}`,
  )
}

export function getTradeListingRecoveryCutoffIso(
  now: Date = new Date(),
  recoveryWindowDays: TradeListingRecoveryWindowDays = getTradeListingRecoveryWindowDays(),
): string {
  return new Date(
    now.getTime() - recoveryWindowDays * 24 * 60 * 60 * 1000,
  ).toISOString()
}

function resolveRecoveryOptions(
  options: TradeListingRecoveryOptions = {},
): Required<TradeListingRecoveryOptions> {
  return {
    now: options.now ?? new Date(),
    recoveryWindowDays:
      options.recoveryWindowDays ?? getTradeListingRecoveryWindowDays(),
  }
}

function isRemovedListingInsideRecoveryWindow(
  deletedAt: string | null | undefined,
  options: Required<TradeListingRecoveryOptions>,
): boolean {
  if (!deletedAt) return false
  const deletedAtMs = new Date(deletedAt).getTime()
  if (!Number.isFinite(deletedAtMs)) return false
  const cutoffMs = new Date(
    getTradeListingRecoveryCutoffIso(options.now, options.recoveryWindowDays),
  ).getTime()
  return deletedAtMs >= cutoffMs
}

function shouldIncludeListingInBoardRead(
  listing: Pick<TradeListingWithDesign, 'status' | 'deleted_at'>,
  options: Required<TradeListingRecoveryOptions>,
  statusFilter?: ListingStatus,
): boolean {
  if (statusFilter && listing.status !== statusFilter) return false
  if (listing.status !== 'removed') return true
  if (statusFilter !== 'removed') return false
  return isRemovedListingInsideRecoveryWindow(listing.deleted_at, options)
}

function compareNullableText(a: string | null | undefined, b: string | null | undefined) {
  return (a ?? '').localeCompare(b ?? '')
}

function getListingTimestamp(listing: TradeListingWithDesign, key: 'created_at' | 'listed_at') {
  const parsed = Date.parse(key === 'listed_at' ? listing.listed_at ?? '' : listing.created_at)
  return Number.isFinite(parsed) ? parsed : 0
}

function sortBoardListings(
  listings: TradeListingWithDesign[],
  sortBy: NonNullable<GetMyBoardFilters['sortBy']>,
  sortOrder: NonNullable<GetMyBoardFilters['sortOrder']>,
) {
  const direction = sortOrder === 'asc' ? 1 : -1
  return [...listings].sort((a, b) => {
    let comparison = 0
    const aDisplay = getTradeListingDisplayFields(a)
    const bDisplay = getTradeListingDisplayFields(b)

    if (sortBy === 'created_at' || sortBy === 'listed_at') {
      comparison =
        getListingTimestamp(a, sortBy) - getListingTimestamp(b, sortBy)
    } else if (sortBy === 'msrp') {
      comparison = Number(aDisplay.bpMsrp ?? 0) - Number(bDisplay.bpMsrp ?? 0)
    } else if (sortBy === 'design_name') {
      comparison = compareNullableText(aDisplay.designName, bDisplay.designName)
    } else if (sortBy === 'collection') {
      comparison = compareNullableText(
        aDisplay.collectionName,
        bDisplay.collectionName,
      )
    }

    if (comparison !== 0) return comparison * direction
    return compareNullableText(aDisplay.itemNumber, bDisplay.itemNumber)
  })
}

function pageBoardListings(
  listings: TradeListingWithDesign[],
  filters: GetMyBoardFilters,
) {
  const offset = filters.offset ?? 0
  const end = filters.limit ? offset + filters.limit : undefined
  return listings.slice(offset, end)
}

function isManagedRepListingPhotoUrl(repId: string, photoUrl: string): boolean {
  try {
    const url = new URL(photoUrl)
    return url.pathname.includes(`/jewelry-photos/${repId}/`)
  } catch {
    return false
  }
}

export async function getMyBoard(
  supabase: SupabaseClient,
  repId: string,
  filters: GetMyBoardFilters = {},
  recoveryOptions: TradeListingRecoveryOptions = {},
): Promise<BoardResult> {
  const resolvedRecoveryOptions = resolveRecoveryOptions(recoveryOptions)
  let query = supabase
    .from('trade_listings')
    .select(LISTING_SELECT)
    .eq('rep_id', repId)

  if (filters.statusFilter) {
    query = query.eq('status', filters.statusFilter)
  }

  const sortBy = filters.sortBy ?? 'listed_at'
  const sortOrder = filters.sortOrder ?? 'desc'
  query = query.order('listed_at', { ascending: false, nullsFirst: false })

  const { data, error } = await query
  if (error) throw error

  const rawListings = (data ?? []) as unknown as Array<
    Omit<TradeListingWithDesign, 'design'> & {
      design: TradeListingWithDesign['design'] | TradeListingWithDesign['design'][] | null
    }
  >

  const listings: TradeListingWithDesign[] = rawListings
    .map((row) => {
      const design = Array.isArray(row.design) ? row.design[0] : row.design
      return { ...row, design } as TradeListingWithDesign
    })
    .filter((l) =>
      shouldIncludeListingInBoardRead(
        l,
        resolvedRecoveryOptions,
        filters.statusFilter,
      ),
    )

  const filteredByCollection = filters.collectionFilter
    ? listings.filter(
        (l) =>
          getTradeListingDisplayFields(l).collectionName ===
          filters.collectionFilter,
      )
    : listings
  const filteredByType = filters.typeFilter
    ? filteredByCollection.filter(
        (l) => getTradeListingDisplayFields(l).typePrefix === filters.typeFilter,
      )
    : filteredByCollection
  const sortedListings = sortBoardListings(filteredByType, sortBy, sortOrder)
  const pagedListings = pageBoardListings(sortedListings, filters)

  const totalPieces = pagedListings.length
  const totalMsrp = pagedListings.reduce(
    (sum, l) => sum + Number(getTradeListingDisplayFields(l).bpMsrp ?? 0),
    0
  )
  const typeBreakdown: Record<JewelryType, number> = { RG: 0, NK: 0, ER: 0, ST: 0, BR: 0 }
  for (const l of pagedListings) {
    const typePrefix = getTradeListingDisplayFields(l).typePrefix
    typeBreakdown[typePrefix] = (typeBreakdown[typePrefix] ?? 0) + 1
  }

  // TODO(SS-spec-alignment): SS Service Spec wants this count across ALL of
  // the rep's listings, but current shipped behavior counts across the
  // collection-filtered set. Preserved here for Task 1.5A; reconcile in the
  // task that wires the dashboard view (likely by adding a separate
  // pendingRequestCountTotal field).
  const listingIds = pagedListings.map((l) => l.id)
  let pendingRequestCount = 0
  if (listingIds.length > 0) {
    const { count } = await supabase
      .from('trade_requests')
      .select('id', { count: 'exact', head: true })
      .in('listing_id', listingIds)
      .eq('status', 'pending')
    pendingRequestCount = count ?? 0
  }

  return {
    listings: pagedListings,
    summary: { totalPieces, totalMsrp, typeBreakdown, pendingRequestCount },
  }
}

function normalizeOptionalListingText(value: string | null | undefined) {
  if (value === undefined) return undefined
  if (value === null) return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function requireListingText(
  value: string | null | undefined,
  fieldName: string,
): string {
  const normalized = normalizeOptionalListingText(value)
  if (!normalized) {
    throw errors.INVALID_INPUT(`${fieldName} required`)
  }
  return normalized
}

export async function removeListing(
  supabase: SupabaseClient,
  repId: string,
  input: { listingId?: string; itemNumber?: string; reason: RemovalReason }
): Promise<RemoveListingResult> {
  if (!input.listingId && !input.itemNumber) {
    throw new TradeBoardError('INVALID_INPUT', 'listingId or itemNumber required')
  }

  let listingId = input.listingId
  if (!listingId && input.itemNumber) {
    const { data: designRows, error: designErr } = await supabase
      .from('jewelry_designs')
      .select('id')
      .eq('item_number', input.itemNumber)
      .limit(2)
    if (designErr) throw designErr
    if (!designRows || designRows.length === 0) {
      throw new TradeBoardError('LISTING_NOT_FOUND', `No design for item ${input.itemNumber}`)
    }
    if (designRows.length > 1) throw errors.NEEDS_MATERIAL_VARIANT(input.itemNumber)
    const designRow = designRows[0]
    // Do not pick one active duplicate physical listing by item number. The
    // caller must resolve the exact listingId before a destructive removal.
    const { data: listingRows, error: listingErr } = await supabase
      .from('trade_listings')
      .select('id, created_at')
      .eq('design_id', designRow.id)
      .eq('rep_id', repId)
      .neq('status', 'removed')
      .order('created_at', { ascending: false })
      .limit(2)
    if (listingErr) throw listingErr
    if (!listingRows || listingRows.length === 0) {
      throw new TradeBoardError('LISTING_NOT_FOUND', `No active listing for item ${input.itemNumber}`)
    }
    if (listingRows.length > 1) {
      throw errors.AMBIGUOUS_LISTING(input.itemNumber)
    }
    listingId = listingRows[0].id as string
  }

  const { data: currentRow, error: fetchErr } = await supabase
    .from('trade_listings')
    .select(
      `id, status, rep_id, listing_source, manual_type_prefix, manual_collection_family, manual_collection_name, manual_size, design:jewelry_designs(design_name)`,
    )
    .eq('id', listingId!)
    .maybeSingle()
  if (fetchErr) throw fetchErr
  if (!currentRow) {
    throw new TradeBoardError('UNAUTHORIZED', 'Listing not found or not owned by rep')
  }
  if (currentRow.rep_id !== repId) {
    throw new TradeBoardError('UNAUTHORIZED', 'Listing does not belong to rep')
  }

  const previousStatus = currentRow.status as ListingStatus
  const designRel = currentRow.design as { design_name: string } | { design_name: string }[] | null
  const designName = Array.isArray(designRel)
    ? designRel[0]?.design_name ?? ''
    : designRel?.design_name ??
      buildNonItemNumberTradeListingName({
        jewelryType: (currentRow.manual_type_prefix as JewelryType | null) ?? 'RG',
        collectionFamily:
          (currentRow.manual_collection_family as string | null) ?? 'Jewelry',
        collectionName: currentRow.manual_collection_name as string | null,
        size: currentRow.manual_size as string | null,
      })

  const nowIso = new Date().toISOString()
  const { error: updErr } = await supabase
    .from('trade_listings')
    .update({
      status: 'removed',
      removal_reason: input.reason,
      deleted_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', listingId!)
    .eq('rep_id', repId)
  if (updErr) throw updErr

  const { data: pendingReq, error: reqFetchErr } = await supabase
    .from('trade_requests')
    .select('id, customer_name')
    .eq('listing_id', listingId!)
    .eq('status', 'pending')
    .maybeSingle()
  if (reqFetchErr) throw reqFetchErr

  let cancelledRequestId: string | undefined
  let cancelledRequestCustomerName: string | undefined
  if (pendingReq) {
    const { error: cancelErr } = await supabase
      .from('trade_requests')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', pendingReq.id)
    if (cancelErr) throw cancelErr
    cancelledRequestId = pendingReq.id as string
    cancelledRequestCustomerName = pendingReq.customer_name as string
  }

  return {
    listingId: listingId!,
    designName,
    previousStatus,
    cancelledRequestId,
    cancelledRequestCustomerName,
  }
}

export async function restoreListing(
  supabase: SupabaseClient,
  repId: string,
  input: RestoreListingInput,
  recoveryOptions: TradeListingRecoveryOptions = {},
): Promise<RestoreListingResult> {
  if (!input.listingId && !input.itemNumber) {
    throw errors.MISSING_ITEM_INPUT()
  }

  const resolvedRecoveryOptions = resolveRecoveryOptions(recoveryOptions)
  let listingId = input.listingId

  if (!listingId && input.itemNumber) {
    const { data: designRow, error: designErr } = await supabase
      .from('jewelry_designs')
      .select('id')
      .eq('item_number', input.itemNumber)
      .maybeSingle()
    if (designErr) throw designErr
    if (!designRow) throw errors.LISTING_NOT_FOUND(input.itemNumber)

    const { data: listingRows, error: listingErr } = await supabase
      .from('trade_listings')
      .select('id, deleted_at')
      .eq('design_id', designRow.id)
      .eq('rep_id', repId)
      .eq('status', 'removed')
      .order('deleted_at', { ascending: false, nullsFirst: false })
      .limit(1)
    if (listingErr) throw listingErr
    if (!listingRows || listingRows.length === 0) {
      throw errors.LISTING_NOT_FOUND(input.itemNumber)
    }
    listingId = listingRows[0].id as string
  }

  const { data: currentRow, error: fetchErr } = await supabase
    .from('trade_listings')
    .select(
      `id, status, rep_id, deleted_at, listing_source, manual_type_prefix, manual_collection_family, manual_collection_name, manual_size, design:jewelry_designs(design_name)`,
    )
    .eq('id', listingId!)
    .maybeSingle()
  if (fetchErr) throw fetchErr
  if (!currentRow) throw errors.UNAUTHORIZED('listing not found or not owned by rep')
  if (currentRow.rep_id !== repId) {
    throw errors.UNAUTHORIZED('listing belongs to another rep')
  }

  const status = currentRow.status as ListingStatus
  if (status !== 'removed') throw errors.INVALID_STATUS_TRANSITION(status, 'restore')

  const deletedAt = currentRow.deleted_at as string | null
  if (!isRemovedListingInsideRecoveryWindow(deletedAt, resolvedRecoveryOptions)) {
    throw errors.LISTING_RECOVERY_EXPIRED(
      resolvedRecoveryOptions.recoveryWindowDays,
    )
  }

  const nowIso = resolvedRecoveryOptions.now.toISOString()
  const { error: updErr } = await supabase
    .from('trade_listings')
    .update({
      status: 'available',
      removal_reason: null,
      deleted_at: null,
      updated_at: nowIso,
    })
    .eq('id', listingId!)
    .eq('rep_id', repId)
  if (updErr) throw updErr

  const designRel = currentRow.design as
    | { design_name: string }
    | { design_name: string }[]
    | null
  const designName = Array.isArray(designRel)
    ? designRel[0]?.design_name ?? ''
    : designRel?.design_name ??
      buildNonItemNumberTradeListingName({
        jewelryType: (currentRow.manual_type_prefix as JewelryType | null) ?? 'RG',
        collectionFamily:
          (currentRow.manual_collection_family as string | null) ?? 'Jewelry',
        collectionName: currentRow.manual_collection_name as string | null,
        size: currentRow.manual_size as string | null,
      })

  return {
    listingId: listingId!,
    designName,
    status: 'available',
    deletedAt: deletedAt!,
    recoveryWindowDays: resolvedRecoveryOptions.recoveryWindowDays,
  }
}

export async function purgeExpiredRemovedListings(
  supabase: SupabaseClient,
  recoveryOptions: TradeListingRecoveryOptions = {},
): Promise<PurgeRemovedListingsResult> {
  const resolvedRecoveryOptions = resolveRecoveryOptions(recoveryOptions)
  const cutoffIso = getTradeListingRecoveryCutoffIso(
    resolvedRecoveryOptions.now,
    resolvedRecoveryOptions.recoveryWindowDays,
  )

  const { data, error } = await supabase
    .from('trade_listings')
    .delete()
    .eq('status', 'removed')
    .lt('deleted_at', cutoffIso)
    .select('id')
  if (error) throw error

  return {
    purgedCount: (data ?? []).length,
    cutoffIso,
  }
}

// ============================================================================
// New functions — service client required (validates repId in body).
// ============================================================================

export async function addNonItemNumberListing(
  supabase: SupabaseClient,
  repId: string,
  input: AddNonItemNumberListingInput,
): Promise<AddNonItemNumberListingResult> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')

  const collectionFamily = requireListingText(
    input.collectionFamily,
    'collectionFamily',
  )
  const collectionName = normalizeOptionalListingText(input.collectionName) ?? null
  const photoUrl = requireListingText(input.photoUrl, 'photoUrl')
  const size = normalizeOptionalListingText(input.size) ?? null
  const jewelryType = input.jewelryType

  if (!['RG', 'NK', 'ER', 'ST', 'BR'].includes(jewelryType)) {
    throw errors.INVALID_INPUT('jewelryType must be one of RG, NK, ER, ST, BR')
  }
  if (jewelryType === 'RG' && !size) {
    throw errors.INVALID_INPUT('size required for non-item-number rings')
  }
  if (!isManagedRepListingPhotoUrl(repId, photoUrl)) {
    throw errors.INVALID_INPUT(
      'photoUrl must be a processed Sparkle Suite listing photo',
      'I need to process that listing photo through the image pipeline before I can save it.',
    )
  }

  const displayName = buildNonItemNumberTradeListingName({
    jewelryType,
    collectionFamily,
    collectionName,
    size,
  })
  const nowIso = new Date().toISOString()
  const { data: inserted, error: insErr } = await supabase
    .from('trade_listings')
    .insert({
      rep_id: repId,
      design_id: null,
      listing_source: 'non_item_number',
      status: 'available',
      rep_notes: normalizeOptionalListingText(input.repNotes) ?? null,
      trade_preferences:
        normalizeOptionalListingText(input.tradePreferences) ?? null,
      ring_size: size,
      listing_photo_url: photoUrl,
      uses_canonical_photo: false,
      manual_type_prefix: jewelryType,
      manual_collection_family: collectionFamily,
      manual_collection_name: collectionName,
      manual_size: size,
      manual_photo_url: photoUrl,
      listed_at: nowIso,
    })
    .select('id, status')
    .single()
  if (insErr) throw insErr

  return {
    listingId: inserted.id as string,
    listingSource: 'non_item_number',
    displayName,
    status: inserted.status as ListingStatus,
  }
}

export async function addListing(
  supabase: SupabaseClient,
  repId: string,
  input: AddListingInput
): Promise<AddListingResult> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')
  if (!input.itemNumber) throw errors.MISSING_ITEM_INPUT()

  const resolved = await resolveItemNumber(supabase, input.itemNumber, {
    material: input.material,
  })
  if (!resolved.found) {
    if (resolved.ambiguous) throw errors.NEEDS_MATERIAL_VARIANT(resolved.itemNumber)
    throw errors.NEEDS_FULL_INFO(input.itemNumber)
  }
  if (!resolved.hasCollection) {
    if (!input.collectionName?.trim()) {
      throw errors.NEEDS_COLLECTION(resolved.design.id, resolved.design.designName)
    }
    await updateDesignCollection(supabase, {
      designId: resolved.design.id,
      collectionName: input.collectionName,
      collectionYear: input.collectionYear,
    })
  }
  if (
    input.listingPhotoUrl &&
    !isManagedRepListingPhotoUrl(repId, input.listingPhotoUrl)
  ) {
    throw errors.INVALID_INPUT(
      'listingPhotoUrl must be a processed Sparkle Suite listing photo',
      'I need to process that listing photo through the image pipeline before I can save it.',
    )
  }

  const usesCanonicalPhoto = !input.listingPhotoUrl
  const { data: inserted, error: insErr } = await supabase
    .from('trade_listings')
    .insert({
      rep_id: repId,
      design_id: resolved.design.id,
      listing_source: 'catalog',
      status: 'available',
      rep_notes: input.repNotes ?? null,
      trade_preferences: input.tradePreferences ?? null,
      ring_size: normalizeOptionalListingText(input.ringSize) ?? null,
      listing_photo_url: input.listingPhotoUrl ?? null,
      uses_canonical_photo: usesCanonicalPhoto,
      listed_at: new Date().toISOString(),
    })
    .select('id, status')
    .single()
  if (insErr) throw insErr

  // Increment times_listed via fetch-then-update (counter, not load-bearing).
  const { data: designRow } = await supabase
    .from('jewelry_designs')
    .select('times_listed')
    .eq('id', resolved.design.id)
    .maybeSingle()
  if (designRow) {
    await supabase
      .from('jewelry_designs')
      .update({
        times_listed: ((designRow.times_listed as number | null) ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', resolved.design.id)
  }

  return {
    listingId: inserted.id as string,
    designId: resolved.design.id,
    itemNumber: resolved.design.itemNumber,
    designName: resolved.design.designName,
    status: inserted.status as ListingStatus,
    usesCanonicalPhoto,
  }
}

export async function addListingBatch(
  supabase: SupabaseClient,
  repId: string,
  input: AddListingBatchInput
): Promise<AddListingBatchResult> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')
  if (!input.items || input.items.length === 0) {
    return { added: [], pending: { needCollection: [], needFullInfo: [] } }
  }

  const normalizedItems: BatchListingItem[] = []
  for (const item of input.items) {
    const itemNumber = normalizeItemNumber(item.itemNumber)
    if (!itemNumber) continue

    normalizedItems.push({
      ...item,
      itemNumber,
    })
  }

  if (normalizedItems.length === 0) {
    return { added: [], pending: { needCollection: [], needFullInfo: [] } }
  }
  const invalidCustomPhotoItem = normalizedItems.find(
    (item) =>
      item.listingPhotoUrl &&
      !isManagedRepListingPhotoUrl(repId, item.listingPhotoUrl),
  )
  if (invalidCustomPhotoItem) {
    throw errors.INVALID_INPUT(
      `batch listingPhotoUrl for ${invalidCustomPhotoItem.itemNumber} must be a processed Sparkle Suite listing photo`,
      'I need to process that listing photo through the image pipeline before I can save it.',
    )
  }

  const itemNumbers = normalizedItems.map((i) => i.itemNumber)
  const { data: designs, error: designErr } = await supabase
    .from('jewelry_designs')
    .select('id, item_number, design_name, collection_id, canonical_photo_url')
    .in('item_number', itemNumbers)
  if (designErr) throw designErr

  const designByItem = new Map<
    string,
    {
      id: string
      design_name: string
      collection_id: string | null
      canonical_photo_url: string | null
    }
  >()
  for (const d of designs ?? []) {
    designByItem.set(d.item_number as string, {
      id: d.id as string,
      design_name: d.design_name as string,
      collection_id: (d.collection_id as string | null) ?? null,
      canonical_photo_url: (d.canonical_photo_url as string | null) ?? null,
    })
  }

  const ready: Array<{ item: BatchListingItem; designId: string; designName: string }> = []
  const needCollection: Array<{ itemNumber: string; designId: string; designName: string }> = []
  const needFullInfo: Array<{ itemNumber: string }> = []

  for (const item of normalizedItems) {
    const d = designByItem.get(item.itemNumber)
    if (!d) {
      needFullInfo.push({ itemNumber: item.itemNumber })
      continue
    }
    if (!d.collection_id) {
      needCollection.push({
        itemNumber: item.itemNumber,
        designId: d.id,
        designName: d.design_name,
      })
      continue
    }
    ready.push({ item, designId: d.id, designName: d.design_name })
  }

  if (ready.length === 0) {
    return { added: [], pending: { needCollection, needFullInfo } }
  }

  const toInsert = ready

  const nowIso = new Date().toISOString()
  const insertRows = toInsert.map((r) => ({
    rep_id: repId,
    design_id: r.designId,
    listing_source: 'catalog' as const,
    status: 'available' as const,
    rep_notes: r.item.repNotes ?? null,
    trade_preferences: r.item.tradePreferences ?? null,
    ring_size: normalizeOptionalListingText(r.item.ringSize) ?? null,
    listing_photo_url: r.item.listingPhotoUrl ?? null,
    uses_canonical_photo: !r.item.listingPhotoUrl,
    listed_at: nowIso,
  }))

  const { data: inserted, error: insErr } = await supabase
    .from('trade_listings')
    .insert(insertRows)
    .select('id, design_id, status')
  if (insErr) throw insErr

  // Bump times_listed by physical listing count per design.
  const listingCountsByDesign = new Map<string, number>()
  for (const r of toInsert) {
    listingCountsByDesign.set(
      r.designId,
      (listingCountsByDesign.get(r.designId) ?? 0) + 1,
    )
  }
  for (const [designId, listingCount] of listingCountsByDesign) {
    const { data: designRow } = await supabase
      .from('jewelry_designs')
      .select('times_listed')
      .eq('id', designId)
      .maybeSingle()
    if (designRow) {
      await supabase
        .from('jewelry_designs')
        .update({
          times_listed:
            ((designRow.times_listed as number | null) ?? 0) + listingCount,
          updated_at: nowIso,
        })
        .eq('id', designId)
    }
  }

  const added: AddListingResult[] = (inserted ?? []).map((row, index) => {
    const r = toInsert[index] ?? toInsert.find((x) => x.designId === row.design_id)!
    return {
      listingId: row.id as string,
      designId: r.designId,
      itemNumber: r.item.itemNumber,
      designName: r.designName,
      status: row.status as ListingStatus,
      usesCanonicalPhoto: !r.item.listingPhotoUrl,
    }
  })

  return { added, pending: { needCollection, needFullInfo } }
}

export async function updateListing(
  supabase: SupabaseClient,
  repId: string,
  listingId: string,
  patch: UpdateListingInput
): Promise<UpdateListingResult> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')
  if (!listingId) throw errors.MISSING_ITEM_INPUT()

  const { data: current, error: fetchErr } = await supabase
    .from('trade_listings')
    .select('id, rep_id, status')
    .eq('id', listingId)
    .maybeSingle()
  if (fetchErr) throw fetchErr
  if (!current) throw errors.LISTING_NOT_FOUND(listingId)
  if (current.rep_id !== repId) throw errors.UNAUTHORIZED('listing belongs to another rep')
  const status = current.status as ListingStatus
  if (status !== 'available' && status !== 'pending_trade') {
    throw errors.INVALID_STATUS_TRANSITION(status, 'edit')
  }
  if (
    patch.listingPhotoUrl &&
    !isManagedRepListingPhotoUrl(repId, patch.listingPhotoUrl)
  ) {
    throw errors.INVALID_INPUT(
      'listingPhotoUrl must be a processed Sparkle Suite listing photo',
      'I need to process that listing photo through the image pipeline before I can save it.',
    )
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.repNotes !== undefined) update.rep_notes = patch.repNotes
  if (patch.tradePreferences !== undefined) update.trade_preferences = patch.tradePreferences
  if (patch.ringSize !== undefined) {
    update.ring_size = normalizeOptionalListingText(patch.ringSize)
  }
  if (patch.useCanonicalPhoto === true) {
    update.listing_photo_url = null
    update.uses_canonical_photo = true
  } else if (patch.listingPhotoUrl !== undefined) {
    update.listing_photo_url = patch.listingPhotoUrl
    update.uses_canonical_photo = patch.listingPhotoUrl === null
  }

  const { error: updErr } = await supabase
    .from('trade_listings')
    .update(update)
    .eq('id', listingId)
    .eq('rep_id', repId)
  if (updErr) throw updErr

  return { listingId, status }
}
