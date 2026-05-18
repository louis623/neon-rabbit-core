import { describe, expect, it, vi } from 'vitest'

import {
  buildNicNacShowSessionContext,
  recordNicNacShowSessionEvent,
  startNicNacShowSession,
} from '@/lib/nic-nac/show-sessions'

function makeUpdateChain(response: { error: unknown }) {
  const is = vi.fn().mockResolvedValue(response)
  const eqStatus = vi.fn(() => ({ is }))
  const eqRep = vi.fn(() => ({ eq: eqStatus }))
  const update = vi.fn(() => ({ eq: eqRep }))
  return {
    api: { update },
    spies: { update, eqRep, eqStatus, is },
  }
}

function makeInsertChain<T>(response: { data: T | null; error: unknown }) {
  const single = vi.fn().mockResolvedValue(response)
  const select = vi.fn(() => ({ single }))
  const insert = vi.fn(() => ({ select }))
  return {
    api: { insert },
    spies: { insert, select, single },
  }
}

describe('Nic-Nac show sessions', () => {
  it('starts a durable show session after closing any prior active session for the rep', async () => {
    const closeChain = makeUpdateChain({ error: null })
    const insertChain = makeInsertChain({
      data: {
        id: 'session-1',
        rep_id: 'rep-1',
        calendar_event_id: 'event-1',
        live_queue_sync_code: 'SYNC123',
        status: 'active',
        started_at: '2026-05-17T20:00:00.000Z',
        ended_at: null,
        summary: null,
        metadata: { platform: 'TikTok' },
        created_at: '2026-05-17T20:00:00.000Z',
        updated_at: '2026-05-17T20:00:00.000Z',
      },
      error: null,
    })
    const from = vi
      .fn()
      .mockReturnValueOnce(closeChain.api)
      .mockReturnValueOnce(insertChain.api)

    const result = await startNicNacShowSession(
      { from } as never,
      {
        repId: 'rep-1',
        calendarEventId: 'event-1',
        liveQueueSyncCode: 'SYNC123',
        startedAt: new Date('2026-05-17T20:00:00.000Z'),
        metadata: { platform: 'TikTok' },
      },
    )

    expect(from).toHaveBeenNthCalledWith(1, 'nic_nac_show_sessions')
    expect(closeChain.spies.update).toHaveBeenCalledWith({
      status: 'ended',
      ended_at: '2026-05-17T20:00:00.000Z',
      updated_at: '2026-05-17T20:00:00.000Z',
    })
    expect(closeChain.spies.eqRep).toHaveBeenCalledWith('rep_id', 'rep-1')
    expect(closeChain.spies.eqStatus).toHaveBeenCalledWith('status', 'active')
    expect(closeChain.spies.is).toHaveBeenCalledWith('ended_at', null)

    expect(from).toHaveBeenNthCalledWith(2, 'nic_nac_show_sessions')
    expect(insertChain.spies.insert).toHaveBeenCalledWith({
      rep_id: 'rep-1',
      calendar_event_id: 'event-1',
      live_queue_sync_code: 'SYNC123',
      status: 'active',
      started_at: '2026-05-17T20:00:00.000Z',
      metadata: { platform: 'TikTok' },
    })
    expect(result).toMatchObject({
      id: 'session-1',
      repId: 'rep-1',
      status: 'active',
      liveQueueSyncCode: 'SYNC123',
    })
  })

  it('records structured current-show events without calling any model or provider API', async () => {
    const insertChain = makeInsertChain({
      data: {
        id: 'event-row-1',
        session_id: 'session-1',
        rep_id: 'rep-1',
        event_type: 'follow_up',
        summary: 'Check whether Jamie still wants the blue ring after the show.',
        payload: { customerName: 'Jamie' },
        conversation_id: 'conv-1',
        run_id: 'run-1',
        occurred_at: '2026-05-17T21:10:00.000Z',
        created_at: '2026-05-17T21:10:00.000Z',
      },
      error: null,
    })
    const from = vi.fn(() => insertChain.api)

    const result = await recordNicNacShowSessionEvent(
      { from } as never,
      {
        sessionId: 'session-1',
        repId: 'rep-1',
        eventType: 'follow_up',
        summary: 'Check whether Jamie still wants the blue ring after the show.',
        payload: { customerName: 'Jamie' },
        conversationId: 'conv-1',
        runId: 'run-1',
        occurredAt: new Date('2026-05-17T21:10:00.000Z'),
      },
    )

    expect(from).toHaveBeenCalledWith('nic_nac_show_session_events')
    expect(insertChain.spies.insert).toHaveBeenCalledWith({
      session_id: 'session-1',
      rep_id: 'rep-1',
      event_type: 'follow_up',
      summary: 'Check whether Jamie still wants the blue ring after the show.',
      payload: { customerName: 'Jamie' },
      conversation_id: 'conv-1',
      run_id: 'run-1',
      occurred_at: '2026-05-17T21:10:00.000Z',
    })
    expect(result).toMatchObject({
      id: 'event-row-1',
      eventType: 'follow_up',
      repId: 'rep-1',
    })
  })

  it('builds a zero-credit two-show continuity context without cross-rep leakage', () => {
    const context = buildNicNacShowSessionContext({
      repId: 'rep-1',
      activeSession: {
        id: 'session-2',
        repId: 'rep-1',
        calendarEventId: 'event-2',
        liveQueueSyncCode: 'SYNC123',
        status: 'active',
        startedAt: '2026-05-18T20:00:00.000Z',
        endedAt: null,
        summary: null,
        metadata: {},
        createdAt: '2026-05-18T20:00:00.000Z',
        updatedAt: '2026-05-18T20:00:00.000Z',
      },
      recentEvents: [
        {
          id: 'event-row-1',
          sessionId: 'session-2',
          repId: 'rep-1',
          eventType: 'follow_up',
          summary: 'Ask Jamie about the blue ring.',
          payload: {},
          conversationId: null,
          runId: null,
          occurredAt: '2026-05-18T20:15:00.000Z',
          createdAt: '2026-05-18T20:15:00.000Z',
        },
        {
          id: 'other-rep-event',
          sessionId: 'session-other',
          repId: 'rep-2',
          eventType: 'follow_up',
          summary: 'Other rep private note.',
          payload: {},
          conversationId: null,
          runId: null,
          occurredAt: '2026-05-18T20:16:00.000Z',
          createdAt: '2026-05-18T20:16:00.000Z',
        },
      ],
      memoryNotes: [
        {
          repId: 'rep-1',
          summary: 'Rep prefers low-hype reminder language.',
          memoryType: 'preference',
          memorySource: 'explicit',
          conversationDate: '2026-05-17T22:00:00.000Z',
        },
        {
          repId: 'rep-1',
          summary: 'Show 1 ended with two customer follow-ups.',
          memoryType: 'show_summary',
          memorySource: 'automatic_high_signal',
          conversationDate: '2026-05-17T23:00:00.000Z',
        },
        {
          repId: 'rep-2',
          summary: 'Other rep private preference.',
          memoryType: 'preference',
          memorySource: 'explicit',
          conversationDate: '2026-05-17T23:00:00.000Z',
        },
      ],
      liveQueueSnapshot: {
        syncCode: 'SYNC123',
        queue: ['Jamie', 'Ari'],
        queueLength: 2,
        currentCustomer: 'Jamie',
        onDeckCustomer: 'Ari',
        lastUpdated: '2026-05-18T20:10:00.000Z',
        ageSeconds: 30,
        staleAfterSeconds: 180,
        isFresh: true,
      },
    })

    expect(context.activeSession?.id).toBe('session-2')
    expect(context.recentEvents.map((event) => event.summary)).toEqual([
      'Ask Jamie about the blue ring.',
    ])
    expect(context.memory.preferences).toEqual([
      'Rep prefers low-hype reminder language.',
    ])
    expect(context.memory.previousShowSummaries).toEqual([
      'Show 1 ended with two customer follow-ups.',
    ])
    expect(context.liveQueueSnapshot).toMatchObject({
      syncCode: 'SYNC123',
      currentCustomer: 'Jamie',
      onDeckCustomer: 'Ari',
      isFresh: true,
    })
    expect(JSON.stringify(context)).not.toContain('Other rep private')
  })

  it('does not attach a queue snapshot from another show anchor', () => {
    const context = buildNicNacShowSessionContext({
      repId: 'rep-1',
      activeSession: {
        id: 'session-2',
        repId: 'rep-1',
        calendarEventId: null,
        liveQueueSyncCode: 'SYNC123',
        status: 'active',
        startedAt: '2026-05-18T20:00:00.000Z',
        endedAt: null,
        summary: null,
        metadata: {},
        createdAt: '2026-05-18T20:00:00.000Z',
        updatedAt: '2026-05-18T20:00:00.000Z',
      },
      recentEvents: [],
      memoryNotes: [],
      liveQueueSnapshot: {
        syncCode: 'OTHER',
        queue: ['Other'],
        queueLength: 1,
        currentCustomer: 'Other',
        onDeckCustomer: null,
        lastUpdated: '2026-05-18T20:10:00.000Z',
        ageSeconds: 30,
        staleAfterSeconds: 180,
        isFresh: true,
      },
    })

    expect(context.liveQueueSnapshot).toBeNull()
  })
})
