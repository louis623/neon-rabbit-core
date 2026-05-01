import { describe, expect, it } from 'vitest'

import { buildAllTools } from '@/lib/thumper/tools'
import {
  inputSchema,
  makeSendSmsNotificationTool,
  sendSmsNotificationTool,
} from '@/lib/thumper/tools/send-sms-notification'
import { THUMPER_SYSTEM_PROMPT } from '@/lib/thumper/system-prompt'

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

describe('send_sms_notification', () => {
  it('returns the coming-soon stub and is wired into the registry + prompt', async () => {
    const tool = makeSendSmsNotificationTool(makeCtx()) as unknown as ToolDef

    const result = await tool.execute({
      repId: 'rep-1',
      recipientPhone: '555-111-2222',
      message: 'Your order is ready.',
    })

    expect(result).toEqual({
      success: false,
      message:
        "SMS notifications are coming soon! This feature is being built and will be available in a future update. For now, you can reach your customers directly through your phone's messaging app.",
    })

    const tools = buildAllTools(makeCtx())
    const names = Object.keys(tools).sort()

    expect(names).toHaveLength(21)
    expect(names).toEqual(
      expect.arrayContaining([
        'send_sms_notification',
        'send_email_notification',
        'get_notification_preferences',
      ]),
    )
    expect(sendSmsNotificationTool.readOnly).toBe(false)
    expect(sendSmsNotificationTool.name).toBe('send_sms_notification')

    expect(THUMPER_SYSTEM_PROMPT).toContain(
      'You have twenty-one tools available right now:',
    )
    expect(THUMPER_SYSTEM_PROMPT).toContain('send_sms_notification')
    expect(THUMPER_SYSTEM_PROMPT).toContain('send_email_notification')
    expect(THUMPER_SYSTEM_PROMPT).toContain('get_notification_preferences')
    expect(THUMPER_SYSTEM_PROMPT).toContain('SMS notifications are coming soon')
    expect(THUMPER_SYSTEM_PROMPT).toContain('Email notifications are coming soon')
    expect(THUMPER_SYSTEM_PROMPT).toContain(
      'Notification preferences will be available once SMS and email notifications launch',
    )
  })

  it('rejects a missing recipientPhone', () => {
    const result = inputSchema.safeParse({
      repId: 'rep-1',
      message: 'Your order is ready.',
    })

    expect(result.success).toBe(false)
  })
})
