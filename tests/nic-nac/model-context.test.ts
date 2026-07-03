import { describe, expect, it } from 'vitest'
import { selectMessagesForModel } from '@/lib/nic-nac/model-context'
import type { UIMessage } from 'ai'

function textMessage(id: string, role: 'user' | 'assistant', text: string): UIMessage {
  return {
    id,
    role,
    parts: [{ type: 'text', text }],
  } as UIMessage
}

describe('Nic-Nac model context selection', () => {
  it('keeps short conversations intact', () => {
    const messages = [
      textMessage('u1', 'user', 'hello'),
      textMessage('a1', 'assistant', 'hey'),
    ]

    const selected = selectMessagesForModel(messages)

    expect(selected.messages).toEqual(messages)
    expect(selected.wasCompacted).toBe(false)
  })

  it('drops older turns when the estimated token budget is too large', () => {
    const messages = Array.from({ length: 80 }, (_, index) =>
      textMessage(
        `m${index}`,
        index % 2 === 0 ? 'user' : 'assistant',
        `message ${index} ${'x'.repeat(1_000)}`,
      ),
    )

    const selected = selectMessagesForModel(messages, {
      maxEstimatedTokens: 6_000,
      maxMessages: 24,
    })

    expect(selected.wasCompacted).toBe(true)
    expect(selected.messages.length).toBeLessThanOrEqual(24)
    expect(selected.messages.at(-1)?.id).toBe('m79')
    expect(selected.droppedMessageCount).toBeGreaterThan(0)
    expect(selected.estimatedTokens).toBeLessThanOrEqual(6_000)
  })

  it('keeps at least the latest user turn even when it is oversized', () => {
    const messages = [
      textMessage('old', 'assistant', 'old context'),
      textMessage('latest', 'user', 'x'.repeat(50_000)),
    ]

    const selected = selectMessagesForModel(messages, {
      maxEstimatedTokens: 2_000,
      maxMessages: 10,
    })

    expect(selected.messages).toEqual([messages[1]])
    expect(selected.wasCompacted).toBe(true)
  })

  it('strips stale output-less approval tool parts before a later user turn', () => {
    const messages: UIMessage[] = [
      {
        id: 'u1',
        role: 'user',
        parts: [{ type: 'text', text: 'cancel the show' }],
      } as UIMessage,
      {
        id: 'a1',
        role: 'assistant',
        parts: [
          { type: 'step-start' },
          {
            type: 'tool-cancel_show',
            state: 'approval-requested',
            toolName: 'cancel_show',
            input: { eventId: 'event-1' },
            approval: { id: 'approval-1' },
          },
        ],
      } as unknown as UIMessage,
      {
        id: 'u2',
        role: 'user',
        parts: [{ type: 'text', text: 'now cancel the weekly series' }],
      } as UIMessage,
    ]

    const selected = selectMessagesForModel(messages)

    expect(selected.messages.map((message) => message.id)).toEqual(['u1', 'u2'])
    expect(selected.wasCompacted).toBe(true)
  })

  it('preserves the last assistant approval response for HITL continuation', () => {
    const messages: UIMessage[] = [
      {
        id: 'u1',
        role: 'user',
        parts: [{ type: 'text', text: 'cancel the show' }],
      } as UIMessage,
      {
        id: 'a1',
        role: 'assistant',
        parts: [
          { type: 'step-start' },
          {
            type: 'tool-cancel_show',
            state: 'approval-responded',
            toolName: 'cancel_show',
            input: { eventId: 'event-1' },
            approval: { id: 'approval-1', approved: true },
          },
        ],
      } as unknown as UIMessage,
    ]

    const selected = selectMessagesForModel(messages)

    expect(selected.messages).toEqual(messages)
    expect(selected.wasCompacted).toBe(false)
  })
})
