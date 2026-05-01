import { z } from 'zod'
import { tool } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { listMyShows } from '@/lib/services/calendar'
import { ServiceError } from '@/lib/services/errors'
import { ThumperToolError } from '@/lib/thumper/errors'
import type { ToolDefinition } from './types'

const inputSchema = z.object({
  upcoming: z.boolean().optional(),
  limit: z.number().int().positive().max(20).optional(),
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

export function makeListMyShowsTool(ctx: { repId: string; supabase: SupabaseClient }) {
  return tool({
    description:
      "Get the rep's upcoming shows. Defaults to upcoming scheduled shows. " +
      'Set upcoming=false to see past shows too.',
    inputSchema,
    execute: async ({ upcoming, limit }) => {
      let result: Awaited<ReturnType<typeof listMyShows>>
      try {
        result = await listMyShows(ctx.supabase, ctx.repId, { upcoming, limit })
      } catch (err) {
        explainServiceError(err)
      }

      return {
        count: result.events.length,
        totalCount: result.totalCount,
        events: result.events.map((event) => ({
          eventId: event.id,
          platform: event.platform,
          eventTime: event.eventTime,
          durationMinutes: event.durationMinutes,
          title: event.title,
          description: event.description,
          discountCodes: event.discountCodes,
          discountCodesSummary: event.discountCodes.length
            ? event.discountCodes
                .map((discountCode) => `${discountCode.code} (${discountCode.description})`)
                .join(', ')
            : null,
          featuredCollections: event.featuredCollections,
          isRecurring: event.isRecurring,
          recurrenceGroupId: event.recurrenceGroupId,
          recurrenceRule: event.recurrenceRule,
          status: event.status,
        })),
      }
    },
  })
}

export const listMyShowsTool: ToolDefinition = {
  name: 'list_my_shows',
  readOnly: true,
  build: (ctx) => makeListMyShowsTool({ repId: ctx.repId, supabase: ctx.supabase }),
}
