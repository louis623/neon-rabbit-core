import {
  buildDemoSeedPlan,
  seedDemoRep,
  type DemoSeedPlan,
} from '@/scripts/seed-demo-rep'
import {
  seedDemoLaunchFlow,
  type DemoLaunchFlowResult,
} from '@/scripts/seed-demo-launch-flow'

export const DEFAULT_DEMO_LAUNCH_REP_EMAIL =
  'louis+sparkle-demo@neonrabbit.net'
export const DEFAULT_DEMO_LAUNCH_LEAD_NAME = 'Sparkle Demo Lead'
export const DEFAULT_DEMO_LAUNCH_BUSINESS_NAME = 'Sparkle Demo Shop'

type MutableEnv = Record<string, string | undefined>

export interface DemoLaunchRunInput {
  demoRepEmail?: string
  leadName?: string
  businessName?: string
  operatorRepId?: string | null
  env?: MutableEnv
  dependencies?: DemoLaunchRunDependencies
}

export interface DemoLaunchRunDependencies {
  seedDemoRep?: (plan: DemoSeedPlan) => Promise<unknown>
  seedDemoLaunchFlow?: (input: { env: MutableEnv }) => Promise<DemoLaunchFlowResult>
}

export interface DemoLaunchRunResult extends DemoLaunchFlowResult {
  links: {
    controlCenter: string
    nicNac: string
    homepage: string
    tradeBoard: string
    joinPage: string
  }
}

function clean(value: string | undefined, fallback: string) {
  return value?.trim() || fallback
}

function cleanEmail(value: string | undefined, fallback: string) {
  return clean(value, fallback).toLowerCase()
}

function assertSafeDemoInput(input: {
  businessName: string
  demoRepEmail: string
  leadName: string
}) {
  const values = [
    input.businessName,
    input.demoRepEmail,
    input.leadName,
  ].map((value) => value.trim().toLowerCase())

  if (values.some((value) => value.includes('kim goforth'))) {
    throw new Error('Demo launch runs cannot use the real waitlist lead.')
  }
}

export function buildDemoLaunchRunEnv(input: DemoLaunchRunInput = {}) {
  const demoRepEmail = cleanEmail(
    input.demoRepEmail ?? input.env?.DEMO_REP_EMAIL,
    DEFAULT_DEMO_LAUNCH_REP_EMAIL,
  )
  const leadName = clean(
    input.leadName ?? input.env?.DEMO_PRELAUNCH_LEAD_NAME,
    DEFAULT_DEMO_LAUNCH_LEAD_NAME,
  )
  const businessName = clean(
    input.businessName ?? input.env?.DEMO_PRELAUNCH_BUSINESS_NAME,
    DEFAULT_DEMO_LAUNCH_BUSINESS_NAME,
  )

  assertSafeDemoInput({ businessName, demoRepEmail, leadName })

  return {
    ...process.env,
    ...(input.env ?? {}),
    DEMO_PRELAUNCH_SEED_CONFIRMED: 'true',
    DEMO_REP_EMAIL: demoRepEmail,
    DEMO_PRELAUNCH_LEAD_EMAIL: demoRepEmail,
    DEMO_PRELAUNCH_LEAD_NAME: leadName,
    DEMO_PRELAUNCH_BUSINESS_NAME: businessName,
  } satisfies MutableEnv
}

export async function runDemoLaunchRun(
  input: DemoLaunchRunInput = {},
): Promise<DemoLaunchRunResult> {
  const env = buildDemoLaunchRunEnv(input)
  const dependencies = input.dependencies ?? {}
  const plan = buildDemoSeedPlan({ email: env.DEMO_REP_EMAIL ?? '' })

  await (dependencies.seedDemoRep ?? seedDemoRep)(plan)

  const result = await (dependencies.seedDemoLaunchFlow ?? seedDemoLaunchFlow)({
    env,
  })

  return {
    ...result,
    providerActions: {
      sendSms: false,
      sendEmail: false,
      sendSignWellLiveAgreement: false,
      chargeStripe: false,
      callPaidNicNac: false,
      attachReservedPhone: false,
    },
    links: {
      controlCenter: '/control-center/intake#reps',
      nicNac: `/nic-nac?c=${result.repId}`,
      homepage: '/amethyst/Homepage.html',
      tradeBoard: '/amethyst/Trade.html',
      joinPage: '/amethyst/Join.html',
    },
  }
}
