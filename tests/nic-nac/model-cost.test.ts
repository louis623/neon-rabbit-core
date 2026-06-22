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

  it('keeps model family matching strict so premium pro/nano overrides do not reuse base pricing', () => {
    const usage = {
      inputTokens: 1_000,
      outputTokens: 1_000,
      totalTokens: 2_000,
    }

    expect(
      estimateNicNacRunCostCents(
        {
          key: 'human_escalated',
          provider: 'openai',
          modelId: 'gpt-5.5-pro',
          reasoning: 'high',
          purpose: 'unapproved premium override',
        },
        usage,
      ),
    ).toBeNull()
    expect(
      estimateNicNacRunCostCents(
        {
          key: 'human_escalated',
          provider: 'openai',
          modelId: 'gpt-5.4-pro',
          reasoning: 'high',
          purpose: 'unapproved premium override',
        },
        usage,
      ),
    ).toBeNull()
    expect(
      estimateNicNacRunCostCents(
        {
          key: 'utility_fast',
          provider: 'openai',
          modelId: 'gpt-5.4-nano',
          reasoning: 'low',
          purpose: 'unapproved utility override',
        },
        usage,
      ),
    ).toBeNull()
  })

  it('still estimates dated model snapshots for approved model families', () => {
    expect(
      estimateNicNacRunCostCents(
        {
          key: 'human_default',
          provider: 'openai',
          modelId: 'gpt-5.4-2026-03-05',
          reasoning: 'medium',
          purpose: 'dated snapshot',
        },
        {
          inputTokens: 1_000,
          outputTokens: 1_000,
          totalTokens: 2_000,
        },
      ),
    ).toBe(2)
  })

  it('does not invent costs for unsupported OpenAI model families', () => {
    expect(
      estimateNicNacRunCostCents(
        {
          key: 'human_default',
          provider: 'openai',
          modelId: 'gpt-future-unpriced',
          reasoning: 'none',
          purpose: 'unpriced future model',
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
