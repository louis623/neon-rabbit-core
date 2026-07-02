import {
  REQUIRED_SETUP_STEPS,
  type RequiredSetupStepId,
} from '@/lib/self-serve/required-setup'
import {
  createSelfServeWorkspaceForAuthUser,
  type SelfServeWorkspaceAccount,
} from '@/lib/self-serve/signup'
import { ensureLiveQueueSyncCodeForRep } from '@/lib/services/live-queue'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  REVIEWER_SMOKE_NEXT_PATHS,
  getReviewerSmokePersona,
  normalizeReviewerSmokeState,
  type ReviewerSmokeState,
} from './config'

type AdminClient = ReturnType<typeof createAdminClient>

type ExistingRep = {
  id: string
  auth_user_id: string | null
  email: string
}

type AuthUser = {
  id: string
  email?: string | null
}

const REVIEWER_SMOKE_FULFILLMENT = {
  designId: '00000000-0000-4000-8000-000000000101',
  listingId: '00000000-0000-4000-8000-000000000102',
  requestId: '00000000-0000-4000-8000-000000000103',
  fulfillmentId: '00000000-0000-4000-8000-000000000104',
}

export const REVIEWER_SMOKE_CALENDAR = {
  recurrenceGroupId: '00000000-0000-4000-8000-000000000201',
  tonightEventId: '00000000-0000-4000-8000-000000000202',
  futureEventId: '00000000-0000-4000-8000-000000000203',
  audienceId: '00000000-0000-4000-8000-000000000204',
}

function completedStepsForState(state: ReviewerSmokeState): RequiredSetupStepId[] {
  if (state !== 'dashboard_unlocked') return []
  return REQUIRED_SETUP_STEPS.map((step) => step.id)
}

function setupAnswersForReviewer(persona: ReturnType<typeof getReviewerSmokePersona>) {
  return {
    account_basics: {
      businessName: 'Britt Test Rep Sparkle Studio',
      repName: persona.displayName,
      email: persona.email,
      note: 'Reviewer smoke mode synthetic data only.',
    },
    site_skin: {
      preset: 'sparkle_suite_morganite',
      tone: 'warm, polished, customer-ready',
    },
  }
}

async function findAuthUserByEmail(admin: AdminClient, email: string) {
  const authAdmin = admin.auth.admin as {
    listUsers?: (params?: { page?: number; perPage?: number }) => Promise<{
      data?: { users?: AuthUser[] }
      error?: unknown
    }>
  }
  if (!authAdmin.listUsers) return null

  for (let page = 1; page <= 5; page += 1) {
    const { data, error } = await authAdmin.listUsers({
      page,
      perPage: 100,
    })
    if (error) throw error
    const users = data?.users ?? []
    const match = users.find(
      (user) => user.email?.trim().toLowerCase() === email,
    )
    if (match) return match
    if (users.length < 100) return null
  }

  return null
}

async function ensureReviewerAuthUser(
  admin: AdminClient,
  account: SelfServeWorkspaceAccount & { password: string },
) {
  const { data: existingRep, error: repError } = await admin
    .from('reps')
    .select('id, auth_user_id, email')
    .eq('email', account.email)
    .maybeSingle<ExistingRep>()

  if (repError) throw repError

  const existingAuthUserId = existingRep?.auth_user_id ?? null
  if (existingAuthUserId) {
    const { error } = await admin.auth.admin.updateUserById(
      existingAuthUserId,
      {
        password: account.password,
        user_metadata: {
          display_name: account.displayName,
          reviewer_smoke: true,
        },
      },
    )
    if (error) throw error
    return {
      authUserId: existingAuthUserId,
      repId: existingRep?.id ?? null,
    }
  }

  const existingAuthUser = await findAuthUserByEmail(admin, account.email)
  if (existingAuthUser) {
    const { error } = await admin.auth.admin.updateUserById(
      existingAuthUser.id,
      {
        password: account.password,
        user_metadata: {
          display_name: account.displayName,
          reviewer_smoke: true,
        },
      },
    )
    if (error) throw error
    return {
      authUserId: existingAuthUser.id,
      repId: existingRep?.id ?? null,
    }
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: {
      display_name: account.displayName,
      reviewer_smoke: true,
    },
  })

  if (error) throw error
  const authUserId = data.user?.id
  if (!authUserId) throw new Error('Supabase did not return reviewer auth id.')
  return { authUserId, repId: null }
}

async function ensureReviewerWorkspace(
  admin: AdminClient,
  account: SelfServeWorkspaceAccount,
  existingRepId: string | null,
) {
  if (existingRepId) return existingRepId

  const created = await createSelfServeWorkspaceForAuthUser(account, admin)
  return created.repId
}

async function clearReviewerNicNacHistory(admin: AdminClient, repId: string) {
  const tables = ['approval_events', 'nic_nac_runs', 'nic_nac_conversations']
  for (const table of tables) {
    const { error } = await admin.from(table).delete().eq('rep_id', repId)
    if (error) throw error
  }
}

async function ensureReviewerSubscription(admin: AdminClient, repId: string) {
  const now = new Date()
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const { error } = await admin.from('subscriptions').upsert(
    {
      rep_id: repId,
      stripe_subscription_id: `sub_reviewer_smoke_${repId}`,
      stripe_customer_id: `cus_reviewer_smoke_${repId}`,
      plan_tier: 'monthly',
      pricing_tier: 'smoke',
      status: 'active',
      monthly_amount: 99,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
      stripe_livemode: false,
      updated_at: now.toISOString(),
    },
    { onConflict: 'rep_id' },
  )

  if (error) throw error
}

async function ensureReviewerTeamManagementAccess(
  admin: AdminClient,
  repId: string,
) {
  const now = new Date().toISOString()

  const { error } = await admin.from('team_management_entitlements').upsert(
    {
      rep_id: repId,
      status: 'manual_beta',
      source: 'manual_beta',
      stripe_subscription_id: null,
      stripe_price_id: null,
      stripe_customer_id: `cus_reviewer_smoke_${repId}`,
      updated_at: now,
    },
    { onConflict: 'rep_id' },
  )

  if (error) throw error
}

async function clearReviewerFulfillmentSmokeData(
  admin: AdminClient,
) {
  const { error: swapError } = await admin
    .from('trade_swaps')
    .delete()
    .or(
      [
        `request_id.eq.${REVIEWER_SMOKE_FULFILLMENT.requestId}`,
        `outgoing_listing_id.eq.${REVIEWER_SMOKE_FULFILLMENT.listingId}`,
        `replacement_listing_id.eq.${REVIEWER_SMOKE_FULFILLMENT.listingId}`,
        `revealed_design_id.eq.${REVIEWER_SMOKE_FULFILLMENT.designId}`,
      ].join(','),
    )
  if (swapError) throw swapError

  const { error: fulfillmentError } = await admin
    .from('trade_fulfillment')
    .delete()
    .eq('id', REVIEWER_SMOKE_FULFILLMENT.fulfillmentId)
  if (fulfillmentError) throw fulfillmentError

  const { error: requestError } = await admin
    .from('trade_requests')
    .delete()
    .eq('id', REVIEWER_SMOKE_FULFILLMENT.requestId)
  if (requestError) throw requestError

  const { error: listingError } = await admin
    .from('trade_listings')
    .delete()
    .eq('id', REVIEWER_SMOKE_FULFILLMENT.listingId)
  if (listingError) throw listingError

  const { error: designError } = await admin
    .from('jewelry_designs')
    .delete()
    .eq('id', REVIEWER_SMOKE_FULFILLMENT.designId)
  if (designError) throw designError
}

function nextUpcomingUtcDateAt(hourUtc: number, minuteUtc: number) {
  const now = new Date()
  const date = new Date(now)
  date.setUTCHours(hourUtc, minuteUtc, 0, 0)
  if (date.getTime() <= now.getTime() + 10 * 60 * 1000) {
    date.setUTCDate(date.getUTCDate() + 1)
  }
  return date
}

async function clearReviewerCalendarSmokeData(admin: AdminClient, repId?: string) {
  const { error: overrideError } = await admin
    .from('show_reminder_overrides')
    .delete()
    .in('event_id', [
      REVIEWER_SMOKE_CALENDAR.tonightEventId,
      REVIEWER_SMOKE_CALENDAR.futureEventId,
    ])
  if (overrideError) throw overrideError

  if (repId) {
    const { error: preferenceError } = await admin
      .from('show_reminder_preferences')
      .delete()
      .eq('rep_id', repId)
    if (preferenceError) throw preferenceError
  }

  const { error: audienceError } = await admin
    .from('customer_audience')
    .delete()
    .eq('id', REVIEWER_SMOKE_CALENDAR.audienceId)
  if (audienceError) throw audienceError

  const { error: eventError } = await admin
    .from('calendar_events')
    .delete()
    .in('id', [
      REVIEWER_SMOKE_CALENDAR.tonightEventId,
      REVIEWER_SMOKE_CALENDAR.futureEventId,
    ])
  if (eventError) throw eventError
}

async function seedReviewerCalendarSmokeData(admin: AdminClient, repId: string) {
  await clearReviewerCalendarSmokeData(admin, repId)

  const now = new Date().toISOString()
  const firstEventDate = nextUpcomingUtcDateAt(23, 30)
  const secondEventDate = new Date(firstEventDate)
  secondEventDate.setUTCDate(secondEventDate.getUTCDate() + 7)
  const firstEventTime = firstEventDate.toISOString()
  const secondEventTime = secondEventDate.toISOString()

  const { error: eventError } = await admin.from('calendar_events').upsert(
    [
      {
        id: REVIEWER_SMOKE_CALENDAR.tonightEventId,
        rep_id: repId,
        platform: 'TikTok',
        event_time: firstEventTime,
        time_zone: 'America/New_York',
        duration_minutes: 60,
        title: 'Reviewer Smoke Friday Sparkles',
        description: 'Synthetic reviewer smoke live show.',
        discount_codes: [{ code: 'SMOKE10', description: 'Smoke test code' }],
        featured_collections: ['Reviewer Smoke Collection'],
        is_recurring: true,
        recurrence_group_id: REVIEWER_SMOKE_CALENDAR.recurrenceGroupId,
        recurrence_rule: 'weekly',
        status: 'scheduled',
        updated_at: now,
      },
      {
        id: REVIEWER_SMOKE_CALENDAR.futureEventId,
        rep_id: repId,
        platform: 'TikTok',
        event_time: secondEventTime,
        time_zone: 'America/New_York',
        duration_minutes: 60,
        title: 'Reviewer Smoke Friday Sparkles',
        description: 'Synthetic reviewer smoke future live show.',
        discount_codes: [{ code: 'SMOKE10', description: 'Smoke test code' }],
        featured_collections: ['Reviewer Smoke Collection'],
        is_recurring: true,
        recurrence_group_id: REVIEWER_SMOKE_CALENDAR.recurrenceGroupId,
        recurrence_rule: 'weekly',
        status: 'scheduled',
        updated_at: now,
      },
    ],
    { onConflict: 'id' },
  )
  if (eventError) throw eventError

  const { error: audienceError } = await admin.from('customer_audience').upsert(
    {
      id: REVIEWER_SMOKE_CALENDAR.audienceId,
      rep_id: repId,
      name: 'Jamie Reviewer',
      phone: '+15555550101',
      email: 'jamie.reviewer@example.com',
      sms_consent: true,
      email_consent: true,
      marketing_consent: true,
      consent_date: now,
      sms_opted_out_at: null,
      email_opted_out_at: null,
      stop_keyword_received_at: null,
      updated_at: now,
    },
    { onConflict: 'id' },
  )
  if (audienceError) throw audienceError
}

export async function resetReviewerSmokeSession(
  requestedState: unknown,
  admin: AdminClient = createAdminClient(),
) {
  const state = normalizeReviewerSmokeState(requestedState)
  const persona = getReviewerSmokePersona()
  const account = {
    authUserId: '',
    email: persona.email,
    displayName: persona.displayName,
    password: persona.password,
  }
  const { authUserId, repId: existingRepId } = await ensureReviewerAuthUser(
    admin,
    account,
  )
  const repId = await ensureReviewerWorkspace(
    admin,
    {
      authUserId,
      email: persona.email,
      displayName: persona.displayName,
    },
    existingRepId,
  )
  await clearReviewerNicNacHistory(admin, repId)
  await clearReviewerFulfillmentSmokeData(admin)
  await clearReviewerCalendarSmokeData(admin, repId)
  const now = new Date().toISOString()
  const status = state
  const completedSteps = completedStepsForState(state)

  const { error: repUpdateError } = await admin
    .from('reps')
    .update({
      display_name: persona.displayName,
      business_name: 'Britt Test Rep Sparkle Studio',
      status: state === 'dashboard_unlocked' ? 'active' : 'onboarding',
      updated_at: now,
    })
    .eq('id', repId)

  if (repUpdateError) throw repUpdateError

  const { error: setupError } = await admin
    .from('self_serve_setup_sessions')
    .upsert(
      {
        rep_id: repId,
        status,
        current_step:
          state === 'dashboard_unlocked'
            ? 'final_preview_approval'
            : 'account_basics',
        completed_steps: completedSteps,
        answers: setupAnswersForReviewer(persona),
        generated_copy: {},
        support_state: {
          reviewer_smoke: {
            enabled: true,
            reset_at: now,
            state,
          },
        },
        dashboard_unlocked_at:
          state === 'dashboard_unlocked' ? now : null,
        updated_at: now,
      },
      { onConflict: 'rep_id' },
    )

  if (setupError) throw setupError

  if (state !== 'checkout_required') {
    await ensureLiveQueueSyncCodeForRep(admin, { repId })
  }
  if (state === 'dashboard_unlocked') {
    await ensureReviewerSubscription(admin, repId)
    await ensureReviewerTeamManagementAccess(admin, repId)
    await seedReviewerCalendarSmokeData(admin, repId)
  }

  return {
    ok: true as const,
    repId,
    email: persona.email,
    password: persona.password,
    displayName: persona.displayName,
    state,
    next: REVIEWER_SMOKE_NEXT_PATHS[state],
  }
}
