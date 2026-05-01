import { z } from 'zod'
import { tool } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { addShow } from '@/lib/services/calendar'
import { ServiceError } from '@/lib/services/errors'
import { ThumperToolError } from '@/lib/thumper/errors'
import type { ToolDefinition } from './types'

const inputSchema = z.object({
  platform: z.string(),
  eventTime: z.string(),
  durationMinutes: z.number().int().positive().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  discountCode: z.string().optional(),
  discountDescription: z.string().optional(),
  featuredCollections: z.array(z.string()).optional(),
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

export function makeAddShowTool(ctx: { repId: string; supabase: SupabaseClient }) {
  return tool({
    description:
      'Schedule a new show. Requires platform (where to stream) and event time. ' +
      'Optional: title, duration, description, discount code, discount description, and featured collections.',
    inputSchema,
    execute: async (input) => {
      try {
        return await addShow(ctx.supabase, ctx.repId, input)
      } catch (err) {
        explainServiceError(err)
      }
    },
  })
}

export const addShowTool: ToolDefinition = {
  name: 'add_show',
  readOnly: false,
  build: (ctx) => makeAddShowTool({ repId: ctx.repId, supabase: ctx.supabase }),
}
