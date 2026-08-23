// Trade Requests service — submit/get/approve/reject + history.
//
// Client requirements:
//   submitTradeRequest — service client. Customer is unauthenticated;
//                        rpc_submit_trade_request is SECURITY DEFINER but we
//                        still need a client that can reach it.
//   getTradeRequests   — auth client. RLS gives `requests_rep_read` for the
//                        rep's own listings.
//   approveTrade       — service client. RPC is SECURITY DEFINER; service
//                        client chosen for consistency and uniform error
//                        mapping. Validates `repId` ownership before calling.
//   rejectTrade        — same as approveTrade.
//   getTradeHistory    — auth client. Pure rep-scoped read; never elevate to
//                        service. requests_rep_read + fulfillment_own_data +
//                        designs_read_all + collections_read_all all permit.

import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js'
import {
  type TradeRequestStatus,
  type RejectionReason,
  type FulfillmentStatus,
  type SubmitTradeRequestInput,
  type SubmitTradeRequestResult,
  type GetTradeRequestsFilters,
  type TradeRequestWithListing,
  type TradeRequestRevealScreenshot,
  type TradeRequestNotificationSummary,
  type ApproveTradeResult,
  type RejectTradeResult,
  type GetTradeHistoryOptions,
  type TradeHistoryItem,
  type TradeHistoryResult,
  type TradeListingWithDesign,
} from './types'
import { ServiceError, errors } from './errors'
import { getTradeListingDisplayFields } from './trade-listing-display'

function mapRevealScreenshot(row: {
  reveal_screenshot_path?: string | null
  reveal_screenshot_content_type?: string | null
  reveal_screenshot_size_bytes?: number | null
  reveal_screenshot_uploaded_at?: string | null
  reveal_screenshot_expires_at?: string | null
}): TradeRequestRevealScreenshot | null {
  if (
    !row.reveal_screenshot_path ||
    !row.reveal_screenshot_content_type ||
    !row.reveal_screenshot_size_bytes ||
    !row.reveal_screenshot_uploaded_at ||
    !row.reveal_screenshot_expires_at
  ) {
    return null
  }

  if (new Date(row.reveal_screenshot_expires_at).getTime() <= Date.now()) {
    return null
  }

  return {
    objectPath: row.reveal_screenshot_path,
    contentType: row.reveal_screenshot_content_type,
    sizeBytes: row.reveal_screenshot_size_bytes,
    uploadedAt: row.reveal_screenshot_uploaded_at,
    expiresAt: row.reveal_screenshot_expires_at,
  }
}

function rpcError(err: PostgrestError | null): ServiceError | null {
  if (!err) return null
  const msg = err.message ?? ''
  if (msg.includes('LISTING_NOT_FOUND')) return errors.LISTING_NOT_FOUND()
  if (msg.includes('REQUEST_ALREADY_EXISTS')) return errors.REQUEST_ALREADY_EXISTS()
  if (msg.includes('REQUEST_NOT_FOUND')) return errors.LISTING_NOT_FOUND('request')
  if (msg.includes('REQUEST_NOT_PENDING')) return errors.REQUEST_NOT_PENDING()
  // Partial unique index collision surfaces as 23505.
  if (err.code === '23505') return errors.REQUEST_ALREADY_EXISTS()
  return null
}

export async function submitTradeRequest(
  supabase: SupabaseClient,
  input: SubmitTradeRequestInput
): Promise<SubmitTradeRequestResult> {
  if (!input.listingId) throw errors.MISSING_ITEM_INPUT()
  if (!input.customerName?.trim()) {
    throw errors.INVALID_INPUT('customerName required', 'I need a customer name to submit that.')
  }
  if (!input.customerDescription?.trim()) {
    throw errors.INVALID_INPUT(
      'customerDescription required',
      'I need a short description from the customer to submit that.',
    )
  }

  if (input.expectedRepId?.trim()) {
    const { data: listing, error: listingError } = await supabase
      .from('trade_listings')
      .select('id, rep_id')
      .eq('id', input.listingId)
      .maybeSingle()

    if (listingError) throw listingError
    const row = listing as { id: string; rep_id: string } | null
    if (!row) throw errors.LISTING_NOT_FOUND(input.listingId)
    if (row.rep_id !== input.expectedRepId.trim()) {
      throw errors.LISTING_NOT_FOUND(input.listingId)
    }
  }

  const { data, error } = await supabase.rpc('rpc_submit_trade_request', {
    p_listing_id: input.listingId,
    p_customer_name: input.customerName,
    p_customer_description: input.customerDescription,
  })
  const mapped = rpcError(error)
  if (mapped) throw mapped
  if (error) throw error

  const payload = data as { request_id: string; listing_id: string } | null
  if (!payload?.request_id) throw errors.LISTING_NOT_FOUND(input.listingId)
  return { requestId: payload.request_id, listingId: payload.listing_id }
}

export async function attachTradeRequestRevealScreenshot(
  supabase: SupabaseClient,
  requestId: string,
  screenshot: TradeRequestRevealScreenshot,
): Promise<void> {
  if (!requestId) throw errors.MISSING_ITEM_INPUT()
  if (!screenshot.objectPath) {
    throw errors.INVALID_INPUT(
      'reveal screenshot path required',
      'That screenshot could not be attached to the trade request.',
    )
  }

  const { error } = await supabase
    .from('trade_requests')
    .update({
      reveal_screenshot_path: screenshot.objectPath,
      reveal_screenshot_content_type: screenshot.contentType,
      reveal_screenshot_size_bytes: screenshot.sizeBytes,
      reveal_screenshot_uploaded_at: screenshot.uploadedAt,
      reveal_screenshot_expires_at: screenshot.expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
  if (error) throw error
}

const REQUEST_LISTING_SELECT = `
  id, status, customer_name, customer_description,
  reveal_screenshot_path, reveal_screenshot_content_type,
  reveal_screenshot_size_bytes, reveal_screenshot_uploaded_at,
  reveal_screenshot_expires_at,
  rejection_reason,
  rep_notes, created_at, updated_at,
  listing:trade_listings(
    id, rep_id, listing_source, listing_photo_url, uses_canonical_photo,
    manual_type_prefix, manual_collection_family, manual_collection_name,
    manual_size, manual_photo_url,
    design:jewelry_designs(
      id, item_number, design_name, material, main_stone, bp_msrp,
      canonical_photo_url, type_prefix,
      collection:collections(name)
    )
  )
`

export async function getTradeRequests(
  supabase: SupabaseClient,
  repId: string,
  filters: GetTradeRequestsFilters = {}
): Promise<TradeRequestWithListing[]> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')

  const status = filters.statusFilter ?? 'pending'
  let query = supabase
    .from('trade_requests')
    .select(REQUEST_LISTING_SELECT)
    .eq('status', status)
    .order('created_at', { ascending: false })
  if (filters.limit) query = query.limit(filters.limit)

  const { data, error } = await query
  if (error) throw error

type RawListing = {
    id: string
    rep_id: string
    listing_source?: TradeListingWithDesign['listing_source'] | null
    listing_photo_url: string | null
    uses_canonical_photo: boolean
    manual_type_prefix?: TradeListingWithDesign['manual_type_prefix']
    manual_collection_family?: string | null
    manual_collection_name?: string | null
    manual_size?: string | null
    manual_photo_url?: string | null
    design:
      | {
          id: string
          item_number: string
          design_name: string
          collection: { name: string } | { name: string }[] | null
          material: string | null
          main_stone: string | null
          bp_msrp: number | null
          canonical_photo_url: string | null
          type_prefix: TradeRequestWithListing['listing']['design']['typePrefix']
        }
      | Array<{
          id: string
          item_number: string
          design_name: string
          collection: { name: string } | { name: string }[] | null
          material: string | null
          main_stone: string | null
          bp_msrp: number | null
          canonical_photo_url: string | null
          type_prefix: TradeRequestWithListing['listing']['design']['typePrefix']
        }>
      | null
  }
  type RawRow = {
    id: string
    status: TradeRequestStatus
    customer_name: string
    customer_description: string
    reveal_screenshot_path: string | null
    reveal_screenshot_content_type: string | null
    reveal_screenshot_size_bytes: number | null
    reveal_screenshot_uploaded_at: string | null
    reveal_screenshot_expires_at: string | null
    rejection_reason: RejectionReason | null
    rep_notes: string | null
    created_at: string
    updated_at: string
    listing: RawListing | RawListing[] | null
  }

  const rows = ((data ?? []) as unknown as RawRow[])
    .map((row): TradeRequestWithListing | null => {
      const lst = Array.isArray(row.listing) ? row.listing[0] : row.listing
      if (!lst) return null
      const design = Array.isArray(lst.design) ? lst.design[0] : lst.design
      // Auth client RLS already filters to this rep's listings, but double-check.
      if (lst.rep_id !== repId) return null
      const collectionRel = design?.collection
      const collection = Array.isArray(collectionRel) ? collectionRel[0] : collectionRel
      const display = getTradeListingDisplayFields({
        id: lst.id,
        rep_id: lst.rep_id,
        listing_source: lst.listing_source ?? undefined,
        status: 'available',
        rep_notes: null,
        trade_preferences: null,
        ring_size: null,
        listing_photo_url: lst.listing_photo_url,
        uses_canonical_photo: lst.uses_canonical_photo,
        manual_type_prefix: lst.manual_type_prefix,
        manual_collection_family: lst.manual_collection_family,
        manual_collection_name: lst.manual_collection_name,
        manual_size: lst.manual_size,
        manual_photo_url: lst.manual_photo_url,
        listed_at: null,
        removal_reason: null,
        deleted_at: null,
        created_at: row.created_at,
        updated_at: row.updated_at,
        design: design
          ? {
              id: design.id,
              item_number: design.item_number,
              design_name: design.design_name,
              collection: collection
                ? { id: '', name: collection.name }
                : null,
              material: design.material,
              main_stone: design.main_stone,
              bp_msrp: design.bp_msrp,
              canonical_photo_url: design.canonical_photo_url,
              type_prefix: design.type_prefix,
            }
          : null,
      } as TradeListingWithDesign)
      return {
        id: row.id,
        status: row.status,
        customerName: row.customer_name,
        customerDescription: row.customer_description,
        revealScreenshot: mapRevealScreenshot(row),
        rejectionReason: row.rejection_reason,
        repNotes: row.rep_notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        listing: {
          id: lst.id,
          repId: lst.rep_id,
          listingSource: display.listingSource,
          listingPhotoUrl: display.listingPhotoUrl,
          usesCanonicalPhoto: lst.uses_canonical_photo,
          repFacingNote: display.repFacingNote,
          design: {
            id: design?.id ?? null,
            itemNumber: display.itemNumber,
            designName: display.designName,
            collectionName: display.collectionName,
            material: display.material,
            mainStone: display.mainStone,
            bpMsrp: display.bpMsrp,
            canonicalPhotoUrl: display.canonicalPhotoUrl,
            typePrefix: display.typePrefix,
          },
        },
      }
    })
    .filter((r): r is TradeRequestWithListing => r !== null)

  return rows
}

const REQUEST_NOTIFICATION_SELECT = `
  id, customer_name, customer_description,
  reveal_screenshot_path, reveal_screenshot_content_type,
  reveal_screenshot_size_bytes, reveal_screenshot_uploaded_at,
  reveal_screenshot_expires_at,
  listing:trade_listings(
    id, rep_id, listing_source, listing_photo_url, uses_canonical_photo,
    manual_type_prefix, manual_collection_family, manual_collection_name,
    manual_size, manual_photo_url,
    design:jewelry_designs(
      item_number, design_name, bp_msrp, type_prefix,
      collection:collections(name)
    )
  )
`

export async function getTradeRequestNotificationSummary(
  supabase: SupabaseClient,
  requestId: string
): Promise<TradeRequestNotificationSummary | null> {
  if (!requestId) throw errors.MISSING_ITEM_INPUT()

  const { data, error } = await supabase
    .from('trade_requests')
    .select(REQUEST_NOTIFICATION_SELECT)
    .eq('id', requestId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  type RawDesign = {
    id?: string | null
    item_number: string
    design_name: string
    material?: string | null
    main_stone?: string | null
    canonical_photo_url?: string | null
    bp_msrp: number | null
    type_prefix: TradeRequestNotificationSummary['listing']['typePrefix']
    collection: { name: string } | { name: string }[] | null
  }
  type RawListing = {
    id: string
    rep_id: string
    listing_source?: TradeListingWithDesign['listing_source'] | null
    listing_photo_url?: string | null
    uses_canonical_photo?: boolean
    manual_type_prefix?: TradeListingWithDesign['manual_type_prefix']
    manual_collection_family?: string | null
    manual_collection_name?: string | null
    manual_size?: string | null
    manual_photo_url?: string | null
    design: RawDesign | RawDesign[] | null
  }
  type RawRow = {
    id: string
    customer_name: string
    customer_description: string
    reveal_screenshot_path: string | null
    reveal_screenshot_content_type: string | null
    reveal_screenshot_size_bytes: number | null
    reveal_screenshot_uploaded_at: string | null
    reveal_screenshot_expires_at: string | null
    listing: RawListing | RawListing[] | null
  }

  const row = data as unknown as RawRow
  const listing = Array.isArray(row.listing) ? row.listing[0] : row.listing
  if (!listing) return null
  const design = Array.isArray(listing.design) ? listing.design[0] : listing.design
  const collectionRel = design?.collection
  const collection = Array.isArray(collectionRel) ? collectionRel[0] : collectionRel
  const display = getTradeListingDisplayFields({
    id: listing.id,
    rep_id: listing.rep_id,
    listing_source: listing.listing_source ?? undefined,
    status: 'available',
    rep_notes: null,
    trade_preferences: null,
    ring_size: null,
    listing_photo_url: listing.listing_photo_url ?? null,
    uses_canonical_photo: listing.uses_canonical_photo ?? true,
    manual_type_prefix: listing.manual_type_prefix,
    manual_collection_family: listing.manual_collection_family,
    manual_collection_name: listing.manual_collection_name,
    manual_size: listing.manual_size,
    manual_photo_url: listing.manual_photo_url,
    listed_at: null,
    removal_reason: null,
    deleted_at: null,
    created_at: '',
    updated_at: '',
    design: design
      ? {
          id: design.id ?? '',
          item_number: design.item_number,
          design_name: design.design_name,
          collection: collection ? { id: '', name: collection.name } : null,
          material: design.material ?? null,
          main_stone: design.main_stone ?? null,
          bp_msrp: design.bp_msrp,
          canonical_photo_url: design.canonical_photo_url ?? null,
          type_prefix: design.type_prefix,
        }
      : null,
  } as TradeListingWithDesign)

  return {
    requestId: row.id,
    repId: listing.rep_id,
    customerName: row.customer_name,
    customerDescription: row.customer_description,
    revealScreenshot: mapRevealScreenshot(row),
    listing: {
      id: listing.id,
      listingSource: display.listingSource,
      itemNumber: display.itemNumber,
      designName: display.designName,
      collectionName: display.collectionName,
      typePrefix: display.typePrefix,
      bpMsrp: display.bpMsrp,
    },
  }
}

export async function getTradeRequestRevealScreenshotForRep(
  supabase: SupabaseClient,
  repId: string,
  requestId: string,
): Promise<TradeRequestRevealScreenshot | null> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')
  if (!requestId) throw errors.MISSING_ITEM_INPUT()

  const { data, error } = await supabase
    .from('trade_requests')
    .select(`
      id,
      reveal_screenshot_path,
      reveal_screenshot_content_type,
      reveal_screenshot_size_bytes,
      reveal_screenshot_uploaded_at,
      reveal_screenshot_expires_at,
      listing:trade_listings!inner(rep_id)
    `)
    .eq('id', requestId)
    .maybeSingle()
  if (error) throw error
  if (!data) throw errors.LISTING_NOT_FOUND(`request ${requestId}`)

  type RawRow = {
    reveal_screenshot_path: string | null
    reveal_screenshot_content_type: string | null
    reveal_screenshot_size_bytes: number | null
    reveal_screenshot_uploaded_at: string | null
    reveal_screenshot_expires_at: string | null
    listing: { rep_id: string } | Array<{ rep_id: string }> | null
  }

  const row = data as unknown as RawRow
  const listing = Array.isArray(row.listing) ? row.listing[0] : row.listing
  if (!listing || listing.rep_id !== repId) {
    throw errors.UNAUTHORIZED(`request ${requestId} not owned by rep`)
  }

  return mapRevealScreenshot(row)
}

export async function getExpiredTradeRequestRevealScreenshotPaths(
  supabase: SupabaseClient,
  now = new Date(),
  limit = 100,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('trade_requests')
    .select('reveal_screenshot_path')
    .not('reveal_screenshot_path', 'is', null)
    .lte('reveal_screenshot_expires_at', now.toISOString())
    .limit(limit)
  if (error) throw error

  return ((data ?? []) as Array<{ reveal_screenshot_path: string | null }>)
    .map((row) => row.reveal_screenshot_path)
    .filter((path): path is string => Boolean(path))
}

export async function clearExpiredTradeRequestRevealScreenshots(
  supabase: SupabaseClient,
  objectPaths: string[],
): Promise<number> {
  const paths = objectPaths.map((path) => path.trim()).filter(Boolean)
  if (paths.length === 0) return 0

  const { error } = await supabase
    .from('trade_requests')
    .update({
      reveal_screenshot_path: null,
      reveal_screenshot_content_type: null,
      reveal_screenshot_size_bytes: null,
      reveal_screenshot_uploaded_at: null,
      reveal_screenshot_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .in('reveal_screenshot_path', paths)
  if (error) throw error

  return paths.length
}

async function assertRequestOwnedByRep(
  supabase: SupabaseClient,
  repId: string,
  requestId: string
): Promise<void> {
  const { data, error } = await supabase
    .from('trade_requests')
    .select('id, status, listing:trade_listings!inner(rep_id)')
    .eq('id', requestId)
    .maybeSingle()
  if (error) throw error
  if (!data) throw errors.LISTING_NOT_FOUND(`request ${requestId}`)
  const listingRel = (data as { listing: { rep_id: string } | { rep_id: string }[] }).listing
  const ownerRep = Array.isArray(listingRel) ? listingRel[0]?.rep_id : listingRel?.rep_id
  if (!ownerRep || ownerRep !== repId) {
    throw errors.UNAUTHORIZED(`request ${requestId} not owned by rep`)
  }
  if ((data as { status: TradeRequestStatus }).status !== 'pending') {
    throw errors.REQUEST_NOT_PENDING()
  }
}

export async function approveTrade(
  supabase: SupabaseClient,
  repId: string,
  requestId: string,
  repNotes?: string
): Promise<ApproveTradeResult> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')
  if (!requestId) throw errors.MISSING_ITEM_INPUT()

  await assertRequestOwnedByRep(supabase, repId, requestId)

  const { data, error } = await supabase.rpc('rpc_approve_trade', {
    p_request_id: requestId,
    p_rep_notes: repNotes ?? null,
  })
  const mapped = rpcError(error)
  if (mapped) throw mapped
  if (error) throw error

  const payload = data as
    | {
        request_id: string
        fulfillment_id: string
        listing_id: string
        customer_name: string
        quantity_available?: number
      }
    | null
  if (!payload) throw errors.LISTING_NOT_FOUND(`request ${requestId}`)
  return {
    requestId: payload.request_id,
    fulfillmentId: payload.fulfillment_id,
    listingId: payload.listing_id,
    customerName: payload.customer_name,
    quantityAvailable: payload.quantity_available ?? 0,
  }
}

export async function rejectTrade(
  supabase: SupabaseClient,
  repId: string,
  requestId: string,
  reason?: RejectionReason,
  repNotes?: string
): Promise<RejectTradeResult> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')
  if (!requestId) throw errors.MISSING_ITEM_INPUT()

  await assertRequestOwnedByRep(supabase, repId, requestId)

  const { data, error } = await supabase.rpc('rpc_reject_trade', {
    p_request_id: requestId,
    p_reason: reason ?? null,
    p_rep_notes: repNotes ?? null,
  })
  const mapped = rpcError(error)
  if (mapped) throw mapped
  if (error) throw error

  const payload = data as { request_id: string; listing_id: string; listing_restored: boolean } | null
  if (!payload) throw errors.LISTING_NOT_FOUND(`request ${requestId}`)
  return {
    requestId: payload.request_id,
    listingId: payload.listing_id,
    listingRestored: payload.listing_restored,
  }
}

const HISTORY_SELECT = `
  id, status, customer_name, created_at,
  fulfillment:trade_fulfillment(
    id, fulfillment_status, completed_at, status_updated_at
  ),
  listing:trade_listings!inner(
    id, rep_id, listing_source, listing_photo_url, uses_canonical_photo,
    manual_type_prefix, manual_collection_family, manual_collection_name,
    manual_size, manual_photo_url,
    design:jewelry_designs(
      item_number, design_name, bp_msrp, type_prefix,
      collection:collections(name)
    )
  )
`

export async function getTradeHistory(
  supabase: SupabaseClient,
  repId: string,
  options: GetTradeHistoryOptions = {}
): Promise<TradeHistoryResult> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')

  let query = supabase
    .from('trade_requests')
    .select(HISTORY_SELECT)
    .in('status', ['approved', 'denied'])
    .order('created_at', { ascending: false })
  if (options.limit) query = query.limit(options.limit)

  const { data, error } = await query
  if (error) throw error

  type RawDesign = {
    id?: string | null
    item_number: string
    design_name: string
    material?: string | null
    main_stone?: string | null
    canonical_photo_url?: string | null
    bp_msrp: number | null
    type_prefix: TradeHistoryItem['design']['typePrefix']
    collection: { name: string } | { name: string }[] | null
  }
  type RawListing = {
    id: string
    rep_id: string
    listing_source?: TradeListingWithDesign['listing_source'] | null
    listing_photo_url?: string | null
    uses_canonical_photo?: boolean
    manual_type_prefix?: TradeListingWithDesign['manual_type_prefix']
    manual_collection_family?: string | null
    manual_collection_name?: string | null
    manual_size?: string | null
    manual_photo_url?: string | null
    design: RawDesign | RawDesign[] | null
  }
  type RawFulfillment = {
    id: string
    fulfillment_status: FulfillmentStatus | null
    completed_at: string | null
    status_updated_at: string | null
  }
  type RawRow = {
    id: string
    status: TradeRequestStatus
    customer_name: string
    created_at: string
    fulfillment: RawFulfillment | RawFulfillment[] | null
    listing: RawListing | RawListing[] | null
  }

  const items: TradeHistoryItem[] = []
  for (const row of (data ?? []) as unknown as RawRow[]) {
    const lst = Array.isArray(row.listing) ? row.listing[0] : row.listing
    if (!lst || lst.rep_id !== repId) continue
    const design = Array.isArray(lst.design) ? lst.design[0] : lst.design
    const collectionRel = design?.collection
    const collection = Array.isArray(collectionRel) ? collectionRel[0] : collectionRel
    const ful = Array.isArray(row.fulfillment) ? row.fulfillment[0] : row.fulfillment
    const display = getTradeListingDisplayFields({
      id: lst.id,
      rep_id: lst.rep_id,
      listing_source: lst.listing_source ?? undefined,
      status: 'available',
      rep_notes: null,
      trade_preferences: null,
      ring_size: null,
      listing_photo_url: lst.listing_photo_url ?? null,
      uses_canonical_photo: lst.uses_canonical_photo ?? true,
      manual_type_prefix: lst.manual_type_prefix,
      manual_collection_family: lst.manual_collection_family,
      manual_collection_name: lst.manual_collection_name,
      manual_size: lst.manual_size,
      manual_photo_url: lst.manual_photo_url,
      listed_at: null,
      removal_reason: null,
      deleted_at: null,
      created_at: row.created_at,
      updated_at: row.created_at,
      design: design
        ? {
            id: design.id ?? '',
            item_number: design.item_number,
            design_name: design.design_name,
            collection: collection ? { id: '', name: collection.name } : null,
            material: design.material ?? null,
            main_stone: design.main_stone ?? null,
            bp_msrp: design.bp_msrp,
            canonical_photo_url: design.canonical_photo_url ?? null,
            type_prefix: design.type_prefix,
          }
        : null,
    } as TradeListingWithDesign)

    let fulfillmentDays: number | null = null
    if (ful?.completed_at) {
      const created = new Date(row.created_at).getTime()
      const completed = new Date(ful.completed_at).getTime()
      fulfillmentDays = Math.max(0, Math.round((completed - created) / 86_400_000))
    }

    items.push({
      requestId: row.id,
      listingId: lst.id,
      customerName: row.customer_name,
      status: row.status,
      fulfillmentStatus: (ful?.fulfillment_status as FulfillmentStatus | null) ?? null,
      createdAt: row.created_at,
      completedAt: ful?.completed_at ?? null,
      fulfillmentDays,
      design: {
        itemNumber: display.itemNumber,
        designName: display.designName,
        bpMsrp: display.bpMsrp,
        typePrefix: display.typePrefix,
        collectionName: display.collectionName,
      },
    })
  }

  // Summary stats — completed-only for averages.
  const completed = items.filter((i) => i.fulfillmentStatus === 'completed')
  const totalCompleted = completed.length
  const totalMsrpTraded = completed.reduce((sum, i) => sum + Number(i.design.bpMsrp ?? 0), 0)
  const daysList = completed
    .map((i) => i.fulfillmentDays)
    .filter((d): d is number => typeof d === 'number')
  const avgFulfillmentDays =
    daysList.length > 0 ? daysList.reduce((s, d) => s + d, 0) / daysList.length : null

  const customerCounts = new Map<string, number>()
  for (const i of completed) {
    customerCounts.set(i.customerName, (customerCounts.get(i.customerName) ?? 0) + 1)
  }
  const repeatCustomers = [...customerCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([customerName, count]) => ({ customerName, count }))
    .sort((a, b) => b.count - a.count)

  return {
    items,
    summary: {
      totalCompleted,
      totalMsrpTraded,
      avgFulfillmentDays,
      repeatCustomers,
    },
  }
}
