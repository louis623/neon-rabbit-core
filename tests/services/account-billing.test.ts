import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/stripe/client', () => ({
  stripeEnabled: vi.fn(),
  getStripe: vi.fn(),
}))

import { getAccountBillingDashboard } from '@/lib/services/account-billing'
import { getStripe, stripeEnabled } from '@/lib/stripe/client'

function makeSelectSingle(response: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(response)
  const maybeSingle = vi.fn().mockResolvedValue(response)
  const limit = vi.fn(() => ({ single, maybeSingle }))
  const order = vi.fn(() => ({ limit, single, maybeSingle }))
  const eq = vi.fn(() => ({ order, limit, single, maybeSingle }))
  const select = vi.fn(() => ({ eq }))

  return {
    api: { select },
    spies: { select, eq, order, limit, single, maybeSingle },
  }
}

describe('account billing service', () => {
  beforeEach(() => {
    vi.mocked(stripeEnabled).mockReset()
    vi.mocked(getStripe).mockReset()
  })

  it('returns an unsubscribed monthly-ready dashboard when no subscription exists', async () => {
    vi.mocked(stripeEnabled).mockReturnValue(false)

    const subscriptionsChain = makeSelectSingle({
      data: null,
      error: null,
    })
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'subscriptions') return subscriptionsChain.api
        throw new Error(`Unexpected table ${table}`)
      }),
    }

    const result = await getAccountBillingDashboard({
      supabase: supabase as never,
      repId: 'rep-1',
      stripeCustomerId: null,
    })

    expect(result).toEqual({
      stripeConfigured: false,
      subscription: null,
      paymentMethod: null,
      invoices: [],
      canStartSubscription: true,
      canManageBilling: false,
    })
  })

  it('returns subscription, payment method, and invoice history when Stripe data exists', async () => {
    vi.mocked(stripeEnabled).mockReturnValue(true)

    const subscriptionsChain = makeSelectSingle({
      data: {
        status: 'active',
        plan_tier: 'monthly',
        current_period_end: '2026-06-01T00:00:00Z',
        cancel_at_period_end: true,
        cancelled_at: null,
        stripe_livemode: false,
      },
      error: null,
    })

    const stripeMock = {
      customers: {
        retrieve: vi.fn().mockResolvedValue({
          invoice_settings: {
            default_payment_method: {
              card: {
                brand: 'visa',
                last4: '4242',
                exp_month: 12,
                exp_year: 2028,
              },
            },
          },
        }),
      },
      invoices: {
        list: vi.fn().mockResolvedValue({
          data: [
            {
              id: 'in_1',
              created: 1770000000,
              amount_paid: 9900,
              currency: 'usd',
              status: 'paid',
              hosted_invoice_url: 'https://stripe.test/in_1',
              invoice_pdf: 'https://stripe.test/in_1.pdf',
            },
          ],
        }),
      },
    }
    vi.mocked(getStripe).mockReturnValue(stripeMock as never)

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'subscriptions') return subscriptionsChain.api
        throw new Error(`Unexpected table ${table}`)
      }),
    }

    const result = await getAccountBillingDashboard({
      supabase: supabase as never,
      repId: 'rep-1',
      stripeCustomerId: 'cus_123',
    })

    expect(result.subscription).toEqual({
      status: 'active',
      planType: 'monthly',
      currentPeriodEnd: '2026-06-01T00:00:00Z',
      cancelAtPeriodEnd: true,
      cancelledAt: null,
      livemode: false,
    })
    expect(result.paymentMethod).toEqual({
      brand: 'visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2028,
    })
    expect(result.invoices).toEqual([
      {
        id: 'in_1',
        createdAt: '2026-02-02T02:40:00.000Z',
        amountPaidCents: 9900,
        currency: 'usd',
        status: 'paid',
        hostedInvoiceUrl: 'https://stripe.test/in_1',
        invoicePdfUrl: 'https://stripe.test/in_1.pdf',
      },
    ])
    expect(result.canStartSubscription).toBe(false)
    expect(result.canManageBilling).toBe(true)
  })
})
