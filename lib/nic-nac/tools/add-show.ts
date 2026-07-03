import { z } from 'zod'
import { tool } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { addShow } from '@/lib/services/calendar'
import { ServiceError } from '@/lib/services/errors'
import { NicNacToolError } from '@/lib/nic-nac/errors'
import type { ToolContext, ToolDefinition } from './types'

const inputSchema = z.object({
  platform: z.string(),
  eventTime: z.string(),
  timeZone: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  discountCodes: z.array(z.object({
    code: z.string().min(1),
    description: z.string(),
  })).max(10).optional(),
  featuredCollections: z.array(z.string()).optional(),
  recurring: z.object({
    cadence: z.enum(['daily', 'weekly']),
    duration: z.enum(['1_month', '3_months', 'ongoing']),
  }).optional(),
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

function calendarWorkflowAllowsRecurring(
  workflow: ToolContext['activeCalendarWorkflow'] | undefined,
) {
  if (!workflow) return true
  return Boolean(workflow.knownFields.recurring)
}

export function makeAddShowTool(ctx: {
  repId: string
  supabase: SupabaseClient
  activeCalendarWorkflow?: ToolContext['activeCalendarWorkflow']
}) {
  return tool({
    description:
      'Schedule a new show. Can schedule a one-time show or a recurring series. ' +
      'For recurring: ask the rep how often (daily or weekly) and how long (one month, three months, or ongoing). ' +
      'In the current build, ongoing schedules out about six months ahead. ' +
      'Discount codes support up to 10 per show as an array of {code, description} pairs.',
    inputSchema,
    execute: async (input) => {
      try {
        const safeInput =
          input.recurring && !calendarWorkflowAllowsRecurring(ctx.activeCalendarWorkflow)
            ? { ...input, recurring: undefined }
            : input
        const result = await addShow(ctx.supabase, ctx.repId, safeInput)
        const firstEvent = result.events[0] ?? null
        const lastEvent = result.events[result.events.length - 1] ?? null

        return {
          count: result.count,
          events: result.events,
          event: result.count === 1 ? firstEvent : null,
          summary:
            result.count === 1
              ? null
              : {
                  cadence: safeInput.recurring?.cadence ?? null,
                  startTime: firstEvent?.eventTime ?? null,
                  endTime: lastEvent?.eventTime ?? null,
                },
        }
      } catch (err) {
        explainServiceError(err)
      }
    },
  })
}

export const addShowTool: ToolDefinition = {
  name: 'add_show',
  readOnly: false,
  build: (ctx) =>
    makeAddShowTool({
      repId: ctx.repId,
      supabase: ctx.supabase,
      activeCalendarWorkflow: ctx.activeCalendarWorkflow,
    }),
}
