import { describe, expect, it, vi } from 'vitest'

import {
  buildLiveQueueSnapshot,
  getLiveQueueSyncCodeForRep,
  getLiveQueueSnapshot,
  normalizeLiveQueue,
} from '@/lib/services/live-queue'

function makeLiveQueueSelectChain(response: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(response)
  const eqSync = vi.fn(() => ({ maybeSingle }))
  const eqRep = vi.fn(() => ({ eq: eqSync }))
  const select = vi.fn(() => ({ eq: eqRep }))
  const from = vi.fn(() => ({ select }))

  return {
    supabase: { from },
    spies: { from, select, eqRep, eqSync, maybeSingle },
  }
}

function makeLiveQueueSyncCodeChain(response: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(response)
  const limit = vi.fn(() => ({ maybeSingle }))
  const order = vi.fn(() => ({ limit }))
  const eqRep = vi.fn(() => ({ order }))
  const select = vi.fn(() => ({ eq: eqRep }))
  const from = vi.fn(() => ({ select }))

  return {
    supabase: { from },
    spies: { from, select, eqRep, order, limit, maybeSingle },
  }
}

describe('live queue service', () => {
  it('normalizes queue names without trusting malformed payload values', () => {
    expect(
      normalizeLiveQueue([' Alice ', null, '', 'Bo', 42, { nope: true }]),
    ).toEqual(['Alice', 'Bo', '42'])
  })

  it('builds a freshness snapshot from a live queue row', () => {
    const snapshot = buildLiveQueueSnapshot(
      {
        sync_code: 'SYNC123',
        queue: [' Jamie ', 'Ari', 'Mara'],
        last_updated: '2026-05-18T20:00:00.000Z',
      },
      {
        now: new Date('2026-05-18T20:01:30.000Z'),
        staleAfterSeconds: 180,
      },
    )

    expect(snapshot).toEqual({
      syncCode: 'SYNC123',
      queue: ['Jamie', 'Ari', 'Mara'],
      queueLength: 3,
      currentCustomer: 'Jamie',
      onDeckCustomer: 'Ari',
      lastUpdated: '2026-05-18T20:00:00.000Z',
      ageSeconds: 90,
      staleAfterSeconds: 180,
      isFresh: true,
    })
  })

  it('reads a queue snapshot by authenticated rep and sync code only', async () => {
    const chain = makeLiveQueueSelectChain({
      data: {
        sync_code: 'SYNC123',
        queue: ['Jamie'],
        last_updated: '2026-05-18T20:00:00.000Z',
      },
      error: null,
    })

    const snapshot = await getLiveQueueSnapshot(chain.supabase as never, {
      repId: 'rep-1',
      syncCode: 'SYNC123',
      now: new Date('2026-05-18T20:05:00.000Z'),
    })

    expect(chain.spies.from).toHaveBeenCalledWith('live_queue')
    expect(chain.spies.select).toHaveBeenCalledWith(
      'sync_code, queue, last_updated',
    )
    expect(chain.spies.eqRep).toHaveBeenCalledWith('rep_id', 'rep-1')
    expect(chain.spies.eqSync).toHaveBeenCalledWith('sync_code', 'SYNC123')
    expect(snapshot).toMatchObject({
      syncCode: 'SYNC123',
      currentCustomer: 'Jamie',
      isFresh: false,
    })
  })

  it('loads the assigned Live Queue sync code for setup without deriving it from rep id', async () => {
    const chain = makeLiveQueueSyncCodeChain({
      data: { sync_code: 'MHF-7342' },
      error: null,
    })

    await expect(
      getLiveQueueSyncCodeForRep(chain.supabase as never, 'rep-1'),
    ).resolves.toBe('MHF-7342')

    expect(chain.spies.from).toHaveBeenCalledWith('live_queue')
    expect(chain.spies.select).toHaveBeenCalledWith('sync_code')
    expect(chain.spies.eqRep).toHaveBeenCalledWith('rep_id', 'rep-1')
    expect(chain.spies.order).toHaveBeenCalledWith('created_at', {
      ascending: true,
    })
    expect(chain.spies.limit).toHaveBeenCalledWith(1)
  })

  it('does not query live_queue for missing or auto-generated anchors', async () => {
    const chain = makeLiveQueueSelectChain({ data: null, error: null })

    await expect(
      getLiveQueueSnapshot(chain.supabase as never, {
        repId: 'rep-1',
        syncCode: 'NIC-NAC-AUTO-conv-1',
      }),
    ).resolves.toBeNull()
    await expect(
      getLiveQueueSnapshot(chain.supabase as never, {
        repId: 'rep-1',
        syncCode: '',
      }),
    ).resolves.toBeNull()

    expect(chain.spies.from).not.toHaveBeenCalled()
  })
})
