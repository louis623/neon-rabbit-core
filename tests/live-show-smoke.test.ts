import { describe, expect, it, vi } from 'vitest'

import { runLiveShowSmoke } from '@/lib/launch-readiness/live-show-smoke'

const freshQueue = {
  syncCode: 'LIVE123',
  queue: ['Jamie', 'Ari'],
  queueLength: 2,
  currentCustomer: 'Jamie',
  onDeckCustomer: 'Ari',
  lastUpdated: '2026-05-26T17:59:00.000Z',
  ageSeconds: 60,
  staleAfterSeconds: 180,
  isFresh: true,
}

function makeDependencies(queue: typeof freshQueue | null = freshQueue) {
  return {
    buildPreShowReminderPlan: vi.fn(async () => ({
      plannedCount: 2,
      dryRun: true,
      plans: [
        {
          eventId: 'show-1',
          repId: 'rep-1',
          recipient: '+12025550143',
          channel: 'sms' as const,
        },
      ],
    })),
    loadLiveQueueSnapshot: vi.fn(async () => queue),
    submitCustomerSiteAction: vi.fn(async () => ({
      action: 'trade_request_submitted',
      requestId: 'request-1',
      listingId: 'listing-1',
      customerName: 'Jamie',
    })),
    recordShowSessionEvent: vi.fn(async () => ({
      eventId: 'event-1',
      eventType: 'customer_request',
      summary: 'Jamie requested a trade during the live show.',
    })),
    loadFulfillmentStatus: vi.fn(async () => ({
      status: 'approved',
      fulfillmentId: 'fulfillment-1',
      requestId: 'request-1',
      nextAction: 'ship_trade',
    })),
  }
}

describe('live show smoke', () => {
  it('composes the provider-free live show path in order', async () => {
    const calls: string[] = []
    const dependencies = makeDependencies()
    dependencies.buildPreShowReminderPlan.mockImplementation(async () => {
      calls.push('reminders')
      return { plannedCount: 2, dryRun: true, plans: [] }
    })
    dependencies.loadLiveQueueSnapshot.mockImplementation(async () => {
      calls.push('queue')
      return freshQueue
    })
    dependencies.submitCustomerSiteAction.mockImplementation(async () => {
      calls.push('customer-site')
      return {
        action: 'trade_request_submitted',
        requestId: 'request-1',
        listingId: 'listing-1',
        customerName: 'Jamie',
      }
    })
    dependencies.recordShowSessionEvent.mockImplementation(async () => {
      calls.push('show-session')
      return {
        eventId: 'event-1',
        eventType: 'customer_request',
        summary: 'Jamie requested a trade during the live show.',
      }
    })
    dependencies.loadFulfillmentStatus.mockImplementation(async () => {
      calls.push('fulfillment')
      return {
        status: 'approved',
        fulfillmentId: 'fulfillment-1',
        requestId: 'request-1',
        nextAction: 'ship_trade',
      }
    })

    const report = await runLiveShowSmoke({
      repId: 'rep-1',
      sessionId: 'session-1',
      syncCode: 'LIVE123',
      now: new Date('2026-05-26T18:00:00.000Z'),
      dependencies,
    })

    expect(calls).toEqual([
      'reminders',
      'queue',
      'customer-site',
      'show-session',
      'fulfillment',
    ])
    expect(report).toMatchObject({
      ok: true,
      queueState: 'fresh',
      providerActions: {
        sendSms: false,
        sendEmail: false,
        chargeStripe: false,
        sendSignWellLiveAgreement: false,
        callPhotoroom: false,
        callPostHog: false,
      },
    })
    expect(report.steps.map((step) => step.id)).toEqual([
      'pre_show_reminders',
      'live_queue_snapshot',
      'customer_site_action',
      'nic_nac_show_session_event',
      'fulfillment_status',
    ])
    expect(report.steps.every((step) => step.ok)).toBe(true)
    expect(report.nextEvidenceSuggestions).toContain(
      'Attach this report to the live-show Phase 11 evidence bundle.',
    )
  })

  it('reports empty queue state without running customer or fulfillment actions', async () => {
    const dependencies = makeDependencies(null)

    const report = await runLiveShowSmoke({
      repId: 'rep-1',
      sessionId: 'session-1',
      syncCode: 'LIVE123',
      dependencies,
    })

    expect(report.ok).toBe(false)
    expect(report.queueState).toBe('empty')
    expect(dependencies.submitCustomerSiteAction).not.toHaveBeenCalled()
    expect(dependencies.recordShowSessionEvent).not.toHaveBeenCalled()
    expect(dependencies.loadFulfillmentStatus).not.toHaveBeenCalled()
    expect(report.nextEvidenceSuggestions).toContain(
      'Capture a fresh live queue snapshot with at least one customer before launch signoff.',
    )
  })

  it('reports stale queue state and preserves the rest of the dry-run path', async () => {
    const dependencies = makeDependencies({
      ...freshQueue,
      ageSeconds: 301,
      isFresh: false,
    })

    const report = await runLiveShowSmoke({
      repId: 'rep-1',
      sessionId: 'session-1',
      syncCode: 'LIVE123',
      dependencies,
    })

    expect(report.ok).toBe(false)
    expect(report.queueState).toBe('stale')
    expect(dependencies.submitCustomerSiteAction).toHaveBeenCalled()
    expect(dependencies.recordShowSessionEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'customer_request',
        payload: expect.objectContaining({
          queueState: 'stale',
        }),
      }),
    )
    expect(report.nextEvidenceSuggestions).toContain(
      'Refresh the live queue sync and rerun the composed smoke while the queue is fresh.',
    )
  })

  it('never calls provider actions even when dependency options are inspected', async () => {
    const forbiddenProviderAction = vi.fn()
    const dependencies = {
      ...makeDependencies(),
      sendSms: forbiddenProviderAction,
      sendEmail: forbiddenProviderAction,
      chargeStripe: forbiddenProviderAction,
      sendSignWellLiveAgreement: forbiddenProviderAction,
      callPhotoroom: forbiddenProviderAction,
      callPostHog: forbiddenProviderAction,
    }

    const report = await runLiveShowSmoke({
      repId: 'rep-1',
      sessionId: 'session-1',
      syncCode: 'LIVE123',
      dependencies,
    })

    expect(forbiddenProviderAction).not.toHaveBeenCalled()
    expect(Object.values(report.providerActions)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
    ])
  })
})
