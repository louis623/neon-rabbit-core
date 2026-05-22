import { pathToFileURL } from 'node:url'

import { config } from 'dotenv'

import {
  createPrelaunchAgreementDraftTracker,
  recordPrelaunchAgreementSigned,
} from '@/lib/prelaunch/agreement-documents'
import { DEFAULT_PRELAUNCH_LAUNCH_CHECKS } from '@/lib/prelaunch/launch-checks'
import { upsertPrelaunchLaunchCheck } from '@/lib/prelaunch/launch-checks'
import { upsertPrelaunchLaunchGate } from '@/lib/prelaunch/launch-gates'
import {
  connectPrelaunchLaunchBuildToProductionRep,
} from '@/lib/prelaunch/production-roster'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  DEMO_PRELAUNCH_SEED_CONFIRM_ENV,
  buildDemoPrelaunchSeedPlan,
  seedDemoPrelaunch,
  type DemoPrelaunchSeedResult,
} from '@/scripts/seed-demo-prelaunch'

type MutableEnv = Record<string, string | undefined>
type SeedDemoPrelaunchDependency = (
  plan?: ReturnType<typeof buildDemoPrelaunchSeedPlan>,
  env?: MutableEnv,
) => Promise<DemoPrelaunchSeedResult>

export interface DemoLaunchFlowResult {
  ok: boolean
  waitlistId: string
  launchBuildId: string
  setupProfileId: string
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
}

export interface DemoLaunchFlowDependencies {
  seedDemoPrelaunch?: SeedDemoPrelaunchDependency
  loadDemoRepId?: (email: string) => Promise<string>
  upsertPrelaunchLaunchGate?: (input: {
    launchBuildId: string
    gateKey: string
    status: 'ready'
    notes: string
  }) => Promise<unknown>
  createPrelaunchAgreementDraftTracker?: (input: {
    launchBuildId: string
    providerDocumentId: string
    providerStatus: number
    notes: string
    env: MutableEnv
  }) => Promise<unknown>
  recordPrelaunchAgreementSigned?: (input: {
    launchBuildId: string
    signedPdfUrl: string | null
    notes: string
  }) => Promise<unknown>
  upsertPrelaunchLaunchCheck?: (input: {
    launchBuildId: string
    checkKey: string
    status: 'passed'
    notes: string
  }) => Promise<unknown>
  connectPrelaunchLaunchBuildToProductionRep?: (input: {
    launchBuildId: string
    repId: string
    notes: string
  }) => Promise<{ stage: string; status: string }>
}

export async function loadDemoRepIdByEmail(email: string) {
  const cleanedEmail = email.trim().toLowerCase()
  if (!cleanedEmail) throw new Error('Demo rep email is required.')

  const { data, error } = await createAdminClient()
    .from('reps')
    .select('id')
    .eq('email', cleanedEmail)
    .single()

  if (error) throw error
  return data.id as string
}

export async function seedDemoLaunchFlow(input: {
  env?: MutableEnv
  dependencies?: DemoLaunchFlowDependencies
} = {}): Promise<DemoLaunchFlowResult> {
  const env = input.env ?? process.env
  if (env[DEMO_PRELAUNCH_SEED_CONFIRM_ENV] !== 'true') {
    throw new Error(
      `${DEMO_PRELAUNCH_SEED_CONFIRM_ENV}=true is required before creating demo launch-flow data.`,
    )
  }

  const dependencies = input.dependencies ?? {}
  const plan = buildDemoPrelaunchSeedPlan(env)
  const prelaunch = await (dependencies.seedDemoPrelaunch ?? seedDemoPrelaunch)(
    plan,
    env,
  )
  const demoRepEmail =
    env.DEMO_REP_EMAIL?.trim().toLowerCase() || prelaunch.leadEmail
  const repId = await (dependencies.loadDemoRepId ?? loadDemoRepIdByEmail)(
    demoRepEmail,
  )

  await (dependencies.upsertPrelaunchLaunchGate ?? upsertPrelaunchLaunchGate)({
    launchBuildId: prelaunch.launchBuildId,
    gateKey: 'payment',
    status: 'ready',
    notes:
      'Demo payment gate marked ready in Stripe test mode only. No checkout or charge.',
  })

  await (
    dependencies.createPrelaunchAgreementDraftTracker ??
    createPrelaunchAgreementDraftTracker
  )({
    launchBuildId: prelaunch.launchBuildId,
    providerDocumentId: 'demo-sandbox-agreement',
    providerStatus: 200,
    notes:
      'Demo sandbox agreement tracker. No email sent and no live agreement created.',
    env,
  })

  await (
    dependencies.recordPrelaunchAgreementSigned ??
    recordPrelaunchAgreementSigned
  )({
    launchBuildId: prelaunch.launchBuildId,
    signedPdfUrl: null,
    notes: 'Demo sandbox agreement signature recorded. No live SignWell send.',
  })

  for (const check of DEFAULT_PRELAUNCH_LAUNCH_CHECKS) {
    await (dependencies.upsertPrelaunchLaunchCheck ?? upsertPrelaunchLaunchCheck)(
      {
        launchBuildId: prelaunch.launchBuildId,
        checkKey: check.key,
        status: 'passed',
        notes: `Demo flow passed: ${check.label}. No provider action.`,
      },
    )
  }

  const build = await (
    dependencies.connectPrelaunchLaunchBuildToProductionRep ??
    connectPrelaunchLaunchBuildToProductionRep
  )({
    launchBuildId: prelaunch.launchBuildId,
    repId,
    notes: 'Existing demo rep account connected after sandbox checks passed.',
  })

  return {
    ok: build.status === 'ready',
    waitlistId: prelaunch.waitlistId,
    launchBuildId: prelaunch.launchBuildId,
    setupProfileId: prelaunch.setupProfileId,
    repId,
    stage: build.stage,
    status: build.status,
    providerActions: {
      sendSms: false,
      sendEmail: false,
      sendSignWellLiveAgreement: false,
      chargeStripe: false,
      callPaidNicNac: false,
      attachReservedPhone: false,
    },
  }
}

async function main() {
  config({ path: '.env.local', quiet: true })
  const result = await seedDemoLaunchFlow()
  console.log(JSON.stringify(result, null, 2))

  if (!result.ok) {
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
