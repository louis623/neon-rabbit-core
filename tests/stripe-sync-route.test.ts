import { beforeEach, describe, expect, it, vi } from 'vitest'

const stripeEnabledMock = vi.fn()
const getStripeMock = vi.fn()
const getAuthenticatedRepMock = vi.fn()
const createAdminClientMock = vi.fn()

vi.mock('@/lib/stripe/client', () => ({
  stripeEnabled: (...args: unknown[]) => stripeEnabledMock(...args),
  getStripe: (...args: unknown[]) => getStripeMock(...args),
}))

vi.mock('@/lib/supabase/auth', () => ({
  AuthError: class AuthError extends Error {},
  getAuthenticatedRep: (...args: unknown[]) => getAuthenticatedRepMock(...args),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

import { POST } from '@/app/api/stripe/sync/route'

function makeSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub_test_buyer',
    customer: 'cus_test_buyer',
    status: 'active',
    start_date: 1_779_120_000,
    billing_cycle_anchor: 1_781_712_000,
    cancel_at_period_end: false,
    canceled_at: null,
    livemode: false,
    metadata: {},
    items: {
      data: [
        {
          current_period_start: 1_779_120_000,
          current_period_end: 1_781_712_000,
        },
      ],
    },
    ...overrides,
  }
}

function makeAdmin() {
  const repsUpdateEq = vi.fn().mockResolvedValue({ error: null })
  const repsUpdate = vi.fn(() => ({ eq: repsUpdateEq }))
  const subscriptionsUpsert = vi.fn().mockResolvedValue({ error: null })

  const from = vi.fn((table: string) => {
    if (table === 'reps') {
      return { update: repsUpdate }
    }

    if (table === 'subscriptions') {
      return {
        upsert: subscriptionsUpsert,
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null }),
          })),
        })),
        insert: vi.fn().mockResolvedValue({ error: null }),
      }
    }

    throw new Error(`unexpected table ${table}`)
  })

  return {
    client: { from },
    spies: {
      from,
      repsUpdate,
      repsUpdateEq,
      subscriptionsUpsert,
    },
  }
}

describe('POST /api/stripe/sync', () => {
  beforeEach(() => {
    stripeEnabledMock.mockReset()
    getStripeMock.mockReset()
    getAuthenticatedRepMock.mockReset()
    createAdminClientMock.mockReset()
  })

  it('syncs the exact returned checkout session and unlocks the authenticated rep', async () => {
    stripeEnabledMock.mockReturnValue(true)
    getAuthenticatedRepMock.mockResolvedValueOnce({
      repId: 'rep-test-buyer',
      rep: {
        id: 'rep-test-buyer',
        stripe_customer_id: null,
      },
    })
    const subscription = makeSubscription()
    const retrieveSession = vi.fn().mockResolvedValue({
      id: 'cs_test_buyer',
      mode: 'subscription',
      customer: 'cus_test_buyer',
      subscription: 'sub_test_buyer',
      metadata: {
        rep_id: 'rep-test-buyer',
        plan_type: 'monthly',
        pricing_tier: 'standard',
        founder_sequence: '',
        build_fee_charged: 'false',
        founder_rate_months: '',
        build_fee_price_id: 'test_buyer_no_build_fee',
        monthly_price_id: 'test_buyer_price_data_50_cents',
        test_buyer_checkout: 'true',
      },
    })
    const retrieveSubscription = vi.fn().mockResolvedValue(subscription)
    getStripeMock.mockReturnValue({
      checkout: {
        sessions: {
          retrieve: retrieveSession,
        },
      },
      subscriptions: {
        retrieve: retrieveSubscription,
      },
    })
    const { client, spies } = makeAdmin()
    createAdminClientMock.mockReturnValue(client)

    const response = await POST(
      new Request('http://localhost/api/stripe/sync', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: 'cs_test_buyer' }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      synced: true,
      mode: 'checkout_session',
      stripeSubscriptionCount: 1,
      changes: ['sub_test_buyer: synced from checkout session'],
    })
    expect(retrieveSession).toHaveBeenCalledWith('cs_test_buyer')
    expect(retrieveSubscription).toHaveBeenCalledWith('sub_test_buyer', {
      expand: ['items'],
    })
    expect(spies.repsUpdate).toHaveBeenCalledWith({
      stripe_customer_id: 'cus_test_buyer',
      pricing_tier: 'standard',
    })
    expect(spies.repsUpdateEq).toHaveBeenCalledWith('id', 'rep-test-buyer')
    expect(spies.subscriptionsUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        rep_id: 'rep-test-buyer',
        stripe_subscription_id: 'sub_test_buyer',
        stripe_customer_id: 'cus_test_buyer',
        plan_tier: 'monthly',
        pricing_tier: 'standard',
        build_fee_charged: false,
        monthly_price_id: 'test_buyer_price_data_50_cents',
        status: 'active',
        stripe_livemode: false,
      }),
      { onConflict: 'stripe_subscription_id' },
    )
  })

  it('refuses to sync a checkout session for another rep', async () => {
    stripeEnabledMock.mockReturnValue(true)
    getAuthenticatedRepMock.mockResolvedValueOnce({
      repId: 'rep-real-user',
      rep: {
        id: 'rep-real-user',
        stripe_customer_id: null,
      },
    })
    getStripeMock.mockReturnValue({
      checkout: {
        sessions: {
          retrieve: vi.fn().mockResolvedValue({
            id: 'cs_other',
            mode: 'subscription',
            customer: 'cus_other',
            subscription: 'sub_other',
            metadata: {
              rep_id: 'rep-other',
            },
          }),
        },
      },
    })
    const { client, spies } = makeAdmin()
    createAdminClientMock.mockReturnValue(client)

    const response = await POST(
      new Request('http://localhost/api/stripe/sync', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: 'cs_other' }),
      }),
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      error: 'Checkout session does not belong to this account.',
    })
    expect(spies.repsUpdate).not.toHaveBeenCalled()
    expect(spies.subscriptionsUpsert).not.toHaveBeenCalled()
  })

  it('does not unlock paid access for non-entitled Stripe subscription statuses', async () => {
    stripeEnabledMock.mockReturnValue(true)
    getAuthenticatedRepMock.mockResolvedValueOnce({
      repId: 'rep-test-buyer',
      rep: {
        id: 'rep-test-buyer',
        stripe_customer_id: null,
      },
    })
    const subscription = makeSubscription({ status: 'incomplete' })
    const retrieveSession = vi.fn().mockResolvedValue({
      id: 'cs_incomplete',
      mode: 'subscription',
      customer: 'cus_test_buyer',
      subscription: 'sub_incomplete',
      metadata: {
        rep_id: 'rep-test-buyer',
        plan_type: 'monthly',
        pricing_tier: 'standard',
      },
    })
    getStripeMock.mockReturnValue({
      checkout: {
        sessions: {
          retrieve: retrieveSession,
        },
      },
      subscriptions: {
        retrieve: vi.fn().mockResolvedValue(subscription),
      },
    })
    const { client, spies } = makeAdmin()
    createAdminClientMock.mockReturnValue(client)

    const response = await POST(
      new Request('http://localhost/api/stripe/sync', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId: 'cs_incomplete' }),
      }),
    )

    expect(response.status).toBe(402)
    await expect(response.json()).resolves.toEqual({
      error: 'Stripe subscription is not active yet.',
      status: 'incomplete',
    })
    expect(spies.subscriptionsUpsert).not.toHaveBeenCalledWith(
      expect.objectContaining({ status: 'active' }),
      expect.anything(),
    )
  })
})
