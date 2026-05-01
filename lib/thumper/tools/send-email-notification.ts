import { tool } from 'ai'
import { z } from 'zod'

import type { ToolDefinition } from './types'

export const inputSchema = z.object({
  repId: z.string().min(1),
  recipientEmail: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
})

const STUB_RESPONSE = {
  success: false,
  message:
    'Email notifications are coming soon! This feature is being built and will be available in a future update. For now, you can send emails directly from your email app.',
} as const

export function makeSendEmailNotificationTool(_ctx?: {
  repId: string
  conversationId: string
  runId: string
}) {
  return tool({
    description:
      'Stub for future email notifications. Returns a coming-soon message and does not send anything.',
    inputSchema,
    execute: async () => STUB_RESPONSE,
  })
}

export const sendEmailNotificationTool: ToolDefinition = {
  name: 'send_email_notification',
  readOnly: false,
  build: (ctx) =>
    makeSendEmailNotificationTool({
      repId: ctx.repId,
      conversationId: ctx.conversationId,
      runId: ctx.runId,
    }),
}
