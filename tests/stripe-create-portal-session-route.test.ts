import { beforeEach, describe, expect, it, vi } from 'vitest'

const stripeEnabledMock = vi.fn()
const getStripeMock = vi.fn()
const getAppUrlMock = vi.fn()
const getAuthenticatedRepMock = vi.fn()

vi.mock('@/lib/stripe/client', () => ({
  stripeEnabled: (...args: unknown[]) => stripeEnabledMock(...args),
  getStripe: (...args: unknown[]) => getStripeMock(...args),
}))

vi.mock('@/lib/stripe/config', () => ({
  getAppUrl: (...args: unknown[]) => getAppUrlMock(...args),
}))

vi.mock('@/lib/supabase/auth', () => ({
  AuthError: class AuthError extends Error {},
  getAuthenticatedRep: (...args: unknown[]) => getAuthenticatedRepMock(...args),
}))

import { POST } from '@/app/api/stripe/create-portal-session/route'

describe('POST /api/stripe/create-portal-session', () => {
  beforeEach(() => {
    stripeEnabledMock.mockReset()
    getStripeMock.mockReset()
    getAppUrlMock.mockReset()
    getAuthenticatedRepMock.mockReset()
  })

  it('returns a billing portal session that goes back to nic-nac', async () => {
    stripeEnabledMock.mockReturnValue(true)
    getAppUrlMock.mockReturnValue('https://sparkle-suite.example')
    getAuthenticatedRepMock.mockResolvedValueOnce({
      rep: {
        stripe_customer_id: 'cus_123',
      },
    })

    const createMock = vi.fn().mockResolvedValue({
      url: 'https://billing.stripe.test/session_123',
    })
    getStripeMock.mockReturnValue({
      billingPortal: {
        sessions: {
          create: createMock,
        },
      },
    })

    const response = await POST()

    expect(createMock).toHaveBeenCalledWith({
      customer: 'cus_123',
      return_url: 'https://sparkle-suite.example/nic-nac?billing=portal-returned',
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      url: 'https://billing.stripe.test/session_123',
    })
  })
})
