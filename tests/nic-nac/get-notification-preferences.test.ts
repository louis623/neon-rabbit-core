import { describe, expect, it } from 'vitest'

import {
  getNotificationPreferencesTool,
  inputSchema,
  makeGetNotificationPreferencesTool,
} from '@/lib/nic-nac/tools/get-notification-preferences'

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

describe('get_notification_preferences', () => {
  it('returns the coming-soon stub', async () => {
    const tool = makeGetNotificationPreferencesTool(
      makeCtx(),
    ) as unknown as ToolDef

    const result = await tool.execute({
      repId: 'rep-1',
    })

    expect(result).toEqual({
      success: false,
      message:
        'Notification preferences will be available once SMS and email notifications launch in a future update. Stay tuned!',
    })
    expect(getNotificationPreferencesTool.readOnly).toBe(true)
    expect(getNotificationPreferencesTool.name).toBe(
      'get_notification_preferences',
    )
  })

  it('rejects a missing repId', () => {
    const result = inputSchema.safeParse({})

    expect(result.success).toBe(false)
  })
})
