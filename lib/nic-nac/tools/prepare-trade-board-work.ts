// Tool: prepare_trade_board_work - read-only resolver for TradeBoard work.
// It gives Nic-Nac the app-owned next path before write tools run.

import { z } from 'zod'
import { tool } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { searchJewelryDatabase } from '@/lib/services/jewelry-database'
import { getMyBoard } from '@/lib/services/trade-board'
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
  itemNumber: z.string().optional(),
  ringSize: z.string().optional(),
})

type ToolInput = z.infer<typeof inputSchema>

function searchQuery(input: ToolInput) {
  return input.itemNumber?.trim() || input.query?.trim() || ''
}

function exactOrSingleMatch(
  results: Awaited<ReturnType<typeof searchJewelryDatabase>>,
  input: ToolInput,
) {
  const normalizedItem = input.itemNumber?.trim().toUpperCase()
  if (normalizedItem) {
    const exact = results.find(
      (result) => result.itemNumber.toUpperCase() === normalizedItem,
    )
    if (exact) return exact
  }
  return results.length === 1 ? results[0] : null
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
          const itemNumber = listing.design.item_number.toUpperCase()
          const designName = listing.design.design_name.toUpperCase()
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
            itemNumber: listing.design.item_number,
            designName: listing.design.design_name,
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
      const match = exactOrSingleMatch(results, input)

      if (!match && results.length > 1) {
        return {
          action: input.action,
          catalogStatus: 'ambiguous',
          allowedPath: 'ask_for_catalog_match',
          candidates: results.map((result) => ({
            designId: result.designId,
            itemNumber: result.itemNumber,
            designName: result.designName,
            collectionName: result.collectionName,
            collectionYear: result.collectionYear,
          })),
          nextQuestion: 'Which matching piece should I use?',
          catalogDeletionAllowed: false,
        }
      }

      if (!match) {
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
