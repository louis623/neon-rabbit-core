import { z } from 'zod'
import { tool } from 'ai'
import {
  isSameNicNacShowSessionAnchor,
  loadActiveNicNacShowSession,
  NicNacShowSessionConflictError,
  startNicNacShowSession,
} from '@/lib/nic-nac/show-sessions'
import { startShow } from '@/lib/services/calendar'
import { ServiceError } from '@/lib/services/errors'
import { NicNacToolError } from '@/lib/nic-nac/errors'
import type { ToolDefinition } from './types'

const inputSchema = z.object({
  calendarEventId: z.string().min(1).optional(),
  liveQueueSyncCode: z.string().min(1).optional(),
  metadata: z
    .record(
      z.string().min(1).max(64),
      z.union([z.string().max(500), z.number(), z.boolean(), z.null()]),
    )
    .refine((value) => Object.keys(value).length <= 12, {
      message: 'metadata supports at most 12 fields',
    })
    .optional(),
  replaceActiveSession: z.boolean().default(false),
})

export function makeStartShowSessionTool(ctx: {
  repId: string
  supabase: never
  conversationId: string
  runId: string
}) {
  return tool({
    description:
      "Start or reuse the authenticated rep's current live-show session state. " +
      'Use only when the rep says the live show is starting or explicitly asks for help during the live. ' +
      'If a different show session is already active, first explain that and call again with replaceActiveSession=true only when the rep wants to replace it; replacement shows a visible approval dialog.',
    inputSchema,
    needsApproval: ({ replaceActiveSession }) => replaceActiveSession === true,
    execute: async ({
      calendarEventId,
      liveQueueSyncCode,
      metadata,
      replaceActiveSession,
    }) => {
      const shouldReplaceActiveSession = replaceActiveSession === true
      const needsAutoAnchor = !calendarEventId && !liveQueueSyncCode
      const resolvedSyncCode = needsAutoAnchor
        ? `NIC-NAC-AUTO-${ctx.conversationId}`
        : liveQueueSyncCode
      const requestedAnchor = {
        calendarEventId,
        liveQueueSyncCode: resolvedSyncCode,
      }
      const activeSession = await loadActiveNicNacShowSession(
        ctx.supabase,
        ctx.repId,
      )

      if (
        activeSession &&
        isSameNicNacShowSessionAnchor(activeSession, requestedAnchor)
      ) {
        return { ...activeSession, calendarEvent: null, reused: true }
      }

      if (activeSession && !shouldReplaceActiveSession) {
        throw new NicNacToolError({
          code: 'show_session_conflict',
          userMessage:
            'A different live-show session is already active. Ask whether the rep wants to keep it or replace it.',
        })
      }

      let calendarEvent: Awaited<ReturnType<typeof startShow>>['event'] | null = null
      if (calendarEventId) {
        try {
          calendarEvent = (await startShow(ctx.supabase, ctx.repId, calendarEventId)).event
        } catch (err) {
          if (err instanceof ServiceError) {
            throw new NicNacToolError({
              code: err.code,
              userMessage: err.userMessage,
              cause: err,
            })
          }
          throw err
        }
      }
      let session: Awaited<ReturnType<typeof startNicNacShowSession>>
      try {
        session = await startNicNacShowSession(ctx.supabase, {
          repId: ctx.repId,
          calendarEventId,
          liveQueueSyncCode: resolvedSyncCode,
          replaceActiveSession: shouldReplaceActiveSession,
          expectedActiveSessionId: activeSession?.id,
          metadata: {
            ...(metadata ?? {}),
            ...(needsAutoAnchor ? { autoAnchor: true } : {}),
            conversationId: ctx.conversationId,
            runId: ctx.runId,
          },
        })
      } catch (error) {
        if (error instanceof NicNacShowSessionConflictError) {
          throw new NicNacToolError({
            code: 'show_session_conflict',
            userMessage:
              'The active live-show session changed before I could start this one. Please check the current show and try again.',
            cause: error,
          })
        }
        throw error
      }
      return { ...session, calendarEvent }
    },
  })
}

export const startShowSessionTool: ToolDefinition = {
  name: 'start_show_session',
  readOnly: false,
  build: (ctx) =>
    makeStartShowSessionTool({
      repId: ctx.repId,
      supabase: ctx.supabase as never,
      conversationId: ctx.conversationId,
      runId: ctx.runId,
    }),
}
