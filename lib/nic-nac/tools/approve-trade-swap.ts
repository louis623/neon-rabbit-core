// Tool: approve_trade_swap - HITL. Approves a live-show trade request while
// capturing the item number just revealed for the customer.

import { z } from 'zod'
import { tool } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'

import { approveTradeWithRevealedItemCapture } from '@/lib/services/trade-swaps'
import { ServiceError } from '@/lib/services/errors'
import { createAdminClient } from '@/lib/supabase/admin'
import { writeTradeActionAudit } from '@/lib/nic-nac/audit'
import { logIncident } from '@/lib/nic-nac/guardian-telemetry'
import { NicNacToolError } from '@/lib/nic-nac/errors'
import type { ToolDefinition } from './types'

const inputSchema = z.object({
  requestId: z.string().uuid(),
  revealedItemNumber: z.string().min(1),
  revealedRingSize: z.string().optional(),
  repNotes: z.string().optional(),
})

function explainServiceError(err: unknown): never {
  if (err instanceof ServiceError) {
    throw new NicNacToolError({
      code: err.code,
      userMessage: err.userMessage,
      cause: err,
    })
  }
  throw err
}

export function makeApproveTradeSwapTool(ctx: {
  repId: string
  supabase: SupabaseClient
  conversationId: string
  runId: string
}) {
  return tool({
    description:
      "Approve a live-show Trade Board swap for the authenticated rep. Ask the rep exactly: \"Which item number was just revealed for the customer?\" " +
      'Use this instead of plain approve_trade when approving an in-show swap: the customer gets the requested board piece, and Sparkle Suite captures the just-revealed item number so it can be added back to the board or finished after the show. ' +
      'If the revealed item is a ring and the rep knows the size, include revealedRingSize. Requires explicit user approval.',
    inputSchema,
    needsApproval: true,
    execute: async ({
      requestId,
      revealedItemNumber,
      revealedRingSize,
      repNotes,
    }) => {
      const admin = createAdminClient()

      let result: Awaited<ReturnType<typeof approveTradeWithRevealedItemCapture>>
      try {
        result = await approveTradeWithRevealedItemCapture(admin, ctx.repId, {
          requestId,
          revealedItemNumber,
          revealedRingSize,
          repNotes,
        })
      } catch (err) {
        explainServiceError(err)
      }

      try {
        await writeTradeActionAudit({
          actionType: 'trade_swap_approved',
          repId: ctx.repId,
          targetListingId: result.outgoingListingId,
          beforeState: {
            requestId,
            requestStatus: 'pending',
            listingId: result.outgoingListingId,
            listingStatus: 'pending_trade',
            repId: ctx.repId,
          },
          afterState: {
            requestId: result.requestId,
            requestStatus: 'approved',
            listingId: result.outgoingListingId,
            listingStatus: 'traded',
            fulfillmentId: result.fulfillmentId,
            revealedItemNumber: result.revealedItemNumber,
            revealedDesignId: result.revealedDesignId,
            replacementListingId: result.replacementListingId,
            replacementStatus: result.replacementStatus,
            repId: ctx.repId,
          },
          details: {
            runId: ctx.runId,
            conversationId: ctx.conversationId,
            replacementStatus: result.replacementStatus,
          },
        })
      } catch (auditErr) {
        console.error('[nic-nac] trade_action_audit write failed', {
          requestId,
          listingId: result.outgoingListingId,
          auditErr,
        })
        try {
          await logIncident({
            errorType: 'audit_write_failed',
            repId: ctx.repId,
            conversationId: ctx.conversationId,
            severity: 'warn',
            details: {
              toolName: 'approve_trade_swap',
              runId: ctx.runId,
              requestId,
              listingId: result.outgoingListingId,
              message: (auditErr as Error)?.message,
            },
          })
        } catch {
          /* swallow - observability must not affect outcome */
        }
      }

      return result
    },
  })
}

export const approveTradeSwapTool: ToolDefinition = {
  name: 'approve_trade_swap',
  readOnly: false,
  build: (ctx) =>
    makeApproveTradeSwapTool({
      repId: ctx.repId,
      supabase: ctx.supabase,
      conversationId: ctx.conversationId,
      runId: ctx.runId,
    }),
}
