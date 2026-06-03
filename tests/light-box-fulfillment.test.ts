import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendLouisAlertMock = vi.fn()

vi.mock('@/lib/ops/louis-alerts', () => ({
  sendLouisAlert: (...args: unknown[]) => sendLouisAlertMock(...args),
}))

import { createLightBoxFulfillmentTask } from '@/lib/self-serve/light-box-fulfillment'

describe('createLightBoxFulfillmentTask', () => {
  beforeEach(() => {
    sendLouisAlertMock.mockReset()
    sendLouisAlertMock.mockResolvedValue({ delivered: true })
  })

  it('upserts a needs_order fulfillment task and alerts Louis', async () => {
    const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null })
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    const updateEqMock = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn(() => ({
      eq: updateEqMock,
    }))
    const admin = {
      from: vi.fn((table: string) => {
        if (table !== 'light_box_fulfillment_tasks') {
          throw new Error(`unexpected table ${table}`)
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: maybeSingleMock,
            })),
          })),
          upsert: upsertMock,
          update: updateMock,
        }
      }),
    }

    const result = await createLightBoxFulfillmentTask(
      {
        repId: 'rep-1',
        repEmail: 'britt@example.com',
        repName: 'Britt',
        stripeCheckoutSessionId: 'cs_123',
        stripeSubscriptionId: 'sub_123',
        paidAtIso: '2026-06-02T16:00:00.000Z',
        shippingName: 'Brittany Smith',
        shippingAddress: {
          line1: '123 Main St',
          city: 'Austin',
          state: 'TX',
          postal_code: '78701',
          country: 'US',
        },
      },
      admin as never,
    )

    expect(result).toEqual({ created: true, skipped: false })
    expect(upsertMock).toHaveBeenCalledWith(
      {
        rep_id: 'rep-1',
        stripe_checkout_session_id: 'cs_123',
        stripe_subscription_id: 'sub_123',
        status: 'needs_order',
        shipping_name: 'Brittany Smith',
        shipping_address: {
          line1: '123 Main St',
          city: 'Austin',
          state: 'TX',
          postal_code: '78701',
          country: 'US',
        },
        due_at: '2026-06-03T16:00:00.000Z',
        updated_at: expect.any(String),
      },
      { onConflict: 'stripe_checkout_session_id' },
    )
    expect(sendLouisAlertMock).toHaveBeenCalledWith({
      title: 'Order light box within 24 hours',
      severity: 'info',
      lines: [
        'Rep: Britt <britt@example.com>',
        'Rep ID: rep-1',
        'Checkout: cs_123',
        'Paid: 2026-06-02T16:00:00.000Z',
        'Due: 2026-06-03T16:00:00.000Z',
        'Ship to: Brittany Smith',
        '123 Main St, Austin, TX, 78701, US',
      ],
    })
    expect(updateMock).toHaveBeenCalledWith({
      alert_sent_at: expect.any(String),
      alert_error: null,
      updated_at: expect.any(String),
    })
    expect(updateEqMock).toHaveBeenCalledWith(
      'stripe_checkout_session_id',
      'cs_123',
    )
  })

  it('skips ordered tasks without reopening or sending another alert', async () => {
    const maybeSingleMock = vi.fn().mockResolvedValue({
      data: { status: 'ordered' },
      error: null,
    })
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    const admin = {
      from: vi.fn((table: string) => {
        if (table !== 'light_box_fulfillment_tasks') {
          throw new Error(`unexpected table ${table}`)
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: maybeSingleMock,
            })),
          })),
          upsert: upsertMock,
        }
      }),
    }

    const result = await createLightBoxFulfillmentTask(
      {
        repId: 'rep-1',
        repEmail: 'britt@example.com',
        repName: 'Britt',
        stripeCheckoutSessionId: 'cs_ordered',
        stripeSubscriptionId: 'sub_123',
        paidAtIso: '2026-06-02T16:00:00.000Z',
        shippingName: 'Brittany Smith',
        shippingAddress: {},
      },
      admin as never,
    )

    expect(result).toEqual({ created: false, skipped: true })
    expect(upsertMock).not.toHaveBeenCalled()
    expect(sendLouisAlertMock).not.toHaveBeenCalled()
  })

  it('retries alert delivery for existing needs_order tasks until an alert is recorded', async () => {
    const maybeSingleMock = vi.fn().mockResolvedValue({
      data: { status: 'needs_order', alert_sent_at: null },
      error: null,
    })
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    const updateEqMock = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn(() => ({
      eq: updateEqMock,
    }))
    const admin = {
      from: vi.fn((table: string) => {
        if (table !== 'light_box_fulfillment_tasks') {
          throw new Error(`unexpected table ${table}`)
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: maybeSingleMock,
            })),
          })),
          upsert: upsertMock,
          update: updateMock,
        }
      }),
    }

    const result = await createLightBoxFulfillmentTask(
      {
        repId: 'rep-1',
        repEmail: 'britt@example.com',
        repName: 'Britt',
        stripeCheckoutSessionId: 'cs_needs_order',
        stripeSubscriptionId: 'sub_123',
        paidAtIso: '2026-06-02T16:00:00.000Z',
        shippingName: 'Updated Name',
        shippingAddress: { line1: '456 Gem Ave' },
      },
      admin as never,
    )

    expect(result).toEqual({ created: false, skipped: false })
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_checkout_session_id: 'cs_needs_order',
        status: 'needs_order',
        shipping_name: 'Updated Name',
        shipping_address: { line1: '456 Gem Ave' },
      }),
      { onConflict: 'stripe_checkout_session_id' },
    )
    expect(sendLouisAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Order light box within 24 hours',
      }),
    )
    expect(updateMock).toHaveBeenCalledWith({
      alert_sent_at: expect.any(String),
      alert_error: null,
      updated_at: expect.any(String),
    })
    expect(updateEqMock).toHaveBeenCalledWith(
      'stripe_checkout_session_id',
      'cs_needs_order',
    )
  })

  it('does not resend Louis alerts for needs_order tasks that already recorded alert delivery', async () => {
    const maybeSingleMock = vi.fn().mockResolvedValue({
      data: {
        status: 'needs_order',
        alert_sent_at: '2026-06-02T16:05:00.000Z',
      },
      error: null,
    })
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn()
    const admin = {
      from: vi.fn((table: string) => {
        if (table !== 'light_box_fulfillment_tasks') {
          throw new Error(`unexpected table ${table}`)
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: maybeSingleMock,
            })),
          })),
          upsert: upsertMock,
          update: updateMock,
        }
      }),
    }

    const result = await createLightBoxFulfillmentTask(
      {
        repId: 'rep-1',
        repEmail: 'britt@example.com',
        repName: 'Britt',
        stripeCheckoutSessionId: 'cs_alerted',
        stripeSubscriptionId: 'sub_123',
        paidAtIso: '2026-06-02T16:00:00.000Z',
        shippingName: 'Updated Name',
        shippingAddress: { line1: '456 Gem Ave' },
      },
      admin as never,
    )

    expect(result).toEqual({ created: false, skipped: false })
    expect(sendLouisAlertMock).not.toHaveBeenCalled()
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('records alert errors and rethrows when Louis alert delivery fails', async () => {
    const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null })
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    const updateEqMock = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn(() => ({
      eq: updateEqMock,
    }))
    const admin = {
      from: vi.fn((table: string) => {
        if (table !== 'light_box_fulfillment_tasks') {
          throw new Error(`unexpected table ${table}`)
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: maybeSingleMock,
            })),
          })),
          upsert: upsertMock,
          update: updateMock,
        }
      }),
    }
    sendLouisAlertMock.mockRejectedValueOnce(new Error('telegram unavailable'))

    await expect(
      createLightBoxFulfillmentTask(
        {
          repId: 'rep-1',
          repEmail: 'britt@example.com',
          repName: 'Britt',
          stripeCheckoutSessionId: 'cs_alert_failure',
          stripeSubscriptionId: 'sub_123',
          paidAtIso: '2026-06-02T16:00:00.000Z',
          shippingName: 'Brittany Smith',
          shippingAddress: {},
        },
        admin as never,
      ),
    ).rejects.toThrow('telegram unavailable')

    expect(updateMock).toHaveBeenCalledWith({
      alert_error: 'telegram unavailable',
      updated_at: expect.any(String),
    })
    expect(updateEqMock).toHaveBeenCalledWith(
      'stripe_checkout_session_id',
      'cs_alert_failure',
    )
  })

  it('does not fail fulfillment when alert delivery succeeds but recording alert_sent_at fails', async () => {
    const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null })
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    const updateEqMock = vi.fn().mockResolvedValue({
      error: { message: 'database unavailable' },
    })
    const updateMock = vi.fn(() => ({
      eq: updateEqMock,
    }))
    const errorMock = vi.spyOn(console, 'error').mockImplementation(() => {})
    const admin = {
      from: vi.fn((table: string) => {
        if (table !== 'light_box_fulfillment_tasks') {
          throw new Error(`unexpected table ${table}`)
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: maybeSingleMock,
            })),
          })),
          upsert: upsertMock,
          update: updateMock,
        }
      }),
    }

    const result = await createLightBoxFulfillmentTask(
      {
        repId: 'rep-1',
        repEmail: 'britt@example.com',
        repName: 'Britt',
        stripeCheckoutSessionId: 'cs_alert_record_failure',
        stripeSubscriptionId: 'sub_123',
        paidAtIso: '2026-06-02T16:00:00.000Z',
        shippingName: 'Brittany Smith',
        shippingAddress: {},
      },
      admin as never,
    )

    expect(result).toEqual({ created: true, skipped: false })
    expect(sendLouisAlertMock).toHaveBeenCalledTimes(1)
    expect(errorMock).toHaveBeenCalledWith(
      '[light-box-fulfillment] Failed to record alert delivery:',
      { message: 'database unavailable' },
    )
  })

  it('records skipped alert delivery without marking alert_sent_at', async () => {
    const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null })
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    const updateEqMock = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn(() => ({
      eq: updateEqMock,
    }))
    const admin = {
      from: vi.fn((table: string) => {
        if (table !== 'light_box_fulfillment_tasks') {
          throw new Error(`unexpected table ${table}`)
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: maybeSingleMock,
            })),
          })),
          upsert: upsertMock,
          update: updateMock,
        }
      }),
    }
    sendLouisAlertMock.mockResolvedValueOnce({
      delivered: false,
      reason: 'telegram_not_configured',
    })

    const result = await createLightBoxFulfillmentTask(
      {
        repId: 'rep-1',
        repEmail: 'britt@example.com',
        repName: 'Britt',
        stripeCheckoutSessionId: 'cs_alert_skipped',
        stripeSubscriptionId: 'sub_123',
        paidAtIso: '2026-06-02T16:00:00.000Z',
        shippingName: 'Brittany Smith',
        shippingAddress: {},
      },
      admin as never,
    )

    expect(result).toEqual({ created: true, skipped: false })
    expect(updateMock).toHaveBeenCalledWith({
      alert_error: 'telegram_not_configured',
      updated_at: expect.any(String),
    })
    expect(updateMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        alert_sent_at: expect.any(String),
      }),
    )
  })

  it('resends the alert on retry after a previous alert failure left needs_order unalerted', async () => {
    const maybeSingleMock = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: { status: 'needs_order', alert_sent_at: null },
        error: null,
      })
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    const updateEqMock = vi.fn().mockResolvedValue({ error: null })
    const updateMock = vi.fn(() => ({
      eq: updateEqMock,
    }))
    const admin = {
      from: vi.fn((table: string) => {
        if (table !== 'light_box_fulfillment_tasks') {
          throw new Error(`unexpected table ${table}`)
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: maybeSingleMock,
            })),
          })),
          upsert: upsertMock,
          update: updateMock,
        }
      }),
    }
    const input = {
      repId: 'rep-1',
      repEmail: 'britt@example.com',
      repName: 'Britt',
      stripeCheckoutSessionId: 'cs_retry_alert',
      stripeSubscriptionId: 'sub_123',
      paidAtIso: '2026-06-02T16:00:00.000Z',
      shippingName: 'Brittany Smith',
      shippingAddress: {},
    }

    sendLouisAlertMock
      .mockRejectedValueOnce(new Error('telegram unavailable'))
      .mockResolvedValueOnce({ delivered: true })

    await expect(
      createLightBoxFulfillmentTask(input, admin as never),
    ).rejects.toThrow('telegram unavailable')

    const retryResult = await createLightBoxFulfillmentTask(input, admin as never)

    expect(retryResult).toEqual({ created: false, skipped: false })
    expect(sendLouisAlertMock).toHaveBeenCalledTimes(2)
    expect(updateMock).toHaveBeenCalledWith({
      alert_error: 'telegram unavailable',
      updated_at: expect.any(String),
    })
    expect(updateMock).toHaveBeenCalledWith({
      alert_sent_at: expect.any(String),
      alert_error: null,
      updated_at: expect.any(String),
    })
  })
})
