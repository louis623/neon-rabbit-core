import { describe, expect, it } from 'vitest'
import {
  buildBenchmarkPlan,
  normalizeBaseUrl,
  THUMPER_BENCHMARK_PATH,
  type Prompt,
} from '@/spike/run-benchmark'

const prompts: Prompt[] = [
  { kind: 'conversational', text: 'hello' },
  { kind: 'read', text: 'show my board' },
  { kind: 'hitl', text: 'remove this listing' },
]

describe('Thumper benchmark plan', () => {
  it('defaults to the Phase 1.0 200-prompt benchmark shape', () => {
    const plan = buildBenchmarkPlan(prompts)

    expect(plan.cold).toHaveLength(100)
    expect(plan.warmConversations).toHaveLength(20)
    expect(plan.warmConversations.every((turns) => turns.length === 5)).toBe(true)
    expect(plan.warmConversations.flat()).toHaveLength(100)
  })

  it('keeps HITL prompts out of warm multi-turn conversations', () => {
    const plan = buildBenchmarkPlan(prompts)

    expect(plan.cold.some((prompt) => prompt.kind === 'hitl')).toBe(true)
    expect(plan.warmConversations.flat().every((prompt) => prompt.kind !== 'hitl')).toBe(
      true
    )
  })

  it('uses the production Thumper route and normalizes base URLs', () => {
    expect(THUMPER_BENCHMARK_PATH).toBe('/api/thumper')
    expect(normalizeBaseUrl('https://sparkle-suite.vercel.app///')).toBe(
      'https://sparkle-suite.vercel.app'
    )
  })
})
