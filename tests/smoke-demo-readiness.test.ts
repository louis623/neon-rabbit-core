import { describe, expect, it } from 'vitest'
import {
  buildDemoSmokePlan,
  buildDemoSmokeReport,
  buildLaunchSmokeReport,
  buildSmokeHttpError,
  buildDemoCredentialFailureMessage,
  DEFAULT_DEMO_SMOKE_CATEGORY,
  formatSmokeCliError,
  isVercelDeploymentProtectionResponse,
  parseLaunchSmokeOptions,
  parseDemoSmokeOptions,
  runLaunchSmoke,
  runDemoSmoke,
  SAFE_LAUNCH_SMOKE_CATEGORIES,
  validateDemoSmokePlan,
  VERCEL_PROTECTION_BYPASS_ENV,
  withVercelProtectionBypass,
} from '@/scripts/smoke-demo-readiness'
import {
  NIC_NAC_PAID_SMOKE_ALLOW_FLAG,
  NIC_NAC_PAID_SMOKE_MAX_REQUESTS_ENV,
} from '@/spike/run-benchmark'

describe('demo launch smoke readiness plan', () => {
  it('defaults to a provider-free local static smoke plan', () => {
    const plan = buildDemoSmokePlan({})

    expect(plan.category).toBe(DEFAULT_DEMO_SMOKE_CATEGORY)
    expect(plan.actions.every((action) => action.risk !== 'paid_provider')).toBe(true)
    expect(validateDemoSmokePlan(plan, {})).toEqual([])
  })

  it('excludes live SMS sends from every category', () => {
    const categories = [
      'local_static',
      'local_app',
      'supabase_demo',
      'stripe_test',
      'stripe_local_routes',
      'signwell_sandbox',
      'nic_nac_paid',
    ] as const

    for (const category of categories) {
      const plan = buildDemoSmokePlan({ category })
      const serializedActions = JSON.stringify(plan.actions)

      expect(serializedActions).not.toContain('sms_live_send')
      expect(serializedActions).not.toContain('+19044383050')
      expect(plan.excludedLiveActions).toContain('sms_live_send')
    }
  })

  it('excludes live SignWell sends unless the sandbox category is explicitly live-blocked', () => {
    const plan = buildDemoSmokePlan({ category: 'signwell_sandbox' })

    expect(plan.actions.map((action) => action.id)).toContain('signwell_sandbox_payload')
    expect(plan.actions.map((action) => action.id)).not.toContain('signwell_live_send')
    expect(plan.excludedLiveActions).toContain('signwell_live_send')
  })

  it('requires an explicit confirmation before a Stripe live key can be used', () => {
    const plan = buildDemoSmokePlan({ category: 'stripe_test' })

    expect(
      validateDemoSmokePlan(plan, {
        DEMO_REP_EMAIL: 'demo@example.com',
        STRIPE_SECRET_KEY: 'sk_live_123',
        STRIPE_PRICE_MONTHLY: 'price_123',
      }),
    ).toContain('STRIPE_LIVE_SMOKE_CONFIRMED=true is required when STRIPE_SECRET_KEY is live.')
  })

  it('summarizes blocked Stripe readiness without exposing key values', () => {
    const plan = buildDemoSmokePlan({ category: 'stripe_test' })

    const errors = validateDemoSmokePlan(plan, {
      DEMO_REP_EMAIL: 'demo@example.com',
      NEXT_PUBLIC_APP_URL: 'https://app.example.com',
      STRIPE_SECRET_KEY: 'sk_test_super_secret',
      STRIPE_WEBHOOK_SECRET: 'whsec_super_secret',
    })

    expect(errors).toContain(
      'Stripe readiness blocked: missing STRIPE_PRICE_MONTHLY; STRIPE_SECRET_KEY mode=test.',
    )
    expect(JSON.stringify(errors)).not.toContain('sk_test_super_secret')
    expect(JSON.stringify(errors)).not.toContain('whsec_super_secret')
  })

  it('summarizes blocked Stripe local route smoke without exposing key values', () => {
    const plan = buildDemoSmokePlan({ category: 'stripe_local_routes' })

    const errors = validateDemoSmokePlan(plan, {
      DEMO_REP_EMAIL: 'demo@example.com',
      DEMO_REP_PASSWORD: 'demo-password',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
      NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.test',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon_key',
      STRIPE_SECRET_KEY: 'sk_test_super_secret',
      STRIPE_WEBHOOK_SECRET: 'whsec_super_secret',
    })

    expect(errors).toContain(
      'STRIPE_PRICE_MONTHLY is required for stripe_local_routes smoke.',
    )
    expect(errors).toContain(
      'Stripe local route smoke blocked: missing STRIPE_PRICE_MONTHLY; STRIPE_SECRET_KEY mode=test.',
    )
    expect(JSON.stringify(errors)).not.toContain('sk_test_super_secret')
    expect(JSON.stringify(errors)).not.toContain('whsec_super_secret')
  })

  it('requires the demo account email for demo-specific smoke categories', () => {
    const plan = buildDemoSmokePlan({ category: 'supabase_demo' })

    expect(validateDemoSmokePlan(plan, {})).toContain(
      'DEMO_REP_EMAIL is required for supabase_demo smoke.',
    )
  })

  it('reuses the paid Nic-Nac smoke guard before any paid calls are allowed', () => {
    const plan = buildDemoSmokePlan({ category: 'nic_nac_paid' })

    expect(validateDemoSmokePlan(plan, { DEMO_REP_EMAIL: 'demo@example.com' })).toContain(
      `${NIC_NAC_PAID_SMOKE_ALLOW_FLAG}=true is required before running paid Nic-Nac smoke calls; planned requests=4.`,
    )
    expect(
      validateDemoSmokePlan(plan, {
        DEMO_REP_EMAIL: 'demo@example.com',
        [NIC_NAC_PAID_SMOKE_ALLOW_FLAG]: 'true',
        [NIC_NAC_PAID_SMOKE_MAX_REQUESTS_ENV]: '4',
      }),
    ).toEqual([])
  })

  it('runs local static checks against the demo seed plan shape', async () => {
    const result = await runDemoSmoke(buildDemoSmokePlan({ category: 'local_static' }), {})

    expect(result.ok).toBe(true)
    expect(result.results).toContainEqual({
      id: 'local_static_seed_plan',
      ok: true,
      detail: 'demo seed plan has 2 shows, 10 listings, and 5 audience members',
    })
  })

  it('runs SignWell sandbox smoke by building a non-sending payload', async () => {
    const result = await runDemoSmoke(buildDemoSmokePlan({ category: 'signwell_sandbox' }), {
      DEMO_REP_EMAIL: 'demo@example.com',
      SIGNWELL_API_KEY: 'signwell_api_key',
      SIGNWELL_API_BASE_URL: 'https://www.signwell.com/api/v1',
      SIGNWELL_TEMPLATE_ID: 'template_demo',
    })

    expect(result.ok).toBe(true)
    expect(result.results).toContainEqual({
      id: 'signwell_sandbox_payload',
      ok: true,
      detail:
        'built sandbox payload for demo@example.com with send_email=false; template_id=present; api_base_url_mode=production',
    })
  })

  it('reports SignWell sandbox base URL mode without exposing configured values', async () => {
    const result = await runDemoSmoke(buildDemoSmokePlan({ category: 'signwell_sandbox' }), {
      DEMO_REP_EMAIL: 'demo@example.com',
      SIGNWELL_API_KEY: 'signwell_api_key',
      SIGNWELL_API_BASE_URL: 'https://sandbox.signwell.example.test/api/v1',
      SIGNWELL_TEMPLATE_ID: 'template_secret_demo',
    })

    const serialized = JSON.stringify(result)

    expect(result.results).toContainEqual({
      id: 'signwell_sandbox_payload',
      ok: true,
      detail:
        'built sandbox payload for demo@example.com with send_email=false; template_id=present; api_base_url_mode=sandbox',
    })
    expect(serialized).not.toContain('template_secret_demo')
    expect(serialized).not.toContain('sandbox.signwell.example.test')
  })

  it('requires a SignWell template id before sandbox payload smoke', () => {
    const plan = buildDemoSmokePlan({ category: 'signwell_sandbox' })

    expect(validateDemoSmokePlan(plan, { DEMO_REP_EMAIL: 'demo@example.com' })).toContain(
      'SIGNWELL_TEMPLATE_ID is required for signwell_sandbox smoke.',
    )
  })

  it('summarizes blocked SignWell readiness without exposing configured secrets', () => {
    const plan = buildDemoSmokePlan({ category: 'signwell_sandbox' })

    const errors = validateDemoSmokePlan(plan, {
      DEMO_REP_EMAIL: 'demo@example.com',
      SIGNWELL_API_KEY: 'signwell_super_secret',
    })

    expect(errors).toContain(
      'SignWell readiness blocked: missing SIGNWELL_API_BASE_URL, SIGNWELL_TEMPLATE_ID.',
    )
    expect(JSON.stringify(errors)).not.toContain('signwell_super_secret')
  })

  it('can execute the Supabase demo seed through an injected seed runner', async () => {
    const result = await runDemoSmoke(
      buildDemoSmokePlan({ category: 'supabase_demo' }),
      {
        DEMO_REP_EMAIL: 'demo@example.com',
        NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.test',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon_key',
        SUPABASE_SERVICE_ROLE_KEY: 'service_role_key',
      },
      {
        seedDemoRep: async () => ({
          repId: 'rep-demo',
          siteSettingsId: 'settings-demo',
          designIds: Array.from({ length: 10 }, (_, index) => `design-${index}`),
          listingIds: Array.from({ length: 10 }, (_, index) => `listing-${index}`),
          showIds: ['show-1', 'show-2'],
          audienceIds: ['audience-1', 'audience-2', 'audience-3', 'audience-4', 'audience-5'],
        }),
        verifyDemoRepLogin: async () => ({
          repCount: 1,
          listingCount: 10,
          showCount: 2,
          audienceCount: 5,
        }),
      },
    )

    expect(result.ok).toBe(true)
    expect(result.results).toContainEqual({
      id: 'supabase_demo_seed_check',
      ok: true,
      detail:
        'seeded rep=rep-demo settings=1 designs=10 listings=10 shows=2 audience=5',
    })
    expect(result.results).toContainEqual({
      id: 'supabase_demo_login_check',
      ok: true,
      detail: 'demo login can read reps=1 listings=10 shows=2 audience=5',
    })
  })

  it('can verify the running local app with an injected app smoke runner', async () => {
    const result = await runDemoSmoke(
      buildDemoSmokePlan({ category: 'local_app' }),
      {
        DEMO_REP_EMAIL: 'demo@example.com',
        DEMO_REP_PASSWORD: 'demo-password',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.test',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon_key',
      },
      {
        verifyLocalApp: async () => ({
          repEmail: 'demo@example.com',
          repDisplayName: 'Launch Demo Rep',
          nicNacShellRendered: true,
        }),
      },
    )

    expect(result.ok).toBe(true)
    expect(result.results).toContainEqual({
      id: 'local_app_login_route',
      ok: true,
      detail:
        'local app authenticated as Launch Demo Rep <demo@example.com>; Nic-Nac shell rendered',
    })
  })

  it('explains demo credential failures without leaking the attempted password', () => {
    const message = buildDemoCredentialFailureMessage(
      'Demo local app sign-in failed',
      'Invalid login credentials',
      {
        DEMO_REP_EMAIL: 'demo@example.com',
        DEMO_REP_PASSWORD: 'super-secret-demo-password',
      },
    )

    expect(message).toContain('Invalid login credentials')
    expect(message).toContain('DEMO_REP_PASSWORD')
    expect(message).toContain('scripts/seed-demo-rep.ts')
    expect(message).toContain('demo@example.com')
    expect(message).not.toContain('super-secret-demo-password')
  })

  it('formats CLI errors as operator messages without stack traces', () => {
    const formatted = formatSmokeCliError(new Error('Demo local app sign-in failed'))

    expect(formatted).toBe('[smoke:demo] Demo local app sign-in failed')
    expect(formatted).not.toContain('at ')
  })

  it('can verify Stripe checkout and portal routes with an injected route runner', async () => {
    const result = await runDemoSmoke(
      buildDemoSmokePlan({ category: 'stripe_local_routes' }),
      {
        DEMO_REP_EMAIL: 'demo@example.com',
        DEMO_REP_PASSWORD: 'demo-password',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.test',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon_key',
        STRIPE_SECRET_KEY: 'sk_test_secret',
        STRIPE_WEBHOOK_SECRET: 'whsec_secret',
        STRIPE_PRICE_MONTHLY: 'price_test',
      },
      {
        verifyStripeLocalRoutes: async () => ({
          checkoutSessionUrl: 'https://checkout.stripe.test/session',
          portalSessionUrl: 'https://billing.stripe.test/session',
        }),
      },
    )

    expect(result.ok).toBe(true)
    expect(result.results).toContainEqual({
      id: 'stripe_local_checkout_and_portal',
      ok: true,
      detail:
        'Stripe test checkout session ready=true; portal session ready=true',
    })
  })

  it('detects protected Vercel previews without leaking bypass values', async () => {
    const response = new Response(
      '<title>Authentication Required</title><a>Vercel Authentication</a>',
      {
        status: 401,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          server: 'Vercel',
        },
      },
    )

    expect(isVercelDeploymentProtectionResponse(response, await response.clone().text())).toBe(
      true,
    )
    await expect(buildSmokeHttpError('/api/nic-nac/me', response)).resolves.toEqual(
      new Error(
        `Vercel deployment protection blocked /api/nic-nac/me; set ${VERCEL_PROTECTION_BYPASS_ENV} or complete Vercel SSO before deployed preview smoke.`,
      ),
    )
  })

  it('adds a Vercel protection bypass token to smoke URLs without changing the base URL', () => {
    const url = withVercelProtectionBypass('https://preview.example.com/nic-nac?tab=home', {
      [VERCEL_PROTECTION_BYPASS_ENV]: 'bypass_secret',
    })

    expect(url).toContain('https://preview.example.com/nic-nac?')
    expect(url).toContain('tab=home')
    expect(url).toContain('x-vercel-set-bypass-cookie=true')
    expect(url).toContain('x-vercel-protection-bypass=bypass_secret')
  })

  it('can build a machine-readable smoke report without leaking env secrets', async () => {
    const plan = buildDemoSmokePlan({ category: 'signwell_sandbox' })
    const result = await runDemoSmoke(plan, {
      DEMO_REP_EMAIL: 'demo@example.com',
      SIGNWELL_API_KEY: 'super_secret_signwell_key',
      SIGNWELL_API_BASE_URL: 'https://www.signwell.com/api/v1',
      SIGNWELL_TEMPLATE_ID: 'template_demo',
    })

    const report = buildDemoSmokeReport(plan, result)
    const serialized = JSON.stringify(report)

    expect(report.result.ok).toBe(true)
    expect(serialized).not.toContain('super_secret_signwell_key')
    expect(serialized).not.toContain('SIGNWELL_API_KEY')
  })

  it('parses json output mode for runnable launch smoke reports', () => {
    expect(parseDemoSmokeOptions(['--category', 'local_static', '--json'])).toEqual({
      category: 'local_static',
      json: true,
    })
  })

  it('runs the safe launch smoke categories in order and summarizes the result', async () => {
    const seenCategories: string[] = []

    const report = await runLaunchSmoke(
      {
        target: 'local',
        categories: ['local_static', 'local_app', 'stripe_test'],
        json: true,
        writeReport: false,
      },
      {
        DEMO_REP_EMAIL: 'demo@example.com',
        DEMO_REP_PASSWORD: 'demo-password',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.test',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon_key',
        STRIPE_SECRET_KEY: 'sk_test_secret',
        STRIPE_WEBHOOK_SECRET: 'whsec_secret',
        STRIPE_PRICE_MONTHLY: 'price_test',
      },
      {
        runCategory: async (plan) => {
          seenCategories.push(plan.category)
          return {
            category: plan.category,
            ok: true,
            results: [{ id: `${plan.category}_ok`, ok: true, detail: 'ok' }],
          }
        },
      },
    )

    expect(seenCategories).toEqual(['local_static', 'local_app', 'stripe_test'])
    expect(report.ok).toBe(true)
    expect(report.target).toBe('local')
    expect(report.categories.map((category) => category.category)).toEqual([
      'local_static',
      'local_app',
      'stripe_test',
    ])
  })

  it('captures launch smoke category failures without leaking env secrets', async () => {
    const report = await runLaunchSmoke(
      {
        target: 'preview',
        categories: ['stripe_test', 'signwell_sandbox'],
        json: true,
        writeReport: false,
      },
      {
        DEMO_REP_EMAIL: 'demo@example.com',
        STRIPE_SECRET_KEY: 'sk_test_super_secret',
        SIGNWELL_API_KEY: 'super_secret_signwell_key',
      },
      {
        runCategory: async (plan) => {
          if (plan.category === 'stripe_test') {
            throw new Error('provider route failed with sk_test_super_secret')
          }

          return runDemoSmoke(plan, {
            DEMO_REP_EMAIL: 'demo@example.com',
            SIGNWELL_API_KEY: 'super_secret_signwell_key',
          })
        },
      },
    )

    const serialized = JSON.stringify(report)

    expect(report.ok).toBe(false)
    expect(report.categories).toContainEqual(
      expect.objectContaining({
        category: 'stripe_test',
        ok: false,
      }),
    )
    expect(serialized).not.toContain('sk_test_super_secret')
    expect(serialized).not.toContain('super_secret_signwell_key')
  })

  it('parses launch smoke options for target, category subset, and report writing', () => {
    expect(
      parseLaunchSmokeOptions([
        '--target',
        'preview',
        '--categories',
        'local_static,stripe_test',
        '--json',
        '--write-report',
      ]),
    ).toEqual({
      target: 'preview',
      categories: ['local_static', 'stripe_test'],
      json: true,
      writeReport: true,
    })
  })

  it('builds a machine-readable launch report without env configuration', () => {
    const report = buildLaunchSmokeReport({
      target: 'local',
      categories: SAFE_LAUNCH_SMOKE_CATEGORIES.map((category) => ({
        category,
        ok: true,
        results: [{ id: `${category}_ok`, ok: true, detail: 'ok' }],
      })),
    })

    expect(report.ok).toBe(true)
    expect(report.categories).toHaveLength(SAFE_LAUNCH_SMOKE_CATEGORIES.length)
    expect(JSON.stringify(report)).not.toContain('SIGNWELL_API_KEY')
    expect(JSON.stringify(report)).not.toContain('STRIPE_SECRET_KEY')
  })
})
