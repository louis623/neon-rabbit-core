import { beforeEach, describe, expect, it, vi } from 'vitest'

const stripeEnabledMock = vi.fn()
const getStripeMock = vi.fn()
const getPriceIdMock = vi.fn()
const getSparkleSuitePriceIdsMock = vi.fn()
const getAppUrlMock = vi.fn()
const getStripeConfigMock = vi.fn()
const getOrCreateStripeCustomerMock = vi.fn()
const getAuthenticatedRepMock = vi.fn()
const createAdminClientMock = vi.fn()

vi.mock('@/lib/stripe/client', () => ({
  stripeEnabled: (...args: unknown[]) => stripeEnabledMock(...args),
  getStripe: (...args: unknown[]) => getStripeMock(...args),
}))

vi.mock('@/lib/stripe/config', () => ({
  getPriceId: (...args: unknown[]) => getPriceIdMock(...args),
  getSparkleSuitePriceIds: (...args: unknown[]) =>
    getSparkleSuitePriceIdsMock(...args),
  getAppUrl: (...args: unknown[]) => getAppUrlMock(...args),
  getStripeConfig: (...args: unknown[]) => getStripeConfigMock(...args),
}))

vi.mock('@/lib/stripe/customers', () => ({
  getOrCreateStripeCustomer: (...args: unknown[]) =>
    getOrCreateStripeCustomerMock(...args),
}))

vi.mock('@/lib/supabase/auth', () => ({
  AuthError: class AuthError extends Error {},
  getAuthenticatedRep: (...args: unknown[]) => getAuthenticatedRepMock(...args),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

import { POST } from '@/app/api/stripe/create-checkout/route'

function createCheckoutAdminMock(paidSubscriptionStarts = 0) {
  return {
    from: vi.fn(() => ({
      select: vi.fn((_: string, options?: { count?: string }) => {
        if (options?.count === 'exact') {
          return {
            in: vi.fn().mockResolvedValue({
              count: paidSubscriptionStarts,
              error: null,
            }),
          }
        }

        return {
          eq: vi.fn(() => ({
            in: vi.fn(() => ({
              limit: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: null }),
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              })),
            })),
          })),
        }
      }),
    })),
  }
}

describe('POST /api/stripe/create-checkout', () => {
  const originalTestBuyerMode = process.env.SPARKLE_STRIPE_TEST_BUYER_MODE

  beforeEach(() => {
    process.env.SPARKLE_STRIPE_TEST_BUYER_MODE = originalTestBuyerMode
    stripeEnabledMock.mockReset()
    getStripeMock.mockReset()
    getPriceIdMock.mockReset()
    getSparkleSuitePriceIdsMock.mockReset()
    getAppUrlMock.mockReset()
    getStripeConfigMock.mockReset()
    getOrCreateStripeCustomerMock.mockReset()
    getAuthenticatedRepMock.mockReset()
    createAdminClientMock.mockReset()
  })

  it('defaults to the monthly plan and returns to nic-nac URLs', async () => {
    stripeEnabledMock.mockReturnValue(true)
    getAuthenticatedRepMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { id: 'rep-1' },
    })
    createAdminClientMock.mockReturnValue(createCheckoutAdminMock())
    getPriceIdMock.mockReturnValue('price_monthly')
    getSparkleSuitePriceIdsMock.mockReturnValue({
      buildFee: 'price_build_fee',
      founderMonthly: 'price_founder_monthly',
      standardMonthly: 'price_standard_monthly',
    })
    getAppUrlMock.mockReturnValue('https://sparkle-suite.example')
    getOrCreateStripeCustomerMock.mockResolvedValueOnce('cus_123')

    const createMock = vi.fn().mockResolvedValue({
      id: 'cs_123',
      url: 'https://checkout.stripe.test/cs_123',
    })
    getStripeMock.mockReturnValue({
      checkout: {
        sessions: {
          create: createMock,
        },
      },
    })

    const response = await POST(
      new Request('http://localhost/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ agreementAccepted: true }),
      }),
    )

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          { price: 'price_build_fee', quantity: 1 },
          { price: 'price_standard_monthly', quantity: 1 },
        ],
        success_url:
          'https://sparkle-suite.example/nic-nac?onboarding=required-setup&billing=subscription-success&session_id={CHECKOUT_SESSION_ID}',
        cancel_url:
          'https://sparkle-suite.example/nic-nac?onboarding=checkout-required&billing=subscription-cancelled',
        payment_method_types: ['card', 'link'],
        shipping_address_collection: { allowed_countries: ['US'] },
        phone_number_collection: { enabled: true },
        metadata: expect.objectContaining({
          plan_type: 'monthly',
          first_run_setup: 'required_nic_nac',
          light_box_required: 'true',
          pricing_tier: 'standard',
          founder_sequence: '',
          build_fee_charged: 'true',
          founder_rate_months: '',
          agreement_provider: 'clickwrap',
          agreement_version: 'sparkle-suite-terms-2026-05-09',
          signwell_required: 'false',
        }),
        subscription_data: expect.objectContaining({
          metadata: expect.objectContaining({
            first_run_setup: 'required_nic_nac',
            light_box_required: 'true',
          }),
        }),
      }),
    )
    expect(response.status).toBe(200)
  })

  it('allows only card and Link payment methods for Sparkle Suite checkout', async () => {
    stripeEnabledMock.mockReturnValue(true)
    getAuthenticatedRepMock.mockResolvedValueOnce({
      repId: 'rep-payment-methods',
      rep: { id: 'rep-payment-methods' },
    })
    createAdminClientMock.mockReturnValue(createCheckoutAdminMock())
    getSparkleSuitePriceIdsMock.mockReturnValue({
      buildFee: 'price_build_fee',
      founderMonthly: 'price_founder_monthly',
      standardMonthly: 'price_standard_monthly',
    })
    getAppUrlMock.mockReturnValue('https://sparkle-suite.example')
    getOrCreateStripeCustomerMock.mockResolvedValueOnce('cus_payment_methods')

    const createMock = vi.fn().mockResolvedValue({
      id: 'cs_payment_methods',
      url: 'https://checkout.stripe.test/cs_payment_methods',
    })
    getStripeMock.mockReturnValue({
      checkout: {
        sessions: {
          create: createMock,
        },
      },
    })

    const response = await POST(
      new Request('http://localhost/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ agreementAccepted: true }),
      }),
    )

    const createParams = createMock.mock.calls[0]?.[0]
    expect(createParams).toEqual(
      expect.objectContaining({
        payment_method_types: ['card', 'link'],
      }),
    )
    expect(createParams.payment_method_types).not.toEqual(
      expect.arrayContaining([
        'affirm',
        'afterpay_clearpay',
        'amazon_pay',
        'cashapp',
        'klarna',
      ]),
    )
    expect(response.status).toBe(200)
  })

  it('uses standard monthly pricing once 20 paid subscriptions have started', async () => {
    stripeEnabledMock.mockReturnValue(true)
    getAuthenticatedRepMock.mockResolvedValueOnce({
      repId: 'rep-21',
      rep: { id: 'rep-21' },
    })
    createAdminClientMock.mockReturnValue(createCheckoutAdminMock(20))
    getSparkleSuitePriceIdsMock.mockReturnValue({
      buildFee: 'price_build_fee',
      founderMonthly: 'price_founder_monthly',
      standardMonthly: 'price_standard_monthly',
    })
    getAppUrlMock.mockReturnValue('https://sparkle-suite.example')
    getOrCreateStripeCustomerMock.mockResolvedValueOnce('cus_standard')

    const createMock = vi.fn().mockResolvedValue({
      id: 'cs_standard',
      url: 'https://checkout.stripe.test/cs_standard',
    })
    getStripeMock.mockReturnValue({
      checkout: {
        sessions: {
          create: createMock,
        },
      },
    })

    const response = await POST(
      new Request('http://localhost/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ agreementAccepted: true }),
      }),
    )

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          { price: 'price_build_fee', quantity: 1 },
          { price: 'price_standard_monthly', quantity: 1 },
        ],
        metadata: expect.objectContaining({
          pricing_tier: 'standard',
          founder_sequence: '',
          build_fee_charged: 'true',
          founder_rate_months: '',
        }),
      }),
    )
    expect(response.status).toBe(200)
  })

  it('refuses checkout with an actionable error when Stripe env is missing', async () => {
    stripeEnabledMock.mockReturnValue(false)

    const response = await POST(
      new Request('http://localhost/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ agreementAccepted: true }),
      }),
    )

    expect(getAuthenticatedRepMock).not.toHaveBeenCalled()
    expect(getStripeMock).not.toHaveBeenCalled()
    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      code: 'STRIPE_CONFIGURATION_MISSING',
      error: 'Stripe is not configured.',
      action:
        'Set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_APP_URL, STRIPE_PRICE_BUILD_FEE, STRIPE_PRICE_FOUNDER_MONTHLY, and STRIPE_PRICE_STANDARD_MONTHLY before starting checkout.',
    })
  })

  it('uses the authenticated rep identity instead of request-supplied identity', async () => {
    stripeEnabledMock.mockReturnValue(true)
    getAuthenticatedRepMock.mockResolvedValueOnce({
      repId: 'rep-authenticated',
      rep: { id: 'rep-authenticated' },
    })
    createAdminClientMock.mockReturnValue(createCheckoutAdminMock())
    getPriceIdMock.mockReturnValue('price_monthly')
    getSparkleSuitePriceIdsMock.mockReturnValue({
      buildFee: 'price_build_fee',
      founderMonthly: 'price_founder_monthly',
      standardMonthly: 'price_standard_monthly',
    })
    getAppUrlMock.mockReturnValue('https://sparkle-suite.example')
    getOrCreateStripeCustomerMock.mockResolvedValueOnce('cus_auth')

    const createMock = vi.fn().mockResolvedValue({
      id: 'cs_123',
      url: 'https://checkout.stripe.test/cs_123',
    })
    getStripeMock.mockReturnValue({
      checkout: {
        sessions: {
          create: createMock,
        },
      },
    })

    const response = await POST(
      new Request('http://localhost/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          repId: 'rep-attacker',
          planType: 'monthly',
          agreementAccepted: true,
        }),
      }),
    )

    expect(getOrCreateStripeCustomerMock).toHaveBeenCalledWith('rep-authenticated')
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          rep_id: 'rep-authenticated',
        }),
        subscription_data: expect.objectContaining({
          metadata: expect.objectContaining({
            rep_id: 'rep-authenticated',
          }),
        }),
      }),
    )
    expect(response.status).toBe(200)
  })

  it('fails closed when the active subscription guard query errors', async () => {
    stripeEnabledMock.mockReturnValue(true)
    getAuthenticatedRepMock.mockResolvedValueOnce({
      repId: 'rep-guard-error',
      rep: { id: 'rep-guard-error' },
    })
    createAdminClientMock.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn((_: string, options?: { count?: string }) => {
          if (options?.count === 'exact') {
            return {
              in: vi.fn().mockResolvedValue({
                count: 0,
                error: null,
              }),
            }
          }

          return {
            eq: vi.fn(() => ({
              in: vi.fn(() => ({
                limit: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'database unavailable' },
                  }),
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'database unavailable' },
                  }),
                })),
              })),
            })),
          }
        }),
      })),
    })
    getSparkleSuitePriceIdsMock.mockReturnValue({
      buildFee: 'price_build_fee',
      founderMonthly: 'price_founder_monthly',
      standardMonthly: 'price_standard_monthly',
    })
    getAppUrlMock.mockReturnValue('https://sparkle-suite.example')
    getOrCreateStripeCustomerMock.mockResolvedValueOnce('cus_guard_error')

    const createMock = vi.fn()
    getStripeMock.mockReturnValue({
      checkout: {
        sessions: {
          create: createMock,
        },
      },
    })

    const response = await POST(
      new Request('http://localhost/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ agreementAccepted: true }),
      }),
    )

    expect(response.status).toBe(500)
    expect(createMock).not.toHaveBeenCalled()
    expect(getOrCreateStripeCustomerMock).not.toHaveBeenCalled()
  })

  it('requires standard terms acceptance before creating checkout', async () => {
    stripeEnabledMock.mockReturnValue(true)
    getAuthenticatedRepMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { id: 'rep-1' },
    })

    const response = await POST(
      new Request('http://localhost/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Accept the Sparkle Suite Terms and Conditions before checkout.',
      agreementVersion: 'sparkle-suite-terms-2026-05-09',
    })
    expect(getStripeMock).not.toHaveBeenCalled()
  })

  it('rejects non-monthly plan requests', async () => {
    stripeEnabledMock.mockReturnValue(true)
    getAuthenticatedRepMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { id: 'rep-1' },
    })

    const response = await POST(
      new Request('http://localhost/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ planType: 'annual' }),
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid planType — monthly is the only supported plan.',
    })
  })
  it('creates a guarded 50-cent Stripe test buyer checkout without configured price IDs', async () => {
    process.env.SPARKLE_STRIPE_TEST_BUYER_MODE = 'true'
    stripeEnabledMock.mockReturnValue(true)
    getStripeConfigMock.mockReturnValue({
      STRIPE_SECRET_KEY: 'sk_test_secret',
    })
    getAuthenticatedRepMock.mockResolvedValueOnce({
      repId: 'rep-test-buyer',
      rep: { id: 'rep-test-buyer' },
    })
    createAdminClientMock.mockReturnValue(createCheckoutAdminMock())
    getSparkleSuitePriceIdsMock.mockReturnValue({})
    getAppUrlMock.mockReturnValue('http://localhost:3000')
    getOrCreateStripeCustomerMock.mockResolvedValueOnce('cus_test_buyer')

    const createMock = vi.fn().mockResolvedValue({
      id: 'cs_test_buyer',
      url: 'https://checkout.stripe.test/cs_test_buyer',
    })
    getStripeMock.mockReturnValue({
      checkout: {
        sessions: {
          create: createMock,
        },
      },
    })

    const response = await POST(
      new Request('http://localhost/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ agreementAccepted: true }),
      }),
    )

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_test_buyer',
        mode: 'subscription',
        line_items: [
          {
            price_data: expect.objectContaining({
              currency: 'usd',
              unit_amount: 50,
              recurring: { interval: 'month' },
              product_data: expect.objectContaining({
                name: 'Sparkle Suite test buyer subscription',
              }),
            }),
            quantity: 1,
          },
        ],
        metadata: expect.objectContaining({
          rep_id: 'rep-test-buyer',
          pricing_tier: 'standard',
          test_buyer_checkout: 'true',
          production_pricing: 'false',
          monthly_price_id: 'test_buyer_price_data_50_cents',
        }),
        subscription_data: expect.objectContaining({
          metadata: expect.objectContaining({
            test_buyer_checkout: 'true',
            production_pricing: 'false',
          }),
        }),
      }),
    )
    expect(response.status).toBe(200)
  })

  it('refuses test buyer checkout unless the local Stripe key is a test key', async () => {
    process.env.SPARKLE_STRIPE_TEST_BUYER_MODE = 'true'
    stripeEnabledMock.mockReturnValue(true)
    getStripeConfigMock.mockReturnValue({
      STRIPE_SECRET_KEY: 'sk_live_secret',
    })
    getAuthenticatedRepMock.mockResolvedValueOnce({
      repId: 'rep-test-buyer',
      rep: { id: 'rep-test-buyer' },
    })
    createAdminClientMock.mockReturnValue(createCheckoutAdminMock())

    const response = await POST(
      new Request('http://localhost/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ agreementAccepted: true }),
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      code: 'TEST_BUYER_CHECKOUT_NOT_AVAILABLE',
      error:
        'Test buyer checkout requires a Stripe test key and cannot run in production.',
      action:
        'Use STRIPE_SECRET_KEY=sk_test_... with SPARKLE_STRIPE_TEST_BUYER_MODE=true in local development.',
    })
    expect(getStripeMock).not.toHaveBeenCalled()
  })
})
