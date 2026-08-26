import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { listRepConversations } from '@/lib/services/workspace-conversations'

describe('canonical workspace conversation data service', () => {
  it('uses the joined database page and preserves its exact unread total', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'conversation-150',
          conversation_type: 'support',
          state: 'open',
          subject: 'A matching thread beyond the former membership cap',
          context_snapshot: {},
          last_message_at: '2026-08-26T15:00:00.000Z',
          latest_message_preview: 'Please help',
          latest_message_sender_display_name: 'Avery',
          updated_at: '2026-08-26T15:00:00.000Z',
          participant_id: 'participant-row-150',
          participant_role: 'requester',
          participant_membership_state: 'active',
          participant_last_read_at: null,
          participant_archived_at: null,
          participant_muted_at: null,
          participant_unread_count: 2,
          total_unread: '137',
        },
      ],
      error: null,
    })
    const supabase = { rpc } as never

    const result = await listRepConversations(supabase, 'rep-1', {
      view: 'support',
      limit: 250,
    })

    expect(rpc).toHaveBeenCalledWith('list_workspace_rep_conversation_page', {
      p_rep_id: 'rep-1',
      p_conversation_type: 'support',
      p_archived: false,
      p_limit: 250,
      p_before_last_message_at: null,
      p_before_id: null,
      p_equal_timestamp_mode: null,
    })
    expect(result.unreadCount).toBe(137)
    expect(result.messages).toEqual([
      expect.objectContaining({
        id: 'conversation-150',
        conversationType: 'support',
        unreadCount: 2,
      }),
    ])
  })

  it('does not infer unread from a truncated page', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null })
    const result = await listRepConversations({ rpc } as never, 'rep-1', {
      view: 'team',
    })

    expect(result).toEqual({ messages: [], unreadCount: 0, nextCursor: null })
  })
})
