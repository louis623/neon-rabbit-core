import { beforeEach, describe, expect, it, vi } from 'vitest'

const claimEvents = vi.fn()
const completeEvent = vi.fn()
const failEvent = vi.fn()
const enqueueEvent = vi.fn()
const publishMessage = vi.fn()
const collectMonthly = vi.fn()
const saveSnapshot = vi.fn()
const attachPublication = vi.fn()

vi.mock('@/lib/services/workspace-message-outbox', () => ({
  claimWorkspaceMessageOutboxEvents: (...args: unknown[]) => claimEvents(...args),
  completeWorkspaceMessageOutboxEvent: (...args: unknown[]) => completeEvent(...args),
  failWorkspaceMessageOutboxEvent: (...args: unknown[]) => failEvent(...args),
  enqueueWorkspaceMessageOutboxEvent: (...args: unknown[]) => enqueueEvent(...args),
}))
vi.mock('@/lib/services/workspace-messages', () => ({
  publishWorkspaceMessage: (...args: unknown[]) => publishMessage(...args),
}))
vi.mock('@/lib/services/workspace-monthly-reports', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/services/workspace-monthly-reports')>()
  return {
    ...original,
    collectMonthlyReportData: (...args: unknown[]) => collectMonthly(...args),
    saveMonthlyReportSnapshot: (...args: unknown[]) => saveSnapshot(...args),
    attachMonthlyReportPublication: (...args: unknown[]) => attachPublication(...args),
  }
})

import { processWorkspaceMessageAutomation } from '@/lib/services/workspace-message-automation'

describe('workspace message automation', () => {
  beforeEach(() => {
    claimEvents.mockReset()
    completeEvent.mockReset()
    failEvent.mockReset()
    enqueueEvent.mockReset()
    publishMessage.mockReset()
    collectMonthly.mockReset()
    saveSnapshot.mockReset()
    attachPublication.mockReset()
    completeEvent.mockResolvedValue({})
    failEvent.mockResolvedValue({})
  })

  it('publishes one privacy-minimized customer signup message', async () => {
    claimEvents.mockResolvedValue([
      {
        id: 'event-1',
        eventType: 'customer_signup_created',
        idempotencyKey: 'customer-signup:aud-1',
        payload: {
          repId: 'rep-1',
          audienceId: 'aud-1',
          customerFirstName: 'Jamie',
          createdAt: '2026-08-17T20:00:00.000Z',
        },
        attemptCount: 0,
      },
    ])
    publishMessage.mockResolvedValue({ id: 'publication-1' })

    const result = await processWorkspaceMessageAutomation({
      supabase: { marker: 'admin' } as never,
      workerId: 'worker-1',
      now: new Date('2026-08-17T20:01:00.000Z'),
    })

    expect(result).toMatchObject({ claimed: 1, completed: 1, failed: 0 })
    expect(publishMessage).toHaveBeenCalledWith(
      { marker: 'admin' },
      expect.objectContaining({
        senderKey: 'customer_signup_notifier',
        category: 'customer_activity',
        audience: { kind: 'selected', repIds: ['rep-1'] },
        idempotencyKey: 'customer-signup:aud-1',
        actionUrl: '/nic-nac?section=customer-list&customer=aud-1',
      }),
    )
    const publishedInput = publishMessage.mock.calls[0][1]
    expect(JSON.stringify(publishedInput)).not.toContain('@')
    expect(JSON.stringify(publishedInput)).not.toContain('555')
    expect(completeEvent).toHaveBeenCalledWith(
      { marker: 'admin' },
      { eventId: 'event-1', workerId: 'worker-1' },
    )
  })

  it('fails malformed events into the retry lane instead of dropping them', async () => {
    claimEvents.mockResolvedValue([
      {
        id: 'event-bad',
        eventType: 'customer_signup_created',
        idempotencyKey: 'customer-signup:bad',
        payload: { repId: 'rep-1' },
        attemptCount: 1,
      },
    ])

    const result = await processWorkspaceMessageAutomation({
      supabase: { marker: 'admin' } as never,
      workerId: 'worker-1',
      now: new Date('2026-08-17T20:00:00.000Z'),
    })

    expect(result.failed).toBe(1)
    expect(completeEvent).not.toHaveBeenCalled()
    expect(failEvent).toHaveBeenCalledWith(
      { marker: 'admin' },
      expect.objectContaining({
        eventId: 'event-bad',
        workerId: 'worker-1',
        retryAt: '2026-08-17T20:04:00.000Z',
      }),
    )
  })

  it('publishes an immutable monthly snapshot and links its publication', async () => {
    claimEvents.mockResolvedValue([
      {
        id: 'event-monthly',
        eventType: 'monthly_report_due',
        idempotencyKey: 'monthly-report:rep-1:2026-08',
        payload: {
          repId: 'rep-1',
          timeZone: 'America/New_York',
          reportMonth: '2026-08-01',
          runAt: '2026-08-01T13:00:00.000Z',
        },
        attemptCount: 0,
      },
    ])
    collectMonthly.mockResolvedValue({
      period: {
        reportMonth: '2026-08-01',
        timeZone: 'America/New_York',
        previousMonthLabel: 'July 2026',
        currentMonthLabel: 'August 2026',
        periodStart: '2026-07-01T04:00:00.000Z',
        periodEnd: '2026-08-01T04:00:00.000Z',
        birthdayMonth: 8,
      },
      metrics: [{ key: 'customers_added', label: 'Customers added', value: 3, status: 'tracked' }],
      birthdays: [{ audienceId: 'aud-1', name: 'Jamie', month: 8, day: 12 }],
    })
    saveSnapshot.mockResolvedValue({ id: 'snapshot-1' })
    publishMessage.mockResolvedValue({ id: 'publication-1' })

    const result = await processWorkspaceMessageAutomation({
      supabase: { marker: 'admin' } as never,
      workerId: 'worker-1',
    })

    expect(result.completed).toBe(1)
    expect(publishMessage).toHaveBeenCalledWith(
      { marker: 'admin' },
      expect.objectContaining({
        senderKey: 'monthly_reporter',
        idempotencyKey: 'monthly-report:rep-1:2026-08',
        sourceId: 'snapshot-1',
      }),
    )
    expect(attachPublication).toHaveBeenCalledWith({
      supabase: { marker: 'admin' },
      snapshotId: 'snapshot-1',
      publicationId: 'publication-1',
    })
  })

  it('publishes a queued resource announcement and links the revision', async () => {
    claimEvents.mockResolvedValue([
      {
        id: 'event-resource',
        eventType: 'workspace_resource_published',
        idempotencyKey: 'resource-published:resource-1:2',
        payload: { resourceId: 'resource-1', revisionId: 'revision-2', version: 2 },
        attemptCount: 0,
      },
    ])
    publishMessage.mockResolvedValue({ id: 'publication-resource' })
    const revisionUpdate = vi.fn().mockResolvedValue({ error: null })
    const supabase = {
      from(table: string) {
        if (table === 'workspace_resources') {
          return {
            select: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    id: 'resource-1',
                    resource_key: 'trade-guide',
                    resource_type: 'blog',
                    title: 'Trade smarter',
                    summary: 'A practical Dance Floor guide.',
                    action_url: '/nic-nac?section=resources&resource=trade-guide',
                    video_url: null,
                    status: 'published',
                  },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'workspace_resource_revisions') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: async () => ({
                    data: {
                      id: 'revision-2',
                      version: 2,
                      change_summary: 'Added fulfillment tips.',
                      announcement_status: 'pending',
                    },
                    error: null,
                  }),
                }),
              }),
            }),
            update: () => ({ eq: revisionUpdate }),
          }
        }
        throw new Error(`Unexpected table ${table}`)
      },
    }

    const result = await processWorkspaceMessageAutomation({
      supabase: supabase as never,
      workerId: 'worker-1',
    })

    expect(result).toMatchObject({ claimed: 1, completed: 1, failed: 0 })
    expect(publishMessage).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({
        senderKey: 'resource_publisher',
        category: 'blog',
        audience: { kind: 'all_active' },
        idempotencyKey: 'resource-published:resource-1:2',
      }),
    )
    expect(revisionUpdate).toHaveBeenCalledWith('id', 'revision-2')
  })
})
