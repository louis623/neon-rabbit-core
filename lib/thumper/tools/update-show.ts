import { z } from 'zod'
import { tool } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { updateShow } from '@/lib/services/calendar'
import { ServiceError } from '@/lib/services/errors'
import { writeTradeActionAudit } from '@/lib/thumper/audit'
import { logIncident } from '@/lib/thumper/guardian-telemetry'
import { ThumperToolError } from '@/lib/thumper/errors'
import type { ToolDefinition } from './types'

const inputSchema = z
  .object({
    eventId: z.string().uuid(),
    platform: z.string().optional(),
    eventTime: z.string().optional(),
    durationMinutes: z.number().int().positive().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    discountCode: z.string().optional(),
    discountDescription: z.string().optional(),
    featuredCollections: z.array(z.string()).optional(),
  })
  .refine(
    (value) =>
      value.platform !== undefined ||
      value.eventTime !== undefined ||
      value.durationMinutes !== undefined ||
      value.title !== undefined ||
      value.description !== undefined ||
      value.discountCode !== undefined ||
      value.discountDescription !== undefined ||
      value.featuredCollections !== undefined,
    { message: 'at least one patch field is required' },
  )

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

export function makeUpdateShowTool(ctx: {
  repId: string
  supabase: SupabaseClient
  conversationId: string
  runId: string
}) {
  return tool({
    description:
      "Update details on a scheduled show. Can change time, platform, title, description, discount code, or featured collections. " +
      "Only works on shows still in 'scheduled' status.",
    inputSchema,
    execute: async (input) => {
      const {
        eventId,
        platform,
        eventTime,
        durationMinutes,
        title,
        description,
        discountCode,
        discountDescription,
        featuredCollections,
      } = input

      const patch = {
        platform,
        eventTime,
        durationMinutes,
        title,
        description,
        discountCode,
        discountDescription,
        featuredCollections,
      }

      const patchedFields = Object.entries(patch)
        .filter(([, value]) => value !== undefined)
        .map(([key]) => key)

      if (patchedFields.length === 0) {
        throw new ThumperToolError({
          code: 'NO_PATCH_FIELDS',
          userMessage: 'Tell me what you want to change on that show.',
        })
      }

      let result: Awaited<ReturnType<typeof updateShow>>
      try {
        result = await updateShow(ctx.supabase, ctx.repId, eventId, patch)
      } catch (err) {
        explainServiceError(err)
      }

      try {
        await writeTradeActionAudit({
          actionType: 'update_show',
          repId: ctx.repId,
          targetListingId: null,
          beforeState: {
            eventId,
            repId: ctx.repId,
            status: 'scheduled',
          },
          afterState: {
            eventId: result.event.id,
            repId: ctx.repId,
            status: result.event.status,
            patchedFields,
          },
          details: { runId: ctx.runId, conversationId: ctx.conversationId },
        })
      } catch (auditErr) {
        console.error('[thumper] trade_action_audit write failed', {
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
              toolName: 'update_show',
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
        patchedFields,
      }
    },
  })
}

export const updateShowTool: ToolDefinition = {
  name: 'update_show',
  readOnly: false,
  build: (ctx) =>
    makeUpdateShowTool({
      repId: ctx.repId,
      supabase: ctx.supabase,
      conversationId: ctx.conversationId,
      runId: ctx.runId,
    }),
}
