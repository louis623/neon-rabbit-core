// Tool: prepare_trade_board_work - read-only resolver for TradeBoard work.
// It gives Nic-Nac the app-owned next path before write tools run.

import { z } from 'zod'
import { tool } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  normalizeJewelryMaterialKey,
  searchJewelryDatabase,
} from '@/lib/services/jewelry-database'
import { getMyBoard } from '@/lib/services/trade-board'
import { getTradeListingDisplayFields } from '@/lib/services/trade-listing-display'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ToolDefinition } from './types'

const inputSchema = z.object({
  action: z.enum([
    'add_piece',
    'remove_piece',
    'facilitate_trade',
    'catalog_correction',
    'view_board',
    'unknown',
  ]),
  query: z.string().optional(),
  catalogMode: z.enum(['item_number', 'non_item_number']).optional(),
  itemNumber: z.string().optional(),
  jewelryType: z.enum(['RG', 'NK', 'ER', 'ST', 'BR']).optional(),
  collectionFamily: z.string().optional(),
  material: z.string().optional(),
  ringSize: z.string().optional(),
})

type ToolInput = z.infer<typeof inputSchema>

function searchQuery(input: ToolInput) {
  return input.itemNumber?.trim() || input.query?.trim() || ''
}

function variantCandidate(result: Awaited<ReturnType<typeof searchJewelryDatabase>>[number]) {
  return {
    designId: result.designId,
    itemNumber: result.itemNumber,
    designName: result.designName,
    material: result.material,
    mainStone: result.mainStone,
    collectionName: result.collectionName,
    collectionYear: result.collectionYear,
    isOnMyBoard: result.isOnMyBoard,
    activeListingsCount: result.activeListingsCount,
  }
}

function resolveCatalogMatch(
  results: Awaited<ReturnType<typeof searchJewelryDatabase>>,
  input: ToolInput,
) {
  const normalizedItem = input.itemNumber?.trim().toUpperCase()
  const materialKey = normalizeJewelryMaterialKey(input.material)
  if (normalizedItem) {
    const exactMatches = results.filter(
      (result) => result.itemNumber.toUpperCase() === normalizedItem,
    )
    if (materialKey && exactMatches.length > 0) {
      const materialMatch = exactMatches.find(
        (result) => normalizeJewelryMaterialKey(result.material) === materialKey,
      )
      if (materialMatch) return { kind: 'match' as const, match: materialMatch }
      return {
        kind: 'variant_not_found' as const,
        candidates: exactMatches.map(variantCandidate),
      }
    }
    if (exactMatches.length === 1) {
      return { kind: 'match' as const, match: exactMatches[0] }
    }
    if (exactMatches.length > 1) {
      return {
        kind: 'variant_ambiguous' as const,
        candidates: exactMatches.map(variantCandidate),
      }
    }
  }
  if (results.length === 1) return { kind: 'match' as const, match: results[0] }
  if (results.length > 1) {
    return {
      kind: 'ambiguous' as const,
      candidates: results.map(variantCandidate),
    }
  }
  return { kind: 'not_found' as const }
}

export function makePrepareTradeBoardWorkTool(ctx: {
  repId: string
  supabase: SupabaseClient
}) {
  return tool({
    description:
      'Read-only resolver for TradeBoard and jewelry database work. Use this first when the rep wants to add, remove, view, facilitate, or correct TradeBoard/jewelry database work. It decides whether the item is an existing catalog design, a new catalog intake, a board-management action, or a trade-request workflow before write tools run.',
    inputSchema,
    execute: async (input) => {
      if (input.action === 'remove_piece') {
        const board = await getMyBoard(ctx.supabase, ctx.repId, {
          statusFilter: 'available',
          limit: 50,
        })
        const needle = searchQuery(input).toUpperCase()
        const matches = board.listings.filter((listing) => {
          const display = getTradeListingDisplayFields(listing)
          const itemNumber = display.itemNumber?.toUpperCase() ?? ''
          const designName = display.designName.toUpperCase()
          return needle
            ? itemNumber.includes(needle) || designName.includes(needle)
            : true
        })
        return {
          action: input.action,
          allowedPath: 'remove_rep_trade_board_listing',
          nextTool: 'remove_listing',
          requiresApproval: true,
          catalogDeletionAllowed: false,
          boardMatches: matches.map((listing) => ({
            listingId: listing.id,
            itemNumber: getTradeListingDisplayFields(listing).itemNumber,
            designName: getTradeListingDisplayFields(listing).designName,
            status: listing.status,
          })),
          guidance:
            'Remove only the rep TradeBoard listing, and use remove_listing because it has the approval dialog. Do not remove or delete the shared jewelry database record.',
        }
      }

      if (input.action === 'facilitate_trade') {
        return {
          action: input.action,
          allowedPath: 'trade_request_workflow',
          nextTool: 'get_trade_requests',
          requiresApproval: false,
          catalogDeletionAllowed: false,
          guidance:
            'Use trade-request tools for customer swap facilitation. The rep approves or rejects the trade; Nic-Nac does not approve trades by judgment alone.',
        }
      }

      if (input.action === 'catalog_correction') {
        return {
          action: input.action,
          allowedPath: 'catalog_correction_request',
          nextTool: 'report_jewelry_catalog_issue',
          requiresApproval: false,
          catalogDeletionAllowed: false,
          guidance:
            'Use catalog correction tools for bad shared data or photos. Destructive jewelry database deletion is not available to Nic-Nac.',
        }
      }

      if (input.catalogMode === 'non_item_number') {
        const requiredBeforeAction = [
          ...(input.jewelryType ? [] : ['jewelryType']),
          ...(input.collectionFamily ? [] : ['collectionFamily']),
          'jewelryFrontPhoto',
          ...(input.jewelryType === 'RG' && !input.ringSize ? ['ringSize'] : []),
        ]
        return {
          action: input.action,
          catalogStatus: 'not_applicable',
          allowedPath: 'add_non_item_number_trade_listing',
          requiredBeforeAction,
          nextTool: 'add_listing',
          catalogDeletionAllowed: false,
          nextQuestion:
            requiredBeforeAction.length > 0
              ? 'Collection Type and Size'
              : null,
          guidance:
            'The rep confirmed this is a non-item-number piece. Collect controlled jewelry type, collection, size when applicable, and a clear customer-facing jewelry photo, then call add_listing in non_item_number mode. Do not create or update jewelry_designs and do not invent an item number.',
        }
      }

      const query = searchQuery(input)
      if (!query) {
        return {
          action: input.action,
          catalogStatus: 'needs_identifying_info',
          allowedPath: 'ask_for_identifier',
          requiredBeforeAction: ['itemNumberOrLabelOrDescription'],
          nextQuestion:
            'Send the item number, a label/details photo, or a short description so I can check the jewelry database first.',
          catalogDeletionAllowed: false,
        }
      }

      const admin = createAdminClient()
      const results = await searchJewelryDatabase(admin, ctx.repId, {
        query,
        limit: 5,
      })
      const catalogMatch = resolveCatalogMatch(results, input)

      if (catalogMatch.kind === 'variant_ambiguous') {
        return {
          action: input.action,
          catalogStatus: 'variant_ambiguous',
          allowedPath: 'ask_for_variant_material',
          candidates: catalogMatch.candidates,
          nextQuestion: 'Which plating or material is this one?',
          catalogDeletionAllowed: false,
          guidance:
            'This item number has multiple catalog variants. Ask for the plating/material and then use the matching variant; do not treat a different plating as a catalog correction.',
        }
      }

      if (catalogMatch.kind === 'variant_not_found') {
        return {
          action: input.action,
          catalogStatus: 'variant_not_found',
          allowedPath: 'create_catalog_variant_then_add_listing',
          existingVariants: catalogMatch.candidates,
          requiredBeforeAction: [
            'itemNumber',
            'designName',
            'collectionName',
            'jewelryFrontPhoto',
          ],
          nextTool: 'add_listing',
          catalogDeletionAllowed: false,
          guidance:
            'This item number exists, but the provided plating/material is not one of the current catalog variants. A different plating is a new catalog variant, not a correction to the existing variant. Collect the new variant facts and customer-facing jewelry photo, then call add_listing with the material.',
        }
      }

      if (catalogMatch.kind === 'ambiguous') {
        return {
          action: input.action,
          catalogStatus: 'ambiguous',
          allowedPath: 'ask_for_catalog_match',
          candidates: catalogMatch.candidates,
          nextQuestion: 'Which matching piece should I use?',
          catalogDeletionAllowed: false,
        }
      }

      if (catalogMatch.kind === 'not_found') {
        return {
          action: input.action,
          catalogStatus: 'not_found',
          allowedPath: 'create_catalog_design_then_add_listing',
          requiredBeforeAction: [
            'itemNumber',
            'designName',
            'collectionName',
            'jewelryFrontPhoto',
          ],
          nextTool: 'add_listing',
          catalogDeletionAllowed: false,
          guidance:
            'This looks new to the shared jewelry database. label/details photos are facts only; collect readable item facts plus a customer-facing jewelry photo before creating the catalog design and adding the rep listing.',
        }
      }

      const match = catalogMatch.match
      const requiredBeforeAction =
        match.typePrefix === 'RG' && !input.ringSize ? ['ringSize'] : []

      return {
        action: input.action,
        catalogStatus: 'found',
        allowedPath: 'add_existing_catalog_design',
        design: {
          designId: match.designId,
          itemNumber: match.itemNumber,
          designName: match.designName,
          material: match.material,
          mainStone: match.mainStone,
          type: match.typePrefix,
          collectionName: match.collectionName,
          collectionYear: match.collectionYear,
          canonicalPhotoUrl: match.canonicalPhotoUrl,
          isOnMyBoard: match.isOnMyBoard,
          activeListingsCount: match.activeListingsCount,
        },
        requiredBeforeAction,
        nextQuestion:
          requiredBeforeAction.includes('ringSize')
            ? 'What ring size is this physical piece?'
            : match.isOnMyBoard
              ? 'That item number is already on your Trade Board. Are we adding a second physical piece of that same design?'
              : null,
        nextTool: 'add_listing',
        catalogDeletionAllowed: false,
        guidance:
          'This is already in the shared jewelry database. Use catalog metadata and the canonical catalog photo when available. Do not ask for a new jewelry photo unless the catalog has no usable photo or the rep specifically wants a custom listing photo.',
      }
    },
  })
}

export const prepareTradeBoardWorkTool: ToolDefinition = {
  name: 'prepare_trade_board_work',
  readOnly: true,
  build: (ctx) =>
    makePrepareTradeBoardWorkTool({
      repId: ctx.repId,
      supabase: ctx.supabase,
    }),
}
