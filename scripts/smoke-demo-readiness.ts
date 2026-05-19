import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import {
  buildPrelaunchSignWellAgreementPayload,
  buildPrelaunchSignWellMetadata,
  getPrelaunchSignWellConfig,
  getPrelaunchSignWellLiveSendMode,
  submitPrelaunchSignWellSandboxAgreement,
} from '@/lib/prelaunch/signwell'
import {
  buildDemoSeedPlan,
  DEFAULT_DEMO_PASSWORD,
  seedDemoRep,
  type DemoSeedPlan,
  type DemoSeedResult,
} from '@/scripts/seed-demo-rep'
import { runProtectedPreviewRouteSmoke } from '@/scripts/smoke-protected-preview-routes'

export const DEMO_SMOKE_CATEGORIES = [
  'local_static',
  'local_app',
  'supabase_demo',
  'stripe_test',
  'stripe_local_routes',
  'stripe_live_preflight',
  'protected_preview_routes',
  'signwell_sandbox',
  'signwell_provider_sandbox',
  'signwell_live_preflight',
  'nic_nac_paid_preflight',
  'nic_nac_paid',
] as const

export type DemoSmokeCategory = (typeof DEMO_SMOKE_CATEGORIES)[number]

export const SAFE_LAUNCH_SMOKE_CATEGORIES = [
  'local_static',
  'supabase_demo',
  'local_app',
  'stripe_test',
  'stripe_local_routes',
  'signwell_sandbox',
] as const satisfies readonly DemoSmokeCategory[]

export type LaunchSmokeTarget = 'local' | 'preview'

export const DEFAULT_DEMO_SMOKE_CATEGORY: DemoSmokeCategory = 'local_static'
export const STRIPE_LIVE_SMOKE_CONFIRM_ENV = 'STRIPE_LIVE_SMOKE_CONFIRMED'
export const STRIPE_LIVE_APPROVED_BUILD_FEE_PRICE_ID_ENV =
  'STRIPE_LIVE_APPROVED_BUILD_FEE_PRICE_ID'
export const STRIPE_LIVE_APPROVED_FOUNDER_MONTHLY_PRICE_ID_ENV =
  'STRIPE_LIVE_APPROVED_FOUNDER_MONTHLY_PRICE_ID'
export const STRIPE_LIVE_APPROVED_STANDARD_MONTHLY_PRICE_ID_ENV =
  'STRIPE_LIVE_APPROVED_STANDARD_MONTHLY_PRICE_ID'
export const STRIPE_LIVE_APPROVED_PRICE_ID_ENV =
  STRIPE_LIVE_APPROVED_STANDARD_MONTHLY_PRICE_ID_ENV
export const STRIPE_LIVE_APPROVED_SMOKE_PATH_ENV =
  'STRIPE_LIVE_APPROVED_SMOKE_PATH'
export const STRIPE_LIVE_APPROVED_AT_ENV = 'STRIPE_LIVE_APPROVED_AT'
export const VERCEL_PROTECTION_BYPASS_ENV = 'VERCEL_PROTECTION_BYPASS'
export const NIC_NAC_PAID_SMOKE_ALLOW_FLAG = 'NIC_NAC_ALLOW_PAID_SMOKE'
export const NIC_NAC_PAID_SMOKE_MAX_REQUESTS_ENV =
  'NIC_NAC_PAID_SMOKE_MAX_REQUESTS'
export const NIC_NAC_PAID_SMOKE_SCOPE_ENV = 'NIC_NAC_PAID_SMOKE_SCOPE'
export const NIC_NAC_PAID_SMOKE_APPROVED_REQUESTS_ENV =
  'NIC_NAC_PAID_SMOKE_APPROVED_REQUESTS'
export const NIC_NAC_PAID_SMOKE_APPROVED_AT_ENV =
  'NIC_NAC_PAID_SMOKE_APPROVED_AT'
export const DEFAULT_PAID_SMOKE_MAX_REQUESTS = 20
export const SIGNWELL_LIVE_APPROVED_RECIPIENT_EMAIL_ENV =
  'SIGNWELL_LIVE_APPROVED_RECIPIENT_EMAIL'
export const SIGNWELL_LIVE_APPROVED_TEMPLATE_NAME_ENV =
  'SIGNWELL_LIVE_APPROVED_TEMPLATE_NAME'
export const SIGNWELL_LIVE_APPROVED_SEND_WINDOW_ENV =
  'SIGNWELL_LIVE_APPROVED_SEND_WINDOW'
export const SIGNWELL_SANDBOX_PROVIDER_CALL_ENV =
  'SIGNWELL_SANDBOX_PROVIDER_CALL'

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

export interface LaunchSmokeOptions {
  target: LaunchSmokeTarget
  categories: DemoSmokeCategory[]
  json: boolean
  writeReport: boolean
}

export interface LaunchSmokeCategoryReport {
  category: DemoSmokeCategory
  ok: boolean
  results: DemoSmokeResult[]
}

export interface LaunchSmokeReport {
  generatedAt: string
  target: LaunchSmokeTarget
  ok: boolean
  categories: LaunchSmokeCategoryReport[]
}

export interface DemoSmokeRunDependencies {
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
  runProtectedPreviewRouteSmoke?: (
    env: Record<string, string | undefined>,
  ) => Promise<ProtectedPreviewRouteSmokeResult>
}

interface LaunchSmokeRunDependencies extends DemoSmokeRunDependencies {
  runCategory?: (
    plan: DemoSmokePlan,
    env: Record<string, string | undefined>,
    dependencies: DemoSmokeRunDependencies,
  ) => Promise<DemoSmokeRunResult>
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

interface ProtectedPreviewRouteSmokeResult {
  ok: boolean
  target: string
  rep: string
  shell: boolean
  checkout: boolean
  portal: boolean
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
const STRIPE_SPARKLE_SUITE_PRICE_ENVS = [
  'STRIPE_PRICE_BUILD_FEE',
  'STRIPE_PRICE_FOUNDER_MONTHLY',
  'STRIPE_PRICE_STANDARD_MONTHLY',
] as const
const STRIPE_LIVE_APPROVED_PRICE_ENVS = [
  STRIPE_LIVE_APPROVED_BUILD_FEE_PRICE_ID_ENV,
  STRIPE_LIVE_APPROVED_FOUNDER_MONTHLY_PRICE_ID_ENV,
  STRIPE_LIVE_APPROVED_STANDARD_MONTHLY_PRICE_ID_ENV,
] as const

export function buildDemoCredentialFailureMessage(
  context: string,
  providerMessage: string,
  env: Record<string, string | undefined>,
): string {
  const email = env[DEMO_EMAIL_ENV]?.trim()
  const emailHint = email ? ` for ${email}` : ''
  const safeProviderMessage = redactEnvSecrets(providerMessage, env)

  return `${context}: ${safeProviderMessage}. To restore demo auth${emailHint}, set ${DEMO_EMAIL_ENV} and a fresh DEMO_REP_PASSWORD only in the local shell, then run npx tsx scripts/seed-demo-rep.ts. Existing demo auth users are rotated only when DEMO_REP_PASSWORD is explicitly set; do not put the password in docs, commits, screenshots, or chat.`
}

export function formatSmokeCliError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return `[smoke:demo] ${message}`
}

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
          ...STRIPE_SPARKLE_SUITE_PRICE_ENVS,
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
          ...STRIPE_SPARKLE_SUITE_PRICE_ENVS,
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
    case 'stripe_live_preflight':
      return {
        category,
        requiredEnv: [
          DEMO_EMAIL_ENV,
          'STRIPE_SECRET_KEY',
          'STRIPE_WEBHOOK_SECRET',
          ...STRIPE_SPARKLE_SUITE_PRICE_ENVS,
          'NEXT_PUBLIC_APP_URL',
          ...STRIPE_LIVE_APPROVED_PRICE_ENVS,
          STRIPE_LIVE_APPROVED_SMOKE_PATH_ENV,
          STRIPE_LIVE_APPROVED_AT_ENV,
        ],
        excludedLiveActions: BASE_EXCLUDED_LIVE_ACTIONS,
        actions: [
          {
            id: 'stripe_live_preflight',
            label:
              'Validate live Stripe subscription config and approval gates without creating checkout or charging a card.',
            risk: 'test_provider',
            run: 'planned',
          },
        ],
      }
    case 'protected_preview_routes':
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
            id: 'protected_preview_routes',
            label:
              'Verify protected preview demo auth, Nic-Nac shell, and Stripe test checkout/portal routes through authenticated Vercel curl.',
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
    case 'signwell_provider_sandbox':
      return {
        category,
        requiredEnv: [
          DEMO_EMAIL_ENV,
          'SIGNWELL_API_KEY',
          'SIGNWELL_API_BASE_URL',
          'SIGNWELL_TEMPLATE_ID',
          SIGNWELL_SANDBOX_PROVIDER_CALL_ENV,
        ],
        excludedLiveActions: BASE_EXCLUDED_LIVE_ACTIONS,
        actions: [
          {
            id: 'signwell_provider_sandbox',
            label:
              'Create one SignWell test-mode document from the configured template with send_email=false.',
            risk: 'test_provider',
            run: 'planned',
          },
        ],
      }
    case 'signwell_live_preflight':
      return {
        category,
        requiredEnv: [
          DEMO_EMAIL_ENV,
          'SIGNWELL_API_KEY',
          'SIGNWELL_API_BASE_URL',
          'SIGNWELL_TEMPLATE_ID',
          SIGNWELL_LIVE_APPROVED_RECIPIENT_EMAIL_ENV,
          SIGNWELL_LIVE_APPROVED_TEMPLATE_NAME_ENV,
          SIGNWELL_LIVE_APPROVED_SEND_WINDOW_ENV,
        ],
        excludedLiveActions: BASE_EXCLUDED_LIVE_ACTIONS,
        actions: [
          {
            id: 'signwell_live_preflight',
            label:
              'Build a live-like non-sending SignWell payload after recipient, template, and send window are approved.',
            risk: 'test_provider',
            run: 'planned',
          },
        ],
      }
    case 'nic_nac_paid_preflight':
      return {
        category,
        requiredEnv: [
          DEMO_EMAIL_ENV,
          NIC_NAC_PAID_SMOKE_SCOPE_ENV,
          NIC_NAC_PAID_SMOKE_APPROVED_REQUESTS_ENV,
          NIC_NAC_PAID_SMOKE_MAX_REQUESTS_ENV,
          NIC_NAC_PAID_SMOKE_APPROVED_AT_ENV,
        ],
        excludedLiveActions: BASE_EXCLUDED_LIVE_ACTIONS,
        actions: [
          {
            id: 'nic_nac_paid_preflight',
            label:
              'Validate paid Nic-Nac smoke scope and request cap without calling paid providers.',
            risk: 'paid_provider',
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
      ...STRIPE_SPARKLE_SUITE_PRICE_ENVS,
      'NEXT_PUBLIC_APP_URL',
    ])

    if (missing.length === 0) return null

    return `Stripe readiness blocked: missing ${missing.join(', ')}; STRIPE_SECRET_KEY mode=${getStripeSecretKeyMode(env.STRIPE_SECRET_KEY)}.`
  }

  if (plan.category === 'stripe_local_routes') {
    const missing = missingEnvNames(env, [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      ...STRIPE_SPARKLE_SUITE_PRICE_ENVS,
      'NEXT_PUBLIC_APP_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ])

    if (missing.length === 0) return null

    return `Stripe local route smoke blocked: missing ${missing.join(', ')}; STRIPE_SECRET_KEY mode=${getStripeSecretKeyMode(env.STRIPE_SECRET_KEY)}.`
  }

  if (plan.category === 'stripe_live_preflight') {
    const missing = missingEnvNames(env, [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      ...STRIPE_SPARKLE_SUITE_PRICE_ENVS,
      'NEXT_PUBLIC_APP_URL',
      ...STRIPE_LIVE_APPROVED_PRICE_ENVS,
      STRIPE_LIVE_APPROVED_SMOKE_PATH_ENV,
      STRIPE_LIVE_APPROVED_AT_ENV,
    ])
    const errors: string[] = []
    const keyMode = getStripeSecretKeyMode(env.STRIPE_SECRET_KEY)

    if (missing.length > 0) {
      errors.push(
        `Stripe live preflight blocked: missing ${missing.join(', ')}; STRIPE_SECRET_KEY mode=${keyMode}.`,
      )
    }

    if (keyMode !== 'live') {
      errors.push(
        `Stripe live preflight requires STRIPE_SECRET_KEY mode=live; current mode=${keyMode}.`,
      )
    }

    if (
      !stripeLiveApprovedPricesMatch(env)
    ) {
      errors.push(
        'Stripe live price ids must match their approved live price ids for stripe_live_preflight.',
      )
    }

    if (env[STRIPE_LIVE_SMOKE_CONFIRM_ENV]?.trim() === 'true') {
      errors.push(
        'STRIPE_LIVE_SMOKE_CONFIRMED must stay unset during stripe_live_preflight; final live checkout approval is a separate step.',
      )
    }

    return errors.length > 0 ? errors.join(' ') : null
  }

  if (
    plan.category === 'signwell_sandbox' ||
    plan.category === 'signwell_provider_sandbox'
  ) {
    const missing = missingEnvNames(env, [
      'SIGNWELL_API_KEY',
      'SIGNWELL_API_BASE_URL',
      'SIGNWELL_TEMPLATE_ID',
      ...(plan.category === 'signwell_provider_sandbox'
        ? [SIGNWELL_SANDBOX_PROVIDER_CALL_ENV]
        : []),
    ])
    const errors: string[] = []

    if (missing.length > 0) {
      errors.push(`SignWell readiness blocked: missing ${missing.join(', ')}.`)
    }

    if (
      plan.category === 'signwell_provider_sandbox' &&
      env[SIGNWELL_SANDBOX_PROVIDER_CALL_ENV]?.trim() !== 'true'
    ) {
      errors.push(
        `${SIGNWELL_SANDBOX_PROVIDER_CALL_ENV}=true is required for signwell_provider_sandbox smoke.`,
      )
    }

    if (
      plan.category === 'signwell_provider_sandbox' &&
      env.SIGNWELL_ALLOW_LIVE_SEND?.trim() === 'true'
    ) {
      errors.push(
        'SIGNWELL_ALLOW_LIVE_SEND must stay unset during signwell_provider_sandbox smoke.',
      )
    }

    return errors.length > 0 ? errors.join(' ') : null
  }

  if (plan.category === 'signwell_live_preflight') {
    const missing = missingEnvNames(env, [
      'SIGNWELL_API_KEY',
      'SIGNWELL_API_BASE_URL',
      'SIGNWELL_TEMPLATE_ID',
      SIGNWELL_LIVE_APPROVED_RECIPIENT_EMAIL_ENV,
      SIGNWELL_LIVE_APPROVED_TEMPLATE_NAME_ENV,
      SIGNWELL_LIVE_APPROVED_SEND_WINDOW_ENV,
    ])
    const errors: string[] = []

    if (missing.length > 0) {
      errors.push(`SignWell live preflight blocked: missing ${missing.join(', ')}.`)
    }

    if (env.SIGNWELL_ALLOW_LIVE_SEND?.trim() === 'true') {
      errors.push(
        'SIGNWELL_ALLOW_LIVE_SEND must stay unset during signwell_live_preflight; final live send approval is a separate step.',
      )
    }

    return errors.length > 0 ? errors.join(' ') : null
  }

  if (plan.category === 'nic_nac_paid_preflight') {
    const missing = missingEnvNames(env, [
      NIC_NAC_PAID_SMOKE_SCOPE_ENV,
      NIC_NAC_PAID_SMOKE_APPROVED_REQUESTS_ENV,
      NIC_NAC_PAID_SMOKE_MAX_REQUESTS_ENV,
      NIC_NAC_PAID_SMOKE_APPROVED_AT_ENV,
    ])
    const errors: string[] = []
    const approvedRequests = parsePositiveIntEnv(
      env,
      NIC_NAC_PAID_SMOKE_APPROVED_REQUESTS_ENV,
      0,
    )
    const maxRequests = parsePositiveIntEnv(
      env,
      NIC_NAC_PAID_SMOKE_MAX_REQUESTS_ENV,
      0,
    )

    if (missing.length > 0) {
      errors.push(`Nic-Nac paid preflight blocked: missing ${missing.join(', ')}.`)
    }

    if (typeof approvedRequests === 'string') {
      errors.push(approvedRequests)
    }

    if (typeof maxRequests === 'string') {
      errors.push(maxRequests)
    }

    if (
      typeof approvedRequests === 'number' &&
      typeof maxRequests === 'number' &&
      approvedRequests > maxRequests
    ) {
      errors.push(
        `Approved Nic-Nac paid smoke requests (${approvedRequests}) exceed ${NIC_NAC_PAID_SMOKE_MAX_REQUESTS_ENV}=${maxRequests}.`,
      )
    }

    if (env[NIC_NAC_PAID_SMOKE_ALLOW_FLAG]?.trim() === 'true') {
      errors.push(
        'NIC_NAC_ALLOW_PAID_SMOKE must stay unset during nic_nac_paid_preflight; final paid provider run approval is a separate step.',
      )
    }

    return errors.length > 0 ? errors.join(' ') : null
  }

  return null
}

function missingEnvNames(
  env: Record<string, string | undefined>,
  names: string[],
): string[] {
  return names.filter((name) => !env[name]?.trim())
}

function stripeLiveApprovedPricesMatch(
  env: Record<string, string | undefined>,
): boolean {
  const pairs = [
    ['STRIPE_PRICE_BUILD_FEE', STRIPE_LIVE_APPROVED_BUILD_FEE_PRICE_ID_ENV],
    [
      'STRIPE_PRICE_FOUNDER_MONTHLY',
      STRIPE_LIVE_APPROVED_FOUNDER_MONTHLY_PRICE_ID_ENV,
    ],
    [
      'STRIPE_PRICE_STANDARD_MONTHLY',
      STRIPE_LIVE_APPROVED_STANDARD_MONTHLY_PRICE_ID_ENV,
    ],
  ] as const

  return pairs.every(([actualName, approvedName]) => {
    const actual = env[actualName]?.trim()
    const approved = env[approvedName]?.trim()
    return !actual || !approved || actual === approved
  })
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

  if (plan.category === 'stripe_live_preflight') {
    const appUrlHost = new URL(env.NEXT_PUBLIC_APP_URL ?? '').hostname
    const keyMode = getStripeSecretKeyMode(env.STRIPE_SECRET_KEY)
    const ok =
      keyMode === 'live' &&
      Boolean(env.STRIPE_WEBHOOK_SECRET) &&
      STRIPE_SPARKLE_SUITE_PRICE_ENVS.every((name) => Boolean(env[name])) &&
      stripeLiveApprovedPricesMatch(env) &&
      env[STRIPE_LIVE_SMOKE_CONFIRM_ENV]?.trim() !== 'true'

    return {
      category: plan.category,
      ok,
      results: [
        {
          id: 'stripe_live_preflight',
          ok,
          detail: `Stripe live preflight ready; key_mode=${keyMode}; price_ids=${ok ? 'approved_match' : 'not_ready'}; app_url_host=${appUrlHost}; webhook_secret=${env.STRIPE_WEBHOOK_SECRET ? 'present' : 'missing'}; live_smoke_confirmed=${String(env[STRIPE_LIVE_SMOKE_CONFIRM_ENV]?.trim() === 'true')}; checkout_created=false`,
        },
      ],
    }
  }

  if (plan.category === 'protected_preview_routes') {
    const runProtectedPreview =
      dependencies.runProtectedPreviewRouteSmoke ?? runProtectedPreviewRouteSmoke
    const previewResult = await runProtectedPreview(env)

    return {
      category: plan.category,
      ok: previewResult.ok,
      results: [
        {
          id: 'protected_preview_routes',
          ok: previewResult.ok,
          detail: `protected preview target=${previewResult.target} rep=${previewResult.rep} shell=${String(previewResult.shell)} checkout=${String(previewResult.checkout)} portal=${String(previewResult.portal)}`,
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
      recipientPlaceholderName: config.recipientPlaceholderName,
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

  if (plan.category === 'signwell_provider_sandbox') {
    const config = getPrelaunchSignWellConfig(env)
    if (!config) {
      return {
        category: plan.category,
        ok: false,
        results: [
          {
            id: 'signwell_provider_sandbox',
            ok: false,
            detail: 'SignWell sandbox provider configuration is incomplete.',
          },
        ],
      }
    }

    const payload = buildPrelaunchSignWellAgreementPayload({
      templateId: config.templateId,
      recipientPlaceholderName: config.recipientPlaceholderName,
      recipient: {
        name: 'Launch Demo Rep',
        email: demoEmail,
      },
      metadata: buildPrelaunchSignWellMetadata({
        gateType: 'service_agreement',
        intakeId: 'demo-provider-smoke',
        waitlistId: 'demo-provider-smoke',
        operatorRepId: null,
      }),
      mode: 'sandbox',
    })
    const providerResult = await submitPrelaunchSignWellSandboxAgreement({
      config,
      agreementPayload: payload,
    })
    const ok =
      providerResult.testMode === true &&
      providerResult.sendEmail === false &&
      providerResult.providerStatus >= 200 &&
      providerResult.providerStatus < 300

    return {
      category: plan.category,
      ok,
      results: [
        {
          id: 'signwell_provider_sandbox',
          ok,
          detail: `SignWell sandbox provider call created test document=${providerResult.documentId ? 'present' : 'missing'}; provider_status=${providerResult.providerStatus}; recipient_count=${providerResult.recipientCount}; send_email=${String(providerResult.sendEmail)}; test_mode=${String(providerResult.testMode)}; api_base_url_mode=${getSignWellApiBaseUrlMode(config.apiBaseUrl)}`,
        },
      ],
    }
  }

  if (plan.category === 'signwell_live_preflight') {
    const config = getPrelaunchSignWellConfig(env)
    if (!config) {
      return {
        category: plan.category,
        ok: false,
        results: [
          {
            id: 'signwell_live_preflight',
            ok: false,
            detail: 'SignWell live preflight configuration is incomplete.',
          },
        ],
      }
    }

    const approvedRecipientEmail =
      env[SIGNWELL_LIVE_APPROVED_RECIPIENT_EMAIL_ENV]?.trim() ?? demoEmail
    const liveSendMode = getPrelaunchSignWellLiveSendMode(env)
    const payload = buildPrelaunchSignWellAgreementPayload({
      templateId: config.templateId,
      recipientPlaceholderName: config.recipientPlaceholderName,
      recipient: {
        name: approvedRecipientEmail,
        email: approvedRecipientEmail,
      },
      metadata: buildPrelaunchSignWellMetadata({
        gateType: 'service_agreement',
        intakeId: 'live-preflight',
        waitlistId: 'live-preflight',
        operatorRepId: null,
      }),
      mode: 'dry_run',
    })

    const ok = payload.send_email === false && payload.test_mode === false

    return {
      category: plan.category,
      ok,
      results: [
        {
          id: 'signwell_live_preflight',
          ok,
          detail: `SignWell live preflight ready for approved recipient ${approvedRecipientEmail}; send_email=${String(payload.send_email)}; test_mode=${String(payload.test_mode)}; api_base_url_mode=${getSignWellApiBaseUrlMode(config.apiBaseUrl)}; live_send_allow_flag=${String(liveSendMode.allowLiveSend)}`,
        },
      ],
    }
  }

  if (plan.category === 'nic_nac_paid_preflight') {
    const approvedRequests = parsePositiveIntEnv(
      env,
      NIC_NAC_PAID_SMOKE_APPROVED_REQUESTS_ENV,
      0,
    )
    const maxRequests = parsePositiveIntEnv(
      env,
      NIC_NAC_PAID_SMOKE_MAX_REQUESTS_ENV,
      0,
    )
    const ok =
      typeof approvedRequests === 'number' &&
      typeof maxRequests === 'number' &&
      approvedRequests > 0 &&
      approvedRequests <= maxRequests &&
      env[NIC_NAC_PAID_SMOKE_ALLOW_FLAG]?.trim() !== 'true'

    return {
      category: plan.category,
      ok,
      results: [
        {
          id: 'nic_nac_paid_preflight',
          ok,
          detail: `Nic-Nac paid preflight ready; approved_requests=${String(approvedRequests)}; max_requests=${String(maxRequests)}; allow_flag=${String(env[NIC_NAC_PAID_SMOKE_ALLOW_FLAG]?.trim() === 'true')}; paid_calls_executed=false`,
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
    throw new Error(
      buildDemoCredentialFailureMessage(
        'Demo rep sign-in failed',
        signInError.message,
        env,
      ),
    )
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
    throw new Error(
      buildDemoCredentialFailureMessage(
        'Demo local app sign-in failed',
        signInError.message,
        env,
      ),
    )
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
    throw new Error(
      buildDemoCredentialFailureMessage(
        'Demo Stripe route sign-in failed',
        signInError.message,
        env,
      ),
    )
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

export function parseLaunchSmokeOptions(args: string[]): LaunchSmokeOptions {
  const targetFlagIndex = args.findIndex((arg) => arg === '--target')
  const rawTarget =
    targetFlagIndex >= 0 ? args[targetFlagIndex + 1] : 'local'
  if (rawTarget !== 'local' && rawTarget !== 'preview') {
    throw new Error('--target must be one of: local, preview')
  }

  const categoriesFlagIndex = args.findIndex((arg) => arg === '--categories')
  const categories =
    categoriesFlagIndex >= 0
      ? args[categoriesFlagIndex + 1]
          ?.split(',')
          .map((category) => category.trim())
          .filter(Boolean) ?? []
      : [...SAFE_LAUNCH_SMOKE_CATEGORIES]

  if (categories.length === 0) {
    throw new Error('--categories must include at least one smoke category')
  }

  for (const category of categories) {
    if (!DEMO_SMOKE_CATEGORIES.includes(category as DemoSmokeCategory)) {
      throw new Error(
        `--categories must only include: ${DEMO_SMOKE_CATEGORIES.join(', ')}`,
      )
    }
    if (category === 'nic_nac_paid') {
      throw new Error('launch smoke cannot include nic_nac_paid')
    }
  }

  return {
    target: rawTarget,
    categories: categories as DemoSmokeCategory[],
    json: args.includes('--json'),
    writeReport: args.includes('--write-report'),
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

export function buildLaunchSmokeReport(input: {
  target: LaunchSmokeTarget
  categories: LaunchSmokeCategoryReport[]
}): LaunchSmokeReport {
  return {
    generatedAt: new Date().toISOString(),
    target: input.target,
    ok: input.categories.every((category) => category.ok),
    categories: input.categories,
  }
}

export async function runLaunchSmoke(
  options: LaunchSmokeOptions,
  env: Record<string, string | undefined> = process.env,
  dependencies: LaunchSmokeRunDependencies = {},
): Promise<LaunchSmokeReport> {
  const categoryReports: LaunchSmokeCategoryReport[] = []
  const runCategory = dependencies.runCategory ?? runDemoSmoke

  for (const category of options.categories) {
    const plan = buildDemoSmokePlan({ category })

    try {
      const result = await runCategory(plan, env, dependencies)
      categoryReports.push({
        category,
        ok: result.ok,
        results: result.results.map((smokeResult) => ({
          ...smokeResult,
          detail: redactEnvSecrets(smokeResult.detail, env),
        })),
      })
    } catch (error) {
      categoryReports.push({
        category,
        ok: false,
        results: [
          {
            id: 'exception',
            ok: false,
            detail: redactEnvSecrets(
              error instanceof Error ? error.message : String(error),
              env,
            ),
          },
        ],
      })
    }
  }

  return buildLaunchSmokeReport({
    target: options.target,
    categories: categoryReports,
  })
}

export async function writeLaunchSmokeReport(
  report: LaunchSmokeReport,
): Promise<string> {
  const outputDir = path.join('.local', 'launch-smoke-results')
  await mkdir(outputDir, { recursive: true })
  const safeTimestamp = report.generatedAt.replace(/[:.]/g, '-')
  const outputPath = path.join(
    outputDir,
    `launch-${report.target}-${safeTimestamp}.json`,
  )
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  return outputPath
}

function redactEnvSecrets(
  text: string,
  env: Record<string, string | undefined>,
): string {
  let redacted = text
  for (const [name, value] of Object.entries(env)) {
    if (!value || value.length < 4) continue
    if (!isSensitiveEnvName(name)) continue
    redacted = redacted.split(value).join(`[redacted:${name}]`)
  }
  return redacted
}

function isSensitiveEnvName(name: string): boolean {
  return /(?:KEY|SECRET|TOKEN|PASSWORD|BYPASS)/.test(name)
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
  const args = process.argv.slice(2)
  if (args.includes('--launch')) {
    const options = parseLaunchSmokeOptions(args)
    const report = await runLaunchSmoke(options)
    const writtenReportPath = options.writeReport
      ? await writeLaunchSmokeReport(report)
      : null

    if (options.json) {
      console.log(JSON.stringify(report, null, 2))
    } else {
      console.log(`[smoke:launch] target=${report.target}`)
      for (const category of report.categories) {
        console.log(
          `  - ${category.ok ? 'ok' : 'fail'} ${category.category}: ${category.results.map((result) => result.detail).join('; ')}`,
        )
      }
      if (writtenReportPath) {
        console.log(`[smoke:launch] wrote ${writtenReportPath}`)
      }
    }

    if (!report.ok) {
      process.exit(1)
    }
    return
  }

  const options = parseDemoSmokeOptions(args)
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
    console.error(formatSmokeCliError(error))
    process.exitCode = 1
  })
}
