import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSparkleLabCaps } from '@/lib/nic-nac/core/lab/budget'
import {
  buildSparkleLabFindingsFromSources,
  runSparkleLabManualScan,
} from '@/lib/sparkle-lab/runner'

function makeSelectQuery(data: unknown, error: unknown = null) {
  const limit = vi.fn().mockResolvedValue({ data, error })
  const order = vi.fn(() => ({ limit }))
  const select = vi.fn(() => ({ order }))
  return { select, order, limit }
}

function makeInsertRunQuery() {
  const single = vi.fn().mockResolvedValue({ data: { id: 'run-1' }, error: null })
  const select = vi.fn(() => ({ single }))
  const insert = vi.fn(() => ({ select }))
  return { insert, select, single }
}

function makeInsertFindingsQuery() {
  const insert = vi.fn().mockResolvedValue({ error: null })
  return { insert }
}

beforeEach(() => {
  vi.useRealTimers()
})

describe('Sparkle Lab deterministic runner', () => {
  it('creates capped findings from support reports and Nic-Nac run telemetry', () => {
    const findings = buildSparkleLabFindingsFromSources({
      caps: getSparkleLabCaps('manual'),
      supportReports: [
        {
          id: 'support-1',
          title: 'Showtime workflow broke',
          details: 'The rep could not complete a live-show workflow.',
          urgency: 'showtime_urgent',
        },
      ],
      nicNacRuns: [
        {
          run_id: 'run-hard-fail',
          status: 'complete',
          hard_fail_phrase_count: 1,
          hard_fail_phrases: ['Log into your workspace and add it manually'],
        },
        {
          run_id: 'run-error',
          status: 'error',
          error_message: 'stream failed',
        },
      ],
    })

    expect(findings).toHaveLength(3)
    expect(findings[0]).toMatchObject({
      section: 'ops_lab',
      severity: 'urgent',
      priorityRank: 1,
      sourceRefs: [{ type: 'support_report', id: 'support-1' }],
    })
    expect(findings[1]).toMatchObject({
      section: 'nic_nac_lab',
      title: 'Nic-Nac hard-fail phrase detected',
      priorityRank: 2,
      sourceRefs: [{ type: 'nic_nac_run', id: 'run-hard-fail' }],
    })
    expect(findings[2]).toMatchObject({
      title: 'Nic-Nac run did not complete cleanly',
      priorityRank: null,
    })
  })

  it('persists a manual run and generated findings without model calls', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-21T06:00:00.000Z'))
    const supportQuery = makeSelectQuery([
      {
        id: 'support-1',
        title: 'Blocking report',
        details: 'Trade Board failure during show.',
        urgency: 'blocking',
      },
    ])
    const runQuery = makeSelectQuery([
      {
        run_id: 'nic-run-1',
        status: 'complete',
        hard_fail_phrase_count: 1,
      },
    ])
    const insertRunQuery = makeInsertRunQuery()
    const insertFindingsQuery = makeInsertFindingsQuery()
    const from = vi.fn((table: string) => {
      if (table === 'support_reports') return supportQuery
      if (table === 'nic_nac_runs') return runQuery
      if (table === 'sparkle_lab_runs') return insertRunQuery
      if (table === 'sparkle_lab_findings') return insertFindingsQuery
      throw new Error(`unexpected table ${table}`)
    })

    const result = await runSparkleLabManualScan({
      supabase: { from } as never,
    })

    expect(result).toMatchObject({
      runId: 'run-1',
      runType: 'manual',
      usage: {
        estimatedCostCents: 0,
        modelCallCount: 0,
        premiumCallCount: 0,
        candidateRecordCount: 2,
      },
    })
    expect(insertRunQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        run_type: 'manual',
        status: 'stopped_by_limit',
        started_at: '2026-06-21T06:00:00.000Z',
        completed_at: '2026-06-21T06:00:00.000Z',
        cost_cap_cents: 200,
        model_call_count: 0,
        premium_call_count: 0,
        limits_hit: ['active_priority_cap'],
      }),
    )
    expect(insertFindingsQuery.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          run_id: 'run-1',
          section: 'ops_lab',
          priority_rank: 1,
        }),
        expect.objectContaining({
          run_id: 'run-1',
          section: 'nic_nac_lab',
          priority_rank: 2,
        }),
      ]),
    )
  })
})
