import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getNicNacModelPolicy,
  NIC_NAC_MODEL_POLICIES,
} from '@/lib/nic-nac/core/model-policy'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('Nic-Nac model policy', () => {
  it('defines stable policy keys instead of raw route model strings', () => {
    expect(Object.keys(NIC_NAC_MODEL_POLICIES).sort()).toEqual([
      'human_default',
      'human_escalated',
      'lab_synthesis',
      'utility_fast',
    ])
  })

  it('defaults human-facing Nic-Nac to OpenAI GPT-5.6 Terra medium reasoning', () => {
    expect(getNicNacModelPolicy('human_default')).toMatchObject({
      provider: 'openai',
      modelId: 'gpt-5.6-terra',
      reasoning: 'medium',
    })
  })

  it('keeps complex human work on the escalated OpenAI policy', () => {
    expect(getNicNacModelPolicy('human_escalated')).toMatchObject({
      provider: 'openai',
      modelId: 'gpt-5.5',
      reasoning: 'medium',
    })
  })

  it('keeps lab synthesis on premium OpenAI model policy', () => {
    expect(getNicNacModelPolicy('lab_synthesis')).toMatchObject({
      provider: 'openai',
      modelId: 'gpt-5.5',
      reasoning: 'high',
    })
  })

  it('keeps invisible utility work on a cheaper model policy', () => {
    expect(getNicNacModelPolicy('utility_fast')).toMatchObject({
      provider: 'openai',
      modelId: 'gpt-5.4-mini',
      reasoning: 'low',
    })
  })

  it('resolves model id env overrides when the policy is requested', () => {
    vi.stubEnv('NIC_NAC_HUMAN_DEFAULT_MODEL', 'gpt-5.4-2026-03-05')

    expect(getNicNacModelPolicy('human_default')).toMatchObject({
      modelId: 'gpt-5.4-2026-03-05',
    })
  })
})
