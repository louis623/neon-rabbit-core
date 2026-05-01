import { tool } from 'ai'
import { z } from 'zod'

import type { ToolDefinition } from './types'

export const inputSchema = z.object({
  repId: z.string().min(1),
})

const STUB_RESPONSE = {
  success: false,
  message:
    'Notification preferences will be available once SMS and email notifications launch in a future update. Stay tuned!',
} as const

export function makeGetNotificationPreferencesTool(_ctx?: {
  repId: string
  conversationId: string
  runId: string
}) {
  return tool({
    description:
      'Stub for future notification preferences. Returns a coming-soon message and does not read or write anything.',
    inputSchema,
    execute: async () => STUB_RESPONSE,
  })
}

export const getNotificationPreferencesTool: ToolDefinition = {
  name: 'get_notification_preferences',
  readOnly: false,
  build: (ctx) =>
    makeGetNotificationPreferencesTool({
      repId: ctx.repId,
      conversationId: ctx.conversationId,
      runId: ctx.runId,
    }),
}
