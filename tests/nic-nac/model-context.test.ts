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
})
