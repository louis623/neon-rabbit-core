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

function tradeRequestMessage(status: 'pending' | 'approved'): UIMessage {
  return {
    id: 'trade-request-request-1',
    role: 'assistant',
    parts: [
      {
        type: 'data-trade-request-card',
        data: {
          requestId: 'request-1',
          status,
          customerName: 'Maya Stone',
          requestedItem: {
            itemNumber: 'RG100',
            designName: 'Rose Glow',
            typePrefix: 'RG',
            collectionName: 'Birthday',
            bpMsrp: 39.95,
          },
          offeredText: 'Offering RG095.',
          ruleCheck: {
            status: 'needs_review',
            label: 'Compare against RG / Birthday',
            description: 'Confirm same type and collection.',
          },
        },
      },
    ],
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

  it('replaces existing server messages so hydrated trade card status can update', () => {
    const current = [message('user-1', 'user'), tradeRequestMessage('pending')]
    const incoming = [message('user-1', 'user'), tradeRequestMessage('approved')]

    const merged = mergeServerMessages(current, incoming)

    expect(merged).toHaveLength(2)
    expect(merged[1]).toEqual(incoming[1])
    expect(
      ((merged[1].parts?.[0] as { data?: { status?: string } })?.data?.status),
    ).toBe('approved')
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
