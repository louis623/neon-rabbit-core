import { describe, expect, it } from 'vitest'
import type { UIMessage } from 'ai'

import {
  approveLatestTool,
  findApprovalTarget,
  getMissingRemoveListingSmokeEnv,
} from '@/scripts/smoke-nic-nac-remove-listing'

describe('Nic-Nac remove-listing smoke script helpers', () => {
  it('reports the required live smoke environment', () => {
    expect(getMissingRemoveListingSmokeEnv({})).toEqual([
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ])
    expect(
      getMissingRemoveListingSmokeEnv({
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
            type: 'tool-remove_listing',
            state: 'approval-requested',
            approval: { id: 'approval-1' },
          } as UIMessage['parts'][number],
        ],
      },
    ]

    const target = findApprovalTarget(messages, 'remove_listing')
    expect(target?.approvalId).toBe('approval-1')

    const approved = approveLatestTool(messages, target!)
    expect(approved[0].parts?.[1]).toMatchObject({
      type: 'tool-remove_listing',
      state: 'approval-responded',
      toolName: 'remove_listing',
      approval: {
        id: 'approval-1',
        approved: true,
      },
    })
  })
})
