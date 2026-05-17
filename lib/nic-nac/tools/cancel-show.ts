import { z } from 'zod'
import { tool } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cancelShow } from '@/lib/services/calendar'
import { ServiceError } from '@/lib/services/errors'
import { writeTradeActionAudit } from '@/lib/nic-nac/audit'
import { logIncident } from '@/lib/nic-nac/guardian-telemetry'
import { NicNacToolError } from '@/lib/nic-nac/errors'
import type { ToolDefinition } from './types'

const inputSchema = z.object({
  eventId: z.string().uuid(),
  reason: z.string().optional(),
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

export function makeCancelShowTool(ctx: {
  repId: string
  supabase: SupabaseClient
  conversationId: string
  runId: string
}) {
  return tool({
    description:
      'Cancel a scheduled or live show. Requires confirmation from the rep before executing. ' +
      "Cannot cancel shows that are already completed or cancelled.",
    inputSchema,
    needsApproval: true,
    execute: async ({ eventId, reason }) => {
      let result: Awaited<ReturnType<typeof cancelShow>>
      try {
        result = await cancelShow(ctx.supabase, ctx.repId, eventId, reason)
      } catch (err) {
        explainServiceError(err)
      }

      try {
        await writeTradeActionAudit({
          actionType: 'cancel_show',
          repId: ctx.repId,
          targetListingId: null,
          beforeState: {
            eventId,
            repId: ctx.repId,
            status: 'scheduled_or_live',
          },
          afterState: {
            eventId: result.event.id,
            repId: ctx.repId,
            status: 'cancelled',
          },
          details: {
            runId: ctx.runId,
            conversationId: ctx.conversationId,
            reason: reason ?? null,
          },
        })
      } catch (auditErr) {
        console.error('[nic-nac] trade_action_audit write failed', {
          eventId,
          auditErr,
        })
        try {
          await logIncident({
            errorType: 'audit_write_failed',
            repId: ctx.repId,
            conversationId: ctx.conversationId,
            severity: 'warn',
            details: {
              toolName: 'cancel_show',
              runId: ctx.runId,
              eventId,
              message: (auditErr as Error)?.message,
            },
          })
        } catch {
          /* swallow */
        }
      }

      return {
        event: result.event,
        reason: reason ?? null,
      }
    },
  })
}

export const cancelShowTool: ToolDefinition = {
  name: 'cancel_show',
  readOnly: false,
  build: (ctx) =>
    makeCancelShowTool({
      repId: ctx.repId,
      supabase: ctx.supabase,
      conversationId: ctx.conversationId,
      runId: ctx.runId,
    }),
}
