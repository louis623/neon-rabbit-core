import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getSparkleLabCaps,
  shouldStopSparkleLabRun,
  type SparkleLabCaps,
  type SparkleLabRunType,
  type SparkleLabUsage,
} from '@/lib/nic-nac/core/lab/budget'
import type { SparkleLabSection } from '@/lib/sparkle-lab/read-model'

export interface SparkleLabSupportSource {
  id: string
  title?: string | null
  details?: string | null
  status?: string | null
  urgency?: string | null
  page_or_workflow?: string | null
  created_at?: string | null
}

export interface SparkleLabNicNacRunSource {
  run_id: string
  status?: string | null
  product?: string | null
  surface?: string | null
  hard_fail_phrase_count?: number | null
  hard_fail_phrases?: string[] | null
  error_message?: string | null
  latency_ms?: number | null
  estimated_cost_cents?: number | null
  created_at?: string | null
}

export interface SparkleLabDraftFinding {
  section: SparkleLabSection
  severity: 'low' | 'medium' | 'high' | 'urgent'
  confidence: 'low' | 'medium' | 'high'
  title: string
  summary: string
  recommendedAction: string
  impactScore: number
  effortScore: number
  priorityRank: number | null
  sourceRefs: Array<{ type: string; id: string }>
}

export interface SparkleLabScanResult {
  runId: string
  runType: SparkleLabRunType
  usage: SparkleLabUsage
  limitsHit: string[]
  findings: SparkleLabDraftFinding[]
}

export async function runSparkleLabManualScan(input: {
  supabase: Pick<SupabaseClient, 'from'>
  runType?: Extract<SparkleLabRunType, 'manual' | 'urgent'>
}): Promise<SparkleLabScanResult> {
  const runType = input.runType ?? 'manual'
  const caps = getSparkleLabCaps(runType)
  const sources = await collectSparkleLabSources({
    supabase: input.supabase,
    caps,
  })
  const findings = buildSparkleLabFindingsFromSources({
    ...sources,
    caps,
  })
  const usage: SparkleLabUsage = {
    estimatedCostCents: 0,
    modelCallCount: 0,
    premiumCallCount: 0,
    runtimeSeconds: 0,
    candidateRecordCount:
      sources.supportReports.length + sources.nicNacRuns.length,
    deepItemCount: findings.length,
    headlineFindingCount: Math.min(findings.length, caps.headlineFindingCap),
    activePriorityCount: findings.filter((finding) => finding.priorityRank !== null)
      .length,
  }
  const stop = shouldStopSparkleLabRun(usage, caps)
  const status = stop.shouldStop ? 'stopped_by_limit' : 'completed'

  const { data: runRow, error: runError } = await input.supabase
    .from('sparkle_lab_runs')
    .insert({
      run_type: runType,
      status,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      cost_cap_cents: caps.costCapCents,
      monthly_scheduled_cap_cents: caps.monthlyScheduledCapCents ?? null,
      estimated_cost_cents: usage.estimatedCostCents,
      model_call_cap: caps.modelCallCap,
      model_call_count: usage.modelCallCount,
      premium_call_cap: caps.premiumCallCap,
      premium_call_count: usage.premiumCallCount,
      runtime_cap_seconds: caps.runtimeCapSeconds,
      candidate_record_cap: caps.candidateRecordCap,
      candidate_record_count: usage.candidateRecordCount,
      deep_item_cap: caps.deepItemCap,
      deep_item_count: usage.deepItemCount,
      headline_finding_cap: caps.headlineFindingCap,
      headline_finding_count: usage.headlineFindingCount,
      active_priority_cap: caps.activePriorityCap,
      active_priority_count: usage.activePriorityCount,
      limits_hit: stop.limitsHit,
    })
    .select('id')
    .single()

  if (runError || !runRow) {
    throw runError ?? new Error('sparkle_lab_runs insert returned no row')
  }

  const runId = (runRow as { id: string }).id
  if (findings.length) {
    const { error: findingError } = await input.supabase
      .from('sparkle_lab_findings')
      .insert(
        findings.map((finding) => ({
          run_id: runId,
          section: finding.section,
          severity: finding.severity,
          confidence: finding.confidence,
          title: finding.title,
          summary: finding.summary,
          recommended_action: finding.recommendedAction,
          impact_score: finding.impactScore,
          effort_score: finding.effortScore,
          priority_rank: finding.priorityRank,
          source_refs: finding.sourceRefs,
        })),
      )

    if (findingError) throw findingError
  }

  return {
    runId,
    runType,
    usage,
    limitsHit: stop.limitsHit,
    findings,
  }
}

export async function collectSparkleLabSources(input: {
  supabase: Pick<SupabaseClient, 'from'>
  caps: SparkleLabCaps
}): Promise<{
  supportReports: SparkleLabSupportSource[]
  nicNacRuns: SparkleLabNicNacRunSource[]
}> {
  const perSourceLimit = Math.max(
    1,
    Math.floor(input.caps.candidateRecordCap / 2),
  )
  const [supportResult, runsResult] = await Promise.all([
    input.supabase
      .from('support_reports')
      .select('id,title,details,status,urgency,page_or_workflow,created_at')
      .order('created_at', { ascending: false })
      .limit(perSourceLimit),
    input.supabase
      .from('nic_nac_runs')
      .select(
        'run_id,status,product,surface,hard_fail_phrase_count,hard_fail_phrases,error_message,latency_ms,estimated_cost_cents,created_at',
      )
      .order('created_at', { ascending: false })
      .limit(perSourceLimit),
  ])

  if (supportResult.error) throw supportResult.error
  if (runsResult.error) throw runsResult.error

  return {
    supportReports: (supportResult.data ?? []) as SparkleLabSupportSource[],
    nicNacRuns: (runsResult.data ?? []) as SparkleLabNicNacRunSource[],
  }
}

export function buildSparkleLabFindingsFromSources(input: {
  supportReports: SparkleLabSupportSource[]
  nicNacRuns: SparkleLabNicNacRunSource[]
  caps: SparkleLabCaps
}): SparkleLabDraftFinding[] {
  const findings: SparkleLabDraftFinding[] = []

  const urgentSupport = input.supportReports.find((report) =>
    ['blocking', 'showtime_urgent'].includes(report.urgency ?? ''),
  )
  if (urgentSupport) {
    findings.push({
      section: 'ops_lab',
      severity: urgentSupport.urgency === 'showtime_urgent' ? 'urgent' : 'high',
      confidence: 'medium',
      title: urgentSupport.title || 'Urgent support pattern needs review',
      summary:
        urgentSupport.details ||
        'A high-urgency support report was found in the latest lab sample.',
      recommendedAction:
        'Review the support report, identify whether it is a product issue or workflow confusion, and create one concrete next action.',
      impactScore: 9,
      effortScore: 3,
      priorityRank: 1,
      sourceRefs: [{ type: 'support_report', id: urgentSupport.id }],
    })
  }

  const hardFailRun = input.nicNacRuns.find(
    (run) => (run.hard_fail_phrase_count ?? 0) > 0,
  )
  if (hardFailRun) {
    findings.push({
      section: 'nic_nac_lab',
      severity: 'high',
      confidence: 'high',
      title: 'Nic-Nac hard-fail phrase detected',
      summary: `A Nic-Nac run recorded ${
        hardFailRun.hard_fail_phrase_count ?? 0
      } hard-fail phrase match${
        (hardFailRun.hard_fail_phrase_count ?? 0) === 1 ? '' : 'es'
      }.`,
      recommendedAction:
        'Turn this run into a replay case before changing prompts, tools, or model policy.',
      impactScore: 8,
      effortScore: 2,
      priorityRank: findings.length < input.caps.activePriorityCap ? findings.length + 1 : null,
      sourceRefs: [{ type: 'nic_nac_run', id: hardFailRun.run_id }],
    })
  }

  const erroredRun = input.nicNacRuns.find((run) =>
    ['error', 'aborted'].includes(run.status ?? ''),
  )
  if (erroredRun && findings.length < input.caps.headlineFindingCap) {
    findings.push({
      section: 'nic_nac_lab',
      severity: 'medium',
      confidence: 'medium',
      title: 'Nic-Nac run did not complete cleanly',
      summary:
        erroredRun.error_message ||
        'A recent Nic-Nac run ended with error or abort status.',
      recommendedAction:
        'Check route telemetry and tool execution logs for this run before adding new features.',
      impactScore: 6,
      effortScore: 3,
      priorityRank: null,
      sourceRefs: [{ type: 'nic_nac_run', id: erroredRun.run_id }],
    })
  }

  return findings.slice(0, input.caps.headlineFindingCap)
}
