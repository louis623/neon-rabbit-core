import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import {
  buildPrelaunchSignWellAgreementPayload,
  buildPrelaunchSignWellMetadata,
  getPrelaunchSignWellConfig,
} from '@/lib/prelaunch/signwell'
import {
  buildDemoSeedPlan,
  DEFAULT_DEMO_PASSWORD,
  seedDemoRep,
  type DemoSeedPlan,
  type DemoSeedResult,
} from '@/scripts/seed-demo-rep'

export const DEMO_SMOKE_CATEGORIES = [
  'local_static',
  'local_app',
  'supabase_demo',
  'stripe_test',
  'stripe_local_routes',
  'signwell_sandbox',
  'nic_nac_paid',
] as const

export type DemoSmokeCategory = (typeof DEMO_SMOKE_CATEGORIES)[number]

export const DEFAULT_DEMO_SMOKE_CATEGORY: DemoSmokeCategory = 'local_static'
export const STRIPE_LIVE_SMOKE_CONFIRM_ENV = 'STRIPE_LIVE_SMOKE_CONFIRMED'
export const VERCEL_PROTECTION_BYPASS_ENV = 'VERCEL_PROTECTION_BYPASS'
export const NIC_NAC_PAID_SMOKE_ALLOW_FLAG = 'NIC_NAC_ALLOW_PAID_SMOKE'
export const NIC_NAC_PAID_SMOKE_MAX_REQUESTS_ENV =
  'NIC_NAC_PAID_SMOKE_MAX_REQUESTS'
export const DEFAULT_PAID_SMOKE_MAX_REQUESTS = 20

type SmokeRisk = 'none' | 'local_app' | 'db_write' | 'test_provider' | 'paid_provider'

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
  verifyDemoRepLogin?: (
    env: Record<string, string | undefined>,
    email: string,
  ) => Promise<DemoLoginVerification>
  verifyLocalApp?: (
    env: Record<string, string | undefined>,
    email: string,
  ) => Promise<LocalAppVerification>
  verifyStripeLocalRoutes?: (
    env: Record<string, string | undefined>,
    email: string,
  ) => Promise<StripeLocalRouteVerification>
}

interface DemoLoginVerification {
  repCount: number
  listingCount: number
  showCount: number
  audienceCount: number
}

interface LocalAppVerification {
  repEmail: string
  repDisplayName: string
  nicNacShellRendered: boolean
}

interface StripeLocalRouteVerification {
  checkoutSessionUrl: string
  portalSessionUrl: string
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
    case 'local_app':
      return {
        category,
        requiredEnv: [
          DEMO_EMAIL_ENV,
          'DEMO_REP_PASSWORD',
          'NEXT_PUBLIC_APP_URL',
          'NEXT_PUBLIC_SUPABASE_URL',
          'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        ],
        excludedLiveActions: BASE_EXCLUDED_LIVE_ACTIONS,
        actions: [
          {
            id: 'local_app_login_route',
            label:
              'Verify the running local app authenticates the demo rep and renders Nic-Nac.',
            risk: 'local_app',
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
          'NEXT_PUBLIC_SUPABASE_ANON_KEY',
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
    case 'stripe_local_routes':
      return {
        category,
        requiredEnv: [
          DEMO_EMAIL_ENV,
          'DEMO_REP_PASSWORD',
          'NEXT_PUBLIC_APP_URL',
          'NEXT_PUBLIC_SUPABASE_URL',
          'NEXT_PUBLIC_SUPABASE_ANON_KEY',
          'STRIPE_SECRET_KEY',
          'STRIPE_WEBHOOK_SECRET',
          'STRIPE_PRICE_MONTHLY',
        ],
        excludedLiveActions: BASE_EXCLUDED_LIVE_ACTIONS,
        actions: [
          {
            id: 'stripe_local_checkout_and_portal',
            label:
              'Create Stripe test-mode checkout and portal sessions through the running local app.',
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

  const providerReadinessError = buildProviderReadinessError(plan, env)
  if (providerReadinessError) {
    errors.push(providerReadinessError)
  }

  if (
    (plan.category === 'stripe_test' || plan.category === 'stripe_local_routes') &&
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

function buildProviderReadinessError(
  plan: DemoSmokePlan,
  env: Record<string, string | undefined>,
): string | null {
  if (plan.category === 'stripe_test') {
    const missing = missingEnvNames(env, [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'STRIPE_PRICE_MONTHLY',
      'NEXT_PUBLIC_APP_URL',
    ])

    if (missing.length === 0) return null

    return `Stripe readiness blocked: missing ${missing.join(', ')}; STRIPE_SECRET_KEY mode=${getStripeSecretKeyMode(env.STRIPE_SECRET_KEY)}.`
  }

  if (plan.category === 'stripe_local_routes') {
    const missing = missingEnvNames(env, [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'STRIPE_PRICE_MONTHLY',
      'NEXT_PUBLIC_APP_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ])

    if (missing.length === 0) return null

    return `Stripe local route smoke blocked: missing ${missing.join(', ')}; STRIPE_SECRET_KEY mode=${getStripeSecretKeyMode(env.STRIPE_SECRET_KEY)}.`
  }

  if (plan.category === 'signwell_sandbox') {
    const missing = missingEnvNames(env, [
      'SIGNWELL_API_KEY',
      'SIGNWELL_API_BASE_URL',
      'SIGNWELL_TEMPLATE_ID',
    ])

    if (missing.length === 0) return null

    return `SignWell readiness blocked: missing ${missing.join(', ')}.`
  }

  return null
}

function missingEnvNames(
  env: Record<string, string | undefined>,
  names: string[],
): string[] {
  return names.filter((name) => !env[name]?.trim())
}

function getStripeSecretKeyMode(secretKey: string | undefined): 'missing' | 'test' | 'live' | 'unknown' {
  if (!secretKey?.trim()) return 'missing'
  if (secretKey.startsWith('sk_test_')) return 'test'
  if (secretKey.startsWith('sk_live_')) return 'live'
  return 'unknown'
}

function getSignWellApiBaseUrlMode(
  apiBaseUrl: string | undefined,
): 'missing' | 'sandbox' | 'production' | 'local' | 'unknown' {
  if (!apiBaseUrl?.trim()) return 'missing'

  try {
    const hostname = new URL(apiBaseUrl).hostname.toLowerCase()
    if (hostname === 'localhost' || hostname === '127.0.0.1') return 'local'
    if (hostname.includes('sandbox') || hostname.includes('test')) return 'sandbox'
    if (hostname === 'www.signwell.com' || hostname === 'signwell.com') {
      return 'production'
    }
    return 'unknown'
  } catch {
    return 'unknown'
  }
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

  if (plan.category === 'local_app') {
    const verifyLocalApp = dependencies.verifyLocalApp ?? verifyLocalAppSmoke
    const appResult = await verifyLocalApp(env, demoEmail)

    return {
      category: plan.category,
      ok: appResult.nicNacShellRendered,
      results: [
        {
          id: 'local_app_login_route',
          ok: appResult.nicNacShellRendered,
          detail: `local app authenticated as ${appResult.repDisplayName} <${appResult.repEmail}>; Nic-Nac shell ${appResult.nicNacShellRendered ? 'rendered' : 'missing'}`,
        },
      ],
    }
  }

  if (plan.category === 'supabase_demo') {
    const runSeed = dependencies.seedDemoRep ?? seedDemoRep
    const verifyLogin = dependencies.verifyDemoRepLogin ?? verifyDemoRepLogin
    const seedResult = await runSeed(demoPlan)
    const loginResult = await verifyLogin(env, demoEmail)

    return {
      category: plan.category,
      ok: true,
      results: [
        {
          id: 'supabase_demo_seed_check',
          ok: true,
          detail: `seeded rep=${seedResult.repId} settings=1 designs=${seedResult.designIds.length} listings=${seedResult.listingIds.length} shows=${seedResult.showIds.length} audience=${seedResult.audienceIds.length}`,
        },
        {
          id: 'supabase_demo_login_check',
          ok: true,
          detail: `demo login can read reps=${loginResult.repCount} listings=${loginResult.listingCount} shows=${loginResult.showCount} audience=${loginResult.audienceCount}`,
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

  if (plan.category === 'stripe_local_routes') {
    const verifyStripeRoutes =
      dependencies.verifyStripeLocalRoutes ?? verifyStripeLocalRoutesSmoke
    const stripeResult = await verifyStripeRoutes(env, demoEmail)

    return {
      category: plan.category,
      ok: true,
      results: [
        {
          id: 'stripe_local_checkout_and_portal',
          ok: true,
          detail: `Stripe test checkout session ready=${String(Boolean(stripeResult.checkoutSessionUrl))}; portal session ready=${String(Boolean(stripeResult.portalSessionUrl))}`,
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
          detail: `built sandbox payload for ${demoEmail} with send_email=${String(payload.send_email)}; template_id=present; api_base_url_mode=${getSignWellApiBaseUrlMode(config.apiBaseUrl)}`,
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

async function verifyDemoRepLogin(
  env: Record<string, string | undefined>,
  email: string,
): Promise<DemoLoginVerification> {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase URL and anon key are required for demo login verification.')
  }

  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password: env.DEMO_REP_PASSWORD ?? DEFAULT_DEMO_PASSWORD,
  })
  if (signInError) {
    throw new Error(`Demo rep sign-in failed: ${signInError.message}`)
  }

  const countVisibleRows = async (table: string): Promise<number> => {
    const { count, error } = await client
      .from(table)
      .select('id', { count: 'exact', head: true })
    if (error) {
      throw new Error(`Failed to count ${table}: ${error.message}`)
    }
    return count ?? 0
  }

  const countedTables = await Promise.all([
    countVisibleRows('reps'),
    countVisibleRows('trade_listings'),
    countVisibleRows('calendar_events'),
    countVisibleRows('customer_audience'),
  ])

  return {
    repCount: countedTables[0],
    listingCount: countedTables[1],
    showCount: countedTables[2],
    audienceCount: countedTables[3],
  }
}

async function verifyLocalAppSmoke(
  env: Record<string, string | undefined>,
  email: string,
): Promise<LocalAppVerification> {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const appUrl = env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '')
  if (!supabaseUrl || !anonKey || !appUrl) {
    throw new Error('Supabase URL, anon key, and app URL are required.')
  }

  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password: env.DEMO_REP_PASSWORD ?? DEFAULT_DEMO_PASSWORD,
  })
  if (signInError) {
    throw new Error(`Demo local app sign-in failed: ${signInError.message}`)
  }

  const {
    data: { session },
  } = await client.auth.getSession()
  if (!session) {
    throw new Error('No demo session after local app sign-in.')
  }

  const supabaseRef = new URL(supabaseUrl).hostname.split('.')[0]
  const cookie = `sb-${supabaseRef}-auth-token=${encodeURIComponent(JSON.stringify(session))}`
  const meResponse = await fetch(
    withVercelProtectionBypass(`${appUrl}/api/nic-nac/me`, env),
    { headers: { cookie } },
  )
  if (!meResponse.ok) {
    throw await buildSmokeHttpError('/api/nic-nac/me', meResponse)
  }
  const me = (await meResponse.json()) as {
    rep?: { email?: string; display_name?: string }
  }

  const pageResponse = await fetch(withVercelProtectionBypass(`${appUrl}/nic-nac`, env), {
    headers: { cookie },
  })
  const pageText = await pageResponse.text()
  if (!pageResponse.ok) {
    throw await buildSmokeHttpError('/nic-nac', pageResponse)
  }

  return {
    repEmail: me.rep?.email ?? email,
    repDisplayName: me.rep?.display_name ?? 'unknown rep',
    nicNacShellRendered: pageText.includes('Nic-Nac'),
  }
}

async function verifyStripeLocalRoutesSmoke(
  env: Record<string, string | undefined>,
  email: string,
): Promise<StripeLocalRouteVerification> {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const appUrl = env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '')
  if (!supabaseUrl || !anonKey || !appUrl) {
    throw new Error('Supabase URL, anon key, and app URL are required.')
  }

  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password: env.DEMO_REP_PASSWORD ?? DEFAULT_DEMO_PASSWORD,
  })
  if (signInError) {
    throw new Error(`Demo Stripe route sign-in failed: ${signInError.message}`)
  }

  const {
    data: { session },
  } = await client.auth.getSession()
  if (!session) {
    throw new Error('No demo session after Stripe route sign-in.')
  }

  const supabaseRef = new URL(supabaseUrl).hostname.split('.')[0]
  const cookie = `sb-${supabaseRef}-auth-token=${encodeURIComponent(JSON.stringify(session))}`
  const checkoutResponse = await fetch(withVercelProtectionBypass(`${appUrl}/api/stripe/create-checkout`, env), {
    method: 'POST',
    headers: {
      cookie,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ planType: 'monthly' }),
  })
  const checkoutPayload =
    await readJsonResponse<StripeRouteSmokeResponse>(checkoutResponse)
  if (!checkoutResponse.ok || !checkoutPayload.url) {
    throw new Error(
      `/api/stripe/create-checkout returned ${checkoutResponse.status}: ${checkoutPayload.error ?? checkoutPayload.action ?? 'missing checkout URL'}`,
    )
  }

  const portalResponse = await fetch(withVercelProtectionBypass(`${appUrl}/api/stripe/create-portal-session`, env), {
    method: 'POST',
    headers: { cookie },
  })
  const portalPayload =
    await readJsonResponse<StripeRouteSmokeResponse>(portalResponse)
  if (!portalResponse.ok || !portalPayload.url) {
    throw new Error(
      `/api/stripe/create-portal-session returned ${portalResponse.status}: ${portalPayload.error ?? portalPayload.action ?? 'missing portal URL'}`,
    )
  }

  return {
    checkoutSessionUrl: checkoutPayload.url,
    portalSessionUrl: portalPayload.url,
  }
}

interface StripeRouteSmokeResponse {
  url?: string
  error?: string
  action?: string
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    const body = await response.text()
    if (isVercelDeploymentProtectionResponse(response, body)) {
      throw new Error(
        `Vercel deployment protection blocked ${response.url}; set ${VERCEL_PROTECTION_BYPASS_ENV} or complete Vercel SSO before deployed preview smoke.`,
      )
    }
    throw new Error(
      `Expected JSON from ${response.url}; received ${response.status} ${contentType || 'unknown content type'}: ${body.slice(0, 80)}`,
    )
  }
  return (await response.json()) as T
}

export async function buildSmokeHttpError(
  pathname: string,
  response: Response,
): Promise<Error> {
  const contentType = response.headers.get('content-type') ?? ''
  const body = await response.text()
  if (isVercelDeploymentProtectionResponse(response, body)) {
    return new Error(
      `Vercel deployment protection blocked ${pathname}; set ${VERCEL_PROTECTION_BYPASS_ENV} or complete Vercel SSO before deployed preview smoke.`,
    )
  }
  return new Error(
    `${pathname} returned ${response.status}${contentType ? ` (${contentType})` : ''}.`,
  )
}

export function withVercelProtectionBypass(
  rawUrl: string,
  env: Record<string, string | undefined>,
): string {
  const bypass = env[VERCEL_PROTECTION_BYPASS_ENV]?.trim()
  if (!bypass) return rawUrl

  const url = new URL(rawUrl)
  url.searchParams.set('x-vercel-set-bypass-cookie', 'true')
  url.searchParams.set('x-vercel-protection-bypass', bypass)
  return url.toString()
}

export function isVercelDeploymentProtectionResponse(
  response: Response,
  body: string,
): boolean {
  return (
    response.status === 401 &&
    response.headers.get('server')?.toLowerCase().includes('vercel') === true &&
    body.includes('Authentication Required') &&
    body.includes('Vercel Authentication')
  )
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
  config({ path: '.env.local', quiet: true })
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
