import { describe, expect, it } from 'vitest'
import { evaluateNicNacRunThresholds } from '@/lib/nic-nac/run-thresholds'

describe('Nic-Nac run thresholds', () => {
  it('does not recommend rollover for a small fast run', () => {
    const result = evaluateNicNacRunThresholds({
      latencyMs: 1_200,
      inputTokens: 1_327,
      totalTokens: 1_341,
      estimatedContextTokens: 33,
      contextCompacted: false,
      droppedMessageCount: 0,
    })

    expect(result).toEqual({
      rolloverRecommended: false,
      reasons: [],
    })
  })

  it('recommends rollover when a run crosses cost and latency thresholds', () => {
    const result = evaluateNicNacRunThresholds({
      latencyMs: 12_000,
      inputTokens: 85_000,
      totalTokens: 91_000,
      estimatedContextTokens: 21_000,
      contextCompacted: true,
      droppedMessageCount: 40,
    })

    expect(result.rolloverRecommended).toBe(true)
    expect(result.reasons).toEqual([
      'high_input_tokens',
      'high_total_tokens',
      'slow_response',
      'context_compacted',
      'high_estimated_context',
    ])
  })
})
