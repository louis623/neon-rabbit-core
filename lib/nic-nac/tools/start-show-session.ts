import { z } from 'zod'
import { tool } from 'ai'
import { startNicNacShowSession } from '@/lib/nic-nac/show-sessions'
import type { ToolDefinition } from './types'

const inputSchema = z.object({
  calendarEventId: z.string().min(1).optional(),
  liveQueueSyncCode: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export function makeStartShowSessionTool(ctx: {
  repId: string
  supabase: never
  conversationId: string
  runId: string
}) {
  return tool({
    description:
      "Start or replace the authenticated rep's current live-show session state. " +
      'Use when the rep says the live show is starting or you need a durable current-show object.',
    inputSchema,
    execute: async ({ calendarEventId, liveQueueSyncCode, metadata }) =>
      startNicNacShowSession(ctx.supabase, {
        repId: ctx.repId,
        calendarEventId,
        liveQueueSyncCode,
        metadata: {
          ...(metadata ?? {}),
          conversationId: ctx.conversationId,
          runId: ctx.runId,
        },
      }),
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
