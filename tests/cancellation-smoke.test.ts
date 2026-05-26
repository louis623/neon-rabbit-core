import { describe, expect, it, vi } from 'vitest'

import { runCancellationSmoke } from '@/lib/launch-readiness/cancellation-smoke'

const scheduledCancellation = {
  repId: 'rep-1',
  status: 'active',
  planType: 'monthly',
  currentPeriodEnd: '2026-06-01T00:00:00.000Z',
  cancelAtPeriodEnd: true,
  cancelledAt: null,
  livemode: false,
}

describe('cancellation smoke', () => {
  it('reports an offline subscription cancellation scheduled for period end', async () => {
    const loadSubscriptionState = vi.fn(async () => scheduledCancellation)

    const report = await runCancellationSmoke({
      repId: 'rep-1',
      now: new Date('2026-05-26T18:00:00.000Z'),
      dependencies: {
        loadSubscriptionState,
      },
    })

    expect(loadSubscriptionState).toHaveBeenCalledWith({
      repId: 'rep-1',
      now: new Date('2026-05-26T18:00:00.000Z'),
      providerFree: true,
    })
    expect(report).toMatchObject({
      ok: true,
      cancellationState: 'ends_at_period_end',
      providerActions: {
        retrieveStripeSubscription: false,
        cancelStripeSubscription: false,
        createStripeRefund: false,
        createBillingPortalSession: false,
        constructStripeWebhook: false,
      },
    })
    expect(report.steps.map((step) => step.id)).toEqual([
      'load_subscription_state',
      'end_of_period_state',
      'stripe_live_guard',
    ])
    expect(report.steps.every((step) => step.providerAction === false)).toBe(true)
    expect(report.steps[1].details).toMatchObject({
      currentPeriodEnd: '2026-06-01T00:00:00.000Z',
      cancelAtPeriodEnd: true,
      cancelledAt: null,
    })
  })

  it('never calls Stripe provider dependencies during the offline smoke', async () => {
    const forbiddenStripeCall = vi.fn()

    const report = await runCancellationSmoke({
      repId: 'rep-1',
      dependencies: {
        loadSubscriptionState: vi.fn(async () => scheduledCancellation),
        retrieveStripeSubscription: forbiddenStripeCall,
        cancelStripeSubscription: forbiddenStripeCall,
        createStripeRefund: forbiddenStripeCall,
        createBillingPortalSession: forbiddenStripeCall,
        constructStripeWebhook: forbiddenStripeCall,
      },
    })

    expect(forbiddenStripeCall).not.toHaveBeenCalled()
    expect(Object.values(report.providerActions)).toEqual([
      false,
      false,
      false,
      false,
      false,
    ])
  })
})
