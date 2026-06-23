import { z } from 'zod'
import { tool } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { setShowReminderPreferences } from '@/lib/services/show-reminder-preferences'
import { ServiceError } from '@/lib/services/errors'
import { writeTradeActionAudit } from '@/lib/nic-nac/audit'
import { logIncident } from '@/lib/nic-nac/guardian-telemetry'
import { NicNacToolError } from '@/lib/nic-nac/errors'
import type { ToolDefinition } from './types'

const inputSchema = z.object({
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

export function makeSetNotificationPreferencesTool(ctx: {
  repId: string
  supabase: SupabaseClient
  conversationId: string
  runId: string
}) {
  return tool({
    description:
      'Save the rep default customer reminder preferences for future shows. ' +
      'Use for requests like "text my customers 45 minutes before every show" or "email reminders only". ' +
      'This does not send any SMS or email immediately. Requires rep confirmation.',
    inputSchema,
    needsApproval: true,
    execute: async (input) => {
      let preferences: Awaited<ReturnType<typeof setShowReminderPreferences>>
      try {
        preferences = await setShowReminderPreferences(ctx.supabase, ctx.repId, input)
      } catch (err) {
        explainServiceError(err)
      }

      try {
        await writeTradeActionAudit({
          actionType: 'set_notification_preferences',
          repId: ctx.repId,
          targetListingId: null,
          beforeState: { repId: ctx.repId },
          afterState: { ...preferences },
          details: {
            runId: ctx.runId,
            conversationId: ctx.conversationId,
          },
        })
      } catch (auditErr) {
        console.error('[nic-nac] trade_action_audit write failed', {
          repId: ctx.repId,
          auditErr,
        })
        try {
          await logIncident({
            errorType: 'audit_write_failed',
            repId: ctx.repId,
            conversationId: ctx.conversationId,
            severity: 'warn',
            details: {
              toolName: 'set_notification_preferences',
              runId: ctx.runId,
              message: (auditErr as Error)?.message,
            },
          })
        } catch {
          /* swallow */
        }
      }

      return {
        success: true,
        preferences,
        sendsTriggered: false,
      }
    },
  })
}

export const setNotificationPreferencesTool: ToolDefinition = {
  name: 'set_notification_preferences',
  readOnly: false,
  build: (ctx) =>
    makeSetNotificationPreferencesTool({
      repId: ctx.repId,
      supabase: ctx.supabase,
      conversationId: ctx.conversationId,
      runId: ctx.runId,
    }),
}
