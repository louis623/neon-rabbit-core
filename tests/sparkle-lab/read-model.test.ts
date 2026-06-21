import { describe, expect, it, vi } from 'vitest'
import {
  buildSparkleLabControlCenterModel,
  readSparkleLabControlCenterModel,
  type SparkleLabArtifactRow,
  type SparkleLabFindingRow,
  type SparkleLabRunRow,
} from '@/lib/sparkle-lab/read-model'

const runRow: SparkleLabRunRow = {
  id: 'run-1',
  run_type: 'weekly',
  status: 'completed',
  started_at: '2026-06-21T06:00:00.000Z',
  completed_at: '2026-06-21T06:05:00.000Z',
  estimated_cost_cents: 173,
  cost_cap_cents: 500,
  model_call_count: 7,
  model_call_cap: 20,
  premium_call_count: 1,
  premium_call_cap: 4,
  candidate_record_count: 80,
  candidate_record_cap: 250,
  deep_item_count: 6,
  deep_item_cap: 25,
  headline_finding_count: 2,
  headline_finding_cap: 3,
  active_priority_count: 1,
  active_priority_cap: 2,
  limits_hit: [],
  created_at: '2026-06-21T06:00:00.000Z',
}

const findings: SparkleLabFindingRow[] = [
  {
    id: 'finding-2',
    run_id: 'run-1',
    section: 'sparkle_suite_lab',
    severity: 'medium',
    confidence: 'high',
    title: 'Second priority',
    summary: 'Support reports repeat the same workflow confusion.',
    recommended_action: 'Improve the workflow guide before adding new alerts.',
    impact_score: 8,
    effort_score: 3,
    priority_rank: 2,
    created_at: '2026-06-21T06:04:00.000Z',
  },
  {
    id: 'finding-1',
    run_id: 'run-1',
    section: 'nic_nac_lab',
    severity: 'high',
    confidence: 'high',
    title: 'Top priority',
    summary: 'Duplicate item handling needs a replay case.',
    recommended_action: 'Add a replay before the next model comparison.',
    impact_score: 9,
    effort_score: 2,
    priority_rank: 1,
    created_at: '2026-06-21T06:03:00.000Z',
  },
]

const artifacts: SparkleLabArtifactRow[] = [
  {
    id: 'artifact-1',
    run_id: 'run-1',
    section: 'nic_nac_lab',
    artifact_type: 'replay_case',
    title: 'Duplicate item replay',
    body_markdown: 'Rep asks to add an item number already on the board.',
    created_at: '2026-06-21T06:05:00.000Z',
  },
]

function makeQuery(data: unknown, error: unknown = null) {
  const limit = vi.fn().mockResolvedValue({ data, error })
  const order = vi.fn(() => ({ limit }))
  const select = vi.fn(() => ({ order }))
  return { select, order, limit }
}

describe('Sparkle Lab read model', () => {
  it('builds a Control Center model with caps, priorities, and section counts', () => {
    const model = buildSparkleLabControlCenterModel({
      runs: [runRow],
      findings,
      artifacts,
    })

    expect(model.latestRuns[0]).toMatchObject({
      id: 'run-1',
      runType: 'weekly',
      estimatedCostCents: 173,
      modelCallCap: 20,
    })
    expect(model.headlineFindings.map((finding) => finding.id)).toEqual([
      'finding-1',
      'finding-2',
    ])
    expect(model.activePriorities.map((finding) => finding.id)).toEqual([
      'finding-1',
      'finding-2',
    ])
    expect(model.sections.find((section) => section.id === 'nic_nac_lab')).toMatchObject({
      label: 'Nic-Nac Lab',
      findingCount: 1,
      artifactCount: 1,
    })
    expect(model.caps.weekly.costCapCents).toBe(500)
    expect(model.caps.manual.costCapCents).toBe(200)
    expect(model.caps.urgent.costCapCents).toBe(300)
  })

  it('reads runs, findings, and artifacts from Sparkle Lab tables', async () => {
    const runQuery = makeQuery([runRow])
    const findingQuery = makeQuery(findings)
    const artifactQuery = makeQuery(artifacts)
    const from = vi
      .fn()
      .mockReturnValueOnce(runQuery)
      .mockReturnValueOnce(findingQuery)
      .mockReturnValueOnce(artifactQuery)

    const model = await readSparkleLabControlCenterModel({ from } as never)

    expect(from).toHaveBeenCalledWith('sparkle_lab_runs')
    expect(from).toHaveBeenCalledWith('sparkle_lab_findings')
    expect(from).toHaveBeenCalledWith('sparkle_lab_artifacts')
    expect(runQuery.select).toHaveBeenCalledWith('*')
    expect(runQuery.order).toHaveBeenCalledWith('created_at', {
      ascending: false,
    })
    expect(runQuery.limit).toHaveBeenCalledWith(5)
    expect(model.latestRuns).toHaveLength(1)
    expect(model.accessIssue).toBeNull()
  })

  it('returns an empty model with an access issue when tables are unavailable', async () => {
    const failingQuery = makeQuery([], new Error('relation does not exist'))
    const from = vi.fn(() => failingQuery)

    const model = await readSparkleLabControlCenterModel({ from } as never)

    expect(model.latestRuns).toEqual([])
    expect(model.headlineFindings).toEqual([])
    expect(model.accessIssue).toContain('relation does not exist')
  })
})
