import { beforeEach, describe, expect, it, vi } from 'vitest'

const getStripeConfigMock = vi.fn()
const getSparkleSuitePriceIdsMock = vi.fn()
const getStripeMock = vi.fn()
const createAdminClientMock = vi.fn()

vi.mock('@/lib/stripe/config', () => ({
  getStripeConfig: (...args: unknown[]) => getStripeConfigMock(...args),
  getSparkleSuitePriceIds: (...args: unknown[]) =>
    getSparkleSuitePriceIdsMock(...args),
}))

vi.mock('@/lib/stripe/client', () => ({
  getStripe: (...args: unknown[]) => getStripeMock(...args),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

import { POST } from '@/app/api/stripe/webhook/route'

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    getStripeConfigMock.mockReset()
    getSparkleSuitePriceIdsMock.mockReset()
    getStripeMock.mockReset()
    createAdminClientMock.mockReset()
    getStripeConfigMock.mockReturnValue({
      STRIPE_WEBHOOK_SECRET: 'whsec_test',
    })
    getSparkleSuitePriceIdsMock.mockReturnValue({
      buildFee: 'price_build_fee',
      founderMonthly: 'price_founder_monthly',
      standardMonthly: 'price_standard_monthly',
    })
  })

  it('does not mutate subscription state when Stripe signature verification fails', async () => {
    getStripeMock.mockReturnValue({
      webhooks: {
        constructEvent: vi.fn(() => {
          throw new Error('bad signature')
        }),
      },
    })

    const response = await POST(
      new Request('http://localhost/api/stripe/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'bad_sig' },
        body: JSON.stringify({ type: 'customer.subscription.deleted' }),
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid signature' })
    expect(createAdminClientMock).not.toHaveBeenCalled()
  })

  it('updates subscription status only after a verified Stripe event is constructed', async () => {
    const updateMock = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }))
    const insertEventMock = vi.fn().mockResolvedValue({ error: null })
    const admin = {
      from: vi.fn((table: string) => {
        if (table === 'stripe_events') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: null }),
              })),
            })),
            insert: insertEventMock,
          }
        }

        if (table === 'subscriptions') {
          return {
            update: updateMock,
          }
        }

        throw new Error(`unexpected table ${table}`)
      }),
    }
    const event = {
      id: 'evt_verified',
      type: 'customer.subscription.deleted',
      livemode: false,
      created: 1_779_120_000,
      data: {
        object: {
          id: 'sub_verified',
        },
      },
    }

    createAdminClientMock.mockReturnValue(admin)
    getStripeMock.mockReturnValue({
      webhooks: {
        constructEvent: vi.fn().mockReturnValue(event),
      },
    })

    const response = await POST(
      new Request('http://localhost/api/stripe/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'verified_sig' },
        body: JSON.stringify({ id: 'evt_verified' }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ received: true })
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'cancelled',
        cancel_at_period_end: false,
        stripe_event_timestamp: event.created,
      }),
    )
    expect(insertEventMock).toHaveBeenCalledWith({
      id: 'evt_verified',
      event_type: 'customer.subscription.deleted',
    })
  })

  it('persists checkout pricing metadata after a verified subscription checkout', async () => {
    const repsUpdateEq = vi.fn().mockResolvedValue({ error: null })
    const repsUpdateMock = vi.fn(() => ({ eq: repsUpdateEq }))
    const subscriptionsUpsertMock = vi.fn().mockResolvedValue({ error: null })
    const insertEventMock = vi.fn().mockResolvedValue({ error: null })
    const admin = {
      from: vi.fn((table: string) => {
        if (table === 'stripe_events') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: null }),
              })),
            })),
            insert: insertEventMock,
          }
        }

        if (table === 'reps') {
          return {
            update: repsUpdateMock,
          }
        }

        if (table === 'subscriptions') {
          return {
            upsert: subscriptionsUpsertMock,
          }
        }

        throw new Error(`unexpected table ${table}`)
      }),
    }
    const event = {
      id: 'evt_checkout',
      type: 'checkout.session.completed',
      livemode: false,
      created: 1_779_120_000,
      data: {
        object: {
          id: 'cs_verified',
          mode: 'subscription',
          subscription: 'sub_verified',
          metadata: {
            rep_id: 'rep-founder',
            plan_type: 'monthly',
            pricing_tier: 'founder',
            founder_sequence: '7',
            build_fee_charged: 'true',
            founder_rate_months: '12',
            build_fee_price_id: 'price_build_fee',
            monthly_price_id: 'price_founder_monthly',
          },
        },
      },
    }

    createAdminClientMock.mockReturnValue(admin)
    getStripeMock.mockReturnValue({
      webhooks: {
        constructEvent: vi.fn().mockReturnValue(event),
      },
      subscriptions: {
        retrieve: vi.fn().mockResolvedValue({
          id: 'sub_verified',
          customer: 'cus_verified',
          status: 'active',
          start_date: 1_779_120_000,
          billing_cycle_anchor: 1_781_712_000,
          cancel_at_period_end: false,
          schedule: null,
          items: {
            data: [
              {
                current_period_start: 1_779_120_000,
                current_period_end: 1_781_712_000,
              },
            ],
          },
        }),
      },
      subscriptionSchedules: {
        create: vi.fn().mockResolvedValue({
          id: 'sched_verified',
          current_phase: { start_date: 1_779_120_000 },
        }),
        update: vi.fn().mockResolvedValue({ id: 'sched_verified' }),
      },
    })

    const response = await POST(
      new Request('http://localhost/api/stripe/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'verified_sig' },
        body: JSON.stringify({ id: 'evt_checkout' }),
      }),
    )

    expect(response.status).toBe(200)
    expect(repsUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_customer_id: 'cus_verified',
        pricing_tier: 'founder',
        founder_sequence: 7,
      }),
    )
    expect(repsUpdateEq).toHaveBeenCalledWith('id', 'rep-founder')
    expect(subscriptionsUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        rep_id: 'rep-founder',
        stripe_subscription_id: 'sub_verified',
        pricing_tier: 'founder',
        founder_sequence: 7,
        build_fee_charged: true,
        founder_rate_months: 12,
        build_fee_price_id: 'price_build_fee',
        monthly_price_id: 'price_founder_monthly',
      }),
      { onConflict: 'stripe_subscription_id' },
    )
    expect(insertEventMock).toHaveBeenCalledWith({
      id: 'evt_checkout',
      event_type: 'checkout.session.completed',
    })
  })

  it('schedules founder subscriptions to step up to standard monthly pricing after 12 paid months', async () => {
    const repsUpdateEq = vi.fn().mockResolvedValue({ error: null })
    const repsUpdateMock = vi.fn(() => ({ eq: repsUpdateEq }))
    const subscriptionsUpsertMock = vi.fn().mockResolvedValue({ error: null })
    const insertEventMock = vi.fn().mockResolvedValue({ error: null })
    const admin = {
      from: vi.fn((table: string) => {
        if (table === 'stripe_events') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: null }),
              })),
            })),
            insert: insertEventMock,
          }
        }

        if (table === 'reps') {
          return {
            update: repsUpdateMock,
          }
        }

        if (table === 'subscriptions') {
          return {
            upsert: subscriptionsUpsertMock,
          }
        }

        throw new Error(`unexpected table ${table}`)
      }),
    }
    const event = {
      id: 'evt_founder_schedule',
      type: 'checkout.session.completed',
      livemode: false,
      created: 1_779_120_000,
      data: {
        object: {
          id: 'cs_founder_schedule',
          mode: 'subscription',
          subscription: 'sub_founder_schedule',
          metadata: {
            rep_id: 'rep-founder',
            plan_type: 'monthly',
            pricing_tier: 'founder',
            founder_sequence: '3',
            build_fee_charged: 'true',
            founder_rate_months: '12',
            build_fee_price_id: 'price_build_fee',
            monthly_price_id: 'price_founder_monthly',
          },
        },
      },
    }
    const createScheduleMock = vi.fn().mockResolvedValue({
      id: 'sched_founder',
      current_phase: {
        start_date: 1_779_120_000,
        end_date: 1_781_712_000,
      },
    })
    const updateScheduleMock = vi.fn().mockResolvedValue({ id: 'sched_founder' })

    createAdminClientMock.mockReturnValue(admin)
    getStripeMock.mockReturnValue({
      webhooks: {
        constructEvent: vi.fn().mockReturnValue(event),
      },
      subscriptions: {
        retrieve: vi.fn().mockResolvedValue({
          id: 'sub_founder_schedule',
          customer: 'cus_founder',
          status: 'active',
          start_date: 1_779_120_000,
          billing_cycle_anchor: 1_781_712_000,
          cancel_at_period_end: false,
          schedule: null,
          items: {
            data: [
              {
                current_period_start: 1_779_120_000,
                current_period_end: 1_781_712_000,
              },
            ],
          },
        }),
      },
      subscriptionSchedules: {
        create: createScheduleMock,
        update: updateScheduleMock,
      },
    })

    const response = await POST(
      new Request('http://localhost/api/stripe/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'verified_sig' },
        body: JSON.stringify({ id: 'evt_founder_schedule' }),
      }),
    )

    expect(response.status).toBe(200)
    expect(createScheduleMock).toHaveBeenCalledWith({
      from_subscription: 'sub_founder_schedule',
      metadata: expect.objectContaining({
        rep_id: 'rep-founder',
        pricing_tier: 'founder',
        founder_sequence: '3',
      }),
    })
    expect(updateScheduleMock).toHaveBeenCalledWith(
      'sched_founder',
      expect.objectContaining({
        end_behavior: 'release',
        phases: [
          expect.objectContaining({
            start_date: 1_779_120_000,
            duration: {
              interval: 'month',
              interval_count: 12,
            },
            items: [{ price: 'price_founder_monthly', quantity: 1 }],
          }),
          expect.objectContaining({
            items: [{ price: 'price_standard_monthly', quantity: 1 }],
          }),
        ],
      }),
    )
    expect(subscriptionsUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_subscription_id: 'sub_founder_schedule',
        stripe_subscription_schedule_id: 'sched_founder',
      }),
      { onConflict: 'stripe_subscription_id' },
    )
  })
})
