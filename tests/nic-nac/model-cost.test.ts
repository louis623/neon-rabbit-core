import { describe, expect, it } from 'vitest'
import { estimateNicNacRunCostCents } from '@/lib/nic-nac/core/model-cost'
import { getNicNacModelPolicy } from '@/lib/nic-nac/core/model-policy'

describe('Nic-Nac model cost estimates', () => {
  it('estimates GPT-5.6 Terra short-context usage in integer cents', () => {
    expect(
      estimateNicNacRunCostCents(getNicNacModelPolicy('human_default'), {
        inputTokens: 10_000,
        outputTokens: 1_000,
        totalTokens: 11_000,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
      }),
    ).toBe(4)
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

  it('prices Terra cache writes at 1.25x input without double counting input tokens', () => {
    expect(
      estimateNicNacRunCostCents(getNicNacModelPolicy('human_default'), {
        inputTokens: 100_000,
        outputTokens: 10_000,
        totalTokens: 110_000,
        cacheReadTokens: 20_000,
        cacheWriteTokens: 30_000,
      }),
    ).toBe(30)
  })

  it('retains GPT-5.4 pricing for historical runs and an explicit rollback', () => {
    expect(
      estimateNicNacRunCostCents(
        { ...getNicNacModelPolicy('human_default'), modelId: 'gpt-5.4' },
        { inputTokens: 100_000, outputTokens: 10_000 },
      ),
    ).toBe(40)
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
