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
  const eqId = vi.fn(() => ({ eq: eqRep }))
  const update = vi.fn(() => ({ eq: eqId }))
  return {
    api: { update },
    spies: { update, eqId, eqRep, eqStatus, is },
  }
}

function makeActiveSessionChain<T>(response: { data: T | null; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(response)
  const limit = vi.fn(() => ({ maybeSingle }))
  const order = vi.fn(() => ({ limit }))
  const is = vi.fn(() => ({ order }))
  const eqStatus = vi.fn(() => ({ is }))
  const eqRep = vi.fn(() => ({ eq: eqStatus }))
  const select = vi.fn(() => ({ eq: eqRep }))
  return {
    api: { select },
    spies: { select, eqRep, eqStatus, is, order, limit, maybeSingle },
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

function makeMaybeSingleChain<T>(response: { data: T | null; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(response)
  const eqRep = vi.fn(() => ({ maybeSingle }))
  const eqId = vi.fn(() => ({ eq: eqRep }))
  const select = vi.fn(() => ({ eq: eqId }))
  return {
    api: { select },
    spies: { select, eqId, eqRep, maybeSingle },
  }
}

describe('Nic-Nac show sessions', () => {
  it('reuses an active session with the same show anchor without writing', async () => {
    const activeChain = makeActiveSessionChain({
      data: {
        id: 'session-existing',
        rep_id: 'rep-1',
        calendar_event_id: 'event-1',
        live_queue_sync_code: 'SYNC123',
        status: 'active' as const,
        started_at: '2026-05-17T19:00:00.000Z',
        ended_at: null,
        summary: null,
        metadata: {},
        created_at: '2026-05-17T19:00:00.000Z',
        updated_at: '2026-05-17T19:00:00.000Z',
      },
      error: null,
    })
    const from = vi.fn().mockReturnValueOnce(activeChain.api)

    const result = await startNicNacShowSession(
      { from } as never,
      {
        repId: 'rep-1',
        calendarEventId: 'event-1',
        liveQueueSyncCode: 'SYNC123',
      },
    )

    expect(result.id).toBe('session-existing')
    expect(from).toHaveBeenCalledTimes(1)
  })

  it('refuses to close a different active session without an approved replacement', async () => {
    const activeChain = makeActiveSessionChain({
      data: {
        id: 'session-existing',
        rep_id: 'rep-1',
        calendar_event_id: 'event-old',
        live_queue_sync_code: 'SYNC-OLD',
        status: 'active' as const,
        started_at: '2026-05-17T19:00:00.000Z',
        ended_at: null,
        summary: null,
        metadata: {},
        created_at: '2026-05-17T19:00:00.000Z',
        updated_at: '2026-05-17T19:00:00.000Z',
      },
      error: null,
    })
    const from = vi.fn().mockReturnValueOnce(activeChain.api)

    await expect(
      startNicNacShowSession(
        { from } as never,
        {
          repId: 'rep-1',
          calendarEventId: 'event-new',
          liveQueueSyncCode: 'SYNC-NEW',
        },
      ),
    ).rejects.toMatchObject({ name: 'NicNacShowSessionConflictError' })

    expect(from).toHaveBeenCalledTimes(1)
  })

  it('starts a replacement session only for the expected active session', async () => {
    const activeChain = makeActiveSessionChain({
      data: {
        id: 'session-old',
        rep_id: 'rep-1',
        calendar_event_id: 'event-old',
        live_queue_sync_code: 'SYNC-OLD',
        status: 'active' as const,
        started_at: '2026-05-17T19:00:00.000Z',
        ended_at: null,
        summary: null,
        metadata: {},
        created_at: '2026-05-17T19:00:00.000Z',
        updated_at: '2026-05-17T19:00:00.000Z',
      },
      error: null,
    })
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
      .mockReturnValueOnce(activeChain.api)
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
        replaceActiveSession: true,
        expectedActiveSessionId: 'session-old',
      },
    )

    expect(from).toHaveBeenNthCalledWith(1, 'nic_nac_show_sessions')
    expect(activeChain.spies.eqRep).toHaveBeenCalledWith('rep_id', 'rep-1')
    expect(from).toHaveBeenNthCalledWith(2, 'nic_nac_show_sessions')
    expect(closeChain.spies.update).toHaveBeenCalledWith({
      status: 'ended',
      ended_at: '2026-05-17T20:00:00.000Z',
      updated_at: '2026-05-17T20:00:00.000Z',
    })
    expect(closeChain.spies.eqId).toHaveBeenCalledWith('id', 'session-old')
    expect(closeChain.spies.eqRep).toHaveBeenCalledWith('rep_id', 'rep-1')
    expect(closeChain.spies.eqStatus).toHaveBeenCalledWith('status', 'active')
    expect(closeChain.spies.is).toHaveBeenCalledWith('ended_at', null)

    expect(from).toHaveBeenNthCalledWith(3, 'nic_nac_show_sessions')
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
    const ownershipChain = makeMaybeSingleChain({
      data: { id: 'session-1' },
      error: null,
    })
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
    const from = vi
      .fn()
      .mockReturnValueOnce(ownershipChain.api)
      .mockReturnValueOnce(insertChain.api)

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

    expect(from).toHaveBeenNthCalledWith(1, 'nic_nac_show_sessions')
    expect(ownershipChain.spies.select).toHaveBeenCalledWith('id')
    expect(ownershipChain.spies.eqId).toHaveBeenCalledWith('id', 'session-1')
    expect(ownershipChain.spies.eqRep).toHaveBeenCalledWith('rep_id', 'rep-1')
    expect(from).toHaveBeenNthCalledWith(2, 'nic_nac_show_session_events')
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

  it('refuses to record a show-session event for a session the authenticated rep does not own', async () => {
    const ownershipChain = makeMaybeSingleChain({
      data: null,
      error: null,
    })
    const insertChain = makeInsertChain({
      data: {
        id: 'event-row-1',
        session_id: 'session-other-rep',
        rep_id: 'rep-1',
        event_type: 'follow_up',
        summary: 'This should not be saved.',
        payload: {},
        conversation_id: null,
        run_id: null,
        occurred_at: '2026-05-17T21:10:00.000Z',
        created_at: '2026-05-17T21:10:00.000Z',
      },
      error: null,
    })
    const from = vi.fn((table: string) =>
      table === 'nic_nac_show_sessions' ? ownershipChain.api : insertChain.api,
    )

    await expect(
      recordNicNacShowSessionEvent(
        { from } as never,
        {
          sessionId: 'session-other-rep',
          repId: 'rep-1',
          eventType: 'follow_up',
          summary: 'This should not be saved.',
          occurredAt: new Date('2026-05-17T21:10:00.000Z'),
        },
      ),
    ).rejects.toThrow('show session not found for authenticated rep')

    expect(from).toHaveBeenCalledWith('nic_nac_show_sessions')
    expect(ownershipChain.spies.eqId).toHaveBeenCalledWith(
      'id',
      'session-other-rep',
    )
    expect(ownershipChain.spies.eqRep).toHaveBeenCalledWith('rep_id', 'rep-1')
    expect(insertChain.spies.insert).not.toHaveBeenCalled()
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
