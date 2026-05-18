import { beforeEach, describe, expect, it, vi } from 'vitest'

const getStripeConfigMock = vi.fn()
const getStripeMock = vi.fn()
const createAdminClientMock = vi.fn()

vi.mock('@/lib/stripe/config', () => ({
  getStripeConfig: (...args: unknown[]) => getStripeConfigMock(...args),
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
    getStripeMock.mockReset()
    createAdminClientMock.mockReset()
    getStripeConfigMock.mockReturnValue({
      STRIPE_WEBHOOK_SECRET: 'whsec_test',
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
})
