import { z } from 'zod'
import { tool } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { addShow } from '@/lib/services/calendar'
import { ServiceError } from '@/lib/services/errors'
import { NicNacToolError } from '@/lib/nic-nac/errors'
import { reconcileAddShowInputWithCalendarPlan } from '@/lib/nic-nac/workflows/calendar-plan'
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
    cadence: z.enum(['daily', 'weekly', 'weekday']),
    duration: z.enum(['1_month', '3_months', 'ongoing']),
    occurrenceCount: z.number().int().min(1).max(180).optional(),
    mode: z.enum(['exact_count', 'series']).optional(),
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

export function makeAddShowTool(ctx: {
  repId: string
  supabase: SupabaseClient
  latestUserText?: string
  activeCalendarWorkflow?: ToolContext['activeCalendarWorkflow']
}) {
  return tool({
    description:
      'Schedule a new show when the rep explicitly asks to add, create, put, or schedule one on the Calendar. Use this write tool even when the immediately preceding turn was a Calendar read; an empty read result does not answer or block a later add request. Ask only for a missing required scheduling fact and never repeat the earlier read as the answer to an add request. Can schedule a one-time show or a recurring series. ' +
      'For recurring: ask the rep how often (daily, weekly, or weekday/Monday-Friday) and how long (a specific number of times, one month, three months, or ongoing). ' +
      'If the rep says a bounded count like "twice" or "next two Tuesdays", pass recurring.occurrenceCount and create exactly that many entries. ' +
      'In the current build, ongoing schedules out about six months ahead. ' +
      'Discount codes support up to 10 per show as an array of {code, description} pairs.',
    inputSchema,
    execute: async (input) => {
      try {
        const { input: safeInput, plan } = reconcileAddShowInputWithCalendarPlan({
          input,
          latestUserText: ctx.latestUserText,
          activeCalendarWorkflow: ctx.activeCalendarWorkflow,
        })
        const result = await addShow(ctx.supabase, ctx.repId, safeInput)
        const firstEvent = result.events[0] ?? null
        const lastEvent = result.events[result.events.length - 1] ?? null

        return {
          calendarPlan: plan,
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
      latestUserText: ctx.latestUserText,
      activeCalendarWorkflow: ctx.activeCalendarWorkflow,
    }),
}
