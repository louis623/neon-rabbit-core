import { z } from 'zod'
import { tool } from 'ai'
import { loadNicNacShowSessionContext } from '@/lib/nic-nac/show-sessions'
import type { ToolDefinition } from './types'

const inputSchema = z.object({
  eventLimit: z.number().int().positive().max(50).default(20),
  memoryLimit: z.number().int().positive().max(20).default(10),
})

export function makeGetShowSessionContextTool(ctx: {
  repId: string
  supabase: never
}) {
  return tool({
    description:
      "Read the authenticated rep's current show-session context and structured memory categories. Use quietly during live-show or post-show work.",
    inputSchema,
    execute: async ({ eventLimit = 20, memoryLimit = 10 }) =>
      loadNicNacShowSessionContext(ctx.supabase, ctx.repId, {
        eventLimit,
        memoryLimit,
      }),
  })
}

export const getShowSessionContextTool: ToolDefinition = {
  name: 'get_show_session_context',
  readOnly: true,
  build: (ctx) =>
    makeGetShowSessionContextTool({
      repId: ctx.repId,
      supabase: ctx.supabase as never,
    }),
}
