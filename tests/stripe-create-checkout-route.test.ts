import { beforeEach, describe, expect, it, vi } from 'vitest'

const stripeEnabledMock = vi.fn()
const getStripeMock = vi.fn()
const getPriceIdMock = vi.fn()
const getSparkleSuitePriceIdsMock = vi.fn()
const getAppUrlMock = vi.fn()
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
              })),
            })),
          })),
        }
      }),
    })),
  }
}

describe('POST /api/stripe/create-checkout', () => {
  beforeEach(() => {
    stripeEnabledMock.mockReset()
    getStripeMock.mockReset()
    getPriceIdMock.mockReset()
    getSparkleSuitePriceIdsMock.mockReset()
    getAppUrlMock.mockReset()
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
        body: JSON.stringify({}),
      }),
    )

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          { price: 'price_build_fee', quantity: 1 },
          { price: 'price_founder_monthly', quantity: 1 },
        ],
        success_url:
          'https://sparkle-suite.example/nic-nac?billing=subscription-success&session_id={CHECKOUT_SESSION_ID}',
        cancel_url:
          'https://sparkle-suite.example/nic-nac?billing=subscription-cancelled',
        metadata: expect.objectContaining({
          plan_type: 'monthly',
          pricing_tier: 'founder',
          founder_sequence: '1',
          build_fee_charged: 'true',
          founder_rate_months: '12',
        }),
      }),
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
        body: JSON.stringify({}),
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
        body: JSON.stringify({}),
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
})
