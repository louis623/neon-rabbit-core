import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import {
  buildCostCapacitySnapshot,
  dollarsToIntegerCents,
  formatCostCapacityCsv,
  normalizeFinderRun,
  normalizeSuiteRun,
  parseCostCapacityMonth,
} from '@/lib/remy-communications/nic-nac-cost-capacity'

const now = new Date('2026-09-02T16:00:00.000Z')

describe('Nic-Nac Cost & Capacity', () => {
  it('normalizes Suite cents and Finder fractional dollars before combining', () => {
    expect(dollarsToIntegerCents('0.019900')).toBe(2)
    const suite = normalizeSuiteRun({
      run_id: 'suite-run',
      product: 'sparkle_suite',
      surface: 'rep_workspace',
      model: 'gpt-5.4',
      model_provider: 'openai',
      model_policy: 'human_default',
      status: 'complete',
      input_tokens: 100,
      output_tokens: 20,
      cache_read_tokens: 40,
      estimated_cost_cents: 3,
      hard_fail_phrase_count: 0,
      created_at: '2026-09-02T14:00:00.000Z',
    })
    const finder = normalizeFinderRun({
      id: 'finder-run',
      status: 'failed',
      model_provider: 'openai',
      model_name: 'gpt-5.4',
      model_policy_key: 'human_default',
      prompt_tokens: 50,
      completion_tokens: 10,
      estimated_cost_usd: '0.019900',
      error_code: 'quota_error',
      started_at: '2026-09-02T15:00:00.000Z',
    })
    const snapshot = buildCostCapacitySnapshot({
      month: '2026-09',
      start: new Date('2026-09-01T00:00:00.000Z'),
      end: now,
      now,
      suiteRows: [suite],
      finderRows: [finder],
      finderIssue: null,
      provider: {
        suite: { actualCents: 4, issue: null, projectIdsConfigured: 1 },
        finder: { actualCents: 2, issue: null, projectIdsConfigured: 1 },
      },
      providerCostsAt: now.toISOString(),
    })

    expect(snapshot.totals.estimatedCents).toBe(5)
    expect(snapshot.totals.actualCents).toBe(6)
    expect(snapshot.products).toMatchObject([
      { productClass: 'suite', estimatedCents: 3, actualCents: 4 },
      { productClass: 'finder', estimatedCents: 2, actualCents: 2 },
    ])
    expect(snapshot.totals.cachedTokens).toBe(40)
    expect(snapshot.totals.hardFails).toBe(1)
    expect(finder.cachedTokens).toBeNull()
  })

  it('keeps balance unavailable and labels missing providers without fabricating values', () => {
    const range = parseCostCapacityMonth('not-a-month', now)
    const snapshot = buildCostCapacitySnapshot({
      month: range.month,
      start: range.start,
      end: range.end,
      now,
      suiteRows: [],
      finderRows: [],
      finderIssue: 'Finder bridge not configured.',
      provider: {
        suite: { actualCents: null, issue: 'Suite provider missing.', projectIdsConfigured: 0 },
        finder: { actualCents: null, issue: 'Finder provider missing.', projectIdsConfigured: 0 },
      },
      providerCostsAt: null,
    })

    expect(range.month).toBe('2026-09')
    expect(range.start.toISOString()).toBe('2026-09-01T04:00:00.000Z')
    expect(snapshot.providerBalance.cents).toBeNull()
    expect(snapshot.totals.actualCents).toBeNull()
    expect(snapshot.coverageHoles).toContain('Finder bridge not configured.')
  })

  it('exports stable monthly evidence fields and Eastern timestamps', () => {
    const row = normalizeSuiteRun({
      run_id: 'suite-run',
      product: 'sparkle_suite',
      surface: 'customer_site',
      model: 'gpt-5.4',
      model_provider: 'openai',
      model_policy: 'human_default',
      status: 'complete',
      input_tokens: 100,
      output_tokens: 20,
      cache_read_tokens: 40,
      estimated_cost_cents: 3,
      hard_fail_phrase_count: 0,
      created_at: '2026-09-02T14:00:00.000Z',
    })
    const csv = formatCostCapacityCsv([row])
    expect(csv).toContain('product_class,cost_class,surface,model,purpose,run_id')
    expect(csv).toContain('suite,customer_facing,customer_site,gpt-5.4,default,suite-run')
    expect(csv).toContain('2026-09-02')
    expect(csv).toContain('10:00:00')
  })

  it('ships a visible refresh control and Control Center entry', () => {
    const refreshSource = readFileSync(
      'app/control-center/nic-nac-usage/_components/RefreshButton.tsx',
      'utf8',
    )
    const controlCenterSource = readFileSync(
      'app/control-center/_components/SupportCommandCenter.tsx',
      'utf8',
    )
    expect(refreshSource).toContain("router.refresh()")
    expect(refreshSource).toContain("isPending ? 'Refreshing…' : 'Refresh'")
    expect(controlCenterSource).toContain('href="/control-center/nic-nac-usage"')
  })
})
