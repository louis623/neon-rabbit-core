import { describe, expect, it } from 'vitest'
import {
  canNicNacAgentHarnessBeEnabled,
  isNicNacAgentHarnessEnabled,
} from '@/lib/nic-nac/agent/rollout'

const identity = { repId: 'rep-123', email: 'reviewer@example.com' }

describe('Nic-Nac agent harness rollout', () => {
  it('is default-off in production and default-on for local deterministic work', () => {
    expect(
      isNicNacAgentHarnessEnabled(identity, { NODE_ENV: 'production' }),
    ).toBe(false)
    expect(
      isNicNacAgentHarnessEnabled(identity, { NODE_ENV: 'test' }),
    ).toBe(true)
  })

  it('supports an exact rep or email cohort without broad enablement', () => {
    expect(
      isNicNacAgentHarnessEnabled(identity, {
        NODE_ENV: 'production',
        NIC_NAC_AGENT_HARNESS_REP_IDS: 'another-rep, rep-123',
      }),
    ).toBe(true)
    expect(
      isNicNacAgentHarnessEnabled(identity, {
        NODE_ENV: 'production',
        NIC_NAC_AGENT_HARNESS_EMAILS: 'reviewer@example.com',
      }),
    ).toBe(true)
  })

  it('gives the explicit false kill switch precedence over a cohort', () => {
    expect(
      isNicNacAgentHarnessEnabled(identity, {
        NODE_ENV: 'production',
        NIC_NAC_AGENT_HARNESS_ENABLED: 'false',
        NIC_NAC_AGENT_HARNESS_REP_IDS: 'rep-123',
        NIC_NAC_AGENT_HARNESS_EMAILS: 'reviewer@example.com',
      }),
    ).toBe(false)
  })

  it('allows an explicit broad enable only when deliberately configured', () => {
    expect(
      isNicNacAgentHarnessEnabled(identity, {
        NODE_ENV: 'production',
        NIC_NAC_AGENT_HARNESS_ENABLED: 'true',
      }),
    ).toBe(true)
  })

  it('uses the no-auth legacy fast path when production has no rollout configuration', () => {
    expect(canNicNacAgentHarnessBeEnabled({ NODE_ENV: 'production' })).toBe(false)
    expect(
      canNicNacAgentHarnessBeEnabled({
        NODE_ENV: 'production',
        NIC_NAC_AGENT_HARNESS_EMAILS: 'reviewer@example.com',
      }),
    ).toBe(true)
    expect(
      canNicNacAgentHarnessBeEnabled({
        NODE_ENV: 'production',
        NIC_NAC_AGENT_HARNESS_ENABLED: 'false',
        NIC_NAC_AGENT_HARNESS_EMAILS: 'reviewer@example.com',
      }),
    ).toBe(false)
  })
})
