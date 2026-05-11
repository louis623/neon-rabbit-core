import { beforeEach, describe, expect, it, vi } from 'vitest'

const stripeEnabledMock = vi.fn()
const getStripeMock = vi.fn()
const getPriceIdMock = vi.fn()
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

describe('POST /api/stripe/create-checkout', () => {
  beforeEach(() => {
    stripeEnabledMock.mockReset()
    getStripeMock.mockReset()
    getPriceIdMock.mockReset()
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
    createAdminClientMock.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(() => ({
              limit: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: null }),
              })),
            })),
          })),
        })),
      })),
    })
    getPriceIdMock.mockReturnValue('price_monthly')
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

    expect(getPriceIdMock).toHaveBeenCalledWith('monthly')
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url:
          'https://sparkle-suite.example/nic-nac?billing=subscription-success&session_id={CHECKOUT_SESSION_ID}',
        cancel_url:
          'https://sparkle-suite.example/nic-nac?billing=subscription-cancelled',
        metadata: expect.objectContaining({
          plan_type: 'monthly',
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
