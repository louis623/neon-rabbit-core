import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSparkleLabCaps } from '@/lib/nic-nac/core/lab/budget'
import {
  buildSparkleLabFindingsFromSources,
  runSparkleLabManualScan,
  runSparkleLabWeeklyScan,
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

function makeInsertArtifactsQuery() {
  const insert = vi.fn().mockResolvedValue({ error: null })
  return { insert }
}

function makeMonthlyUsageQuery(data: unknown, error: unknown = null) {
  const gte = vi.fn().mockResolvedValue({ data, error })
  const eq = vi.fn(() => ({ gte }))
  const select = vi.fn(() => ({ eq }))
  return { select, eq, gte }
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
      artifacts: [],
    })
    expect(insertRunQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        run_type: 'manual',
        status: 'completed',
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

  it('creates a model synthesis report artifact only when synthesis is enabled', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-21T06:00:00.000Z'))
    const supportQuery = makeSelectQuery([
      {
        id: 'support-1',
        title: 'Showtime workflow broke',
        details: 'The rep could not complete a live-show workflow.',
        urgency: 'showtime_urgent',
      },
    ])
    const runQuery = makeSelectQuery([
      {
        run_id: 'run-hard-fail',
        status: 'complete',
        hard_fail_phrase_count: 1,
      },
    ])
    const insertRunQuery = makeInsertRunQuery()
    const insertFindingsQuery = makeInsertFindingsQuery()
    const insertArtifactsQuery = makeInsertArtifactsQuery()
    const generateTextMock = vi.fn().mockResolvedValue({
      text: '# Summary\n\nNic-Nac needs a replay case.\n\n# Priority Work\n\nAdd the replay first.',
      usage: {
        inputTokens: 1000,
        outputTokens: 2000,
        totalTokens: 3000,
      },
    })
    const from = vi.fn((table: string) => {
      if (table === 'support_reports') return supportQuery
      if (table === 'nic_nac_runs') return runQuery
      if (table === 'sparkle_lab_runs') return insertRunQuery
      if (table === 'sparkle_lab_findings') return insertFindingsQuery
      if (table === 'sparkle_lab_artifacts') return insertArtifactsQuery
      throw new Error(`unexpected table ${table}`)
    })

    const result = await runSparkleLabManualScan({
      supabase: { from } as never,
      modelSynthesis: 'enabled',
      generateTextImpl: generateTextMock as never,
    })

    expect(generateTextMock).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(generateTextMock.mock.calls[0]?.[0])).toContain(
      'Sparkle Lab',
    )
    expect(result).toMatchObject({
      runId: 'run-1',
      runType: 'manual',
      usage: {
        estimatedCostCents: 7,
        modelCallCount: 1,
        premiumCallCount: 1,
      },
      artifacts: [
        {
          section: 'ops_lab',
          artifactType: 'report',
          title: 'Sparkle Lab synthesis report',
        },
      ],
    })
    expect(insertRunQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        run_type: 'manual',
        model_call_count: 1,
        premium_call_count: 1,
        estimated_cost_cents: 7,
      }),
    )
    expect(insertArtifactsQuery.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        run_id: 'run-1',
        section: 'ops_lab',
        artifact_type: 'report',
        title: 'Sparkle Lab synthesis report',
        body_markdown: expect.stringContaining('Nic-Nac needs a replay case'),
        source_refs: expect.arrayContaining([
          { type: 'support_report', id: 'support-1' },
          { type: 'nic_nac_run', id: 'run-hard-fail' },
        ]),
      }),
    ])
  })

  it('persists a weekly run with the scheduled monthly cap tracked', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-21T06:00:00.000Z'))
    const supportQuery = makeSelectQuery([])
    const runTelemetryQuery = makeSelectQuery([])
    const monthlyUsageQuery = makeMonthlyUsageQuery([
      {
        estimated_cost_cents: 125,
        status: 'completed',
      },
    ])
    const insertRunQuery = makeInsertRunQuery()
    const sparkleLabRunsQuery = {
      ...monthlyUsageQuery,
      insert: insertRunQuery.insert,
    }
    const from = vi.fn((table: string) => {
      if (table === 'support_reports') return supportQuery
      if (table === 'nic_nac_runs') return runTelemetryQuery
      if (table === 'sparkle_lab_runs') return sparkleLabRunsQuery
      throw new Error(`unexpected table ${table}`)
    })

    const result = await runSparkleLabWeeklyScan({
      supabase: { from } as never,
    })

    expect(monthlyUsageQuery.eq).toHaveBeenCalledWith('run_type', 'weekly')
    expect(monthlyUsageQuery.gte).toHaveBeenCalledWith(
      'created_at',
      '2026-06-01T00:00:00.000Z',
    )
    expect(result).toMatchObject({
      runId: 'run-1',
      runType: 'weekly',
      usage: {
        estimatedCostCents: 0,
        monthlyScheduledCostCents: 125,
        modelCallCount: 0,
        premiumCallCount: 0,
      },
      limitsHit: [],
      findings: [],
    })
    expect(insertRunQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        run_type: 'weekly',
        status: 'completed',
        cost_cap_cents: 500,
        monthly_scheduled_cap_cents: 2000,
        limits_hit: [],
      }),
    )
  })

  it('stops a weekly run before sampling when the monthly scheduled cap is already reached', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-21T06:00:00.000Z'))
    const monthlyUsageQuery = makeMonthlyUsageQuery([
      {
        estimated_cost_cents: 2000,
        status: 'completed',
      },
    ])
    const insertRunQuery = makeInsertRunQuery()
    const sparkleLabRunsQuery = {
      ...monthlyUsageQuery,
      insert: insertRunQuery.insert,
    }
    const from = vi.fn((table: string) => {
      if (table === 'sparkle_lab_runs') return sparkleLabRunsQuery
      throw new Error(`unexpected table ${table}`)
    })

    const result = await runSparkleLabWeeklyScan({
      supabase: { from } as never,
    })

    expect(result).toMatchObject({
      runId: 'run-1',
      runType: 'weekly',
      usage: {
        estimatedCostCents: 0,
        monthlyScheduledCostCents: 2000,
        candidateRecordCount: 0,
      },
      limitsHit: ['monthly_scheduled_cap'],
      findings: [],
    })
    expect(insertRunQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        run_type: 'weekly',
        status: 'stopped_by_limit',
        candidate_record_count: 0,
        limits_hit: ['monthly_scheduled_cap'],
      }),
    )
  })
})
