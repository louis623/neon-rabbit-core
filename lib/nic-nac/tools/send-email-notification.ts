import { tool } from 'ai'
import { z } from 'zod'

import { ServiceError } from '@/lib/services/errors'
import { sendEmailNotification } from '@/lib/services/email-notifications'
import { NicNacToolError } from '@/lib/nic-nac/errors'
import type { ToolDefinition } from './types'

export const inputSchema = z.object({
  recipientEmail: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
})

function explainServiceError(error: unknown): never {
  if (error instanceof ServiceError) {
    throw new NicNacToolError({
      code: error.code,
      userMessage: error.userMessage,
      cause: error,
    })
  }
  throw error
}

export function makeSendEmailNotificationTool(_ctx?: {
  repId: string
  conversationId: string
  runId: string
}) {
  if (!_ctx?.repId) {
    throw new Error('send_email_notification requires an authenticated rep context')
  }

  return tool({
    description:
      'Send a one-off email notification to a single customer email address. This is for direct emails, not subscriber blasts or show reminders.',
    inputSchema,
    needsApproval: true,
    execute: async (input) => {
      try {
        return await sendEmailNotification(_ctx.repId, {
          recipientEmail: input.recipientEmail,
          subject: input.subject,
          body: input.body,
        })
      } catch (error) {
        explainServiceError(error)
      }
    },
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
