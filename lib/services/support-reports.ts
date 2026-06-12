import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { sendGoogleChatSupportAlert } from '@/lib/ops/google-chat-alerts'

export type SupportReportSource = 'help_form' | 'nic_nac'
export type SupportReportType =
  | 'site_issue'
  | 'bug'
  | 'suggested_upgrade'
  | 'workflow_idea'
export type SupportReportUrgency = 'normal' | 'blocking' | 'showtime_urgent'
export type SupportReportStatus =
  | 'open'
  | 'reviewing'
  | 'planned'
  | 'resolved'
  | 'closed'
export type SupportReportNotificationStatus =
  | 'delivered'
  | 'not_configured'
  | 'failed'

export interface CreateSupportReportInput {
  repId: string
  repEmail?: string
  source: SupportReportSource
  reportType: SupportReportType
  urgency?: SupportReportUrgency
  pageOrWorkflow?: string
  title: string
  details: string
  expectedResult?: string
  actualResult?: string
  contactOk?: boolean
  conversationId?: string
  runId?: string
}

export interface CreateSupportReportResult {
  ok: true
  reportId: string
  notificationStatus: SupportReportNotificationStatus
}

const SUPPORT_REPORT_SELECT =
  'id, rep_id, conversation_id, run_id, source, report_type, urgency, status, page_or_workflow, title, details, expected_result, actual_result, contact_ok, notification_channel, notification_status, notification_error, created_at, updated_at'

const createSupportReportSchema = z.object({
  repId: z.string().trim().min(1),
  repEmail: z.string().trim().email().optional(),
  source: z.enum(['help_form', 'nic_nac']),
  reportType: z.enum(['site_issue', 'bug', 'suggested_upgrade', 'workflow_idea']),
  urgency: z.enum(['normal', 'blocking', 'showtime_urgent']).default('normal'),
  pageOrWorkflow: z.string().trim().max(180).optional(),
  title: z.string().trim().min(3).max(160),
  details: z.string().trim().min(10).max(3000),
  expectedResult: z.string().trim().max(1200).optional(),
  actualResult: z.string().trim().max(1200).optional(),
  contactOk: z.boolean().default(true),
  conversationId: z.string().trim().max(180).optional(),
  runId: z.string().trim().max(180).optional(),
})

const updateOperatorSupportReportStatusSchema = z.object({
  reportId: z.string().trim().min(1),
  status: z.enum(['open', 'reviewing', 'planned', 'resolved', 'closed']),
})

function emptyToNull(value: string | undefined) {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

function reportTypeLabel(reportType: SupportReportType) {
  if (reportType === 'site_issue') return 'Site issue'
  if (reportType === 'suggested_upgrade') return 'Suggested upgrade'
  if (reportType === 'workflow_idea') return 'Workflow idea'
  return 'Bug'
}

function sourceLabel(source: SupportReportSource) {
  return source === 'help_form' ? 'Help form' : 'Nic-Nac'
}

function notificationErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 300)
  return String(error).slice(0, 300)
}

async function markNotification(
  supabase: SupabaseClient,
  reportId: string,
  notificationStatus: SupportReportNotificationStatus,
  notificationError: string | null,
) {
  const { error } = await supabase
    .from('support_reports')
    .update({
      notification_status: notificationStatus,
      notification_error: notificationError,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)

  if (error) {
    console.error('[support-reports] notification status update failed', {
      reportId,
      notificationStatus,
      error,
    })
  }
}

export async function createSupportReport(
  supabase: SupabaseClient,
  input: CreateSupportReportInput,
): Promise<CreateSupportReportResult> {
  const report = createSupportReportSchema.parse(input)
  const insertPayload = {
    rep_id: report.repId.trim(),
    conversation_id: emptyToNull(report.conversationId),
    run_id: emptyToNull(report.runId),
    source: report.source,
    report_type: report.reportType,
    urgency: report.urgency,
    status: 'open',
    page_or_workflow: emptyToNull(report.pageOrWorkflow),
    title: report.title.trim(),
    details: report.details.trim(),
    expected_result: emptyToNull(report.expectedResult),
    actual_result: emptyToNull(report.actualResult),
    contact_ok: report.contactOk,
    notification_channel: 'google_chat',
    notification_status: 'pending',
  }

  const { data, error } = await supabase
    .from('support_reports')
    .insert(insertPayload)
    .select(SUPPORT_REPORT_SELECT)
    .single()

  if (error || !data) {
    throw error ?? new Error('support report insert failed')
  }

  const row = data as { id: string }
  try {
    const alertResult = await sendGoogleChatSupportAlert({
      title: `${reportTypeLabel(report.reportType)}: ${report.title.trim()}`,
      urgency: report.urgency,
      lines: [
        `Report ID: ${row.id}`,
        `Rep: ${report.repEmail ?? report.repId}`,
        `Source: ${sourceLabel(report.source)}`,
        `Page/workflow: ${emptyToNull(report.pageOrWorkflow) ?? 'Not provided'}`,
        `Details: ${report.details.trim()}`,
      ],
    })

    if (alertResult.delivered) {
      await markNotification(supabase, row.id, 'delivered', null)
      return { ok: true, reportId: row.id, notificationStatus: 'delivered' }
    }

    await markNotification(
      supabase,
      row.id,
      'not_configured',
      alertResult.reason,
    )
    return { ok: true, reportId: row.id, notificationStatus: 'not_configured' }
  } catch (notificationError) {
    await markNotification(
      supabase,
      row.id,
      'failed',
      notificationErrorMessage(notificationError),
    )
    return { ok: true, reportId: row.id, notificationStatus: 'failed' }
  }
}

export async function listOperatorSupportReports(
  supabase: SupabaseClient,
  options: { status?: SupportReportStatus; limit?: number } = {},
) {
  let query = supabase.from('support_reports').select(SUPPORT_REPORT_SELECT)

  if (options.status) {
    query = query.eq('status', options.status)
  }

  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100)
  const { data, error } = await query
    .order('urgency_rank', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

export async function updateOperatorSupportReportStatus(
  supabase: SupabaseClient,
  input: { reportId: string; status: SupportReportStatus },
) {
  const parsed = updateOperatorSupportReportStatusSchema.parse(input)

  const { data, error } = await supabase
    .from('support_reports')
    .update({
      status: parsed.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.reportId.trim())
    .select(SUPPORT_REPORT_SELECT)
    .single()

  if (error || !data) {
    throw error ?? new Error('support report status update failed')
  }

  return data
}
