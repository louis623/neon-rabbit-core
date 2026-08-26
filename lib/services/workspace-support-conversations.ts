import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { sendGoogleChatSupportAlert } from '@/lib/ops/google-chat-alerts'
import { ensureClientAccountProfile } from '@/lib/services/client-account-profiles'
import { ServiceError } from '@/lib/services/errors'
import { runSupportAuditForReport } from '@/lib/services/support-auditor'
import type {
  SupportReportNotificationStatus,
  SupportReportStatus,
  SupportReportType,
  SupportReportUrgency,
} from '@/lib/services/support-reports'
import type { BugHuntItemType } from '@/lib/control-center/bug-hunt'
import { assertWorkspaceConversationComposingEnabled } from '@/lib/services/workspace-conversation-feature-flags'

const createSchema = z.object({
  repId: z.string().uuid(),
  repDisplayName: z.string().trim().min(1).max(120),
  type: z.enum(['help_question', 'site_issue', 'bug', 'suggested_upgrade', 'workflow_idea']),
  urgency: z.enum(['normal', 'blocking', 'showtime_urgent']).default('normal'),
  pageOrWorkflow: z.string().trim().max(180).optional(),
  title: z.string().trim().min(3).max(160),
  details: z.string().trim().min(2).max(10000),
  expectedResult: z.string().trim().max(1200).optional(),
  actualResult: z.string().trim().max(1200).optional(),
  contactOk: z.boolean().default(true),
  clientRequestId: z.string().trim().min(1).max(180),
  idempotencyKey: z.string().trim().min(1).max(180),
})

type SupportSubmissionRpcRow = {
  report_id: string
  conversation_id: string
  message_id: string
  was_created: boolean
}

function firstRpcRow(data: unknown): SupportSubmissionRpcRow | null {
  if (Array.isArray(data)) return (data[0] as SupportSubmissionRpcRow | undefined) ?? null
  return (data as SupportSubmissionRpcRow | null) ?? null
}

function notificationError(error: unknown) {
  return (error instanceof Error ? error.message : String(error)).slice(0, 300)
}

async function finalizeSupportSubmission(
  supabase: SupabaseClient,
  reportId: string,
): Promise<SupportReportNotificationStatus> {
  try {
    const audit = await runSupportAuditForReport(supabase, { reportId })
    try {
      const alert = await sendGoogleChatSupportAlert(audit.alertPayload)
      const status = alert.delivered ? 'delivered' : 'not_configured'
      await supabase.from('support_reports').update({
        notification_status: status,
        notification_error: alert.delivered ? null : alert.reason,
        updated_at: new Date().toISOString(),
      }).eq('id', reportId)
      return status
    } catch (error) {
      await supabase.from('support_reports').update({
        notification_status: 'failed',
        notification_error: notificationError(error),
        updated_at: new Date().toISOString(),
      }).eq('id', reportId)
      return 'failed'
    }
  } catch (error) {
    const now = new Date().toISOString()
    await supabase.from('support_reports').update({
      audit_status: 'failed',
      audit_completed_at: now,
      audit_error: notificationError(error),
      notification_status: 'failed',
      notification_error: 'Support Auditor did not finish; operator review required.',
      updated_at: now,
    }).eq('id', reportId)
    return 'failed'
  }
}

async function claimSupportFollowup(supabase: SupabaseClient, reportId: string) {
  const staleBefore = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('support_reports')
    .update({ notification_claimed_at: now, updated_at: now })
    .eq('id', reportId)
    .eq('notification_status', 'pending')
    .or(`notification_claimed_at.is.null,notification_claimed_at.lt.${staleBefore}`)
    .select('id')
    .maybeSingle()
  if (error) return false
  return Boolean(data)
}

async function loadSupportNotificationStatus(
  supabase: SupabaseClient,
  reportId: string,
): Promise<SupportReportNotificationStatus> {
  const { data } = await supabase
    .from('support_reports')
    .select('notification_status')
    .eq('id', reportId)
    .maybeSingle()
  const status = data?.notification_status
  return status === 'delivered' || status === 'failed' || status === 'not_configured'
    ? status
    : 'failed'
}

export async function processSupportConversationFollowup(
  supabase: SupabaseClient,
  reportId: string,
) {
  const claimed = await claimSupportFollowup(supabase, reportId)
  return claimed
    ? finalizeSupportSubmission(supabase, reportId)
    : loadSupportNotificationStatus(supabase, reportId)
}

export async function processPendingSupportConversationFollowups(
  supabase: SupabaseClient,
  options: { limit?: number } = {},
) {
  const limit = Math.min(Math.max(options.limit ?? 25, 1), 50)
  const pending = await supabase
    .from('support_reports')
    .select('id')
    .eq('notification_status', 'pending')
    .order('created_at', { ascending: true })
    .limit(limit)
  if (pending.error) {
    throw new ServiceError({
      code: 'SUPPORT_FOLLOWUP_QUEUE_LOAD_FAILED',
      message: 'failed to load pending support follow-ups',
      userMessage: 'Pending Support follow-ups could not be processed.',
      statusCode: 500,
      cause: pending.error,
    })
  }

  const results: Array<{
    reportId: string
    status: SupportReportNotificationStatus | 'skipped'
  }> = []
  const rows = pending.data ?? []
  for (let index = 0; index < rows.length; index += 3) {
    const batch = rows.slice(index, index + 3)
    const batchResults = await Promise.all(batch.map(async (row) => {
      const reportId = String(row.id)
      const claimed = await claimSupportFollowup(supabase, reportId)
      if (!claimed) return { reportId, status: 'skipped' as const }
      return {
        reportId,
        status: await finalizeSupportSubmission(supabase, reportId),
      }
    }))
    results.push(...batchResults)
  }

  return {
    scanned: rows.length,
    processed: results.filter((result) => result.status !== 'skipped').length,
    delivered: results.filter((result) => result.status === 'delivered').length,
    notConfigured: results.filter((result) => result.status === 'not_configured').length,
    failed: results.filter((result) => result.status === 'failed').length,
    skipped: results.filter((result) => result.status === 'skipped').length,
    results,
  }
}

export async function createSupportConversation(
  supabase: SupabaseClient,
  input: z.input<typeof createSchema>,
) {
  assertWorkspaceConversationComposingEnabled('support')
  const parsed = createSchema.parse(input)
  const profile = await ensureClientAccountProfile(supabase, parsed.repId)
  const { data, error } = await supabase.rpc('create_workspace_support_submission', {
    p_rep_id: parsed.repId,
    p_rep_display_name: parsed.repDisplayName,
    p_client_account_profile_id: profile.profileId,
    p_client_snapshot: profile,
    p_report_type: parsed.type,
    p_urgency: parsed.urgency,
    p_page_or_workflow: parsed.pageOrWorkflow?.trim() || null,
    p_title: parsed.title,
    p_details: parsed.details,
    p_expected_result: parsed.expectedResult?.trim() || null,
    p_actual_result: parsed.actualResult?.trim() || null,
    p_contact_ok: parsed.contactOk,
    p_client_request_id: parsed.clientRequestId,
    p_submission_idempotency_key: parsed.idempotencyKey,
  })
  const saved = firstRpcRow(data)
  if (error || !saved) {
    throw new ServiceError({
      code: 'SUPPORT_CONVERSATION_CREATE_FAILED',
      message: 'failed to create support conversation transaction',
      userMessage: 'Your support message could not be saved right now.',
      statusCode: 500,
      cause: error,
    })
  }
  return {
    ok: true as const,
    reportId: saved.report_id,
    conversationId: saved.conversation_id,
    messageId: saved.message_id,
    status: 'Received' as const,
    notificationStatus: 'pending' as const,
    created: saved.was_created,
  }
}

const STATUS_LABELS: Record<SupportReportStatus, string> = {
  open: 'Received',
  reviewing: 'Under review',
  planned: 'Planned',
  resolved: 'Resolved',
  closed: 'Closed',
}

export function supportStatusLabel(status: SupportReportStatus) {
  return STATUS_LABELS[status]
}

export async function transitionSupportConversationStatus(
  supabase: SupabaseClient,
  input: { reportId: string; status: SupportReportStatus; operatorId: string },
) {
  const result = await supabase.rpc('transition_workspace_support_status', {
    p_report_id: input.reportId,
    p_status: input.status,
    p_operator_id: input.operatorId,
  })
  const row = Array.isArray(result.data) ? result.data[0] : result.data
  if (result.error || !row) {
    const message = String((result.error as { message?: unknown } | null)?.message ?? '')
    if (message.includes('not found')) {
      throw new ServiceError({ code: 'SUPPORT_REPORT_NOT_FOUND', message, userMessage: 'That support report could not be found.', statusCode: 404, cause: result.error })
    }
    throw new ServiceError({ code: 'SUPPORT_STATUS_UPDATE_FAILED', message: 'atomic support status transition failed', userMessage: 'That support status could not be updated right now.', statusCode: 500, cause: result.error })
  }
  return {
    reportId: input.reportId,
    conversationId: row.conversation_id as string,
    status: input.status,
    label: supportStatusLabel(input.status),
    changed: Boolean(row.was_changed),
  }
}

export async function promoteSupportReportToTask(
  supabase: SupabaseClient,
  input: {
    reportId: string
    title: string
    itemType: BugHuntItemType
    owner?: string
    notes?: string
    operatorId: string
    status?: 'planned'
  },
) {
  const report = await supabase.from('support_reports').select('id, workspace_conversation_id, report_type').eq('id', input.reportId).maybeSingle()
  if (report.error || !report.data || !report.data.workspace_conversation_id) {
    throw new ServiceError({ code: 'SUPPORT_REPORT_NOT_FOUND', message: 'linked support report not found', statusCode: 404 })
  }
  const existing = await supabase.from('sparkle_suite_bug_hunt_items').select('id, title, details, item_type, status, owner, source, created_at, updated_at, completed_at, source_support_report_id').eq('source_support_report_id', input.reportId).maybeSingle()
  if (existing.error) throw existing.error
  if (existing.data) return { task: existing.data, created: false }
  const title = input.title.trim()
  if (!title) throw new ServiceError({ code: 'INVALID_TASK_PROMOTION', message: 'task title required', userMessage: 'Add a Task List title first.' })
  const inserted = await supabase.from('sparkle_suite_bug_hunt_items').insert({
    title,
    details: input.notes?.trim() || null,
    item_type: input.itemType,
    status: 'open',
    owner: input.owner?.trim() || null,
    source: `Sparkle Suite Support report ${input.reportId}`,
    source_support_report_id: input.reportId,
  }).select('id, title, details, item_type, status, owner, source, created_at, updated_at, completed_at, source_support_report_id').single()
  if (inserted.error || !inserted.data) {
    if ((inserted.error as { code?: string } | null)?.code === '23505') {
      const raced = await supabase.from('sparkle_suite_bug_hunt_items').select('id, title, details, item_type, status, owner, source, created_at, updated_at, completed_at, source_support_report_id').eq('source_support_report_id', input.reportId).single()
      if (raced.data) return { task: raced.data, created: false }
    }
    throw inserted.error ?? new Error('task promotion returned no row')
  }
  await supabase.from('workspace_conversation_audit_events').upsert({
    conversation_id: report.data.workspace_conversation_id,
    actor_type: 'operator',
    actor_id: input.operatorId,
    event_type: 'support_report_promoted_to_task',
    details: { supportReportId: input.reportId, taskId: inserted.data.id },
    idempotency_key: `support-task-promotion:${input.reportId}`,
  }, { onConflict: 'idempotency_key', ignoreDuplicates: true })
  if (input.status === 'planned') {
    await transitionSupportConversationStatus(supabase, { reportId: input.reportId, status: 'planned', operatorId: input.operatorId })
  }
  return { task: inserted.data, created: true }
}

export type { SupportReportType, SupportReportUrgency }
