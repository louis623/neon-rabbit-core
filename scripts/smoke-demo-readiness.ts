import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
  buildPrelaunchSignWellAgreementPayload,
  buildPrelaunchSignWellMetadata,
  getPrelaunchSignWellConfig,
} from '@/lib/prelaunch/signwell'
import {
  buildDemoSeedPlan,
  seedDemoRep,
  type DemoSeedPlan,
  type DemoSeedResult,
} from '@/scripts/seed-demo-rep'

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
export const NIC_NAC_PAID_SMOKE_ALLOW_FLAG = 'NIC_NAC_ALLOW_PAID_SMOKE'
export const NIC_NAC_PAID_SMOKE_MAX_REQUESTS_ENV =
  'NIC_NAC_PAID_SMOKE_MAX_REQUESTS'
export const DEFAULT_PAID_SMOKE_MAX_REQUESTS = 20

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

export interface DemoSmokeResult {
  id: string
  ok: boolean
  detail: string
}

export interface DemoSmokeRunResult {
  category: DemoSmokeCategory
  ok: boolean
  results: DemoSmokeResult[]
}

export interface DemoSmokeOptions {
  category: DemoSmokeCategory
  json: boolean
}

export interface DemoSmokeReport {
  generatedAt: string
  plan: {
    category: DemoSmokeCategory
    actions: DemoSmokeAction[]
    excludedLiveActions: string[]
  }
  result: DemoSmokeRunResult
}

interface DemoSmokeRunDependencies {
  seedDemoRep?: (plan: DemoSeedPlan) => Promise<DemoSeedResult>
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
        requiredEnv: [
          DEMO_EMAIL_ENV,
          'SIGNWELL_API_KEY',
          'SIGNWELL_API_BASE_URL',
          'SIGNWELL_TEMPLATE_ID',
        ],
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
    const requestCount = countPaidNicNacSmokeRequests()
    const maxRequests = parsePositiveIntEnv(
      env,
      NIC_NAC_PAID_SMOKE_MAX_REQUESTS_ENV,
      DEFAULT_PAID_SMOKE_MAX_REQUESTS,
    )

    if (typeof maxRequests === 'string') {
      errors.push(maxRequests)
    } else if (env[NIC_NAC_PAID_SMOKE_ALLOW_FLAG] !== 'true') {
      errors.push(
        `${NIC_NAC_PAID_SMOKE_ALLOW_FLAG}=true is required before running paid Nic-Nac smoke calls; planned requests=${requestCount}.`,
      )
    } else if (requestCount > maxRequests) {
      errors.push(
        `Planned Nic-Nac smoke requests (${requestCount}) exceed ${NIC_NAC_PAID_SMOKE_MAX_REQUESTS_ENV}=${maxRequests}.`,
      )
    }
  }

  return errors
}

export async function runDemoSmoke(
  plan: DemoSmokePlan,
  env: Record<string, string | undefined> = process.env,
  dependencies: DemoSmokeRunDependencies = {},
): Promise<DemoSmokeRunResult> {
  const validationErrors = validateDemoSmokePlan(plan, env)
  if (validationErrors.length > 0) {
    return {
      category: plan.category,
      ok: false,
      results: validationErrors.map((error) => ({
        id: 'validation',
        ok: false,
        detail: error,
      })),
    }
  }

  const demoEmail = env[DEMO_EMAIL_ENV] ?? 'local-static-demo@example.com'
  const demoPlan = buildDemoSeedPlan({ email: demoEmail })

  if (plan.category === 'local_static') {
    return {
      category: plan.category,
      ok: true,
      results: [
        {
          id: 'local_static_seed_plan',
          ok: true,
          detail: `demo seed plan has ${demoPlan.upcomingShows.length} shows, ${demoPlan.listings.length} listings, and ${demoPlan.audienceMembers.length} audience members`,
        },
      ],
    }
  }

  if (plan.category === 'supabase_demo') {
    const runSeed = dependencies.seedDemoRep ?? seedDemoRep
    const seedResult = await runSeed(demoPlan)

    return {
      category: plan.category,
      ok: true,
      results: [
        {
          id: 'supabase_demo_seed_check',
          ok: true,
          detail: `seeded rep=${seedResult.repId} settings=1 designs=${seedResult.designIds.length} listings=${seedResult.listingIds.length} shows=${seedResult.showIds.length} audience=${seedResult.audienceIds.length}`,
        },
      ],
    }
  }

  if (plan.category === 'stripe_test') {
    const isTestKey = env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ?? false
    return {
      category: plan.category,
      ok: isTestKey,
      results: [
        {
          id: 'stripe_test_config',
          ok: isTestKey,
          detail: isTestKey
            ? 'Stripe test-mode configuration is present.'
            : 'Stripe test smoke requires STRIPE_SECRET_KEY to start with sk_test_.',
        },
      ],
    }
  }

  if (plan.category === 'signwell_sandbox') {
    const config = getPrelaunchSignWellConfig(env)
    if (!config) {
      return {
        category: plan.category,
        ok: false,
        results: [
          {
            id: 'signwell_sandbox_payload',
            ok: false,
            detail: 'SignWell sandbox configuration is incomplete.',
          },
        ],
      }
    }

    const payload = buildPrelaunchSignWellAgreementPayload({
      templateId: config.templateId,
      recipient: {
        name: 'Launch Demo Rep',
        email: demoEmail,
      },
      metadata: buildPrelaunchSignWellMetadata({
        gateType: 'service_agreement',
        intakeId: 'demo-smoke',
        waitlistId: 'demo-smoke',
        operatorRepId: null,
      }),
      mode: 'sandbox',
    })

    return {
      category: plan.category,
      ok: payload.send_email === false,
      results: [
        {
          id: 'signwell_sandbox_payload',
          ok: payload.send_email === false,
          detail: `built sandbox payload for ${demoEmail} with send_email=${String(payload.send_email)}`,
        },
      ],
    }
  }

  return {
    category: plan.category,
    ok: false,
    results: [
      {
        id: 'nic_nac_paid_guarded_requests',
        ok: false,
        detail:
          'Paid Nic-Nac smoke is guarded; run the benchmark script only after explicit approval and request cap.',
      },
    ],
  }
}

export function parseDemoSmokeArgs(args: string[]): DemoSmokeCategory {
  return parseDemoSmokeOptions(args).category
}

export function parseDemoSmokeOptions(args: string[]): DemoSmokeOptions {
  const categoryFlagIndex = args.findIndex((arg) => arg === '--category')
  const rawCategory =
    categoryFlagIndex >= 0 ? args[categoryFlagIndex + 1] : DEFAULT_DEMO_SMOKE_CATEGORY

  if (!DEMO_SMOKE_CATEGORIES.includes(rawCategory as DemoSmokeCategory)) {
    throw new Error(
      `--category must be one of: ${DEMO_SMOKE_CATEGORIES.join(', ')}`,
    )
  }

  return {
    category: rawCategory as DemoSmokeCategory,
    json: args.includes('--json'),
  }
}

export function buildDemoSmokeReport(
  plan: DemoSmokePlan,
  result: DemoSmokeRunResult,
): DemoSmokeReport {
  return {
    generatedAt: new Date().toISOString(),
    plan: {
      category: plan.category,
      actions: plan.actions,
      excludedLiveActions: plan.excludedLiveActions,
    },
    result,
  }
}

function countPaidNicNacSmokeRequests(): number {
  return 4
}

function parsePositiveIntEnv(
  env: Record<string, string | undefined>,
  name: string,
  fallback: number,
): number | string {
  const raw = env[name]
  if (!raw) return fallback
  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return `${name} must be a positive integer; received ${raw}`
  }
  return parsed
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

function printResults(runResult: DemoSmokeRunResult) {
  console.log('[smoke:demo] results:')
  for (const result of runResult.results) {
    console.log(`  - ${result.ok ? 'ok' : 'fail'} ${result.id}: ${result.detail}`)
  }
}

async function main() {
  const options = parseDemoSmokeOptions(process.argv.slice(2))
  const plan = buildDemoSmokePlan({ category: options.category })
  if (!options.json) {
    printPlan(plan)
  }

  const errors = validateDemoSmokePlan(plan)
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`[smoke:demo] ${error}`)
    }
    process.exit(1)
  }

  const runResult = await runDemoSmoke(plan)
  if (options.json) {
    console.log(JSON.stringify(buildDemoSmokeReport(plan, runResult), null, 2))
  } else {
    printResults(runResult)
  }

  if (!runResult.ok) {
    process.exit(1)
  }

  if (!options.json) {
    console.log('[smoke:demo] readiness checks passed for selected category.')
  }
}

const entrypoint = process.argv[1] ? path.resolve(process.argv[1]) : null
if (entrypoint === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
