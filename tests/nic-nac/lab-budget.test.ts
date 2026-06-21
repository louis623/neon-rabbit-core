import { describe, expect, it } from 'vitest'
import {
  getSparkleLabCaps,
  shouldStopSparkleLabRun,
} from '@/lib/nic-nac/core/lab/budget'

describe('Sparkle Lab budget caps', () => {
  it('sets the locked weekly caps small enough for early beta', () => {
    expect(getSparkleLabCaps('weekly')).toMatchObject({
      runType: 'weekly',
      costCapCents: 500,
      monthlyScheduledCapCents: 2_000,
      modelCallCap: 20,
      premiumCallCap: 4,
      runtimeCapSeconds: 20 * 60,
      candidateRecordCap: 250,
      deepItemCap: 25,
      headlineFindingCap: 3,
      activePriorityCap: 2,
    })
  })

  it('sets smaller manual caps for on-demand exploration', () => {
    expect(getSparkleLabCaps('manual')).toMatchObject({
      runType: 'manual',
      costCapCents: 200,
      modelCallCap: 8,
      premiumCallCap: 2,
      runtimeCapSeconds: 10 * 60,
      candidateRecordCap: 75,
      deepItemCap: 10,
    })
  })

  it('keeps urgent runs bounded unless an operator explicitly raises the cap', () => {
    expect(getSparkleLabCaps('urgent')).toMatchObject({
      runType: 'urgent',
      costCapCents: 300,
    })

    expect(
      getSparkleLabCaps('urgent', { costCapCents: 750 }),
    ).toMatchObject({
      runType: 'urgent',
      costCapCents: 750,
    })
  })

  it('stops gracefully once any hard cap is exceeded', () => {
    const stop = shouldStopSparkleLabRun(
      {
        estimatedCostCents: 501,
        monthlyScheduledCostCents: 1_200,
        modelCallCount: 6,
        premiumCallCount: 1,
        runtimeSeconds: 180,
        candidateRecordCount: 40,
        deepItemCount: 6,
        headlineFindingCount: 1,
        activePriorityCount: 1,
      },
      getSparkleLabCaps('weekly'),
    )

    expect(stop).toEqual({
      shouldStop: true,
      limitsHit: ['cost_cap'],
    })
  })

  it('tracks every cap hit so the Lab report can explain what stopped it', () => {
    const stop = shouldStopSparkleLabRun(
      {
        estimatedCostCents: 501,
        monthlyScheduledCostCents: 2_000,
        modelCallCount: 20,
        premiumCallCount: 4,
        runtimeSeconds: 20 * 60,
        candidateRecordCount: 250,
        deepItemCount: 25,
        headlineFindingCount: 3,
        activePriorityCount: 2,
      },
      getSparkleLabCaps('weekly'),
    )

    expect(stop.shouldStop).toBe(true)
    expect(stop.limitsHit).toEqual([
      'cost_cap',
      'monthly_scheduled_cap',
      'model_call_cap',
      'premium_call_cap',
      'runtime_cap',
      'candidate_record_cap',
      'deep_item_cap',
      'headline_finding_cap',
      'active_priority_cap',
    ])
  })

  it('continues while usage remains below caps', () => {
    expect(
      shouldStopSparkleLabRun(
        {
          estimatedCostCents: 120,
          monthlyScheduledCostCents: 1_100,
          modelCallCount: 4,
          premiumCallCount: 1,
          runtimeSeconds: 240,
          candidateRecordCount: 20,
          deepItemCount: 3,
          headlineFindingCount: 1,
          activePriorityCount: 1,
        },
        getSparkleLabCaps('weekly'),
      ),
    ).toEqual({
      shouldStop: false,
      limitsHit: [],
    })
  })
})
