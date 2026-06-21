import { describe, expect, it } from 'vitest'
import { estimateNicNacRunCostCents } from '@/lib/nic-nac/core/model-cost'
import { getNicNacModelPolicy } from '@/lib/nic-nac/core/model-policy'

describe('Nic-Nac model cost estimates', () => {
  it('estimates GPT-5.4 short-context usage in integer cents', () => {
    expect(
      estimateNicNacRunCostCents(getNicNacModelPolicy('human_default'), {
        inputTokens: 6_100,
        outputTokens: 216,
        totalTokens: 6_316,
        cacheReadTokens: 1_000,
        cacheWriteTokens: 0,
      }),
    ).toBe(2)
  })

  it('uses the cheaper GPT-5.4 mini policy for utility work', () => {
    expect(
      estimateNicNacRunCostCents(getNicNacModelPolicy('utility_fast'), {
        inputTokens: 10_000,
        outputTokens: 1_000,
        totalTokens: 11_000,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
      }),
    ).toBe(2)
  })

  it('does not invent costs for unsupported provider/model combinations', () => {
    expect(
      estimateNicNacRunCostCents(
        {
          key: 'human_default',
          provider: 'anthropic',
          modelId: 'claude-haiku-4-5-20251001',
          reasoning: 'none',
          purpose: 'fallback',
        },
        {
          inputTokens: 10_000,
          outputTokens: 1_000,
          totalTokens: 11_000,
        },
      ),
    ).toBeNull()
  })
})
