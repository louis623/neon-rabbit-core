import { tool } from 'ai'
import { z } from 'zod'

import { getShowReminderPreferences } from '@/lib/services/show-reminder-preferences'
import { ServiceError } from '@/lib/services/errors'
import { NicNacToolError } from '@/lib/nic-nac/errors'
import type { ToolDefinition } from './types'

export const inputSchema = z.object({})

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

export function makeGetNotificationPreferencesTool(ctx: {
  repId: string
  supabase: import('@supabase/supabase-js').SupabaseClient
  conversationId: string
  runId: string
}) {
  return tool({
    description:
      'Read the rep default show reminder preferences for customer SMS/email reminders. Does not send anything.',
    inputSchema,
    execute: async () => {
      try {
        const preferences = await getShowReminderPreferences(ctx.supabase, ctx.repId)
        return {
          success: true,
          preferences,
          sendsTriggered: false,
        }
      } catch (err) {
        explainServiceError(err)
      }
    },
  })
}

export const getNotificationPreferencesTool: ToolDefinition = {
  name: 'get_notification_preferences',
  readOnly: true,
  build: (ctx) =>
    makeGetNotificationPreferencesTool({
      repId: ctx.repId,
      supabase: ctx.supabase,
      conversationId: ctx.conversationId,
      runId: ctx.runId,
    }),
}
