// Trade Fulfillment service — status progression + queue.
//
// Client requirements:
//   updateFulfillmentStatus — auth client. RLS via fulfillment_own_data
//                             scopes through request → listing → rep_id.
//   getFulfillmentQueue     — auth client. Same RLS policy.

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  type FulfillmentStatus,
  type UpdateFulfillmentInput,
  type UpdateFulfillmentResult,
  type FulfillmentQueueItem,
  type TradeListingWithDesign,
} from './types'
import { errors } from './errors'
import { getTradeListingDisplayFields } from './trade-listing-display'

const FORWARD: Record<FulfillmentStatus, FulfillmentStatus | null> = {
  approved: 'shipped',
  shipped: 'completed',
  completed: null,
}

function isValidTransition(from: FulfillmentStatus, to: FulfillmentStatus): boolean {
  if (from === to) return true
  return FORWARD[from] === to
}

export async function updateFulfillmentStatus(
  supabase: SupabaseClient,
  repId: string,
  input: UpdateFulfillmentInput
): Promise<UpdateFulfillmentResult> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')
  if (!input.nextStatus) throw errors.MISSING_ITEM_INPUT()

  // Resolve fulfillment row by requestId or customerName. RLS already scopes to rep.
  let fulfillmentRow: {
    id: string
    request_id: string
    fulfillment_status: FulfillmentStatus
    completed_at: string | null
  } | null = null

  if ('requestId' in input && input.requestId) {
    const { data, error } = await supabase
      .from('trade_fulfillment')
      .select('id, request_id, fulfillment_status, completed_at')
      .eq('request_id', input.requestId)
      .maybeSingle()
    if (error) throw error
    if (!data) throw errors.FULFILLMENT_NOT_FOUND()
    fulfillmentRow = {
      id: data.id as string,
      request_id: data.request_id as string,
      fulfillment_status: data.fulfillment_status as FulfillmentStatus,
      completed_at: (data.completed_at as string | null) ?? null,
    }
  } else if ('customerName' in input && input.customerName) {
    const { data, error } = await supabase
      .from('trade_fulfillment')
      .select(
        'id, request_id, fulfillment_status, completed_at, request:trade_requests!inner(customer_name)',
      )
      .eq('request.customer_name', input.customerName)
    if (error) throw error
    const rows = (data ?? []) as Array<{
      id: string
      request_id: string
      fulfillment_status: FulfillmentStatus
      completed_at: string | null
    }>
    if (rows.length === 0) throw errors.FULFILLMENT_NOT_FOUND()
    if (rows.length > 1) throw errors.AMBIGUOUS_CUSTOMER(input.customerName)
    fulfillmentRow = rows[0]
  } else {
    throw errors.INVALID_INPUT('requestId or customerName required')
  }

  const previousStatus = fulfillmentRow.fulfillment_status
  if (previousStatus === input.nextStatus) {
    return {
      fulfillmentId: fulfillmentRow.id,
      requestId: fulfillmentRow.request_id,
      previousStatus,
      status: previousStatus,
      completedAt: fulfillmentRow.completed_at,
      changed: false,
      shouldPromptAddToBoard: false,
    }
  }

  if (!isValidTransition(previousStatus, input.nextStatus)) {
    throw errors.INVALID_STATUS_TRANSITION(previousStatus, input.nextStatus)
  }

  const nowIso = new Date().toISOString()
  const update: Record<string, unknown> = {
    fulfillment_status: input.nextStatus,
    status_updated_at: nowIso,
  }
  if (input.shippingNotes !== undefined) update.shipping_notes = input.shippingNotes
  if (input.nextStatus === 'completed') update.completed_at = nowIso

  const { data: updated, error: updErr } = await supabase
    .from('trade_fulfillment')
    .update(update)
    .eq('id', fulfillmentRow.id)
    .select('id, request_id, fulfillment_status, completed_at')
    .single()
  if (updErr) throw updErr

  return {
    fulfillmentId: updated.id as string,
    requestId: updated.request_id as string,
    previousStatus,
    status: updated.fulfillment_status as FulfillmentStatus,
    completedAt: (updated.completed_at as string | null) ?? null,
    changed: true,
    shouldPromptAddToBoard:
      input.nextStatus === 'completed' && input.addToBoard === true,
  }
}

const QUEUE_SELECT = `
  id, fulfillment_status, status_updated_at,
  request:trade_requests!inner(
    id, customer_name,
    listing:trade_listings!inner(
      rep_id, listing_source, listing_photo_url, uses_canonical_photo,
      manual_type_prefix, manual_collection_family, manual_collection_name,
      manual_size, manual_photo_url,
      design:jewelry_designs(
        id, item_number, design_name, material, main_stone, bp_msrp,
        canonical_photo_url, type_prefix,
        collection:collections(name)
      )
    )
  )
`

export async function getFulfillmentQueue(
  supabase: SupabaseClient,
  repId: string
): Promise<FulfillmentQueueItem[]> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')

  const { data, error } = await supabase
    .from('trade_fulfillment')
    .select(QUEUE_SELECT)
    .neq('fulfillment_status', 'completed')
    .order('status_updated_at', { ascending: true })
  if (error) throw error

  type RawDesign = {
    id: string
    item_number: string
    design_name: string
    material: string | null
    main_stone: string | null
    bp_msrp: number | null
    canonical_photo_url: string | null
    type_prefix: TradeListingWithDesign['manual_type_prefix']
    collection: { name: string } | { name: string }[] | null
  }
  type RawListing = {
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
  type RawRequest = {
    id: string
    customer_name: string
    listing: RawListing | RawListing[] | null
  }
  type RawRow = {
    id: string
    fulfillment_status: FulfillmentStatus
    status_updated_at: string
    request: RawRequest | RawRequest[] | null
  }

  const now = Date.now()
  const items: FulfillmentQueueItem[] = []
  for (const row of (data ?? []) as unknown as RawRow[]) {
    const req = Array.isArray(row.request) ? row.request[0] : row.request
    if (!req) continue
    const lst = Array.isArray(req.listing) ? req.listing[0] : req.listing
    if (!lst || lst.rep_id !== repId) continue
    const design = Array.isArray(lst.design) ? lst.design[0] : lst.design
    const collectionRel = design?.collection
    const collection = Array.isArray(collectionRel) ? collectionRel[0] : collectionRel
    const display = getTradeListingDisplayFields({
      id: '',
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
      created_at: row.status_updated_at,
      updated_at: row.status_updated_at,
      design: design
        ? {
            id: design.id,
            item_number: design.item_number,
            design_name: design.design_name,
            material: design.material,
            main_stone: design.main_stone,
            bp_msrp: design.bp_msrp,
            canonical_photo_url: design.canonical_photo_url,
            type_prefix: design.type_prefix ?? 'RG',
            collection: collection ? { id: '', name: collection.name } : null,
          }
        : null,
    } as TradeListingWithDesign)
    const updatedAt = new Date(row.status_updated_at).getTime()
    items.push({
      fulfillmentId: row.id,
      requestId: req.id,
      status: row.fulfillment_status,
      customerName: req.customer_name,
      designName: display.designName,
      itemNumber: display.itemNumber,
      statusUpdatedAt: row.status_updated_at,
      daysSinceLastUpdate: Math.max(0, Math.floor((now - updatedAt) / 86_400_000)),
    })
  }

  return items
}
