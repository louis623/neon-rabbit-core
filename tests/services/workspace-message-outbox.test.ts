import { describe, expect, it, vi } from 'vitest'
import {
  claimWorkspaceMessageOutboxEvents,
  completeWorkspaceMessageOutboxEvent,
  enqueueWorkspaceMessageOutboxEvent,
  failWorkspaceMessageOutboxEvent,
} from '@/lib/services/workspace-message-outbox'

function makeQuery(result: { data: unknown; error: unknown }) {
  const query: Record<string, unknown> = {}
  for (const method of [
    'select',
    'eq',
    'upsert',
    'update',
    'insert',
  ]) {
    query[method] = vi.fn(() => query)
  }
  query.single = vi.fn(async () => result)
  query.maybeSingle = vi.fn(async () => result)
  query.then = (
    resolve: (value: typeof result) => unknown,
    reject: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(resolve, reject)
  return query
}

const outboxRow = {
  id: 'event-1',
  event_type: 'customer_signup_created',
  idempotency_key: 'customer-signup:customer-1',
  payload: { audienceId: 'customer-1' },
  status: 'pending',
  attempt_count: 0,
  next_attempt_at: '2026-08-18T00:00:00.000Z',
  claimed_at: null,
  claimed_by: null,
  last_error: null,
  completed_at: null,
  created_at: '2026-08-18T00:00:00.000Z',
  updated_at: '2026-08-18T00:00:00.000Z',
}

describe('workspace message outbox service', () => {
  it('enqueues idempotently and returns the existing event when the insert conflicts', async () => {
    const insertQuery = makeQuery({ data: null, error: null })
    const existingQuery = makeQuery({ data: outboxRow, error: null })
    const from = vi
      .fn()
      .mockReturnValueOnce(insertQuery)
      .mockReturnValueOnce(existingQuery)
    const result = await enqueueWorkspaceMessageOutboxEvent(
      { from } as never,
      {
        eventType: 'customer_signup_created',
        idempotencyKey: 'customer-signup:customer-1',
        payload: { audienceId: 'customer-1' },
      },
    )
    expect(result.id).toBe('event-1')
    expect(insertQuery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotency_key: 'customer-signup:customer-1',
      }),
      { onConflict: 'idempotency_key', ignoreDuplicates: true },
    )
    expect(existingQuery.eq).toHaveBeenCalledWith(
      'idempotency_key',
      'customer-signup:customer-1',
    )
  })

  it('claims a bounded batch through the atomic database function', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          ...outboxRow,
          status: 'processing',
          attempt_count: 1,
          claimed_by: 'worker-1',
        },
      ],
      error: null,
    })
    const events = await claimWorkspaceMessageOutboxEvents(
      { rpc } as never,
      { workerId: 'worker-1', limit: 10 },
    )
    expect(rpc).toHaveBeenCalledWith('claim_workspace_message_outbox', {
      p_worker_id: 'worker-1',
      p_limit: 10,
    })
    expect(events).toMatchObject([
      { id: 'event-1', status: 'processing', attemptCount: 1 },
    ])
  })

  it('completes only an event claimed by the same worker', async () => {
    const query = makeQuery({
      data: { ...outboxRow, status: 'completed', completed_at: 'now' },
      error: null,
    })
    const result = await completeWorkspaceMessageOutboxEvent(
      { from: vi.fn(() => query) } as never,
      { eventId: 'event-1', workerId: 'worker-1' },
    )
    expect(query.eq).toHaveBeenCalledWith('status', 'processing')
    expect(query.eq).toHaveBeenCalledWith('claimed_by', 'worker-1')
    expect(result.status).toBe('completed')
  })

  it('records a bounded error and retry time only for the claiming worker', async () => {
    const query = makeQuery({
      data: {
        ...outboxRow,
        status: 'failed',
        last_error: 'provider unavailable',
      },
      error: null,
    })
    const result = await failWorkspaceMessageOutboxEvent(
      { from: vi.fn(() => query) } as never,
      {
        eventId: 'event-1',
        workerId: 'worker-1',
        error: new Error('provider unavailable'),
        retryAt: '2026-08-18T00:05:00.000Z',
      },
    )
    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        next_attempt_at: '2026-08-18T00:05:00.000Z',
        last_error: 'provider unavailable',
      }),
    )
    expect(result.status).toBe('failed')
  })
})
