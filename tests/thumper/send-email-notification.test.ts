import { describe, expect, it } from 'vitest'

import {
  inputSchema,
  makeSendEmailNotificationTool,
  sendEmailNotificationTool,
} from '@/lib/thumper/tools/send-email-notification'

interface ToolDef {
  execute: (input: unknown) => Promise<Record<string, unknown>>
}

function makeCtx() {
  return {
    repId: 'rep-1',
    supabase: {} as never,
    conversationId: 'conv-1',
    runId: 'run-1',
  }
}

describe('send_email_notification', () => {
  it('returns the coming-soon stub', async () => {
    const tool = makeSendEmailNotificationTool(makeCtx()) as unknown as ToolDef

    const result = await tool.execute({
      repId: 'rep-1',
      recipientEmail: 'customer@example.com',
      subject: 'Your order is ready',
      body: 'Pickup is available now.',
    })

    expect(result).toEqual({
      success: false,
      message:
        'Email notifications are coming soon! This feature is being built and will be available in a future update. For now, you can send emails directly from your email app.',
    })
    expect(sendEmailNotificationTool.readOnly).toBe(false)
    expect(sendEmailNotificationTool.name).toBe('send_email_notification')
  })

  it('rejects a missing subject', () => {
    const result = inputSchema.safeParse({
      repId: 'rep-1',
      recipientEmail: 'customer@example.com',
      body: 'Pickup is available now.',
    })

    expect(result.success).toBe(false)
  })
})
