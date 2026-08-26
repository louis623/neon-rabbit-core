import { describe, expect, it, vi } from 'vitest'

import {
  getOperatorConversation,
  listOperatorConversations,
} from '@/lib/services/workspace-conversations'

describe('operator Support inbox identity and unread state', () => {
  it('uses requester identity and the Support queue unread count in summaries', async () => {
    const conversationBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'conversation-1',
            conversation_type: 'support',
            state: 'open',
            subject: 'Calendar issue',
            context_snapshot: {},
            last_message_at: '2026-08-26T12:00:00.000Z',
            latest_message_preview: 'Received by Sparkle Suite Support',
            latest_message_sender_display_name: 'Sparkle Suite Support',
            updated_at: '2026-08-26T12:00:00.000Z',
          },
        ],
        error: null,
      }),
    }
    const supportReports = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'support-1',
            workspace_conversation_id: 'conversation-1',
            status: 'open',
            report_type: 'help_question',
            urgency: 'normal',
            title: 'Calendar issue',
            audit_status: 'pending',
            created_at: '2026-08-26T12:00:00.000Z',
            client_snapshot: {},
            sparkle_suite_bug_hunt_items: [],
          },
        ],
        error: null,
      }),
    }
    const moderationReports = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    const participants = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [
          {
            conversation_id: 'conversation-1',
            principal_type: 'rep',
            role: 'requester',
            unread_count: 0,
            rep: { display_name: 'Jamie', business_name: 'Jamie Sparkles' },
          },
          {
            conversation_id: 'conversation-1',
            principal_type: 'support_queue',
            role: 'support',
            unread_count: 3,
            rep: null,
          },
        ],
        error: null,
      }),
    }
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'workspace_conversations') return conversationBuilder
        if (table === 'support_reports') return supportReports
        if (table === 'workspace_conversation_reports') return moderationReports
        return participants
      }),
    }

    const result = await listOperatorConversations(supabase as never, {
      type: 'support',
      limit: 25,
    })

    expect(result.conversations[0]).toMatchObject({
      id: 'conversation-1',
      unreadCount: 3,
      participantLabels: ['Jamie Sparkles'],
    })
    expect(result.conversations[0].participantLabels).not.toContain(
      'Sparkle Suite Support',
    )
  })

  it('marks the Support queue participant read when an operator opens detail', async () => {
    const participantReadUpdate = vi.fn()
    const participants = {
      select: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({
          data: [
            {
              conversation_id: 'conversation-1',
              principal_type: 'rep',
              role: 'requester',
              unread_count: 0,
              rep: { display_name: 'Jamie', business_name: 'Jamie Sparkles' },
            },
            {
              conversation_id: 'conversation-1',
              principal_type: 'support_queue',
              role: 'support',
              unread_count: 2,
              rep: null,
            },
          ],
          error: null,
        }),
      })),
      update: participantReadUpdate.mockImplementation(() => {
        let equalityCount = 0
        const chain = {
          eq: vi.fn(() => {
            equalityCount += 1
            return equalityCount === 2
              ? Promise.resolve({ error: null })
              : chain
          }),
        }
        return chain
      }),
    }
    const twoOrders = (data: unknown[]) => {
      let orderCount = 0
      const chain = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn(() => {
          orderCount += 1
          return orderCount === 2
            ? Promise.resolve({ data, error: null })
            : chain
        }),
      }
      return chain
    }
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'workspace_conversations') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'conversation-1',
                  conversation_type: 'support',
                  state: 'open',
                  subject: 'Calendar issue',
                  context_snapshot: {},
                  last_message_at: '2026-08-26T12:00:00.000Z',
                  latest_message_preview: 'Please help',
                  latest_message_sender_display_name: 'Jamie Sparkles',
                  updated_at: '2026-08-26T12:00:00.000Z',
                },
                error: null,
              }),
            })),
          }
        }
        if (table === 'workspace_conversation_messages') {
          return { select: vi.fn(() => twoOrders([])) }
        }
        if (table === 'support_reports') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            })),
          }
        }
        if (table === 'workspace_conversation_reports') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            })),
          }
        }
        if (table === 'workspace_conversation_attachments') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockReturnThis(),
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            })),
          }
        }
        return participants
      }),
    }

    const result = await getOperatorConversation(
      supabase as never,
      'conversation-1',
    )

    expect(result.conversation.participantLabels).toEqual(['Jamie Sparkles'])
    expect(result.conversation.unreadCount).toBe(0)
    expect(participantReadUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ unread_count: 0 }),
    )
  })
})
