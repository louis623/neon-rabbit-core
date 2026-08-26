import { beforeEach, describe, expect, it, vi } from 'vitest'

const listOperatorConversationsMock = vi.fn()

vi.mock('server-only', () => ({}))

vi.mock('@/lib/services/workspace-conversations', () => ({
  listOperatorConversations: (...args: unknown[]) =>
    listOperatorConversationsMock(...args),
}))

import {
  listReportedOperatorConversations,
  loadOperatorConversationReports,
} from '@/lib/control-center/operator-network-safety'

describe('Control Center Network Safety data boundaries', () => {
  beforeEach(() => {
    listOperatorConversationsMock.mockReset()
  })

  it('returns only conversations with an active safety report', async () => {
    const statusIn = vi.fn().mockReturnThis()
    const reportsBuilder = {
      select: vi.fn().mockReturnThis(),
      in: statusIn,
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          { conversation_id: 'conversation-1' },
          { conversation_id: 'conversation-1' },
          { conversation_id: 'conversation-2' },
        ],
        error: null,
      }),
    }
    const supabase = {
      from: vi.fn().mockReturnValue(reportsBuilder),
    }
    listOperatorConversationsMock.mockResolvedValueOnce({
      conversations: [
        { id: 'conversation-1', subject: 'Reported' },
        { id: 'conversation-3', subject: 'Private and unreported' },
      ],
      nextCursor: null,
    })

    const result = await listReportedOperatorConversations(
      supabase as never,
      { limit: 50 },
    )

    expect(statusIn).toHaveBeenCalledWith('status', ['open', 'reviewing'])
    expect(result.conversations).toEqual([
      { id: 'conversation-1', subject: 'Reported', reportedCount: 2 },
    ])
    expect(listOperatorConversationsMock).toHaveBeenCalledWith(supabase, {
      type: 'rep_direct',
      reportedOnly: true,
      limit: 50,
    })
  })

  it('loads report reasons without exposing rep email addresses', async () => {
    const reportsBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'report-1',
            reason: 'spam',
            details: 'Repeated unsolicited messages',
            status: 'open',
            message_id: 'message-1',
            reporter_rep_id: 'rep-1',
            created_at: '2026-08-26T12:00:00.000Z',
          },
        ],
        error: null,
      }),
    }
    const repsBuilder = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'rep-1',
            display_name: 'Avery',
            business_name: 'Avery Sparkles',
            email: 'must-not-leak@example.com',
          },
        ],
        error: null,
      }),
    }
    const supabase = {
      from: vi.fn((table: string) =>
        table === 'workspace_conversation_reports'
          ? reportsBuilder
          : repsBuilder,
      ),
    }

    const result = await loadOperatorConversationReports(
      supabase as never,
      'conversation-1',
    )

    expect(result).toEqual([
      {
        id: 'report-1',
        reason: 'spam',
        details: 'Repeated unsolicited messages',
        status: 'open',
        messageId: 'message-1',
        reporterLabel: 'Avery Sparkles',
        createdAt: '2026-08-26T12:00:00.000Z',
      },
    ])
    expect(JSON.stringify(result)).not.toContain('must-not-leak@example.com')
  })
})
