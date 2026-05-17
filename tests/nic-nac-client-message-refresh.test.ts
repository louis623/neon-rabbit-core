import { describe, expect, it } from 'vitest'
import type { UIMessage } from 'ai'

import { mergeServerMessages } from '@/lib/nic-nac/client-message-refresh'

function message(id: string, role: UIMessage['role']): UIMessage {
  return {
    id,
    role,
    parts: [{ type: 'text', text: id }],
  } as UIMessage
}

describe('mergeServerMessages', () => {
  it('appends a server-inserted assistant notification', () => {
    const current = [message('user-1', 'user')]
    const incoming = [
      message('user-1', 'user'),
      message('trade-request-request-1', 'assistant'),
    ]

    expect(mergeServerMessages(current, incoming).map((item) => item.id)).toEqual([
      'user-1',
      'trade-request-request-1',
    ])
  })

  it('does not duplicate message ids already in the chat state', () => {
    const current = [message('user-1', 'user'), message('assistant-1', 'assistant')]
    const incoming = [message('user-1', 'user'), message('assistant-1', 'assistant')]

    expect(mergeServerMessages(current, incoming)).toEqual(current)
  })

  it('preserves local optimistic messages while appending server rows', () => {
    const current = [message('local-user', 'user')]
    const incoming = [message('server-assistant', 'assistant')]

    expect(mergeServerMessages(current, incoming).map((item) => item.id)).toEqual([
      'local-user',
      'server-assistant',
    ])
  })
})
