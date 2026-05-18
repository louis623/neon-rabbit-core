import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
  assertPaidSmokeAllowed,
  type BenchmarkPlan,
  type Prompt,
} from '@/spike/run-benchmark'

export const DEMO_SMOKE_CATEGORIES = [
  'local_static',
  'supabase_demo',
  'stripe_test',
  'signwell_sandbox',
  'nic_nac_paid',
] as const

export type DemoSmokeCategory = (typeof DEMO_SMOKE_CATEGORIES)[number]

export const DEFAULT_DEMO_SMOKE_CATEGORY: DemoSmokeCategory = 'local_static'
export const STRIPE_LIVE_SMOKE_CONFIRM_ENV = 'STRIPE_LIVE_SMOKE_CONFIRMED'

type SmokeRisk = 'none' | 'db_write' | 'test_provider' | 'paid_provider'

export interface DemoSmokeAction {
  id: string
  label: string
  risk: SmokeRisk
  run: 'planned' | 'blocked'
}

export interface DemoSmokePlan {
  category: DemoSmokeCategory
  requiredEnv: string[]
  actions: DemoSmokeAction[]
  excludedLiveActions: string[]
}

interface BuildDemoSmokePlanOptions {
  category?: DemoSmokeCategory
}

const BASE_EXCLUDED_LIVE_ACTIONS = [
  'sms_live_send',
  'signwell_live_send',
  'stripe_live_charge',
  'telnyx_number_attachment:+19044383050',
]

const DEMO_EMAIL_ENV = 'DEMO_REP_EMAIL'

export function buildDemoSmokePlan(
  options: BuildDemoSmokePlanOptions = {},
): DemoSmokePlan {
  const category = options.category ?? DEFAULT_DEMO_SMOKE_CATEGORY

  switch (category) {
    case 'local_static':
      return {
        category,
        requiredEnv: [],
        excludedLiveActions: BASE_EXCLUDED_LIVE_ACTIONS,
        actions: [
          {
            id: 'local_static_plan',
            label: 'Validate launch smoke categories and provider guards.',
            risk: 'none',
            run: 'planned',
          },
        ],
      }
    case 'supabase_demo':
      return {
        category,
        requiredEnv: [
          DEMO_EMAIL_ENV,
          'NEXT_PUBLIC_SUPABASE_URL',
          'SUPABASE_SERVICE_ROLE_KEY',
        ],
        excludedLiveActions: BASE_EXCLUDED_LIVE_ACTIONS,
        actions: [
          {
            id: 'supabase_demo_seed_check',
            label: 'Check the configured demo rep seed can run idempotently.',
            risk: 'db_write',
            run: 'planned',
          },
        ],
      }
    case 'stripe_test':
      return {
        category,
        requiredEnv: [
          DEMO_EMAIL_ENV,
          'STRIPE_SECRET_KEY',
          'STRIPE_WEBHOOK_SECRET',
          'STRIPE_PRICE_MONTHLY',
          'NEXT_PUBLIC_APP_URL',
        ],
        excludedLiveActions: BASE_EXCLUDED_LIVE_ACTIONS,
        actions: [
          {
            id: 'stripe_test_checkout_portal',
            label: 'Verify Stripe checkout and portal readiness in test mode.',
            risk: 'test_provider',
            run: 'planned',
          },
        ],
      }
    case 'signwell_sandbox':
      return {
        category,
        requiredEnv: [DEMO_EMAIL_ENV, 'SIGNWELL_API_KEY', 'SIGNWELL_API_BASE_URL'],
        excludedLiveActions: BASE_EXCLUDED_LIVE_ACTIONS,
        actions: [
          {
            id: 'signwell_sandbox_payload',
            label: 'Build SignWell sandbox/dry-run agreement payload for the demo rep.',
            risk: 'test_provider',
            run: 'planned',
          },
        ],
      }
    case 'nic_nac_paid':
      return {
        category,
        requiredEnv: [DEMO_EMAIL_ENV],
        excludedLiveActions: BASE_EXCLUDED_LIVE_ACTIONS,
        actions: [
          {
            id: 'nic_nac_paid_guarded_requests',
            label: 'Run a capped paid Nic-Nac smoke sample only after explicit approval.',
            risk: 'paid_provider',
            run: 'blocked',
          },
        ],
      }
  }
}

export function validateDemoSmokePlan(
  plan: DemoSmokePlan,
  env: Record<string, string | undefined> = process.env,
): string[] {
  const errors: string[] = []

  for (const name of plan.requiredEnv) {
    if (!env[name]) {
      errors.push(`${name} is required for ${plan.category} smoke.`)
    }
  }

  if (
    plan.category === 'stripe_test' &&
    env.STRIPE_SECRET_KEY?.startsWith('sk_live_') &&
    env[STRIPE_LIVE_SMOKE_CONFIRM_ENV] !== 'true'
  ) {
    errors.push(
      `${STRIPE_LIVE_SMOKE_CONFIRM_ENV}=true is required when STRIPE_SECRET_KEY is live.`,
    )
  }

  if (plan.category === 'nic_nac_paid') {
    try {
      assertPaidSmokeAllowed(buildPaidNicNacSmokePlan(), env)
    } catch (error) {
      errors.push((error as Error).message)
    }
  }

  return errors
}

export function parseDemoSmokeArgs(args: string[]): DemoSmokeCategory {
  const categoryFlagIndex = args.findIndex((arg) => arg === '--category')
  const rawCategory =
    categoryFlagIndex >= 0 ? args[categoryFlagIndex + 1] : DEFAULT_DEMO_SMOKE_CATEGORY

  if (!DEMO_SMOKE_CATEGORIES.includes(rawCategory as DemoSmokeCategory)) {
    throw new Error(
      `--category must be one of: ${DEMO_SMOKE_CATEGORIES.join(', ')}`,
    )
  }

  return rawCategory as DemoSmokeCategory
}

function buildPaidNicNacSmokePlan(): BenchmarkPlan {
  const prompt: Prompt = {
    kind: 'conversational',
    text: 'Demo readiness smoke: summarize my upcoming show plan.',
  }

  return {
    cold: [prompt, prompt],
    warmConversations: [[prompt, prompt]],
  }
}

function printPlan(plan: DemoSmokePlan) {
  console.log(`[smoke:demo] category=${plan.category}`)
  console.log('[smoke:demo] excluded live actions:')
  for (const action of plan.excludedLiveActions) {
    console.log(`  - ${action}`)
  }
  console.log('[smoke:demo] planned actions:')
  for (const action of plan.actions) {
    console.log(`  - ${action.id} (${action.risk}, ${action.run}): ${action.label}`)
  }
}

async function main() {
  const category = parseDemoSmokeArgs(process.argv.slice(2))
  const plan = buildDemoSmokePlan({ category })
  printPlan(plan)

  const errors = validateDemoSmokePlan(plan)
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`[smoke:demo] ${error}`)
    }
    process.exit(1)
  }

  console.log('[smoke:demo] readiness checks passed for selected category.')
}

const entrypoint = process.argv[1] ? path.resolve(process.argv[1]) : null
if (entrypoint === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
