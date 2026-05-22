import { createPrelaunchAgreementDraftTracker, recordPrelaunchAgreementSigned } from '@/lib/prelaunch/agreement-documents'
import { DEFAULT_PRELAUNCH_LAUNCH_CHECKS, upsertPrelaunchLaunchCheck } from '@/lib/prelaunch/launch-checks'
import { createPrelaunchLaunchBuildDraft } from '@/lib/prelaunch/launch-builds'
import { upsertPrelaunchLaunchGate } from '@/lib/prelaunch/launch-gates'
import { connectPrelaunchLaunchBuildToProductionRep } from '@/lib/prelaunch/production-roster'
import { upsertPrelaunchLaunchSetupProfile } from '@/lib/prelaunch/setup-profiles'
import { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>
type MutableEnv = Record<string, string | undefined>

export const CUSTOMER_FLOW_SMOKE_CONFIRM_ENV =
  'CUSTOMER_FLOW_SMOKE_CONFIRMED'
export const CUSTOMER_FLOW_SMOKE_SOURCE = 'customer_flow_smoke'
const RESERVED_PHONE = '+19044383050'

interface CustomerFlowSmokeCustomer {
  name?: string
  email?: string
  phone?: string
  businessName?: string
  tiktokHandle?: string
  teamRepName?: string
  setupPain?: string
}

interface CustomerFlowWaitlistLeadInput {
  name: string
  email: string
  phone: string
  businessName: string
  tiktokHandle: string
  teamRepName: string
  setupPain: string
  source: string
}

export interface CustomerFlowSmokeResult {
  ok: boolean
  waitlistId: string
  launchBuildId: string
  repId: string
  stage: string
  status: string
  providerActions: {
    sendSms: false
    sendEmail: false
    sendSignWellLiveAgreement: false
    chargeStripe: false
    callPaidNicNac: false
    attachReservedPhone: false
  }
  links: {
    controlCenter: string
    nicNac: string
    homepage: string
    tradeBoard: string
    joinPage: string
  }
}

interface CustomerFlowSmokeDependencies {
  createWaitlistLead?: (
    input: CustomerFlowWaitlistLeadInput,
  ) => Promise<{ waitlistId: string }>
  advanceWaitlistLead?: (waitlistId: string) => Promise<void>
  createPrelaunchLaunchBuildDraft?: (
    input: Parameters<typeof createPrelaunchLaunchBuildDraft>[0],
  ) => Promise<{ id: string }>
  upsertPrelaunchLaunchSetupProfile?: (
    input: Parameters<typeof upsertPrelaunchLaunchSetupProfile>[0],
  ) => Promise<unknown>
  upsertPrelaunchLaunchGate?: (
    input: Parameters<typeof upsertPrelaunchLaunchGate>[0],
  ) => Promise<unknown>
  createPrelaunchAgreementDraftTracker?: (
    input: Parameters<typeof createPrelaunchAgreementDraftTracker>[0],
  ) => Promise<unknown>
  recordPrelaunchAgreementSigned?: (
    input: Parameters<typeof recordPrelaunchAgreementSigned>[0],
  ) => Promise<unknown>
  upsertPrelaunchLaunchCheck?: (
    input: Parameters<typeof upsertPrelaunchLaunchCheck>[0],
  ) => Promise<unknown>
  loadRepIdByEmail?: (email: string) => Promise<string>
  connectPrelaunchLaunchBuildToProductionRep?: (
    input: Parameters<typeof connectPrelaunchLaunchBuildToProductionRep>[0],
  ) => Promise<{ stage: string; status: string }>
}

export interface CustomerFlowSmokeInput {
  customer?: CustomerFlowSmokeCustomer
  env?: MutableEnv
  dependencies?: CustomerFlowSmokeDependencies
}

function clean(value: string | undefined, fallback: string) {
  return value?.trim() || fallback
}

function cleanEmail(value: string | undefined, fallback: string) {
  return clean(value, fallback).toLowerCase()
}

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, '')
}

function assertSafeCustomer(input: CustomerFlowWaitlistLeadInput) {
  if (input.name.trim().toLowerCase() === 'kim goforth') {
    throw new Error('Customer-flow smoke cannot use Kim Goforth.')
  }

  if (normalizePhone(input.phone) === RESERVED_PHONE) {
    throw new Error(`CUSTOMER_FLOW_PHONE must not be ${RESERVED_PHONE}.`)
  }
}

export function buildCustomerFlowSmokeCustomer(
  input: CustomerFlowSmokeInput = {},
): CustomerFlowWaitlistLeadInput {
  const env = input.env ?? process.env
  const repEmail = env.CUSTOMER_FLOW_REP_EMAIL ?? env.DEMO_REP_EMAIL
  const email = cleanEmail(
    input.customer?.email ?? env.CUSTOMER_FLOW_EMAIL,
    repEmail ?? 'louis+sparkle-customer-flow@neonrabbit.net',
  )
  const customer = {
    name: clean(
      input.customer?.name ?? env.CUSTOMER_FLOW_NAME,
      'Sparkle Suite Customer',
    ),
    email,
    phone: clean(
      input.customer?.phone ?? env.CUSTOMER_FLOW_PHONE,
      '202-555-0143',
    ),
    businessName: clean(
      input.customer?.businessName ?? env.CUSTOMER_FLOW_BUSINESS_NAME,
      'Sparkle Suite Customer Studio',
    ),
    tiktokHandle: clean(
      input.customer?.tiktokHandle ?? env.CUSTOMER_FLOW_TIKTOK_HANDLE,
      '@sparklesuitecustomer',
    ),
    teamRepName: clean(
      input.customer?.teamRepName ?? env.CUSTOMER_FLOW_TEAM_REP_NAME,
      'Sparkle Suite',
    ),
    setupPain: clean(
      input.customer?.setupPain ?? env.CUSTOMER_FLOW_SETUP_PAIN,
      'Real-flow smoke for the customer signup to launch path. No provider sends.',
    ),
    source: CUSTOMER_FLOW_SMOKE_SOURCE,
  }

  assertSafeCustomer(customer)
  return customer
}

export async function createCustomerFlowWaitlistLead(
  input: CustomerFlowWaitlistLeadInput,
  admin: AdminClient = createAdminClient(),
) {
  assertSafeCustomer(input)

  const existing = await admin
    .from('sparkle_suite_waitlist')
    .select('id')
    .eq('source', input.source)
    .eq('email', input.email)
    .maybeSingle()

  if (existing.error) throw existing.error

  const row = {
    name: input.name,
    email: input.email,
    phone: input.phone,
    tiktok_handle: input.tiktokHandle.startsWith('@')
      ? input.tiktokHandle
      : `@${input.tiktokHandle}`,
    team_rep_name: input.teamRepName,
    setup_pain: input.setupPain,
    sms_consent: false,
    email_consent: true,
    source: input.source,
    lead_status: 'new',
    welcome_email_status: 'skipped',
    welcome_email_provider_id: null,
    welcome_email_error: 'customer_flow_smoke_no_send',
    welcome_email_sent_at: null,
    intake_submission_id: null,
    handoff_status: 'not_started',
    warmup_status: 'not_started',
    warmup_started_at: null,
    warmup_completed_at: null,
    handoff_notes: 'Customer-flow smoke lead. No live provider outreach.',
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
    return { waitlistId: data.id as string }
  }

  const { data, error } = await admin
    .from('sparkle_suite_waitlist')
    .insert(row)
    .select('id')
    .single()

  if (error) throw error
  return { waitlistId: data.id as string }
}

async function updateLeadStatus(
  waitlistId: string,
  fromStatus: string,
  toStatus: string,
  admin: AdminClient,
) {
  const { error } = await admin
    .from('sparkle_suite_waitlist')
    .update({
      lead_status: toStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', waitlistId)
    .eq('lead_status', fromStatus)
    .eq('handoff_status', 'not_started')
    .is('intake_submission_id', null)
    .select('id')
    .single()

  if (error) {
    throw new Error(
      `Failed to advance waitlist lead ${waitlistId} from ${fromStatus} to ${toStatus}: ${JSON.stringify(error)}`,
    )
  }
}

export async function advanceCustomerFlowWaitlistLead(
  waitlistId: string,
  admin: AdminClient = createAdminClient(),
) {
  await updateLeadStatus(waitlistId, 'new', 'contact_batch_selected', admin)
  await updateLeadStatus(waitlistId, 'contact_batch_selected', 'contacted', admin)
  await updateLeadStatus(waitlistId, 'contacted', 'meeting_scheduled', admin)
  await updateLeadStatus(
    waitlistId,
    'meeting_scheduled',
    'conversation_complete',
    admin,
  )
  await updateLeadStatus(
    waitlistId,
    'conversation_complete',
    'setup_profile_drafted',
    admin,
  )
  await updateLeadStatus(
    waitlistId,
    'setup_profile_drafted',
    'start_work_ready',
    admin,
  )
}

export async function loadCustomerFlowRepIdByEmail(
  email: string,
  admin: AdminClient = createAdminClient(),
) {
  const cleanedEmail = email.trim().toLowerCase()
  if (!cleanedEmail) throw new Error('CUSTOMER_FLOW_REP_EMAIL is required.')

  const { data, error } = await admin
    .from('reps')
    .select('id')
    .eq('email', cleanedEmail)
    .single()

  if (error) throw error
  return data.id as string
}

export async function runCustomerFlowSmoke(
  input: CustomerFlowSmokeInput = {},
): Promise<CustomerFlowSmokeResult> {
  const env = input.env ?? process.env
  if (env[CUSTOMER_FLOW_SMOKE_CONFIRM_ENV] !== 'true') {
    throw new Error(
      `${CUSTOMER_FLOW_SMOKE_CONFIRM_ENV}=true is required before writing customer-flow smoke data.`,
    )
  }

  const dependencies = input.dependencies ?? {}
  const customer = buildCustomerFlowSmokeCustomer(input)
  const repEmail = cleanEmail(
    env.CUSTOMER_FLOW_REP_EMAIL ?? env.DEMO_REP_EMAIL,
    customer.email,
  )
  async function step<T>(label: string, run: () => Promise<T>) {
    try {
      return await run()
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : JSON.stringify(error)
      throw new Error(`${label} failed: ${detail}`)
    }
  }

  const { waitlistId } = await step('Create waitlist lead', () =>
    (dependencies.createWaitlistLead ?? createCustomerFlowWaitlistLead)(
      customer,
    ),
  )

  await step('Advance waitlist lead', () =>
    (dependencies.advanceWaitlistLead ?? advanceCustomerFlowWaitlistLead)(
      waitlistId,
    ),
  )

  const build = await step('Create launch build', () =>
    (
      dependencies.createPrelaunchLaunchBuildDraft ??
      createPrelaunchLaunchBuildDraft
    )({
      waitlistId,
      intakeSubmissionId: null,
      operatorRepId: null,
    }),
  )
  const launchBuildId = build.id

  await step('Save setup profile', () =>
    (
      dependencies.upsertPrelaunchLaunchSetupProfile ??
      upsertPrelaunchLaunchSetupProfile
    )({
      launchBuildId,
      businessName: customer.businessName,
      publicSiteGoal: 'Launch a working Sparkle Suite customer hub.',
      primarySocialUrl: `https://www.tiktok.com/${customer.tiktokHandle.replace(/^@/, '@')}`,
      shopUrl: null,
      brandNotes:
        'Customer-flow smoke setup profile. Review like a real customer build.',
      mustHaveLaunchNotes:
        'Use the same setup, gate, agreement, check, and roster steps as a real customer.',
      openQuestions: [
        'Confirm live provider actions are still intentionally disabled.',
      ],
      status: 'ready',
    }),
  )

  await step('Mark payment gate ready', () =>
    (dependencies.upsertPrelaunchLaunchGate ?? upsertPrelaunchLaunchGate)({
      launchBuildId,
      gateKey: 'payment',
      status: 'ready',
      notes:
        'Stripe test-mode payment gate reviewed. No checkout or charge created.',
    }),
  )

  await step('Record agreement draft', () =>
    (
      dependencies.createPrelaunchAgreementDraftTracker ??
      createPrelaunchAgreementDraftTracker
    )({
      launchBuildId,
      providerDocumentId: 'customer-flow-smoke-agreement',
      providerStatus: 200,
      notes:
        'Agreement tracker recorded from the real customer flow smoke. No live send.',
      env,
    }),
  )

  await step('Record agreement signed', () =>
    (
      dependencies.recordPrelaunchAgreementSigned ??
      recordPrelaunchAgreementSigned
    )({
      launchBuildId,
      signedPdfUrl: null,
      notes:
        'Customer-flow smoke agreement signature recorded. No live SignWell send.',
    }),
  )

  for (const check of DEFAULT_PRELAUNCH_LAUNCH_CHECKS) {
    await step(`Pass launch check ${check.key}`, () =>
      (
        dependencies.upsertPrelaunchLaunchCheck ?? upsertPrelaunchLaunchCheck
      )({
        launchBuildId,
        checkKey: check.key,
        status: 'passed',
        notes: `Customer-flow smoke passed: ${check.label}.`,
      }),
    )
  }

  const repId = await step('Load existing rep account', () =>
    (dependencies.loadRepIdByEmail ?? loadCustomerFlowRepIdByEmail)(repEmail),
  )
  const connectedBuild = await step('Connect production roster', () =>
    (
      dependencies.connectPrelaunchLaunchBuildToProductionRep ??
      connectPrelaunchLaunchBuildToProductionRep
    )({
      launchBuildId,
      repId,
      notes:
        'Customer-flow smoke connected the existing account after gates and checks passed.',
    }),
  )

  return {
    ok: connectedBuild.status === 'ready',
    waitlistId,
    launchBuildId,
    repId,
    stage: connectedBuild.stage,
    status: connectedBuild.status,
    providerActions: {
      sendSms: false,
      sendEmail: false,
      sendSignWellLiveAgreement: false,
      chargeStripe: false,
      callPaidNicNac: false,
      attachReservedPhone: false,
    },
    links: {
      controlCenter: '/control-center/intake',
      nicNac: '/nic-nac',
      homepage: '/amethyst/Homepage.html',
      tradeBoard: '/amethyst/Trade.html',
      joinPage: '/amethyst/Join.html',
    },
  }
}
