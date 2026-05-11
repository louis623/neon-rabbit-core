import { z } from 'zod'
import { tool } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getCustomerAudience } from '@/lib/services/customer-audience'
import { ServiceError } from '@/lib/services/errors'
import { ThumperToolError } from '@/lib/thumper/errors'
import type { ToolDefinition } from './types'

export const inputSchema = z.object({
  channelFilter: z.enum(['all', 'sms', 'email', 'marketing']).optional(),
  limit: z.number().int().min(1).max(100).optional(),
})

function explainServiceError(err: unknown): never {
  if (err instanceof ServiceError) {
    throw new ThumperToolError({
      code: err.code,
      userMessage: err.userMessage,
      cause: err,
    })
  }
  throw err
}

export function makeCustomerAudienceTool(ctx: {
  repId: string
  supabase: SupabaseClient
}) {
  return tool({
    description:
      "List the authenticated rep's saved customer audience and subscriber counts. " +
      'Use this when the rep asks for their customer list, subscriber list, who can receive texts, who can receive emails, or how many opt-ins they have right now. ' +
      'Supports optional channelFilter (all, sms, email, marketing) and limit for the returned customer rows.',
    inputSchema,
    execute: async ({ channelFilter, limit }) => {
      try {
        return await getCustomerAudience(ctx.supabase, ctx.repId, {
          channelFilter,
          limit,
        })
      } catch (err) {
        explainServiceError(err)
      }
    },
  })
}

export const customerAudienceTool: ToolDefinition = {
  name: 'get_customer_audience',
  readOnly: true,
  build: (ctx) =>
    makeCustomerAudienceTool({ repId: ctx.repId, supabase: ctx.supabase }),
}
