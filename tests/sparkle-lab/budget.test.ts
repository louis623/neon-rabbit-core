import { describe, expect, it } from 'vitest'
import {
  getSparkleLabCaps,
  getSparkleLabLimitsExceeded,
  getSparkleLabLimitsHit,
  shouldStopSparkleLabRun,
  type SparkleLabUsage,
} from '@/lib/nic-nac/core/lab/budget'

function zeroUsage(overrides: Partial<SparkleLabUsage> = {}): SparkleLabUsage {
  return {
    estimatedCostCents: 0,
    modelCallCount: 0,
    premiumCallCount: 0,
    runtimeSeconds: 0,
    candidateRecordCount: 0,
    deepItemCount: 0,
    headlineFindingCount: 0,
    activePriorityCount: 0,
    ...overrides,
  }
}

describe('Sparkle Lab budget guardrails', () => {
  it('reports reached caps without marking the run as stopped', () => {
    const caps = getSparkleLabCaps('weekly')
    const usage = zeroUsage({
      activePriorityCount: caps.activePriorityCap,
      headlineFindingCount: caps.headlineFindingCap,
    })

    expect(getSparkleLabLimitsHit(usage, caps)).toEqual([
      'headline_finding_cap',
      'active_priority_cap',
    ])
    expect(getSparkleLabLimitsExceeded(usage, caps)).toEqual([])
    expect(shouldStopSparkleLabRun(usage, caps)).toEqual({
      shouldStop: false,
      limitsHit: ['headline_finding_cap', 'active_priority_cap'],
    })
  })

  it('stops a run only when usage exceeds a hard cap', () => {
    const caps = getSparkleLabCaps('weekly')
    const usage = zeroUsage({
      activePriorityCount: caps.activePriorityCap + 1,
    })

    expect(getSparkleLabLimitsExceeded(usage, caps)).toEqual([
      'active_priority_cap',
    ])
    expect(shouldStopSparkleLabRun(usage, caps)).toEqual({
      shouldStop: true,
      limitsHit: ['active_priority_cap'],
    })
  })
})
