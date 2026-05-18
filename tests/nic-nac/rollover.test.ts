import { describe, expect, it } from 'vitest'
import type { UIMessage } from 'ai'
import {
  buildNicNacRolloverMessages,
  shouldStartNicNacRollover,
} from '@/lib/nic-nac/rollover'

function message(id: string, role: 'user' | 'assistant'): UIMessage {
  return {
    id,
    role,
    parts: [{ type: 'text', text: id }],
  }
}

describe('Nic-Nac conversation rollover', () => {
  it('carries only the recent conversation tail into a fresh conversation', () => {
    const messages = Array.from({ length: 20 }, (_, index) =>
      message(`m${index}`, index % 2 === 0 ? 'user' : 'assistant'),
    )

    const rolled = buildNicNacRolloverMessages(messages, 6)

    expect(rolled).toHaveLength(6)
    expect(rolled.map((m) => m.parts)).toEqual(
      messages.slice(-6).map((m) => m.parts),
    )
    expect(rolled.map((m) => m.id)).toEqual([
      'rollover-0-m14',
      'rollover-1-m15',
      'rollover-2-m16',
      'rollover-3-m17',
      'rollover-4-m18',
      'rollover-5-m19',
    ])
  })

  it('starts rollover only when run health explicitly recommends it', () => {
    expect(shouldStartNicNacRollover(null)).toBe(false)
    expect(shouldStartNicNacRollover({ rolloverRecommended: false })).toBe(false)
    expect(shouldStartNicNacRollover({ rolloverRecommended: true })).toBe(true)
  })

  it('keeps generated rollover ids bounded across repeated rollovers', () => {
    let messages = Array.from({ length: 12 }, (_, index) =>
      message(`m${index}`, index % 2 === 0 ? 'user' : 'assistant'),
    )

    for (let index = 0; index < 80; index++) {
      messages = buildNicNacRolloverMessages(messages)
    }

    expect(new Set(messages.map((m) => m.id)).size).toBe(messages.length)
    expect(Math.max(...messages.map((m) => m.id.length))).toBeLessThanOrEqual(80)
  })
})
