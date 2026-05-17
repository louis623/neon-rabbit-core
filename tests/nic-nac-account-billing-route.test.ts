import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedRepMock = vi.fn()
const getAccountBillingDashboardMock = vi.fn()

vi.mock('@/lib/supabase/auth', () => ({
  AuthError: class AuthError extends Error {},
  getAuthenticatedRep: (...args: unknown[]) => getAuthenticatedRepMock(...args),
}))

vi.mock('@/lib/services/account-billing', () => ({
  getAccountBillingDashboard: (...args: unknown[]) =>
    getAccountBillingDashboardMock(...args),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({ marker: 'admin' })),
}))

import { GET } from '@/app/api/nic-nac/account-billing/route'
import { AuthError } from '@/lib/supabase/auth'

describe('GET /api/nic-nac/account-billing', () => {
  beforeEach(() => {
    getAuthenticatedRepMock.mockReset()
    getAccountBillingDashboardMock.mockReset()
  })

  it('returns the authenticated rep account billing summary', async () => {
    getAuthenticatedRepMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: {
        id: 'rep-1',
        stripe_customer_id: 'cus_123',
      },
    })
    getAccountBillingDashboardMock.mockResolvedValueOnce({
      stripeConfigured: true,
      subscription: {
        status: 'active',
        planType: 'monthly',
        currentPeriodEnd: '2026-06-01T00:00:00Z',
        cancelAtPeriodEnd: false,
        cancelledAt: null,
        livemode: false,
      },
      paymentMethod: {
        brand: 'visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2028,
      },
      invoices: [],
      canStartSubscription: false,
      canManageBilling: true,
    })

    const response = await GET()

    expect(getAccountBillingDashboardMock).toHaveBeenCalledWith({
      supabase: { marker: 'admin' },
      repId: 'rep-1',
      stripeCustomerId: 'cus_123',
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      stripeConfigured: true,
      subscription: {
        status: 'active',
        planType: 'monthly',
        currentPeriodEnd: '2026-06-01T00:00:00Z',
        cancelAtPeriodEnd: false,
        cancelledAt: null,
        livemode: false,
      },
      paymentMethod: {
        brand: 'visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2028,
      },
      invoices: [],
      canStartSubscription: false,
      canManageBilling: true,
    })
  })

  it('returns 401 when the rep is not signed in', async () => {
    getAuthenticatedRepMock.mockRejectedValueOnce(new AuthError('Not authenticated'))

    const response = await GET()

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: 'unauthenticated',
    })
  })
})
