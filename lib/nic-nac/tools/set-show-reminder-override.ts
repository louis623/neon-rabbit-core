import { z } from 'zod'
import { tool } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { setShowReminderOverride } from '@/lib/services/show-reminder-preferences'
import { ServiceError } from '@/lib/services/errors'
import { writeTradeActionAudit } from '@/lib/nic-nac/audit'
import { logIncident } from '@/lib/nic-nac/guardian-telemetry'
import { NicNacToolError } from '@/lib/nic-nac/errors'
import type { ToolDefinition } from './types'

const inputSchema = z.object({
  eventId: z.string().uuid(),
  enabled: z.boolean().optional(),
  channels: z.array(z.enum(['sms', 'email'])).min(1).max(2).optional(),
  leadMinutes: z.number().int().min(15).max(180).optional(),
  includeDiscountCodes: z.boolean().optional(),
  includeFeaturedCollections: z.boolean().optional(),
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

export function makeSetShowReminderOverrideTool(ctx: {
  repId: string
  supabase: SupabaseClient
  conversationId: string
  runId: string
}) {
  return tool({
    description:
      'Save reminder settings for one specific show only. Use for requests like "turn off SMS reminders for tonight but keep email." ' +
      'This does not send SMS or email immediately. Requires rep confirmation.',
    inputSchema,
    needsApproval: true,
    execute: async ({ eventId, ...patch }) => {
      let override: Awaited<ReturnType<typeof setShowReminderOverride>>
      try {
        override = await setShowReminderOverride(ctx.supabase, ctx.repId, eventId, patch)
      } catch (err) {
        explainServiceError(err)
      }

      try {
        await writeTradeActionAudit({
          actionType: 'set_show_reminder_override',
          repId: ctx.repId,
          targetListingId: null,
          beforeState: { eventId, repId: ctx.repId },
          afterState: { ...override },
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
              toolName: 'set_show_reminder_override',
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
        success: true,
        override,
        sendsTriggered: false,
      }
    },
  })
}

export const setShowReminderOverrideTool: ToolDefinition = {
  name: 'set_show_reminder_override',
  readOnly: false,
  build: (ctx) =>
    makeSetShowReminderOverrideTool({
      repId: ctx.repId,
      supabase: ctx.supabase,
      conversationId: ctx.conversationId,
      runId: ctx.runId,
    }),
}
