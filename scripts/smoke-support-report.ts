import { config } from 'dotenv'

config({ path: '.env.local' })

import { createSupportReport } from '@/lib/services/support-reports'
import { resolveSupportReport } from '@/lib/services/support-lessons'
import { createAdminClient } from '@/lib/supabase/admin'

type SmokeEnv = Record<string, string | undefined>

export interface SupportReportSmokeSummaryInput {
  reportId: string
  repId: string
  notificationStatus: string
  profileVerified: boolean
  auditStatus: string
  lessonCreated: boolean
  cleanedUp: boolean
  env?: SmokeEnv
}

export function parseSupportReportSmokeEnv(
  env: SmokeEnv = process.env,
): string[] {
  const errors: string[] = []

  for (const key of [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GOOGLE_CHAT_SUPPORT_WEBHOOK_URL',
  ]) {
    if (!env[key]?.trim()) {
      errors.push(`${key} is required for support report smoke.`)
    }
  }

  return errors
}

function getSupabaseHost(env: SmokeEnv) {
  const value = env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!value) return 'missing'

  try {
    return new URL(value).host
  } catch {
    return 'invalid'
  }
}

export function buildSupportReportSmokeSummary(
  input: SupportReportSmokeSummaryInput,
) {
  const env = input.env ?? process.env

  return [
    `[support-report-smoke] report=${input.reportId}`,
    `rep=${input.repId}`,
    `notification=${input.notificationStatus}`,
    `profile=${input.profileVerified}`,
    `audit=${input.auditStatus}`,
    `lesson=${input.lessonCreated}`,
    `cleanup=${input.cleanedUp}`,
    `supabase_host=${getSupabaseHost(env)}`,
    `google_chat_configured=${Boolean(
      env.GOOGLE_CHAT_SUPPORT_WEBHOOK_URL?.trim(),
    )}`,
  ].join(' ')
}

async function main() {
  const envErrors = parseSupportReportSmokeEnv()
  if (envErrors.length > 0) {
    for (const error of envErrors) console.error(`[support-report-smoke] ${error}`)
    process.exit(1)
  }

  const admin = createAdminClient()
  const stamp = Date.now()
  const email = `sparkle-support-smoke-${stamp}@example.invalid`
  const password = `SupportSmoke2026!${stamp}`

  let authUserId: string | null = null
  let repId: string | null = null
  let reportId: string | null = null
  let lessonId: string | null = null
  let notificationStatus = 'not_started'
  let profileVerified = false
  let auditStatus = 'not_started'
  let lessonCreated = false
  let cleanedUp = false

  try {
    const createdUser = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { smoke: 'support_report' },
    })
    if (createdUser.error) throw createdUser.error
    authUserId = createdUser.data.user.id

    const { data: rep, error: repError } = await admin
      .from('reps')
      .insert({
        auth_user_id: authUserId,
        display_name: 'Support Report Smoke Rep',
        business_name: 'Support Report Smoke Studio',
        email,
        phone: '555-010-4242',
        status: 'active',
      })
      .select('id')
      .single()
    if (repError) throw repError
    const createdRepId = rep.id
    repId = createdRepId

    const result = await createSupportReport(admin, {
      repId: createdRepId,
      repEmail: email,
      source: 'help_form',
      reportType: 'bug',
      urgency: 'blocking',
      pageOrWorkflow: 'Smoke test',
      title: `Support report smoke ${stamp}`,
      details:
        'Synthetic support report smoke verifying database persistence and Google Chat delivery.',
      expectedResult:
        'The support report is saved and Louis receives a Google Chat alert.',
      actualResult: 'The smoke command is checking the delivered status.',
      contactOk: false,
    })

    reportId = result.reportId
    notificationStatus = result.notificationStatus

    if (notificationStatus !== 'delivered') {
      throw new Error(
        `support report notification was ${notificationStatus}, expected delivered`,
      )
    }

    const { data: reportRow, error: reportError } = await admin
      .from('support_reports')
      .select(
        'id, rep_id, client_account_profile_id, client_snapshot, source, report_type, urgency, status, notification_status, audit_status',
      )
      .eq('id', reportId)
      .single()
    if (reportError) throw reportError

    if (
      !reportRow ||
      reportRow.rep_id !== createdRepId ||
      reportRow.source !== 'help_form' ||
      reportRow.report_type !== 'bug' ||
      reportRow.urgency !== 'blocking' ||
      reportRow.status !== 'open' ||
      reportRow.notification_status !== 'delivered' ||
      reportRow.audit_status !== 'completed' ||
      !reportRow.client_account_profile_id ||
      !reportRow.client_snapshot ||
      typeof reportRow.client_snapshot !== 'object'
    ) {
      throw new Error('support report smoke row did not match expected values')
    }

    const clientSnapshot = reportRow.client_snapshot as Record<string, unknown>
    if (
      clientSnapshot.clientName !== 'Support Report Smoke Studio' ||
      clientSnapshot.showName !== 'Support Report Smoke Studio' ||
      clientSnapshot.email !== email ||
      clientSnapshot.phone !== '555-010-4242'
    ) {
      throw new Error('support report smoke client snapshot did not match expected values')
    }

    const { data: profileRow, error: profileError } = await admin
      .from('client_account_profiles')
      .select('id, rep_id, client_name, show_name, email, phone')
      .eq('id', reportRow.client_account_profile_id)
      .single()
    if (profileError) throw profileError

    if (
      !profileRow ||
      profileRow.rep_id !== createdRepId ||
      profileRow.client_name !== 'Support Report Smoke Studio' ||
      profileRow.show_name !== 'Support Report Smoke Studio' ||
      profileRow.email !== email ||
      profileRow.phone !== '555-010-4242'
    ) {
      throw new Error('support report smoke client profile did not match expected values')
    }
    profileVerified = true
    auditStatus = reportRow.audit_status

    const { data: auditRow, error: auditError } = await admin
      .from('support_audits')
      .select('id, support_report_id, client_account_profile_id, status, facts, findings')
      .eq('support_report_id', reportId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (auditError) throw auditError

    if (
      !auditRow ||
      auditRow.support_report_id !== reportId ||
      auditRow.client_account_profile_id !== reportRow.client_account_profile_id ||
      auditRow.status !== 'completed'
    ) {
      throw new Error('support report smoke audit row did not match expected values')
    }
    auditStatus = auditRow.status

    const resolution = await resolveSupportReport(admin, {
      reportId,
      clientAccountProfileId: reportRow.client_account_profile_id,
      affectedArea: 'smoke_test',
      symptom: 'Synthetic smoke report verified the support intake workflow.',
      rootCause: 'Smoke run generated a support report for validation.',
      fixOrWorkaround:
        'Confirm profile, report snapshot, audit row, Google Chat delivery, lesson creation, and cleanup.',
      tags: ['smoke', 'support-auditor'],
      approvedForReuse: true,
      createdBy: 'support-report-smoke',
    })
    lessonId =
      resolution.lesson &&
      typeof resolution.lesson === 'object' &&
      'id' in resolution.lesson
        ? String(resolution.lesson.id)
        : null
    if (!lessonId) throw new Error('support report smoke lesson was not created')
    lessonCreated = true
  } finally {
    if (lessonId) await admin.from('support_lessons').delete().eq('id', lessonId)
    if (reportId) await admin.from('support_reports').delete().eq('id', reportId)
    if (repId) await admin.from('reps').delete().eq('id', repId)
    if (authUserId) await admin.auth.admin.deleteUser(authUserId)
    cleanedUp = true
  }

  console.log(
    buildSupportReportSmokeSummary({
      reportId: reportId ?? 'missing',
      repId: repId ?? 'missing',
      notificationStatus,
      profileVerified,
      auditStatus,
      lessonCreated,
      cleanedUp,
    }),
  )
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('/smoke-support-report.ts')) {
  main().catch((error) => {
    console.error('[support-report-smoke] error', error)
    process.exit(1)
  })
}
