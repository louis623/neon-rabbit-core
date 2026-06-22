import type { SupabaseClient } from '@supabase/supabase-js'
import { generateText } from 'ai'
import {
  getSparkleLabCaps,
  shouldStopSparkleLabRun,
  type SparkleLabCaps,
  type SparkleLabRunType,
  type SparkleLabUsage,
} from '@/lib/nic-nac/core/lab/budget'
import {
  estimateNicNacRunCostCents,
  hasNicNacModelCostPricing,
} from '@/lib/nic-nac/core/model-cost'
import { getNicNacModelPolicy } from '@/lib/nic-nac/core/model-policy'
import {
  getNicNacLanguageModel,
  getNicNacProviderOptions,
} from '@/lib/nic-nac/core/model-provider'
import { normalizeRunUsage } from '@/lib/nic-nac/run-telemetry'
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

export interface SparkleLabDraftArtifact {
  section: SparkleLabSection
  artifactType: 'report' | 'replay_case' | 'research_brief' | 'recommendation' | 'lab_note'
  title: string
  bodyMarkdown: string
  sourceRefs: Array<{ type: string; id: string }>
}

export interface SparkleLabScanResult {
  runId: string
  runType: SparkleLabRunType
  usage: SparkleLabUsage
  limitsHit: string[]
  findings: SparkleLabDraftFinding[]
  artifacts: SparkleLabDraftArtifact[]
}

type SparkleLabRunStatus = 'completed' | 'stopped_by_limit'
type SparkleLabModelSynthesisMode = 'auto' | 'enabled' | 'disabled'

async function defaultSparkleLabGenerateText(
  options: Parameters<typeof generateText>[0],
) {
  return generateText(options)
}

type SparkleLabGenerateText = typeof defaultSparkleLabGenerateText

export async function runSparkleLabManualScan(input: {
  supabase: Pick<SupabaseClient, 'from'>
  runType?: Extract<SparkleLabRunType, 'manual' | 'urgent'>
  modelSynthesis?: SparkleLabModelSynthesisMode
  generateTextImpl?: SparkleLabGenerateText
}): Promise<SparkleLabScanResult> {
  return runSparkleLabScan({
    supabase: input.supabase,
    runType: input.runType ?? 'manual',
    modelSynthesis: input.modelSynthesis,
    generateTextImpl: input.generateTextImpl,
  })
}

export async function runSparkleLabWeeklyScan(input: {
  supabase: Pick<SupabaseClient, 'from'>
  now?: Date
  modelSynthesis?: SparkleLabModelSynthesisMode
  generateTextImpl?: SparkleLabGenerateText
}): Promise<SparkleLabScanResult> {
  return runSparkleLabScan({
    supabase: input.supabase,
    runType: 'weekly',
    now: input.now,
    modelSynthesis: input.modelSynthesis,
    generateTextImpl: input.generateTextImpl,
  })
}

async function runSparkleLabScan(input: {
  supabase: Pick<SupabaseClient, 'from'>
  runType: SparkleLabRunType
  now?: Date
  modelSynthesis?: SparkleLabModelSynthesisMode
  generateTextImpl?: SparkleLabGenerateText
}): Promise<SparkleLabScanResult> {
  const runType = input.runType
  const now = input.now ?? new Date()
  const caps = getSparkleLabCaps(runType)
  const monthlyScheduledCostCents =
    runType === 'weekly'
      ? await readSparkleLabMonthlyScheduledCostCents({
          supabase: input.supabase,
          now,
        })
      : undefined

  if (
    caps.monthlyScheduledCapCents !== undefined &&
    (monthlyScheduledCostCents ?? 0) >= caps.monthlyScheduledCapCents
  ) {
    const usage = buildEmptySparkleLabUsage(monthlyScheduledCostCents)
    const limitsHit = ['monthly_scheduled_cap']
    const runId = await persistSparkleLabRun({
      supabase: input.supabase,
      caps,
      usage,
      limitsHit,
      status: 'stopped_by_limit',
      now,
    })
    const artifacts = [
      buildSparkleLabRunGuardrailArtifact({
        caps,
        usage,
        limitsHit,
        modelSynthesisStatus: describeSparkleLabModelSynthesisStatus({
          requested: shouldRunSparkleLabModelSynthesis(input.modelSynthesis),
        }),
        sourceRefs: [],
      }),
    ]
    await persistSparkleLabArtifacts({
      supabase: input.supabase,
      runId,
      artifacts,
    })

    return {
      runId,
      runType,
      usage,
      limitsHit,
      findings: [],
      artifacts,
    }
  }

  const sources = await collectSparkleLabSources({
    supabase: input.supabase,
    caps,
  })
  const findings = buildSparkleLabFindingsFromSources({
    ...sources,
    caps,
  })
  const estimatedCostCents = 0
  const usage: SparkleLabUsage = {
    estimatedCostCents,
    modelCallCount: 0,
    premiumCallCount: 0,
    runtimeSeconds: 0,
    candidateRecordCount:
      sources.supportReports.length + sources.nicNacRuns.length,
    deepItemCount: findings.length,
    headlineFindingCount: Math.min(findings.length, caps.headlineFindingCap),
    activePriorityCount: findings.filter((finding) => finding.priorityRank !== null)
      .length,
    monthlyScheduledCostCents:
      monthlyScheduledCostCents === undefined
        ? undefined
        : monthlyScheduledCostCents + estimatedCostCents,
  }
  const synthesisArtifacts: SparkleLabDraftArtifact[] = []
  let modelSynthesisStatus = describeSparkleLabModelSynthesisStatus({
    requested: shouldRunSparkleLabModelSynthesis(input.modelSynthesis),
  })

  if (shouldRunSparkleLabModelSynthesis(input.modelSynthesis)) {
    const synthesis = await maybeBuildSparkleLabSynthesisArtifact({
      findings,
      usage,
      caps,
      generateTextImpl: input.generateTextImpl ?? defaultSparkleLabGenerateText,
    })
    if (synthesis.artifact) {
      synthesisArtifacts.push(synthesis.artifact)
      modelSynthesisStatus = describeSparkleLabModelSynthesisStatus({
        requested: true,
        artifactTitle: synthesis.artifact.title,
      })
    }
    usage.modelCallCount += synthesis.modelCallCount
    usage.premiumCallCount += synthesis.premiumCallCount
    usage.estimatedCostCents += synthesis.estimatedCostCents
    if (usage.monthlyScheduledCostCents !== undefined) {
      usage.monthlyScheduledCostCents += synthesis.estimatedCostCents
    }
  }

  const stop = shouldStopSparkleLabRun(usage, caps)
  const status = stop.shouldStop ? 'stopped_by_limit' : 'completed'
  const artifacts: SparkleLabDraftArtifact[] = [
    buildSparkleLabRunGuardrailArtifact({
      caps,
      usage,
      limitsHit: stop.limitsHit,
      modelSynthesisStatus,
      sourceRefs: collectSparkleLabFindingSourceRefs(findings),
    }),
    ...synthesisArtifacts,
  ]
  const runId = await persistSparkleLabRun({
    supabase: input.supabase,
    caps,
    usage,
    limitsHit: stop.limitsHit,
    status,
    now,
  })
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
  await persistSparkleLabArtifacts({
    supabase: input.supabase,
    runId,
    artifacts,
  })

  return {
    runId,
    runType,
    usage,
    limitsHit: stop.limitsHit,
    findings,
    artifacts,
  }
}

function shouldRunSparkleLabModelSynthesis(
  mode: SparkleLabModelSynthesisMode = 'auto',
) {
  if (mode === 'enabled') return true
  if (mode === 'disabled') return false
  return process.env.SPARKLE_LAB_MODEL_SYNTHESIS_ENABLED === 'true'
}

function describeSparkleLabModelSynthesisStatus(input: {
  requested: boolean
  artifactTitle?: string
}) {
  if (!input.requested) {
    return 'disabled'
  }
  if (input.artifactTitle === 'Sparkle Lab synthesis skipped') {
    return 'enabled, skipped unless approved pricing is present'
  }
  if (input.artifactTitle === 'Sparkle Lab synthesis unavailable') {
    return 'enabled, unavailable'
  }
  return 'enabled'
}

function collectSparkleLabFindingSourceRefs(
  findings: SparkleLabDraftFinding[],
) {
  const seen = new Set<string>()
  const refs: Array<{ type: string; id: string }> = []
  for (const finding of findings) {
    for (const ref of finding.sourceRefs) {
      const key = `${ref.type}:${ref.id}`
      if (seen.has(key)) continue
      seen.add(key)
      refs.push(ref)
    }
  }
  return refs
}

function buildSparkleLabRunGuardrailArtifact(input: {
  caps: SparkleLabCaps
  usage: SparkleLabUsage
  limitsHit: string[]
  modelSynthesisStatus: string
  sourceRefs: Array<{ type: string; id: string }>
}): SparkleLabDraftArtifact {
  const monthlyLine =
    input.caps.monthlyScheduledCapCents === undefined
      ? null
      : `- Monthly scheduled spend: ${formatSparkleLabCents(
          input.usage.monthlyScheduledCostCents ?? 0,
        )} / ${formatSparkleLabCents(input.caps.monthlyScheduledCapCents)}`

  return {
    section: 'ops_lab',
    artifactType: 'lab_note',
    title: 'Sparkle Lab deterministic run guardrails',
    bodyMarkdown: [
      '## Guardrails',
      `- Run type: ${input.caps.runType}`,
      '- Mutation mode: recommendations only. No production behavior, prompts, tools, pricing, or customer data were changed.',
      `- Model synthesis: ${input.modelSynthesisStatus}`,
      `- Estimated cost: ${formatSparkleLabCents(
        input.usage.estimatedCostCents,
      )} / ${formatSparkleLabCents(input.caps.costCapCents)}`,
      monthlyLine,
      `- Model calls: ${input.usage.modelCallCount} / ${input.caps.modelCallCap}`,
      `- Premium calls: ${input.usage.premiumCallCount} / ${input.caps.premiumCallCap}`,
      `- Runtime seconds: ${input.usage.runtimeSeconds} / ${input.caps.runtimeCapSeconds}`,
      `- Candidate records: ${input.usage.candidateRecordCount} / ${input.caps.candidateRecordCap}`,
      `- Deep items: ${input.usage.deepItemCount} / ${input.caps.deepItemCap}`,
      `- Headline findings: ${input.usage.headlineFindingCount} / ${input.caps.headlineFindingCap}`,
      `- Active priorities: ${input.usage.activePriorityCount} / ${input.caps.activePriorityCap}`,
      `- Limits hit: ${
        input.limitsHit.length ? input.limitsHit.join(', ') : 'None'
      }`,
    ]
      .filter(Boolean)
      .join('\n'),
    sourceRefs: input.sourceRefs,
  }
}

function formatSparkleLabCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

async function maybeBuildSparkleLabSynthesisArtifact(input: {
  findings: SparkleLabDraftFinding[]
  usage: SparkleLabUsage
  caps: SparkleLabCaps
  generateTextImpl: SparkleLabGenerateText
}): Promise<{
  artifact: SparkleLabDraftArtifact | null
  modelCallCount: number
  premiumCallCount: number
  estimatedCostCents: number
}> {
  if (!input.findings.length) return emptySynthesisUsage()
  if (input.usage.modelCallCount + 1 > input.caps.modelCallCap) {
    return emptySynthesisUsage()
  }
  if (input.usage.premiumCallCount + 1 > input.caps.premiumCallCap) {
    return emptySynthesisUsage()
  }
  if (input.usage.estimatedCostCents >= input.caps.costCapCents) {
    return emptySynthesisUsage()
  }

  const policy = getNicNacModelPolicy('lab_synthesis')
  if (!hasNicNacModelCostPricing(policy)) {
    return {
      artifact: {
        section: 'ops_lab',
        artifactType: 'lab_note',
        title: 'Sparkle Lab synthesis skipped',
        bodyMarkdown: `Model synthesis was enabled, but Sparkle Lab skipped the model call because ${policy.modelId} does not have an approved Nic-Nac pricing entry. Add pricing before enabling this model so Lab budget caps cannot undercount spend.`,
        sourceRefs: input.findings.flatMap((finding) => finding.sourceRefs),
      },
      modelCallCount: 0,
      premiumCallCount: 0,
      estimatedCostCents: 0,
    }
  }
  try {
    const result = await input.generateTextImpl({
      model: getNicNacLanguageModel(policy),
      system: buildSparkleLabSynthesisSystemPrompt(),
      prompt: buildSparkleLabSynthesisPrompt(input.findings, input.caps),
      temperature: 0.2,
      maxOutputTokens: 700,
      providerOptions: getNicNacProviderOptions(policy),
    })
    const usage = normalizeRunUsage(result.usage)
    const estimatedCostCents = estimateNicNacRunCostCents(policy, usage) ?? 0

    return {
      artifact: {
        section: chooseSparkleLabReportSection(input.findings),
        artifactType: 'report',
        title: 'Sparkle Lab synthesis report',
        bodyMarkdown: sanitizeSparkleLabArtifactBody(result.text),
        sourceRefs: input.findings.flatMap((finding) => finding.sourceRefs),
      },
      modelCallCount: 1,
      premiumCallCount: 1,
      estimatedCostCents,
    }
  } catch (err) {
    return {
      artifact: {
        section: 'ops_lab',
        artifactType: 'lab_note',
        title: 'Sparkle Lab synthesis unavailable',
        bodyMarkdown: `Model synthesis was enabled, but the synthesis call did not complete. The deterministic findings were still recorded. Error: ${
          (err as Error)?.message || 'unknown synthesis error'
        }`,
        sourceRefs: input.findings.flatMap((finding) => finding.sourceRefs),
      },
      modelCallCount: 0,
      premiumCallCount: 0,
      estimatedCostCents: 0,
    }
  }
}

function emptySynthesisUsage() {
  return {
    artifact: null,
    modelCallCount: 0,
    premiumCallCount: 0,
    estimatedCostCents: 0,
  }
}

function buildSparkleLabSynthesisSystemPrompt() {
  return [
    'You are Sparkle Lab, an internal analysis assistant for Sparkle Suite, Sparkle Finder, and Nic-Nac.',
    'You may recommend, triage, and explain. You may not claim production has changed, mutate behavior, or ask for unbounded research.',
    'Write a concise internal markdown report for Louis. Prioritize one or two next actions, explain why, and include usage/guardrail awareness.',
  ].join('\n')
}

function buildSparkleLabSynthesisPrompt(
  findings: SparkleLabDraftFinding[],
  caps: SparkleLabCaps,
) {
  const findingLines = findings.map((finding, index) =>
    [
      `Finding ${index + 1}: ${finding.title}`,
      `section=${finding.section}`,
      `severity=${finding.severity}`,
      `confidence=${finding.confidence}`,
      `priority=${finding.priorityRank ?? 'none'}`,
      `summary=${finding.summary}`,
      `recommended_action=${finding.recommendedAction}`,
      `source_refs=${JSON.stringify(finding.sourceRefs)}`,
    ].join('\n'),
  )

  return [
    `Run type: ${caps.runType}`,
    `Caps: cost ${caps.costCapCents} cents, model calls ${caps.modelCallCap}, premium calls ${caps.premiumCallCap}, headline findings ${caps.headlineFindingCap}, active priorities ${caps.activePriorityCap}.`,
    'Findings:',
    findingLines.join('\n\n'),
    'Return markdown only with headings: Summary, Priority Work, Guardrails, Follow-Up Evidence.',
  ].join('\n\n')
}

function chooseSparkleLabReportSection(
  findings: SparkleLabDraftFinding[],
): SparkleLabSection {
  return findings.find((finding) => finding.priorityRank === 1)?.section ?? 'ops_lab'
}

function sanitizeSparkleLabArtifactBody(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return 'Sparkle Lab synthesis returned an empty report.'
  return trimmed.slice(0, 6_000)
}

function buildEmptySparkleLabUsage(
  monthlyScheduledCostCents?: number,
): SparkleLabUsage {
  return {
    estimatedCostCents: 0,
    monthlyScheduledCostCents,
    modelCallCount: 0,
    premiumCallCount: 0,
    runtimeSeconds: 0,
    candidateRecordCount: 0,
    deepItemCount: 0,
    headlineFindingCount: 0,
    activePriorityCount: 0,
  }
}

async function persistSparkleLabRun(input: {
  supabase: Pick<SupabaseClient, 'from'>
  caps: SparkleLabCaps
  usage: SparkleLabUsage
  limitsHit: string[]
  status: SparkleLabRunStatus
  now: Date
}) {
  const nowIso = input.now.toISOString()
  const { data: runRow, error: runError } = await input.supabase
    .from('sparkle_lab_runs')
    .insert({
      run_type: input.caps.runType,
      status: input.status,
      started_at: nowIso,
      completed_at: nowIso,
      cost_cap_cents: input.caps.costCapCents,
      monthly_scheduled_cap_cents:
        input.caps.monthlyScheduledCapCents ?? null,
      estimated_cost_cents: input.usage.estimatedCostCents,
      model_call_cap: input.caps.modelCallCap,
      model_call_count: input.usage.modelCallCount,
      premium_call_cap: input.caps.premiumCallCap,
      premium_call_count: input.usage.premiumCallCount,
      runtime_cap_seconds: input.caps.runtimeCapSeconds,
      candidate_record_cap: input.caps.candidateRecordCap,
      candidate_record_count: input.usage.candidateRecordCount,
      deep_item_cap: input.caps.deepItemCap,
      deep_item_count: input.usage.deepItemCount,
      headline_finding_cap: input.caps.headlineFindingCap,
      headline_finding_count: input.usage.headlineFindingCount,
      active_priority_cap: input.caps.activePriorityCap,
      active_priority_count: input.usage.activePriorityCount,
      limits_hit: input.limitsHit,
    })
    .select('id')
    .single()

  if (runError || !runRow) {
    throw runError ?? new Error('sparkle_lab_runs insert returned no row')
  }

  return (runRow as { id: string }).id
}

async function persistSparkleLabArtifacts(input: {
  supabase: Pick<SupabaseClient, 'from'>
  runId: string
  artifacts: SparkleLabDraftArtifact[]
}) {
  if (!input.artifacts.length) return

  const { error: artifactError } = await input.supabase
    .from('sparkle_lab_artifacts')
    .insert(
      input.artifacts.map((artifact) => ({
        run_id: input.runId,
        section: artifact.section,
        artifact_type: artifact.artifactType,
        title: artifact.title,
        body_markdown: artifact.bodyMarkdown,
        source_refs: artifact.sourceRefs,
      })),
    )

  if (artifactError) throw artifactError
}

async function readSparkleLabMonthlyScheduledCostCents(input: {
  supabase: Pick<SupabaseClient, 'from'>
  now: Date
}) {
  const monthStart = new Date(
    Date.UTC(input.now.getUTCFullYear(), input.now.getUTCMonth(), 1),
  ).toISOString()
  const { data, error } = await input.supabase
    .from('sparkle_lab_runs')
    .select('estimated_cost_cents,status')
    .eq('run_type', 'weekly')
    .gte('created_at', monthStart)

  if (error) throw error

  return ((data ?? []) as Array<{
    estimated_cost_cents?: number | null
    status?: string | null
  }>)
    .filter((run) => ['completed', 'stopped_by_limit'].includes(run.status ?? ''))
    .reduce((total, run) => total + (run.estimated_cost_cents ?? 0), 0)
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
