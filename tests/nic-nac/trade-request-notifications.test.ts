import { beforeEach, describe, expect, it, vi } from 'vitest'

const getLatestConversationIdMock = vi.fn()
const randomUUIDMock = vi.fn(() => 'conv-new')

vi.mock('crypto', () => ({
  randomUUID: () => randomUUIDMock(),
}))

vi.mock('@/lib/nic-nac/persistence', () => ({
  getLatestConversationId: (...args: unknown[]) =>
    getLatestConversationIdMock(...args),
}))

import { notifyRepOfTradeRequest } from '@/lib/nic-nac/trade-request-notifications'

describe('notifyRepOfTradeRequest', () => {
  const upsert = vi.fn()
  const supabase = {
    from: vi.fn(() => ({ upsert })),
  } as unknown as {
    from: typeof upsert
  }

  beforeEach(() => {
    getLatestConversationIdMock.mockReset()
    randomUUIDMock.mockClear()
    upsert.mockReset()
  })

  it('writes a complete assistant message into the rep\'s latest conversation', async () => {
    getLatestConversationIdMock.mockResolvedValueOnce('conv-1')
    upsert.mockResolvedValueOnce({ error: null })

    await notifyRepOfTradeRequest(supabase as never, {
      requestId: 'req-1',
      repId: 'rep-1',
      customerName: 'Alice',
      customerDescription: 'Trading a birthday ring, size 8',
      listing: {
        id: 'listing-1',
        itemNumber: 'RG31452',
        designName: 'The Celeste Ring',
        collectionName: 'Birthday',
        typePrefix: 'RG',
        bpMsrp: 128,
      },
    })

    expect(getLatestConversationIdMock).toHaveBeenCalledWith(
      supabase,
      'rep-1',
    )
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        conversation_id: 'conv-1',
        message_id: 'trade-request-req-1',
        rep_id: 'rep-1',
        role: 'assistant',
        status: 'complete',
        parts: [
          {
            type: 'text',
            text: expect.stringContaining('New trade request from Alice'),
          },
        ],
      }),
      { onConflict: 'conversation_id,message_id', ignoreDuplicates: true },
    )

    const payload = upsert.mock.calls[0][0] as {
      parts: Array<{ type: string; text: string }>
    }
    expect(payload.parts[0].text).toContain('Birthday')
    expect(payload.parts[0].text).toContain('RG')
    expect(payload.parts[0].text).toContain('MSRP is reference only')
  })

  it('creates a fresh conversation id when the rep has no existing Nic-Nac thread yet', async () => {
    getLatestConversationIdMock.mockResolvedValueOnce(null)
    upsert.mockResolvedValueOnce({ error: null })

    await notifyRepOfTradeRequest(supabase as never, {
      requestId: 'req-1',
      repId: 'rep-1',
      customerName: 'Alice',
      customerDescription: 'Trading a birthday ring, size 8',
      listing: {
        id: 'listing-1',
        itemNumber: 'RG31452',
        designName: 'The Celeste Ring',
        collectionName: 'Birthday',
        typePrefix: 'RG',
        bpMsrp: 128,
      },
    })

    expect(randomUUIDMock).toHaveBeenCalledTimes(1)
    expect(upsert.mock.calls[0][0]).toMatchObject({
      conversation_id: 'conv-new',
    })
  })
})
