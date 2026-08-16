import { describe, expect, it, vi } from 'vitest'
import {
  clearConversation,
  getLatestConversationId,
  loadCanonicalHistory,
} from '@/lib/nic-nac/persistence'

describe('Nic-Nac cleared conversation persistence', () => {
  it('marks every row in the owned thread as cleared instead of deleting it', async () => {
    const complete = Promise.resolve({ error: null })
    const query = {
      update: vi.fn(),
      eq: vi.fn(),
      is: vi.fn(),
    }
    query.update.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    query.is.mockReturnValue(complete)
    const supabase = { from: vi.fn(() => query) }

    await clearConversation(supabase as never, {
      conversationId: 'conversation-1',
      repId: 'rep-1',
    })

    expect(supabase.from).toHaveBeenCalledWith('nic_nac_conversations')
    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({ cleared_at: expect.any(String) }),
    )
    expect(query.eq).toHaveBeenNthCalledWith(1, 'conversation_id', 'conversation-1')
    expect(query.eq).toHaveBeenNthCalledWith(2, 'rep_id', 'rep-1')
    expect(query.is).toHaveBeenCalledWith('cleared_at', null)
  })

  it('does not select a cleared thread as the rep’s latest conversation', async () => {
    const complete = Promise.resolve({
      data: { conversation_id: 'active-conversation' },
      error: null,
    })
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      is: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      maybeSingle: vi.fn(),
    }
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    query.is.mockReturnValue(query)
    query.order.mockReturnValue(query)
    query.limit.mockReturnValue(query)
    query.maybeSingle.mockReturnValue(complete)
    const supabase = { from: vi.fn(() => query) }

    await expect(getLatestConversationId(supabase as never, 'rep-1')).resolves.toBe(
      'active-conversation',
    )
    expect(query.is).toHaveBeenCalledWith('cleared_at', null)
  })

  it('does not hydrate a cleared thread from a stale conversation URL', async () => {
    const rows = [
      {
        message_id: 'message-1',
        role: 'user',
        parts: [{ type: 'text', text: 'old message' }],
        status: 'complete',
        created_at: '2026-08-16T12:00:00.000Z',
        cleared_at: '2026-08-16T12:05:00.000Z',
      },
    ]
    const complete = Promise.resolve({ data: rows, error: null })
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
    }
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    query.order.mockReturnValue(complete)
    const supabase = { from: vi.fn(() => query) }

    await expect(loadCanonicalHistory(supabase as never, 'conversation-1')).resolves.toEqual([])
  })
})
