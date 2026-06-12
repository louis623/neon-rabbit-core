import { z } from 'zod'
import { tool } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { endShow } from '@/lib/services/calendar'
import { ServiceError } from '@/lib/services/errors'
import { writeTradeActionAudit } from '@/lib/nic-nac/audit'
import { logIncident } from '@/lib/nic-nac/guardian-telemetry'
import { NicNacToolError } from '@/lib/nic-nac/errors'
import type { ToolDefinition } from './types'

const inputSchema = z.object({
  eventId: z.string().uuid(),
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

export function makeEndShowTool(ctx: {
  repId: string
  supabase: SupabaseClient
  conversationId: string
  runId: string
}) {
  return tool({
    description:
      'Mark a live show completed after the rep says the show is over. ' +
      'Only works for shows that are currently live.',
    inputSchema,
    execute: async ({ eventId }) => {
      let result: Awaited<ReturnType<typeof endShow>>
      try {
        result = await endShow(ctx.supabase, ctx.repId, eventId)
      } catch (err) {
        explainServiceError(err)
      }

      try {
        await writeTradeActionAudit({
          actionType: 'end_show',
          repId: ctx.repId,
          targetListingId: null,
          beforeState: {
            eventId,
            repId: ctx.repId,
            status: 'live',
          },
          afterState: {
            eventId: result.event.id,
            repId: ctx.repId,
            status: 'completed',
          },
          details: {
            runId: ctx.runId,
            conversationId: ctx.conversationId,
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
              toolName: 'end_show',
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
      }
    },
  })
}

export const endShowTool: ToolDefinition = {
  name: 'end_show',
  readOnly: false,
  build: (ctx) =>
    makeEndShowTool({
      repId: ctx.repId,
      supabase: ctx.supabase,
      conversationId: ctx.conversationId,
      runId: ctx.runId,
    }),
}
