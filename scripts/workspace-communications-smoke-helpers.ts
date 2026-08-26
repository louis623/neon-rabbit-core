import { randomBytes } from 'node:crypto'
import { config } from 'dotenv'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const COMMUNICATIONS_SMOKE_EMAIL_PREFIX =
  'sparkle-reviewer+communications-'
export const COMMUNICATIONS_SMOKE_EMAIL_DOMAIN = '@neonrabbit.net'

export type CommunicationsSmokeAdmin = SupabaseClient

export type SyntheticReviewer = {
  authUserId: string
  repId: string
  email: string
  displayName: string
}

export type CommunicationsSmokeFixture = {
  authUserIds: string[]
  repIds: string[]
  conversationIds: string[]
  supportReportIds: string[]
  attachmentPaths: string[]
  taskIds: string[]
  participantIds: string[]
}

export function emptyCommunicationsSmokeFixture(): CommunicationsSmokeFixture {
  return {
    authUserIds: [],
    repIds: [],
    conversationIds: [],
    supportReportIds: [],
    attachmentPaths: [],
    taskIds: [],
    participantIds: [],
  }
}

export function assertSyntheticCommunicationsEmail(email: string) {
  const normalized = email.trim().toLowerCase()
  if (
    !normalized.startsWith(COMMUNICATIONS_SMOKE_EMAIL_PREFIX) ||
    !normalized.endsWith(COMMUNICATIONS_SMOKE_EMAIL_DOMAIN)
  ) {
    throw new Error(
      `Communications smoke identities must use ${COMMUNICATIONS_SMOKE_EMAIL_PREFIX}…${COMMUNICATIONS_SMOKE_EMAIL_DOMAIN}.`,
    )
  }
  return normalized
}

export function makeCommunicationsSmokeEmail(runId: string, label: string) {
  const safeRun = runId.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40)
  const safeLabel = label.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30)
  return assertSyntheticCommunicationsEmail(
    `${COMMUNICATIONS_SMOKE_EMAIL_PREFIX}${safeRun}-${safeLabel}${COMMUNICATIONS_SMOKE_EMAIL_DOMAIN}`,
  )
}

export function createCommunicationsSmokeAdmin(
  env: Record<string, string | undefined> = process.env,
) {
  config({ path: '.env.local', quiet: true })
  config({ path: '.env.production.local', override: false, quiet: true })
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for communications smoke tests.',
    )
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function createSyntheticReviewer(
  admin: CommunicationsSmokeAdmin,
  input: { runId: string; label: string },
): Promise<SyntheticReviewer> {
  const email = makeCommunicationsSmokeEmail(input.runId, input.label)
  const displayName = `Communications Smoke ${input.label}`
  const password = `CommSmoke-${randomBytes(18).toString('base64url')}!9a`
  const auth = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { reviewer_smoke: true, smoke_scope: 'workspace_communications' },
  })
  if (auth.error || !auth.data.user) throw auth.error ?? new Error('Synthetic reviewer auth user was not created.')

  try {
    const rep = await admin
      .from('reps')
      .insert({
        auth_user_id: auth.data.user.id,
        display_name: displayName,
        business_name: `${displayName} Studio`,
        email,
        status: 'active',
      })
      .select('id')
      .single()
    if (rep.error || !rep.data) throw rep.error ?? new Error('Synthetic reviewer rep was not created.')
    const repId = String(rep.data.id)
    const now = new Date()
    const subscription = await admin.from('subscriptions').insert({
      rep_id: repId,
      stripe_subscription_id: `sub_reviewer_smoke_${repId}`,
      stripe_customer_id: `cus_reviewer_smoke_${repId}`,
      plan_tier: 'monthly',
      pricing_tier: 'smoke',
      status: 'active',
      monthly_amount: 99,
      current_period_start: now.toISOString(),
      current_period_end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancel_at_period_end: false,
      stripe_livemode: false,
    })
    if (subscription.error) throw subscription.error
    return { authUserId: auth.data.user.id, repId, email, displayName }
  } catch (error) {
    const cleanup = await admin.auth.admin.deleteUser(auth.data.user.id)
    if (cleanup.error) {
      throw new AggregateError([error, cleanup.error], 'Synthetic reviewer creation and rollback both failed.')
    }
    throw error
  }
}

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

async function mustDelete(
  operation: PromiseLike<{ error: unknown }>,
  label: string,
) {
  const result = await operation
  if (result.error) throw new Error(`Cleanup failed for ${label}: ${String((result.error as { message?: unknown }).message ?? result.error)}`)
}

async function discoverFixtureRelationships(
  admin: CommunicationsSmokeAdmin,
  fixture: CommunicationsSmokeFixture,
) {
  const repIds = unique(fixture.repIds)
  const conversationIds = new Set(unique(fixture.conversationIds))
  if (repIds.length > 0) {
    const created = await admin
      .from('workspace_conversations')
      .select('id')
      .in('created_by_rep_id', repIds)
    if (created.error) throw created.error
    for (const row of created.data ?? []) conversationIds.add(String(row.id))

    const memberships = await admin
      .from('workspace_conversation_participants')
      .select('conversation_id')
      .in('rep_id', repIds)
    if (memberships.error) throw memberships.error
    for (const row of memberships.data ?? []) conversationIds.add(String(row.conversation_id))
  }

  const supportReportIds = new Set(unique(fixture.supportReportIds))
  if (repIds.length > 0) {
    const reports = await admin.from('support_reports').select('id').in('rep_id', repIds)
    if (reports.error) throw reports.error
    for (const row of reports.data ?? []) supportReportIds.add(String(row.id))
  }
  if (conversationIds.size > 0) {
    const reports = await admin
      .from('support_reports')
      .select('id')
      .in('workspace_conversation_id', [...conversationIds])
    if (reports.error) throw reports.error
    for (const row of reports.data ?? []) supportReportIds.add(String(row.id))
  }

  const attachmentPaths = new Set(unique(fixture.attachmentPaths))
  if (conversationIds.size > 0) {
    const attachments = await admin
      .from('workspace_conversation_attachments')
      .select('object_path')
      .in('conversation_id', [...conversationIds])
    if (attachments.error) throw attachments.error
    for (const row of attachments.data ?? []) attachmentPaths.add(String(row.object_path))
  }

  const taskIds = new Set(unique(fixture.taskIds))
  if (supportReportIds.size > 0) {
    const tasks = await admin
      .from('sparkle_suite_bug_hunt_items')
      .select('id')
      .in('source_support_report_id', [...supportReportIds])
    if (tasks.error) throw tasks.error
    for (const row of tasks.data ?? []) taskIds.add(String(row.id))
  }

  return {
    repIds,
    conversationIds: [...conversationIds],
    supportReportIds: [...supportReportIds],
    attachmentPaths: [...attachmentPaths],
    taskIds: [...taskIds],
    participantIds: unique(fixture.participantIds),
    authUserIds: unique(fixture.authUserIds),
  }
}

export async function cleanupCommunicationsSmokeFixture(
  admin: CommunicationsSmokeAdmin,
  fixture: CommunicationsSmokeFixture,
) {
  const discovered = await discoverFixtureRelationships(admin, fixture)
  if (discovered.attachmentPaths.length > 0) {
    const removed = await admin.storage
      .from('workspace-support-attachments')
      .remove(discovered.attachmentPaths)
    if (removed.error) throw new Error(`Cleanup failed for private attachment objects: ${removed.error.message}`)
  }
  if (discovered.taskIds.length > 0) {
    await mustDelete(
      admin.from('sparkle_suite_bug_hunt_items').delete().in('id', discovered.taskIds),
      'Task List promotions',
    )
  }
  if (discovered.supportReportIds.length > 0) {
    await mustDelete(
      admin.from('support_reports').delete().in('id', discovered.supportReportIds),
      'support reports',
    )
  }
  if (discovered.conversationIds.length > 0) {
    await mustDelete(
      admin.from('workspace_conversation_audit_events').delete().in('conversation_id', discovered.conversationIds),
      'conversation audit events',
    )
    await mustDelete(
      admin.from('workspace_conversations').delete().in('id', discovered.conversationIds),
      'conversations',
    )
  }
  if (discovered.participantIds.length > 0) {
    await mustDelete(
      admin.from('team_onboarding_participants').delete().in('id', discovered.participantIds),
      'team onboarding participants',
    )
  }
  if (discovered.repIds.length > 0) {
    await mustDelete(admin.from('reps').delete().in('id', discovered.repIds), 'synthetic reps')
  }
  for (const authUserId of discovered.authUserIds) {
    const deleted = await admin.auth.admin.deleteUser(authUserId)
    if (deleted.error) throw new Error(`Cleanup failed for synthetic auth user ${authUserId}: ${deleted.error.message}`)
  }

  if (discovered.repIds.length > 0) {
    const remaining = await admin.from('reps').select('id', { count: 'exact', head: true }).in('id', discovered.repIds)
    if (remaining.error || (remaining.count ?? 0) !== 0) {
      throw remaining.error ?? new Error('Cleanup verification found remaining synthetic reps.')
    }
  }
  if (discovered.conversationIds.length > 0) {
    const remaining = await admin.from('workspace_conversations').select('id', { count: 'exact', head: true }).in('id', discovered.conversationIds)
    if (remaining.error || (remaining.count ?? 0) !== 0) {
      throw remaining.error ?? new Error('Cleanup verification found remaining communications conversations.')
    }
  }
  return {
    deletedRepIds: discovered.repIds,
    deletedConversationIds: discovered.conversationIds,
    deletedSupportReportIds: discovered.supportReportIds,
    deletedAttachmentPaths: discovered.attachmentPaths,
    deletedTaskIds: discovered.taskIds,
  }
}

async function listSyntheticAuthUserIds(admin: CommunicationsSmokeAdmin) {
  const ids: string[] = []
  for (let page = 1; page <= 20; page += 1) {
    const listed = await admin.auth.admin.listUsers({ page, perPage: 100 })
    if (listed.error) throw listed.error
    const users = listed.data.users
    for (const user of users) {
      const email = user.email?.trim().toLowerCase()
      if (email?.startsWith(COMMUNICATIONS_SMOKE_EMAIL_PREFIX)) ids.push(user.id)
    }
    if (users.length < 100) break
  }
  return ids
}

export async function resetAllCommunicationsSmokeFixtures(
  admin: CommunicationsSmokeAdmin,
) {
  const reps = await admin
    .from('reps')
    .select('id, auth_user_id, email')
    .like('email', `${COMMUNICATIONS_SMOKE_EMAIL_PREFIX}%`)
  if (reps.error) throw reps.error
  const rows = (reps.data ?? []).filter((row) => {
    try {
      assertSyntheticCommunicationsEmail(String(row.email))
      return true
    } catch {
      return false
    }
  })
  const authUserIds = unique([
    ...rows.map((row) => row.auth_user_id as string | null),
    ...(await listSyntheticAuthUserIds(admin)),
  ])
  return cleanupCommunicationsSmokeFixture(admin, {
    ...emptyCommunicationsSmokeFixture(),
    repIds: rows.map((row) => String(row.id)),
    authUserIds,
  })
}

export async function runWithRequiredCleanup<T>(input: {
  admin: CommunicationsSmokeAdmin
  fixture: CommunicationsSmokeFixture
  run: () => Promise<T>
}) {
  let result: T | undefined
  let runError: unknown
  try {
    result = await input.run()
  } catch (error) {
    runError = error
  }

  let cleanup: Awaited<ReturnType<typeof cleanupCommunicationsSmokeFixture>>
  try {
    cleanup = await cleanupCommunicationsSmokeFixture(input.admin, input.fixture)
  } catch (cleanupError) {
    if (runError) {
      throw new AggregateError([runError, cleanupError], 'Communications smoke and required cleanup both failed.')
    }
    throw cleanupError
  }
  if (runError) throw runError
  if (result === undefined) throw new Error('Communications smoke returned no result.')
  return { result, cleanup }
}
