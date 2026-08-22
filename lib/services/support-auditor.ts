import type { SupabaseClient } from '@supabase/supabase-js'

import {
  type SupportAuditAlertPayload,
} from '@/lib/ops/google-chat-alerts'
import { ensureClientAccountProfile } from '@/lib/services/client-account-profiles'

type JsonObject = Record<string, unknown>

export type SupportAuditStatus = 'completed' | 'failed' | 'timed_out'

export interface SupportAuditFinding {
  severity: 'info' | 'warning' | 'attention'
  message: string
}

export interface SupportAuditSimilarLesson {
  id: string
  title: string
  affectedArea: string | null
  fixOrWorkaround: string | null
  tags: string[]
}

export interface SupportAuditSummaryInput {
  report: SupportReportFacts
  profile: ClientProfileFacts
  facts: JsonObject
  findings: SupportAuditFinding[]
  riskFlags: string[]
  similarLessons: SupportAuditSimilarLesson[]
  recommendedFirstAction: string
}

export interface SupportAuditSummaryResult {
  summary: string
  findings?: string[]
  recommendedFirstAction?: string
}

export type SupportAuditSummarizer = (
  input: SupportAuditSummaryInput,
) => Promise<SupportAuditSummaryResult | string>

export interface RunSupportAuditInput {
  reportId: string
  now?: Date
  summarize?: SupportAuditSummarizer
}

export interface SupportAuditResult {
  status: SupportAuditStatus
  alertPayload: SupportAuditAlertPayload
  auditId: string | null
  summary: string
  findings: string[]
  recommendedFirstAction: string
}

interface SupportReportRow {
  id: string
  rep_id: string
  conversation_id: string | null
  run_id: string | null
  source: string
  report_type: string
  urgency: 'normal' | 'blocking' | 'showtime_urgent'
  status: string
  page_or_workflow: string | null
  title: string
  details: string
  expected_result: string | null
  actual_result: string | null
  contact_ok: boolean | null
  created_at: string | null
  updated_at: string | null
}

interface SupportLessonRow {
  id: string
  affected_area: string | null
  symptom: string | null
  root_cause: string | null
  fix_or_workaround: string | null
  tags: string[] | null
  approved_for_reuse: boolean | null
}

interface SupportReportFacts {
  id: string
  title: string
  issue: string
  type: string
  urgency: 'normal' | 'blocking' | 'showtime_urgent'
  source: string
  sourceLabel: string
  workflow: string
  expectedResult: string | null
  actualResult: string | null
  conversationId: string | null
  runId: string | null
  createdAt: string | null
}

interface ClientProfileFacts {
  profileId: string
  repId: string
  clientName: string
  showName: string
  primaryContactName: string | null
  email: string
  phone: string | null
  accountStatus: string | null
  subscriptionStatus: string | null
  supportTier: string | null
  publicSiteSlug: string | null
  customDomain: string | null
}

const SUPPORT_REPORT_SELECT = [
  'id',
  'rep_id',
  'conversation_id',
  'run_id',
  'source',
  'report_type',
  'urgency',
  'status',
  'page_or_workflow',
  'title',
  'details',
  'expected_result',
  'actual_result',
  'contact_ok',
  'created_at',
  'updated_at',
].join(', ')

const SUPPORT_LESSON_SELECT = [
  'id',
  'affected_area',
  'symptom',
  'root_cause',
  'fix_or_workaround',
  'tags',
  'approved_for_reuse',
].join(', ')

function reportTypeLabel(reportType: string) {
  if (reportType === 'site_issue') return 'Site issue'
  if (reportType === 'suggested_upgrade') return 'Suggested upgrade'
  if (reportType === 'workflow_idea') return 'Workflow idea'
  return 'Bug'
}

function sourceLabel(source: string) {
  return source === 'nic_nac' ? 'Nic-Nac' : 'Help form'
}

function textOrFallback(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim()
  return normalized ? normalized : fallback
}

function sanitizeError(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 300)
  return String(error).slice(0, 300)
}

function isTimeoutError(error: unknown) {
  if (!(error instanceof Error)) return false
  return /abort|timeout|timed out/i.test(`${error.name} ${error.message}`)
}

function normalizeReport(row: SupportReportRow): SupportReportFacts {
  return {
    id: row.id,
    title: row.title,
    issue: row.details,
    type: row.report_type,
    urgency: row.urgency,
    source: row.source,
    sourceLabel: sourceLabel(row.source),
    workflow: textOrFallback(row.page_or_workflow, 'Not provided'),
    expectedResult: row.expected_result,
    actualResult: row.actual_result,
    conversationId: row.conversation_id,
    runId: row.run_id,
    createdAt: row.created_at,
  }
}

function normalizeLesson(row: SupportLessonRow): SupportAuditSimilarLesson {
  return {
    id: row.id,
    title: textOrFallback(row.symptom, 'Approved support lesson'),
    affectedArea: row.affected_area,
    fixOrWorkaround: row.fix_or_workaround,
    tags: Array.isArray(row.tags) ? row.tags : [],
  }
}

function affectedAreaFromReport(report: SupportReportFacts) {
  const combined = `${report.workflow} ${report.title} ${report.issue}`.toLowerCase()
  if (combined.includes('trade')) return 'trade_board'
  if (combined.includes('live queue') || combined.includes('queue')) return 'live_queue'
  if (combined.includes('billing') || combined.includes('subscription')) return 'billing'
  if (combined.includes('site') || combined.includes('homepage')) return 'customer_site'
  if (combined.includes('nic-nac') || combined.includes('nic nac')) return 'nic_nac'
  return 'general'
}

function lessonScore(report: SupportReportFacts, lesson: SupportAuditSimilarLesson) {
  const haystack = `${report.workflow} ${report.title} ${report.issue}`.toLowerCase()
  let score = 0
  if (lesson.affectedArea && haystack.includes(lesson.affectedArea.replaceAll('_', ' '))) {
    score += 3
  }
  for (const tag of lesson.tags) {
    if (haystack.includes(tag.toLowerCase().replaceAll('-', ' '))) score += 2
  }
  for (const word of lesson.title.toLowerCase().split(/\W+/).filter((part) => part.length > 4)) {
    if (haystack.includes(word)) score += 1
  }
  return score
}

function buildFindings(input: {
  report: SupportReportFacts
  profile: ClientProfileFacts
  similarLessons: SupportAuditSimilarLesson[]
  affectedArea: string
}) {
  const findings: SupportAuditFinding[] = []
  findings.push({
    severity: 'info',
    message: `Account status is ${input.profile.accountStatus ?? 'unknown'}.`,
  })
  findings.push({
    severity: 'info',
    message: `Subscription status is ${input.profile.subscriptionStatus ?? 'unknown'}.`,
  })
  if (input.report.expectedResult || input.report.actualResult) {
    findings.push({
      severity: 'attention',
      message: 'Report includes expected versus actual behavior details.',
    })
  }
  if (input.report.source === 'nic_nac') {
    findings.push({
      severity: 'info',
      message: 'Report came from Nic-Nac context.',
    })
  }
  if (input.similarLessons.length > 0) {
    findings.push({
      severity: 'attention',
      message: `Similar prior lesson: ${input.similarLessons[0].title}.`,
    })
  }
  if (input.affectedArea === 'trade_board') {
    findings.push({
      severity: 'attention',
      message: 'Dance Floor workflow needs report-specific cleanup review.',
    })
  }
  return findings
}

function buildRecommendedFirstAction(report: SupportReportFacts, affectedArea: string) {
  if (affectedArea === 'trade_board') {
    return 'Open the report in Control Center and inspect the latest trade swap cleanup state.'
  }
  if (affectedArea === 'live_queue') {
    return 'Open the report in Control Center and review safe app-side Live Queue state.'
  }
  if (affectedArea === 'billing') {
    return 'Open the report in Control Center and verify subscription/account status.'
  }
  if (report.source === 'nic_nac') {
    return 'Open the report in Control Center and review the linked Nic-Nac conversation context.'
  }
  return 'Open the report in Control Center and review manually.'
}

function buildTemplateSummary(input: {
  profile: ClientProfileFacts
  report: SupportReportFacts
  similarLessons: SupportAuditSimilarLesson[]
}) {
  const lessonText =
    input.similarLessons.length > 0
      ? ` ${input.similarLessons.length} approved support lesson${input.similarLessons.length === 1 ? '' : 's'} may apply.`
      : ' No approved reusable support lesson matched strongly.'
  return `${input.profile.clientName} account is ${input.profile.accountStatus ?? 'status unknown'} with subscription ${input.profile.subscriptionStatus ?? 'unknown'}. The report concerns ${input.report.workflow}: ${input.report.title}.${lessonText}`
}

function normalizeSummaryResult(
  result: SupportAuditSummaryResult | string,
  fallbackFindings: SupportAuditFinding[],
  fallbackRecommendedFirstAction: string,
) {
  if (typeof result === 'string') {
    return {
      summary: result,
      findings: fallbackFindings.map((finding) => finding.message),
      recommendedFirstAction: fallbackRecommendedFirstAction,
    }
  }

  return {
    summary: result.summary,
    findings: result.findings ?? fallbackFindings.map((finding) => finding.message),
    recommendedFirstAction:
      result.recommendedFirstAction ?? fallbackRecommendedFirstAction,
  }
}

async function markReportAudit(
  supabase: SupabaseClient,
  reportId: string,
  values: Record<string, unknown>,
) {
  const { error } = await supabase
    .from('support_reports')
    .update(values)
    .eq('id', reportId)

  if (error) throw error
}

async function loadRecentSupportHistory(
  supabase: SupabaseClient,
  report: SupportReportFacts,
  repId: string,
) {
  try {
    const result = await supabase
      .from('support_reports')
      .select('id, title, status, audit_status, created_at')
      .eq('rep_id', repId)
      .neq('id', report.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (result && 'data' in result && Array.isArray(result.data)) {
      return result.data
    }
  } catch {
    return []
  }
  return []
}

async function searchSimilarLessons(
  supabase: SupabaseClient,
  report: SupportReportFacts,
) {
  const { data, error } = await supabase
    .from('support_lessons')
    .select(SUPPORT_LESSON_SELECT)
    .eq('approved_for_reuse', true)
    .limit(10)

  if (error) throw error

  return ((data ?? []) as unknown as SupportLessonRow[])
    .map(normalizeLesson)
    .map((lesson) => ({ lesson, score: lessonScore(report, lesson) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ lesson }) => lesson)
}

function buildAlertPayload(input: {
  report: SupportReportFacts
  profile: ClientProfileFacts
  auditStatus: SupportAuditAlertPayload['auditStatus']
  summary: string
  findings: string[]
  recommendedFirstAction: string
}): SupportAuditAlertPayload {
  return {
    title: `${reportTypeLabel(input.report.type)}: ${input.report.title}`,
    urgency: input.report.urgency,
    clientName: input.profile.clientName,
    showName: input.profile.showName,
    phone: input.profile.phone,
    email: input.profile.email,
    reportId: input.report.id,
    issue: input.report.issue,
    source: input.report.sourceLabel,
    workflow: input.report.workflow,
    auditStatus: input.auditStatus,
    summary: input.summary,
    findings: input.findings,
    recommendedFirstAction: input.recommendedFirstAction,
  }
}

export async function runSupportAuditForReport(
  supabase: SupabaseClient,
  input: RunSupportAuditInput,
): Promise<SupportAuditResult> {
  const reportId = input.reportId.trim()
  if (!reportId) throw new Error('reportId is required')

  const startedAt = input.now ?? new Date()
  const startedAtIso = startedAt.toISOString()
  const { data: reportData, error: reportError } = await supabase
    .from('support_reports')
    .select(SUPPORT_REPORT_SELECT)
    .eq('id', reportId)
    .single()

  if (reportError || !reportData) {
    throw reportError ?? new Error(`Support report ${reportId} was not found`)
  }

  const reportRow = reportData as unknown as SupportReportRow
  const report = normalizeReport(reportRow)
  const profile = await ensureClientAccountProfile(supabase, reportRow.rep_id)
  const profileFacts: ClientProfileFacts = {
    profileId: profile.profileId,
    repId: profile.repId,
    clientName: profile.clientName,
    showName: profile.showName,
    primaryContactName: profile.primaryContactName,
    email: profile.email,
    phone: profile.phone,
    accountStatus: profile.accountStatus,
    subscriptionStatus: profile.subscriptionStatus,
    supportTier: profile.supportTier,
    publicSiteSlug: profile.publicSiteSlug,
    customDomain: profile.customDomain,
  }

  await markReportAudit(supabase, report.id, {
    audit_status: 'running',
    audit_started_at: startedAtIso,
    audit_error: null,
    updated_at: startedAtIso,
  })

  try {
    const affectedArea = affectedAreaFromReport(report)
    const [recentSupportReports, similarLessons] = await Promise.all([
      loadRecentSupportHistory(supabase, report, profile.repId),
      searchSimilarLessons(supabase, report),
    ])
    const recommendedFirstAction = buildRecommendedFirstAction(report, affectedArea)
    const findings = buildFindings({
      report,
      profile: profileFacts,
      similarLessons,
      affectedArea,
    })
    const riskFlags = findings
      .filter((finding) => finding.severity !== 'info')
      .map((finding) => finding.message)
    const facts = {
      report,
      profile: profileFacts,
      affectedArea,
      recentSupportReports,
      similarLessonCount: similarLessons.length,
      missingData: [],
    }
    let aiSummary: string | null = null
    let templateSummary: string | null = null
    let summaryOutput: {
      summary: string
      findings: string[]
      recommendedFirstAction: string
    }

    if (input.summarize) {
      try {
        summaryOutput = normalizeSummaryResult(
          await input.summarize({
            report,
            profile: profileFacts,
            facts,
            findings,
            riskFlags,
            similarLessons,
            recommendedFirstAction,
          }),
          findings,
          recommendedFirstAction,
        )
        aiSummary = summaryOutput.summary
      } catch {
        templateSummary = buildTemplateSummary({ profile: profileFacts, report, similarLessons })
        summaryOutput = {
          summary: templateSummary,
          findings: findings.map((finding) => finding.message),
          recommendedFirstAction,
        }
      }
    } else {
      templateSummary = buildTemplateSummary({ profile: profileFacts, report, similarLessons })
      summaryOutput = {
        summary: templateSummary,
        findings: findings.map((finding) => finding.message),
        recommendedFirstAction,
      }
    }

    const durationMs = Math.max(0, Date.now() - startedAt.getTime())
    const { data: auditData, error: auditError } = await supabase
      .from('support_audits')
      .insert({
        support_report_id: report.id,
        client_account_profile_id: profile.profileId,
        status: 'completed',
        facts,
        findings,
        risk_flags: riskFlags,
        similar_lessons: similarLessons,
        recommended_first_action: summaryOutput.recommendedFirstAction,
        ai_summary: aiSummary,
        template_summary: templateSummary,
        error_message: null,
        duration_ms: durationMs,
        completed_at: startedAtIso,
      })
      .select('id')
      .single()

    if (auditError) throw auditError

    await markReportAudit(supabase, report.id, {
      audit_status: 'completed',
      audit_completed_at: startedAtIso,
      audit_error: null,
      updated_at: startedAtIso,
    })

    return {
      status: 'completed',
      auditId:
        auditData && typeof auditData === 'object' && 'id' in auditData
          ? String(auditData.id)
          : null,
      summary: summaryOutput.summary,
      findings: summaryOutput.findings,
      recommendedFirstAction: summaryOutput.recommendedFirstAction,
      alertPayload: buildAlertPayload({
        report,
        profile: profileFacts,
        auditStatus: 'completed',
        summary: summaryOutput.summary,
        findings: summaryOutput.findings,
        recommendedFirstAction: summaryOutput.recommendedFirstAction,
      }),
    }
  } catch (error) {
    const status: Extract<SupportAuditStatus, 'failed' | 'timed_out'> =
      isTimeoutError(error) ? 'timed_out' : 'failed'
    const message = sanitizeError(error)
    const fallbackSummary =
      'The report was saved, but the account audit did not finish. Review manually.'
    const fallbackFirstAction = 'Open the report in Control Center and review manually.'

    try {
      await supabase
        .from('support_audits')
        .insert({
          support_report_id: report.id,
          client_account_profile_id: profile.profileId,
          status,
          facts: { report, profile: profileFacts },
          findings: [],
          risk_flags: [],
          similar_lessons: [],
          recommended_first_action: fallbackFirstAction,
          ai_summary: null,
          template_summary: fallbackSummary,
          error_message: message,
          duration_ms: Math.max(0, Date.now() - startedAt.getTime()),
          completed_at: startedAtIso,
        })
    } catch {
      // The report status update below is the durable fallback signal.
    }

    await markReportAudit(supabase, report.id, {
      audit_status: status,
      audit_completed_at: startedAtIso,
      audit_error: message,
      updated_at: startedAtIso,
    })

    return {
      status,
      auditId: null,
      summary: fallbackSummary,
      findings: [],
      recommendedFirstAction: fallbackFirstAction,
      alertPayload: buildAlertPayload({
        report,
        profile: profileFacts,
        auditStatus: 'incomplete',
        summary: fallbackSummary,
        findings: [],
        recommendedFirstAction: fallbackFirstAction,
      }),
    }
  }
}
