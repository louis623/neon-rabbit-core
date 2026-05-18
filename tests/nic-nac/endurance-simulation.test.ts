import { describe, expect, it } from 'vitest'
import { NIC_NAC_ROLLOVER_TAIL_MESSAGES } from '@/lib/nic-nac/rollover'
import { simulateNicNacEndurance } from '../helpers/nic-nac-endurance'

describe('Nic-Nac no-cost endurance simulation', () => {
  it('keeps an 8-hour synthetic show bounded without model or provider calls', () => {
    const result = simulateNicNacEndurance({
      hours: 8,
      turnEveryMinutes: 2,
      userChars: 220,
      assistantChars: 420,
    })

    expect(result.runs).toBe(240)
    expect(result.rollovers.length).toBeGreaterThan(10)
    expect(result.maxModelMessages).toBeLessThanOrEqual(32)
    expect(result.maxEstimatedTokens).toBeLessThan(18_000)
    expect(
      result.rollovers.every(
        (rollover) =>
          rollover.carriedMessageCount === NIC_NAC_ROLLOVER_TAIL_MESSAGES,
      ),
    ).toBe(true)
    expect(
      result.rollovers.every((rollover) =>
        rollover.reasons.includes('context_compacted'),
      ),
    ).toBe(true)
    expect(result.finalConversationMessages.length).toBeLessThanOrEqual(32)
  })
})
