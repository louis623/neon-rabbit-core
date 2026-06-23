import { describe, expect, it } from 'vitest'
import type { UIMessage } from 'ai'

import {
  approveLatestTool,
  findApprovalTarget,
  getMissingCalendarSmokeEnv,
} from '@/scripts/smoke-nic-nac-calendar-reminders'

describe('Nic-Nac calendar reminder smoke script helpers', () => {
  it('reports the required live smoke environment', () => {
    expect(getMissingCalendarSmokeEnv({})).toEqual([
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ])
    expect(
      getMissingCalendarSmokeEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon',
        SUPABASE_SERVICE_ROLE_KEY: 'service',
      }),
    ).toEqual([])
  })

  it('mutates the latest approval request the same way the chat client does', () => {
    const messages: UIMessage[] = [
      {
        id: 'assistant-1',
        role: 'assistant',
        parts: [
          { type: 'step-start' },
          {
            type: 'tool-set_notification_preferences',
            state: 'approval-requested',
            approval: { id: 'approval-1' },
          } as UIMessage['parts'][number],
        ],
      },
    ]

    const target = findApprovalTarget(messages, 'set_notification_preferences')
    expect(target?.approvalId).toBe('approval-1')

    const approved = approveLatestTool(messages, target!)
    expect(approved[0].parts?.[1]).toMatchObject({
      type: 'tool-set_notification_preferences',
      state: 'approval-responded',
      toolName: 'set_notification_preferences',
      approval: {
        id: 'approval-1',
        approved: true,
      },
    })
  })
})
