import { tool } from 'ai'
import { z } from 'zod'

import type { ToolDefinition } from './types'

export const inputSchema = z.object({
  repId: z.string().min(1),
  recipientPhone: z.string().min(1),
  message: z.string().min(1),
})

const STUB_RESPONSE = {
  success: false,
  message:
    "SMS notifications are coming soon! This feature is being built and will be available in a future update. For now, you can reach your customers directly through your phone's messaging app.",
} as const

export function makeSendSmsNotificationTool(_ctx?: {
  repId: string
  conversationId: string
  runId: string
}) {
  return tool({
    description:
      'Stub for future SMS notifications. Returns a coming-soon message and does not send anything.',
    inputSchema,
    execute: async () => STUB_RESPONSE,
  })
}

export const sendSmsNotificationTool: ToolDefinition = {
  name: 'send_sms_notification',
  readOnly: false,
  build: (ctx) =>
    makeSendSmsNotificationTool({
      repId: ctx.repId,
      conversationId: ctx.conversationId,
      runId: ctx.runId,
    }),
}
