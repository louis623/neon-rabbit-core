import type { SupabaseClient } from '@supabase/supabase-js'

import { addListing } from '@/lib/services/trade-board'
import { approveTrade } from '@/lib/services/trade-requests'
import { errors } from '@/lib/services/errors'
import type {
  ApproveTradeSwapInput,
  ApproveTradeSwapResult,
  JewelryType,
  TradeSwapCleanupItem,
  TradeSwapReplacementStatus,
} from '@/lib/services/types'

type RevealedDesignRow = {
  id: string
  item_number: string
  type_prefix: JewelryType
}

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

  const { data: design, error: designError } = await supabase
    .from('jewelry_designs')
    .select('id, item_number, type_prefix')
    .eq('item_number', revealedItemNumber)
    .maybeSingle()
  if (designError) throw designError

  const revealedDesign = design as RevealedDesignRow | null
  const revealedRingSize = normalizeOptionalText(input.revealedRingSize)
  let replacementStatus: TradeSwapReplacementStatus = 'needs_catalog_details'
  let revealedDesignId: string | null = null
  let replacementListingId: string | null = null

  if (revealedDesign) {
    revealedDesignId = revealedDesign.id
    if (isRingType(revealedDesign.type_prefix) && !revealedRingSize) {
      replacementStatus = 'needs_ring_size'
    } else {
      const replacement = await addListing(supabase, repId, {
        itemNumber: revealedItemNumber,
        ringSize: revealedRingSize,
        repNotes: `Added from approved trade swap for ${approved.customerName}.`,
      })
      replacementListingId = replacement.listingId
      replacementStatus = 'added_to_board'
    }
  }

  const { error: swapError } = await supabase
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
