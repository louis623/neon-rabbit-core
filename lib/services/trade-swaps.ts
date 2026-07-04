import type { SupabaseClient } from '@supabase/supabase-js'

import { addListing } from '@/lib/services/trade-board'
import { approveTrade } from '@/lib/services/trade-requests'
import { ServiceError, errors } from '@/lib/services/errors'
import { resolveItemNumber } from '@/lib/services/jewelry-database'
import type {
  ApproveTradeSwapInput,
  ApproveTradeSwapResult,
  JewelryType,
  ResolveTradeSwapReplacementInput,
  ResolveTradeSwapReplacementResult,
  TradeSwapCleanupItem,
  TradeSwapReplacementStatus,
} from '@/lib/services/types'

type CleanupRow = {
  id: string
  request_id: string
  outgoing_listing_id: string
  revealed_item_number: string
  revealed_ring_size: string | null
  replacement_status: TradeSwapReplacementStatus
  created_at: string
  request:
    | {
        customer_name: string
        listing:
          | {
              rep_id: string
            }
          | Array<{
              rep_id: string
            }>
          | null
      }
    | Array<{
        customer_name: string
        listing:
          | {
              rep_id: string
            }
          | Array<{
              rep_id: string
            }>
          | null
      }>
    | null
}

function normalizeItemNumber(value: string) {
  return value.trim().toUpperCase()
}

function normalizeOptionalText(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function isRingType(typePrefix: JewelryType) {
  return typePrefix === 'RG'
}

export async function approveTradeWithRevealedItemCapture(
  supabase: SupabaseClient,
  repId: string,
  input: ApproveTradeSwapInput,
): Promise<ApproveTradeSwapResult> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')
  if (!input.requestId) throw errors.MISSING_ITEM_INPUT()

  const revealedItemNumber = normalizeItemNumber(input.revealedItemNumber)
  if (!revealedItemNumber) {
    throw errors.INVALID_INPUT(
      'revealedItemNumber required',
      'I need the item number that was just revealed for the customer.',
    )
  }

  const approved = await approveTrade(
    supabase,
    repId,
    input.requestId,
    input.repNotes,
  )

  const resolvedDesign = await resolveItemNumber(supabase, revealedItemNumber, {
    material: input.revealedMaterial,
  })
  const revealedRingSize = normalizeOptionalText(input.revealedRingSize)
  let replacementStatus: TradeSwapReplacementStatus = 'needs_catalog_details'
  let revealedDesignId: string | null = null
  let replacementListingId: string | null = null

  if (resolvedDesign.found) {
    revealedDesignId = resolvedDesign.design.id
    if (isRingType(resolvedDesign.design.typePrefix) && !revealedRingSize) {
      replacementStatus = 'needs_ring_size'
    } else {
      try {
        const replacement = await addListing(supabase, repId, {
          itemNumber: revealedItemNumber,
          material: input.revealedMaterial,
          ringSize: revealedRingSize,
          repNotes: `Added from approved trade swap for ${approved.customerName}.`,
        })
        replacementListingId = replacement.listingId
        replacementStatus = 'added_to_board'
      } catch (err) {
        if (!expectedReplacementCleanupError(err)) throw err
        replacementStatus = 'needs_catalog_details'
      }
    }
  }

  const { data: swapRow, error: swapError } = await supabase
    .from('trade_swaps')
    .insert({
      request_id: approved.requestId,
      outgoing_listing_id: approved.listingId,
      revealed_item_number: revealedItemNumber,
      revealed_ring_size: revealedRingSize ?? null,
      revealed_design_id: revealedDesignId,
      replacement_listing_id: replacementListingId,
      replacement_status: replacementStatus,
      rep_notes: input.repNotes ?? null,
    })
    .select('id, replacement_status')
    .single()
  if (swapError) throw swapError

  return {
    swapId: swapRow.id as string,
    requestId: approved.requestId,
    fulfillmentId: approved.fulfillmentId,
    outgoingListingId: approved.listingId,
    customerName: approved.customerName,
    revealedItemNumber,
    revealedDesignId,
    replacementListingId,
    replacementStatus,
  }
}

function expectedReplacementCleanupError(err: unknown): boolean {
  return (
    err instanceof ServiceError &&
    ['NEEDS_COLLECTION', 'NEEDS_FULL_INFO', 'NEEDS_MATERIAL_VARIANT'].includes(err.code)
  )
}

function getSingleRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

export async function getTradeSwapCleanupQueue(
  supabase: SupabaseClient,
  repId: string,
): Promise<TradeSwapCleanupItem[]> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')

  const { data, error } = await supabase
    .from('trade_swaps')
    .select(
      `
        id, request_id, outgoing_listing_id, revealed_item_number,
        revealed_ring_size, replacement_status, created_at,
        request:trade_requests!inner(
          customer_name,
          listing:trade_listings!inner(rep_id)
        )
      `,
    )
    .eq('request.listing.rep_id', repId)
    .neq('replacement_status', 'added_to_board')
    .order('created_at', { ascending: false })
  if (error) throw error

  const items: TradeSwapCleanupItem[] = []
  for (const row of (data ?? []) as unknown as CleanupRow[]) {
    const request = getSingleRelation(row.request)
    if (!request) continue
    const listing = getSingleRelation(request.listing)
    if (!listing || listing.rep_id !== repId) continue

    items.push({
      swapId: row.id,
      requestId: row.request_id,
      customerName: request.customer_name,
      outgoingListingId: row.outgoing_listing_id,
      revealedItemNumber: row.revealed_item_number,
      revealedRingSize: row.revealed_ring_size,
      replacementStatus: row.replacement_status,
      createdAt: row.created_at,
    })
  }

  return items
}

export async function resolveTradeSwapReplacementListing(
  supabase: SupabaseClient,
  repId: string,
  input: ResolveTradeSwapReplacementInput,
): Promise<ResolveTradeSwapReplacementResult> {
  if (!repId) throw errors.UNAUTHORIZED('repId required')
  if (!input.swapId || !input.replacementListingId) {
    throw errors.INVALID_INPUT(
      'swapId and replacementListingId required',
      'I need the cleanup item and the new listing before I can close that swap cleanup.',
    )
  }

  const { data: listingRow, error: listingError } = await supabase
    .from('trade_listings')
    .select('id, rep_id')
    .eq('id', input.replacementListingId)
    .maybeSingle()
  if (listingError) throw listingError
  if (!listingRow) throw errors.LISTING_NOT_FOUND(input.replacementListingId)
  if ((listingRow as { rep_id?: string }).rep_id !== repId) {
    throw errors.UNAUTHORIZED('replacement listing belongs to another rep')
  }

  const { data: swapRow, error: swapError } = await supabase
    .from('trade_swaps')
    .select(
      `
        id, request_id,
        request:trade_requests!inner(
          listing:trade_listings!inner(rep_id)
        )
      `,
    )
    .eq('id', input.swapId)
    .maybeSingle()
  if (swapError) throw swapError
  if (!swapRow) throw errors.LISTING_NOT_FOUND(`swap ${input.swapId}`)

  const request = getSingleRelation(
    (swapRow as {
      request:
        | { listing: { rep_id: string } | Array<{ rep_id: string }> | null }
        | Array<{ listing: { rep_id: string } | Array<{ rep_id: string }> | null }>
        | null
    }).request,
  )
  const ownerListing = request ? getSingleRelation(request.listing) : null
  if (!ownerListing || ownerListing.rep_id !== repId) {
    throw errors.UNAUTHORIZED('swap belongs to another rep')
  }

  const requestId = (swapRow as { request_id: string }).request_id
  const { data: updatedSwap, error: updateSwapError } = await supabase
    .from('trade_swaps')
    .update({
      replacement_listing_id: input.replacementListingId,
      replacement_status: 'added_to_board',
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.swapId)
    .select('id, request_id, replacement_listing_id, replacement_status')
    .single()
  if (updateSwapError) throw updateSwapError

  const { data: fulfillmentRow, error: fulfillmentError } = await supabase
    .from('trade_fulfillment')
    .update({
      received_listing_id: input.replacementListingId,
      status_updated_at: new Date().toISOString(),
    })
    .eq('request_id', requestId)
    .select('id')
    .maybeSingle()
  if (fulfillmentError) throw fulfillmentError

  return {
    swapId: updatedSwap.id as string,
    requestId: updatedSwap.request_id as string,
    replacementListingId: updatedSwap.replacement_listing_id as string,
    replacementStatus: 'added_to_board',
    fulfillmentId: (fulfillmentRow as { id?: string } | null)?.id ?? null,
  }
}
