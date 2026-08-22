import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getSparkleLabCaps,
  type SparkleLabCaps,
  type SparkleLabRunType,
} from '@/lib/nic-nac/core/lab/budget'

export type SparkleLabSection =
  | 'nic_nac_lab'
  | 'sparkle_suite_lab'
  | 'sparkle_finder_lab'
  | 'ops_lab'
  | 'research_desk'

export interface SparkleLabRunSummary {
  id: string
  runType: SparkleLabRunType
  status: string
  startedAt: string | null
  completedAt: string | null
  estimatedCostCents: number
  costCapCents: number
  modelCallCount: number
  modelCallCap: number
  premiumCallCount: number
  premiumCallCap: number
  candidateRecordCount: number
  candidateRecordCap: number
  deepItemCount: number
  deepItemCap: number
  headlineFindingCount: number
  headlineFindingCap: number
  activePriorityCount: number
  activePriorityCap: number
  limitsHit: string[]
  createdAt: string
}

export interface SparkleLabFindingSummary {
  id: string
  runId: string
  section: SparkleLabSection
  severity: string
  confidence: string
  title: string
  summary: string
  recommendedAction: string
  impactScore: number
  effortScore: number
  priorityRank: number | null
  createdAt: string
}

export interface SparkleLabArtifactSummary {
  id: string
  runId: string
  section: SparkleLabSection
  artifactType: string
  title: string
  bodyMarkdown: string
  createdAt: string
}

export interface SparkleLabSectionSummary {
  id: SparkleLabSection
  label: string
  description: string
  findingCount: number
  artifactCount: number
}

export interface SparkleLabControlCenterModel {
  sections: SparkleLabSectionSummary[]
  latestRuns: SparkleLabRunSummary[]
  headlineFindings: SparkleLabFindingSummary[]
  activePriorities: SparkleLabFindingSummary[]
  recentArtifacts: SparkleLabArtifactSummary[]
  caps: Record<SparkleLabRunType, SparkleLabCaps>
  accessIssue: string | null
}

export type SparkleLabRunRow = {
  id: string
  run_type: SparkleLabRunType
  status: string
  started_at: string | null
  completed_at: string | null
  estimated_cost_cents: number | null
  cost_cap_cents: number
  model_call_count: number | null
  model_call_cap: number
  premium_call_count: number | null
  premium_call_cap: number
  candidate_record_count: number | null
  candidate_record_cap: number
  deep_item_count: number | null
  deep_item_cap: number
  headline_finding_count: number | null
  headline_finding_cap: number
  active_priority_count: number | null
  active_priority_cap: number
  limits_hit: string[] | null
  created_at: string
}

export type SparkleLabFindingRow = {
  id: string
  run_id: string
  section: SparkleLabSection
  severity: string
  confidence: string
  title: string
  summary: string
  recommended_action: string
  impact_score: number | null
  effort_score: number | null
  priority_rank: number | null
  created_at: string
}

export type SparkleLabArtifactRow = {
  id: string
  run_id: string
  section: SparkleLabSection
  artifact_type: string
  title: string
  body_markdown: string | null
  created_at: string
}

export const SPARKLE_LAB_SECTIONS: Array<{
  id: SparkleLabSection
  label: string
  description: string
}> = [
  {
    id: 'nic_nac_lab',
    label: 'Nic-Nac Lab',
    description: 'Replay failures, memory quality, tool behavior, and response quality.',
  },
  {
    id: 'sparkle_suite_lab',
    label: 'Sparkle Suite Lab',
    description: 'Rep business health, site health, Dance Floor patterns, and launch risks.',
  },
  {
    id: 'sparkle_finder_lab',
    label: 'Sparkle Finder Lab',
    description: 'Collector behavior, search gaps, jewelry demand, and lead flow.',
  },
  {
    id: 'ops_lab',
    label: 'Ops Lab',
    description: 'Support trends, internal process gaps, cost, and usage signals.',
  },
  {
    id: 'research_desk',
    label: 'Research Desk',
    description: 'AI/tooling, social commerce, hardware, and live-selling research.',
  },
]

export async function readSparkleLabControlCenterModel(
  supabase: Pick<SupabaseClient, 'from'>,
): Promise<SparkleLabControlCenterModel> {
  try {
    const [runsResult, findingsResult, artifactsResult] = await Promise.all([
      supabase
        .from('sparkle_lab_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('sparkle_lab_findings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(12),
      supabase
        .from('sparkle_lab_artifacts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8),
    ])

    const firstError =
      runsResult.error ?? findingsResult.error ?? artifactsResult.error
    if (firstError) throw firstError

    return buildSparkleLabControlCenterModel({
      runs: (runsResult.data ?? []) as SparkleLabRunRow[],
      findings: (findingsResult.data ?? []) as SparkleLabFindingRow[],
      artifacts: (artifactsResult.data ?? []) as SparkleLabArtifactRow[],
      accessIssue: null,
    })
  } catch (err) {
    return buildSparkleLabControlCenterModel({
      runs: [],
      findings: [],
      artifacts: [],
      accessIssue:
        (err as Error)?.message ??
        'Sparkle Lab tables are not available in this environment yet.',
    })
  }
}

export function buildSparkleLabControlCenterModel(input: {
  runs: SparkleLabRunRow[]
  findings: SparkleLabFindingRow[]
  artifacts: SparkleLabArtifactRow[]
  accessIssue?: string | null
}): SparkleLabControlCenterModel {
  const latestRuns = input.runs.map(mapRun)
  const headlineFindings = input.findings
    .map(mapFinding)
    .sort((a, b) => {
      const priorityDelta =
        (a.priorityRank ?? Number.MAX_SAFE_INTEGER) -
        (b.priorityRank ?? Number.MAX_SAFE_INTEGER)
      if (priorityDelta !== 0) return priorityDelta
      return b.impactScore - a.impactScore
    })
    .slice(0, 3)
  const activePriorities = headlineFindings
    .filter((finding) => finding.priorityRank !== null)
    .slice(0, 2)
  const recentArtifacts = input.artifacts.map(mapArtifact)

  return {
    sections: SPARKLE_LAB_SECTIONS.map((section) => ({
      ...section,
      findingCount: input.findings.filter((finding) => finding.section === section.id)
        .length,
      artifactCount: input.artifacts.filter(
        (artifact) => artifact.section === section.id,
      ).length,
    })),
    latestRuns,
    headlineFindings,
    activePriorities,
    recentArtifacts,
    caps: {
      weekly: getSparkleLabCaps('weekly'),
      manual: getSparkleLabCaps('manual'),
      urgent: getSparkleLabCaps('urgent'),
    },
    accessIssue: input.accessIssue ?? null,
  }
}

function mapRun(row: SparkleLabRunRow): SparkleLabRunSummary {
  return {
    id: row.id,
    runType: row.run_type,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    estimatedCostCents: row.estimated_cost_cents ?? 0,
    costCapCents: row.cost_cap_cents,
    modelCallCount: row.model_call_count ?? 0,
    modelCallCap: row.model_call_cap,
    premiumCallCount: row.premium_call_count ?? 0,
    premiumCallCap: row.premium_call_cap,
    candidateRecordCount: row.candidate_record_count ?? 0,
    candidateRecordCap: row.candidate_record_cap,
    deepItemCount: row.deep_item_count ?? 0,
    deepItemCap: row.deep_item_cap,
    headlineFindingCount: row.headline_finding_count ?? 0,
    headlineFindingCap: row.headline_finding_cap,
    activePriorityCount: row.active_priority_count ?? 0,
    activePriorityCap: row.active_priority_cap,
    limitsHit: row.limits_hit ?? [],
    createdAt: row.created_at,
  }
}

function mapFinding(row: SparkleLabFindingRow): SparkleLabFindingSummary {
  return {
    id: row.id,
    runId: row.run_id,
    section: row.section,
    severity: row.severity,
    confidence: row.confidence,
    title: row.title,
    summary: row.summary,
    recommendedAction: row.recommended_action,
    impactScore: row.impact_score ?? 0,
    effortScore: row.effort_score ?? 0,
    priorityRank: row.priority_rank,
    createdAt: row.created_at,
  }
}

function mapArtifact(row: SparkleLabArtifactRow): SparkleLabArtifactSummary {
  return {
    id: row.id,
    runId: row.run_id,
    section: row.section,
    artifactType: row.artifact_type,
    title: row.title,
    bodyMarkdown: row.body_markdown ?? '',
    createdAt: row.created_at,
  }
}
