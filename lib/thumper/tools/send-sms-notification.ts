import { tool } from 'ai'
import { z } from 'zod'

import { ServiceError } from '@/lib/services/errors'
import { sendSmsNotification } from '@/lib/services/sms-notifications'
import { ThumperToolError } from '@/lib/thumper/errors'
import type { ToolDefinition } from './types'

export const inputSchema = z.object({
  recipientPhone: z.string().min(1),
  message: z.string().min(1),
})

function explainServiceError(error: unknown): never {
  if (error instanceof ServiceError) {
    throw new ThumperToolError({
      code: error.code,
      userMessage: error.userMessage,
      cause: error,
    })
  }
  throw error
}

export function makeSendSmsNotificationTool(_ctx?: {
  repId: string
  conversationId: string
  runId: string
}) {
  if (!_ctx?.repId) {
    throw new Error('send_sms_notification requires an authenticated rep context')
  }

  return tool({
    description:
      'Send a one-off SMS notification to a single customer phone number. This is for direct texts, not subscriber blasts or show reminders.',
    inputSchema,
    execute: async (input) => {
      try {
        return await sendSmsNotification(_ctx.repId, {
          recipientPhone: input.recipientPhone,
          message: input.message,
        })
      } catch (error) {
        explainServiceError(error)
      }
    },
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
