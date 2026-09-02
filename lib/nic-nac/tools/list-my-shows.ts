import { z } from 'zod'
import { tool } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { listMyShows } from '@/lib/services/calendar'
import { ServiceError } from '@/lib/services/errors'
import { NicNacToolError } from '@/lib/nic-nac/errors'
import type { ToolDefinition } from './types'

const inputSchema = z.object({
  upcoming: z.boolean().optional(),
  limit: z.number().int().positive().max(20).optional(),
})

export type ListMyShowsToolInput = z.infer<typeof inputSchema>

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

export async function readMyShowsForNicNac(
  ctx: { repId: string; supabase: SupabaseClient },
  input: ListMyShowsToolInput = {},
) {
  let result: Awaited<ReturnType<typeof listMyShows>>
  try {
    result = await listMyShows(ctx.supabase, ctx.repId, input)
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
      timeZone: event.timeZone,
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
}

export function makeListMyShowsTool(ctx: { repId: string; supabase: SupabaseClient }) {
  return tool({
    description:
      "Directly read the rep's Calendar for questions such as what is scheduled now, today, tonight, next, or upcoming. Defaults to upcoming scheduled shows. " +
      'A Calendar read is complete after you answer from this result and must not control a later add, update, or unrelated request. Do not call prepare_calendar_work for a simple Calendar read. Set upcoming=false to see past shows too.',
    inputSchema,
    execute: async ({ upcoming, limit }) =>
      readMyShowsForNicNac(ctx, { upcoming, limit }),
  })
}

export const listMyShowsTool: ToolDefinition = {
  name: 'list_my_shows',
  readOnly: true,
  build: (ctx) => makeListMyShowsTool({ repId: ctx.repId, supabase: ctx.supabase }),
}
