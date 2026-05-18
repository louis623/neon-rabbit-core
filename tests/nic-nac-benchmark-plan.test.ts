import { describe, expect, it } from 'vitest'
import {
  assertPaidSmokeAllowed,
  buildBenchmarkPlan,
  countBenchmarkPlanRequests,
  DEFAULT_PAID_SMOKE_MAX_REQUESTS,
  NIC_NAC_PAID_SMOKE_ALLOW_FLAG,
  NIC_NAC_PAID_SMOKE_MAX_REQUESTS_ENV,
  normalizeBaseUrl,
  NIC_NAC_BENCHMARK_PATH,
  type Prompt,
} from '@/spike/run-benchmark'

const prompts: Prompt[] = [
  { kind: 'conversational', text: 'hello' },
  { kind: 'read', text: 'show my board' },
  { kind: 'hitl', text: 'remove this listing' },
]

describe('Nic-Nac benchmark plan', () => {
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

  it('uses the production Nic-Nac route and normalizes base URLs', () => {
    expect(NIC_NAC_BENCHMARK_PATH).toBe('/api/nic-nac')
    expect(normalizeBaseUrl('https://sparkle-suite.vercel.app///')).toBe(
      'https://sparkle-suite.vercel.app'
    )
  })

  it('blocks paid smoke runs unless explicitly allowed and capped', () => {
    const plan = buildBenchmarkPlan(prompts, {
      coldPromptCount: 2,
      warmConversationCount: 1,
      warmTurnsPerConversation: 2,
    })

    expect(countBenchmarkPlanRequests(plan)).toBe(4)
    expect(() => assertPaidSmokeAllowed(plan, {})).toThrow(
      `${NIC_NAC_PAID_SMOKE_ALLOW_FLAG}=true is required`,
    )
    expect(
      assertPaidSmokeAllowed(plan, {
        [NIC_NAC_PAID_SMOKE_ALLOW_FLAG]: 'true',
      }),
    ).toEqual({
      requestCount: 4,
      maxRequests: DEFAULT_PAID_SMOKE_MAX_REQUESTS,
    })
  })

  it('requires an explicit higher cap before large paid smoke runs', () => {
    const plan = buildBenchmarkPlan(prompts, {
      coldPromptCount: 100,
      warmConversationCount: 20,
      warmTurnsPerConversation: 5,
    })

    expect(() =>
      assertPaidSmokeAllowed(plan, {
        [NIC_NAC_PAID_SMOKE_ALLOW_FLAG]: 'true',
      }),
    ).toThrow(`${NIC_NAC_PAID_SMOKE_MAX_REQUESTS_ENV}=20`)
    expect(
      assertPaidSmokeAllowed(plan, {
        [NIC_NAC_PAID_SMOKE_ALLOW_FLAG]: 'true',
        [NIC_NAC_PAID_SMOKE_MAX_REQUESTS_ENV]: '200',
      }),
    ).toEqual({ requestCount: 200, maxRequests: 200 })
  })
})
