import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { buildNicNacUsageSnapshot } from '@/lib/remy-communications/nic-nac-usage'
import { buildSparkleLabControlCenterModel } from '@/lib/sparkle-lab/read-model'

const now = new Date('2026-08-28T12:00:00.000Z')
const lab = buildSparkleLabControlCenterModel({
  runs: [],
  findings: [],
  artifacts: [],
})

describe('Control Center Nic-Nac usage read model', () => {
  it('aggregates existing surface, model, spend, spike, and abuse telemetry', () => {
    const rows = [
      ...Array.from({ length: 6 }, (_, index) => ({
        product: 'sparkle_suite',
        surface: 'rep_workspace',
        model: 'gpt-5.4',
        model_provider: 'openai',
        status: index === 5 ? 'error' : 'complete',
        input_tokens: 100,
        output_tokens: 20,
        total_tokens: 120,
        estimated_cost_cents: index === 4 ? null : 2,
        hard_fail_phrase_count: index === 5 ? 1 : 0,
        blocked_memory_card_count: index === 3 ? 2 : 0,
        created_at: `2026-08-28T0${index}:00:00.000Z`,
      })),
      {
        product: 'sparkle_suite',
        surface: 'rep_workspace',
        model: 'gpt-5.4',
        model_provider: 'openai',
        status: 'complete',
        input_tokens: 50,
        output_tokens: 10,
        total_tokens: 60,
        estimated_cost_cents: 1,
        hard_fail_phrase_count: 0,
        blocked_memory_card_count: 0,
        created_at: '2026-08-27T08:00:00.000Z',
      },
    ]

    const snapshot = buildNicNacUsageSnapshot({
      rows,
      lab,
      now,
      labFlags: {
        manualRunsEnabled: false,
        weeklyRunsEnabled: false,
        modelSynthesisEnabled: false,
      },
    })

    expect(snapshot.totals.runCount).toBe(6)
    expect(snapshot.totals.previousRunCount).toBe(1)
    expect(snapshot.totals.runSpikeDetected).toBe(true)
    expect(snapshot.totals.knownEstimatedSpendCents).toBe(10)
    expect(snapshot.totals.unknownSpendRunCount).toBe(1)
    expect(snapshot.totals.creditBalance).toBeNull()
    expect(snapshot.totals.failedOrAbortedRunCount).toBe(1)
    expect(snapshot.totals.hardFailPhraseCount).toBe(1)
    expect(snapshot.bySurface[0]).toMatchObject({
      product: 'sparkle_suite',
      surface: 'rep_workspace',
      runCount: 6,
      runSpikeDetected: true,
    })
    expect(snapshot.byModel[0]).toMatchObject({
      provider: 'openai',
      model: 'gpt-5.4',
      runCount: 6,
    })
    expect(snapshot.coverageHoles.join(' ')).toContain('Finder runtime usage')
    expect(snapshot.surfaceCoverage).toContainEqual({
      product: 'sparkle_finder',
      surface: 'sparkle_finder',
      availability: 'coverage_hole_separate_database',
    })
    expect(snapshot.sparkleLab).toMatchObject({
      mutationMode: 'recommendations_only',
      manualRunsEnabled: false,
      weeklyRunsEnabled: false,
      modelSynthesisEnabled: false,
    })
  })

  it('does not import or invoke Sparkle Lab runners or mutation paths', () => {
    const source = readFileSync(
      'lib/remy-communications/nic-nac-usage.ts',
      'utf8',
    )

    expect(source).not.toContain("from '@/lib/sparkle-lab/runner'")
    expect(source).not.toContain('runSparkleLab')
    expect(source).not.toContain('/api/control-center/sparkle-lab/run')
    expect(source).not.toContain('.insert(')
    expect(source).not.toContain('.update(')
    expect(source).not.toContain('.delete(')
  })
})
