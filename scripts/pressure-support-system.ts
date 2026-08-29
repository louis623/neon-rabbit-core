import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { config } from 'dotenv'

config({ path: '.env.local' })

import { createSupportReport } from '@/lib/services/support-reports'
import {
  listOperatorSupportReports,
  updateOperatorSupportReportStatus,
} from '@/lib/services/support-reports'
import { resolveSupportReport } from '@/lib/services/support-lessons'
import { createAdminClient } from '@/lib/supabase/admin'

type JsonObject = Record<string, unknown>

interface SupportPressureSummaryInput {
  repsCreated: number
  reportsCreated: number
  alertsCaptured: number
  auditsCompleted: number
  notificationFailuresVerified: number
  lessonsCreated: number
  cleanupResiduals: number
}

function requiredEnvErrors(env: NodeJS.ProcessEnv = process.env) {
  return ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
    .filter((key) => !env[key]?.trim())
    .map((key) => `${key} is required for support pressure.`)
}

export function buildSupportPressureSummary(input: SupportPressureSummaryInput) {
  return [
    `[support-pressure] reps=${input.repsCreated}`,
    `reports=${input.reportsCreated}`,
    `alerts=${input.alertsCaptured}`,
    `audits=${input.auditsCompleted}`,
    `notification_failures=${input.notificationFailuresVerified}`,
    `lessons=${input.lessonsCreated}`,
    `cleanup_residuals=${input.cleanupResiduals}`,
  ].join(' ')
}

function readBody(request: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    let body = ''
    request.setEncoding('utf8')
    request.on('data', (chunk) => {
      body += chunk
    })
    request.on('end', () => resolve(body))
    request.on('error', reject)
  })
}

async function startCaptureWebhook() {
  const requests: string[] = []
  const server = createServer(async (request: IncomingMessage, response: ServerResponse) => {
    const body = await readBody(request)
    requests.push(body)

    if (request.url?.includes('/fail')) {
      response.statusCode = 500
      response.end('forced support pressure failure')
      return
    }

    response.setHeader('content-type', 'application/json')
    response.end(JSON.stringify({ ok: true }))
  })

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve)
  })

  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('capture webhook did not expose a port')
  }

  return {
    requests,
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      }),
  }
}

function asObject(value: unknown): JsonObject {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonObject
    : {}
}

async function cleanupSyntheticRows(input: {
  admin: ReturnType<typeof createAdminClient>
  reportIds: string[]
  lessonIds: string[]
  repIds: string[]
  authUserIds: string[]
}) {
  if (input.lessonIds.length > 0) {
    await input.admin.from('support_lessons').delete().in('id', input.lessonIds)
  }
  if (input.reportIds.length > 0) {
    await input.admin.from('support_reports').delete().in('id', input.reportIds)
  }
  if (input.repIds.length > 0) {
    await input.admin.from('reps').delete().in('id', input.repIds)
  }
  for (const authUserId of input.authUserIds) {
    await input.admin.auth.admin.deleteUser(authUserId)
  }
}

async function countResiduals(admin: ReturnType<typeof createAdminClient>, marker: string) {
  const [{ count: reports }, { count: reps }, { count: lessons }] = await Promise.all([
    admin
      .from('support_reports')
      .select('id', { count: 'exact', head: true })
      .ilike('title', `%${marker}%`),
    admin
      .from('reps')
      .select('id', { count: 'exact', head: true })
      .ilike('email', `%${marker}%`),
    admin
      .from('support_lessons')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', 'support-pressure'),
  ])

  return (reports ?? 0) + (reps ?? 0) + (lessons ?? 0)
}

async function main() {
  const envErrors = requiredEnvErrors()
  if (envErrors.length > 0) {
    for (const error of envErrors) console.error(`[support-pressure] ${error}`)
    process.exit(1)
  }

  const admin = createAdminClient()
  const webhook = await startCaptureWebhook()
  const originalWebhook = process.env.GOOGLE_CHAT_SUPPORT_WEBHOOK_URL
  process.env.GOOGLE_CHAT_SUPPORT_WEBHOOK_URL = webhook.url

  const stamp = Date.now()
  const marker = `support-pressure-${stamp}`
  const authUserIds: string[] = []
  const repIds: string[] = []
  const reportIds: string[] = []
  const lessonIds: string[] = []
  let notificationFailuresVerified = 0
  let auditsCompleted = 0

  try {
    for (let index = 0; index < 3; index += 1) {
      const email = `${marker}-rep-${index}@example.invalid`
      const password = `SupportPressure2026!${stamp}${index}`
      const createdUser = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { pressure: 'support_system' },
      })
      if (createdUser.error) throw createdUser.error
      authUserIds.push(createdUser.data.user.id)

      const { data: rep, error: repError } = await admin
        .from('reps')
        .insert({
          auth_user_id: createdUser.data.user.id,
          account_classification: 'demo',
          display_name: `Support Pressure Rep ${index}`,
          business_name: `Support Pressure Studio ${index}`,
          email,
          phone: `555-010-42${index}${index}`,
          status: 'active',
        })
        .select('id')
        .single()
      if (repError || !rep) throw repError ?? new Error('pressure rep insert failed')
      repIds.push(rep.id)
    }

    const submissions = Array.from({ length: 12 }, (_, index) => {
      const repIndex = index % repIds.length
      return createSupportReport(admin, {
        repId: repIds[repIndex],
        repEmail: `${marker}-rep-${repIndex}@example.invalid`,
        source: index % 2 === 0 ? 'help_form' : 'nic_nac',
        reportType: ['site_issue', 'bug', 'suggested_upgrade', 'workflow_idea'][index % 4] as never,
        urgency: ['normal', 'blocking', 'showtime_urgent'][index % 3] as never,
        pageOrWorkflow: `Pressure workflow ${index}`,
        title: `${marker} report ${index}`,
        details:
          'Synthetic support pressure report verifying parallel intake, auditing, alerting, and dashboard readiness.',
        expectedResult:
          'Every pressure report should save, audit, notify, and remain visible for operators.',
        actualResult: 'The pressure script is validating the result.',
        contactOk: index % 2 === 0,
      })
    })

    const results = await Promise.all(submissions)
    reportIds.push(...results.map((result) => result.reportId))

    const failedNotificationReport = await createSupportReport(admin, {
      repId: repIds[0],
      repEmail: `${marker}-rep-0@example.invalid`,
      source: 'help_form',
      reportType: 'bug',
      urgency: 'blocking',
      pageOrWorkflow: 'Notification failure pressure',
      title: `${marker} forced notification failure`,
      details:
        'Synthetic support pressure report forcing the capture webhook to reject delivery.',
      expectedResult: 'The report and audit should persist even if notification delivery fails.',
      actualResult: 'The script is checking notification failure handling.',
      contactOk: false,
    })
    reportIds.push(failedNotificationReport.reportId)

    process.env.GOOGLE_CHAT_SUPPORT_WEBHOOK_URL = `${webhook.url}/fail`
    const failingResult = await createSupportReport(admin, {
      repId: repIds[1],
      repEmail: `${marker}-rep-1@example.invalid`,
      source: 'help_form',
      reportType: 'site_issue',
      urgency: 'normal',
      pageOrWorkflow: 'Forced failing webhook',
      title: `${marker} failing webhook`,
      details:
        'Synthetic report submitted while the webhook intentionally returns a 500.',
      expectedResult: 'The report should be saved with notification_status failed.',
      actualResult: 'The pressure script is validating the failed status.',
      contactOk: false,
    })
    reportIds.push(failingResult.reportId)
    if (failingResult.notificationStatus !== 'failed') {
      throw new Error(
        `expected forced notification failure, got ${failingResult.notificationStatus}`,
      )
    }
    notificationFailuresVerified = 1
    process.env.GOOGLE_CHAT_SUPPORT_WEBHOOK_URL = webhook.url

    const { data: reportRows, error: reportError } = await admin
      .from('support_reports')
      .select(
        'id, rep_id, title, notification_status, audit_status, client_account_profile_id, client_snapshot, support_audits(status)',
      )
      .in('id', reportIds)
    if (reportError) throw reportError

    if (!reportRows || reportRows.length !== reportIds.length) {
      throw new Error(
        `expected ${reportIds.length} pressure reports, found ${reportRows?.length ?? 0}`,
      )
    }

    for (const row of reportRows) {
      const auditRows = Array.isArray(row.support_audits) ? row.support_audits : []
      const snapshot = asObject(row.client_snapshot)
      const expectedNotification = row.id === failingResult.reportId ? 'failed' : 'delivered'
      if (
        row.notification_status !== expectedNotification ||
        row.audit_status !== 'completed' ||
        auditRows[0]?.status !== 'completed' ||
        !row.client_account_profile_id ||
        !snapshot.clientName ||
        !snapshot.showName ||
        !snapshot.email
      ) {
        throw new Error(
          `pressure report invariant failed for ${row.id}: ${JSON.stringify({
            notification: row.notification_status,
            audit: row.audit_status,
            auditRow: auditRows[0]?.status,
            hasProfile: Boolean(row.client_account_profile_id),
            hasSnapshot: Boolean(snapshot.clientName),
          })}`,
        )
      }
    }
    auditsCompleted = reportRows.length

    const openReports = await listOperatorSupportReports(admin, {
      status: 'open',
      limit: 100,
    })
    const openIds = new Set(
      (openReports as Array<{ id?: string }>).map((row) => row.id).filter(Boolean),
    )
    if (!reportIds.some((id) => openIds.has(id))) {
      throw new Error('operator list did not include pressure reports')
    }

    await updateOperatorSupportReportStatus(admin, {
      reportId: reportIds[0],
      status: 'reviewing',
    })
    await updateOperatorSupportReportStatus(admin, {
      reportId: reportIds[1],
      status: 'planned',
    })

    const resolution = await resolveSupportReport(admin, {
      reportId: reportIds[2],
      clientAccountProfileId: String(reportRows[0].client_account_profile_id),
      affectedArea: 'pressure_test',
      symptom: 'Synthetic pressure report validated support system behavior.',
      rootCause: 'The pressure script generated a dashboard resolution workflow.',
      fixOrWorkaround:
        'Verify support report intake, audit, notification, lesson, and cleanup invariants.',
      tags: ['pressure', 'support-auditor', 'dashboard'],
      approvedForReuse: true,
      createdBy: 'support-pressure',
    })
    if (
      resolution.lesson &&
      typeof resolution.lesson === 'object' &&
      'id' in resolution.lesson
    ) {
      lessonIds.push(String(resolution.lesson.id))
    }
    if (lessonIds.length !== 1) {
      throw new Error('pressure resolution did not create a reusable lesson')
    }
  } finally {
    process.env.GOOGLE_CHAT_SUPPORT_WEBHOOK_URL = originalWebhook
    await cleanupSyntheticRows({
      admin,
      reportIds,
      lessonIds,
      repIds,
      authUserIds,
    })
    await webhook.close()
  }

  const cleanupResiduals = await countResiduals(admin, marker)
  if (cleanupResiduals !== 0) {
    throw new Error(`support pressure cleanup left ${cleanupResiduals} residual rows`)
  }

  console.log(
    buildSupportPressureSummary({
      repsCreated: repIds.length,
      reportsCreated: reportIds.length,
      alertsCaptured: webhook.requests.length,
      auditsCompleted,
      notificationFailuresVerified,
      lessonsCreated: lessonIds.length,
      cleanupResiduals,
    }),
  )
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('/pressure-support-system.ts')) {
  main().catch((error) => {
    console.error('[support-pressure] error', error)
    process.exit(1)
  })
}
