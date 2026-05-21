import { pathToFileURL } from 'node:url'

import { config } from 'dotenv'

import { createPrelaunchLaunchBuildDraft } from '@/lib/prelaunch/launch-builds'
import { upsertPrelaunchLaunchSetupProfile } from '@/lib/prelaunch/setup-profiles'
import { createAdminClient } from '@/lib/supabase/admin'

export const DEMO_PRELAUNCH_SEED_CONFIRM_ENV =
  'DEMO_PRELAUNCH_SEED_CONFIRMED'
export const DEMO_PRELAUNCH_SOURCE = 'smoke_demo'
const RESERVED_PHONE = '+19044383050'

export interface DemoPrelaunchSeedPlan {
  lead: {
    name: string
    email: string
    phone: string
    tiktokHandle: string
    teamRepName: string
    setupPain: string
    source: string
  }
  setupProfile: {
    businessName: string
    publicSiteGoal: string
    primarySocialUrl: string | null
    secondarySocialUrl: string | null
    shopUrl: string | null
    brandNotes: string
    mustHaveLaunchNotes: string
    openQuestions: string[]
  }
  providerActions: {
    sendSms: false
    sendEmail: false
    sendSignWellLiveAgreement: false
    chargeStripe: false
    callPaidNicNac: false
    attachReservedPhone: false
  }
}

export interface DemoPrelaunchSeedResult {
  waitlistId: string
  launchBuildId: string
  setupProfileId: string
  leadEmail: string
  leadStatus: string
  setupProfileStatus: string
}

function readEnv(
  env: Record<string, string | undefined>,
  name: string,
  fallback: string,
) {
  return env[name]?.trim() || fallback
}

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, '')
}

function assertDemoSafeLead(plan: DemoPrelaunchSeedPlan) {
  if (plan.lead.name.trim().toLowerCase() === 'kim goforth') {
    throw new Error('Demo prelaunch seed cannot use Kim Goforth.')
  }

  if (normalizePhone(plan.lead.phone) === RESERVED_PHONE) {
    throw new Error(`DEMO_PRELAUNCH_LEAD_PHONE must not be ${RESERVED_PHONE}.`)
  }
}

export function buildDemoPrelaunchSeedPlan(
  env: Record<string, string | undefined> = process.env,
): DemoPrelaunchSeedPlan {
  const plan = {
    lead: {
      name: readEnv(env, 'DEMO_PRELAUNCH_LEAD_NAME', 'Sparkle Demo Lead'),
      email: readEnv(
        env,
        'DEMO_PRELAUNCH_LEAD_EMAIL',
        readEnv(env, 'DEMO_REP_EMAIL', 'demo-prelaunch-waitlist@yoursparklesuite.com'),
      ).toLowerCase(),
      phone: readEnv(env, 'DEMO_PRELAUNCH_LEAD_PHONE', '202-555-0142'),
      tiktokHandle: readEnv(
        env,
        'DEMO_PRELAUNCH_TIKTOK_HANDLE',
        '@sparklesuitedemo',
      ),
      teamRepName: readEnv(
        env,
        'DEMO_PRELAUNCH_TEAM_REP_NAME',
        'Sparkle Suite Demo Circle',
      ),
      setupPain: 'Demo prelaunch seed row for smoke readiness; no provider outreach.',
      source: DEMO_PRELAUNCH_SOURCE,
    },
    setupProfile: {
      businessName: readEnv(
        env,
        'DEMO_PRELAUNCH_BUSINESS_NAME',
        'Sparkle Demo Shop',
      ),
      publicSiteGoal: 'Launch a clean demo Sparkle Suite hub.',
      primarySocialUrl: null,
      secondarySocialUrl: null,
      shopUrl: null,
      brandNotes: 'Provider-free demo profile for intake-to-build smoke.',
      mustHaveLaunchNotes: 'Use only demo data. Do not contact this lead.',
      openQuestions: ['Confirm this is still a demo-only run.'],
    },
    providerActions: {
      sendSms: false,
      sendEmail: false,
      sendSignWellLiveAgreement: false,
      chargeStripe: false,
      callPaidNicNac: false,
      attachReservedPhone: false,
    },
  } satisfies DemoPrelaunchSeedPlan

  assertDemoSafeLead(plan)
  return plan
}

async function upsertDemoWaitlistLead(plan: DemoPrelaunchSeedPlan) {
  const admin = createAdminClient()
  const existing = await admin
    .from('sparkle_suite_waitlist')
    .select('id')
    .eq('source', DEMO_PRELAUNCH_SOURCE)
    .eq('email', plan.lead.email)
    .maybeSingle()

  if (existing.error) throw existing.error

  const row = {
    name: plan.lead.name,
    email: plan.lead.email,
    phone: plan.lead.phone,
    tiktok_handle: plan.lead.tiktokHandle,
    team_rep_name: plan.lead.teamRepName,
    setup_pain: plan.lead.setupPain,
    sms_consent: false,
    email_consent: true,
    lead_status: 'conversation_complete',
    welcome_email_status: 'skipped',
    welcome_email_provider_id: null,
    welcome_email_error: null,
    welcome_email_sent_at: null,
    source: plan.lead.source,
    intake_submission_id: null,
    handoff_status: 'not_started',
    warmup_status: 'not_started',
    warmup_started_at: null,
    warmup_completed_at: null,
    handoff_notes: 'Provider-free guarded demo row. Do not contact.',
    updated_at: new Date().toISOString(),
  }

  if (existing.data?.id) {
    const { data, error } = await admin
      .from('sparkle_suite_waitlist')
      .update(row)
      .eq('id', existing.data.id)
      .select('id')
      .single()

    if (error) throw error
    return data.id as string
  }

  const { data, error } = await admin
    .from('sparkle_suite_waitlist')
    .insert(row)
    .select('id')
    .single()

  if (error) throw error
  return data.id as string
}

async function advanceDemoWaitlistLead(waitlistId: string) {
  const admin = createAdminClient()
  const profileDrafted = await admin
    .from('sparkle_suite_waitlist')
    .update({
      lead_status: 'setup_profile_drafted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', waitlistId)
    .eq('lead_status', 'conversation_complete')
    .eq('handoff_status', 'not_started')
    .is('intake_submission_id', null)
    .select('id, lead_status')
    .single()

  if (profileDrafted.error) throw profileDrafted.error

  const startWorkReady = await admin
    .from('sparkle_suite_waitlist')
    .update({
      lead_status: 'start_work_ready',
      updated_at: new Date().toISOString(),
    })
    .eq('id', waitlistId)
    .eq('lead_status', 'setup_profile_drafted')
    .eq('handoff_status', 'not_started')
    .is('intake_submission_id', null)
    .select('id, lead_status')
    .single()

  if (startWorkReady.error) throw startWorkReady.error
  return startWorkReady.data.lead_status as string
}

async function loadExistingLaunchBuild(waitlistId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('sparkle_suite_launch_builds')
    .select('id')
    .eq('waitlist_id', waitlistId)
    .neq('stage', 'launched')
    .order('updated_at', { ascending: false })
    .limit(1)

  if (error) throw error
  return (data?.[0]?.id as string | undefined) ?? null
}

export async function seedDemoPrelaunch(
  plan: DemoPrelaunchSeedPlan = buildDemoPrelaunchSeedPlan(),
  env: Record<string, string | undefined> = process.env,
): Promise<DemoPrelaunchSeedResult> {
  if (env[DEMO_PRELAUNCH_SEED_CONFIRM_ENV] !== 'true') {
    throw new Error(
      `${DEMO_PRELAUNCH_SEED_CONFIRM_ENV}=true is required before creating demo prelaunch data.`,
    )
  }

  assertDemoSafeLead(plan)
  const waitlistId = await upsertDemoWaitlistLead(plan)
  const leadStatus = await advanceDemoWaitlistLead(waitlistId)
  const existingBuildId = await loadExistingLaunchBuild(waitlistId)
  const launchBuild = existingBuildId
    ? { id: existingBuildId }
    : await createPrelaunchLaunchBuildDraft({
        waitlistId,
        operatorRepId: null,
      })
  const setupProfile = await upsertPrelaunchLaunchSetupProfile({
    launchBuildId: launchBuild.id,
    businessName: plan.setupProfile.businessName,
    publicSiteGoal: plan.setupProfile.publicSiteGoal,
    primarySocialUrl: plan.setupProfile.primarySocialUrl,
    secondarySocialUrl: plan.setupProfile.secondarySocialUrl,
    shopUrl: plan.setupProfile.shopUrl,
    brandNotes: plan.setupProfile.brandNotes,
    mustHaveLaunchNotes: plan.setupProfile.mustHaveLaunchNotes,
    openQuestions: plan.setupProfile.openQuestions,
    status: 'ready',
  })

  return {
    waitlistId,
    launchBuildId: launchBuild.id,
    setupProfileId: setupProfile.id,
    leadEmail: plan.lead.email,
    leadStatus,
    setupProfileStatus: setupProfile.status,
  }
}

async function main() {
  config({ path: '.env.local', quiet: true })
  const result = await seedDemoPrelaunch()
  console.log(JSON.stringify(result, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
