import { beforeEach, describe, expect, it, vi } from 'vitest'

const listRepWorkspaceMessagesMock = vi.fn()
const listRepConversationsMock = vi.fn()

vi.mock('server-only', () => ({}))
vi.mock('@/lib/services/workspace-messages', () => ({
  listRepWorkspaceMessages: (...args: unknown[]) =>
    listRepWorkspaceMessagesMock(...args),
}))
vi.mock('@/lib/services/workspace-conversations', () => ({
  listRepConversations: (...args: unknown[]) =>
    listRepConversationsMock(...args),
}))

import { listRepWorkspaceInbox } from '@/lib/services/workspace-inbox'

describe('workspace inbox composite pagination', () => {
  beforeEach(() => {
    listRepWorkspaceMessagesMock.mockReset()
    listRepConversationsMock.mockReset()
  })

  it('uses the last merged item as a stable cross-stream keyset', async () => {
    listRepWorkspaceMessagesMock.mockResolvedValueOnce({
      messages: [
        {
          id: 'publication-2',
          deliveredAt: '2026-08-26T14:00:00.000Z',
          isRead: true,
        },
        {
          id: 'publication-1',
          deliveredAt: '2026-08-26T13:00:00.000Z',
          isRead: false,
        },
      ],
      unreadCount: 9,
      nextCursor: null,
    })
    listRepConversationsMock.mockResolvedValueOnce({
      messages: [
        {
          kind: 'conversation',
          id: 'conversation-2',
          lastMessageAt: '2026-08-26T15:00:00.000Z',
          unreadCount: 2,
        },
        {
          kind: 'conversation',
          id: 'conversation-1',
          lastMessageAt: '2026-08-26T14:30:00.000Z',
          unreadCount: 1,
        },
      ],
      unreadCount: 137,
      nextCursor: null,
    })

    const first = await listRepWorkspaceInbox({} as never, 'rep-1', {
      view: 'all',
      limit: 2,
    })

    expect(first.messages.map((message) => message.id)).toEqual([
      'conversation-2',
      'conversation-1',
    ])
    expect(first.unreadCount).toBe(146)
    expect(first.nextCursor).toEqual(expect.any(String))

    listRepWorkspaceMessagesMock.mockResolvedValueOnce({
      messages: [],
      unreadCount: 9,
      nextCursor: null,
    })
    listRepConversationsMock.mockResolvedValueOnce({
      messages: [],
      unreadCount: 137,
      nextCursor: null,
    })

    await listRepWorkspaceInbox({} as never, 'rep-1', {
      view: 'all',
      limit: 2,
      cursor: first.nextCursor!,
    })

    expect(listRepWorkspaceMessagesMock).toHaveBeenLastCalledWith(
      {},
      'rep-1',
      expect.objectContaining({
        limit: 3,
        beforeDeliveredAt: '2026-08-26T14:30:00.000Z',
        beforeId: 'conversation-1',
        equalTimestampMode: 'include_all',
      }),
    )
    expect(listRepConversationsMock).toHaveBeenLastCalledWith(
      {},
      'rep-1',
      expect.objectContaining({
        limit: 3,
        beforeLastMessageAt: '2026-08-26T14:30:00.000Z',
        beforeId: 'conversation-1',
        equalTimestampMode: 'same_kind',
      }),
    )
  })

  it('keeps publications after a conversation when timestamps tie', async () => {
    listRepWorkspaceMessagesMock.mockResolvedValueOnce({
      messages: [],
      unreadCount: 0,
      nextCursor: null,
    })
    listRepConversationsMock.mockResolvedValueOnce({
      messages: [],
      unreadCount: 0,
      nextCursor: null,
    })
    const cursor = Buffer.from(JSON.stringify({
      lastMessageAt: '2026-08-26T14:30:00.000Z',
      itemKind: 'publication',
      id: 'publication-2',
    })).toString('base64url')

    await listRepWorkspaceInbox({} as never, 'rep-1', { cursor })

    expect(listRepWorkspaceMessagesMock).toHaveBeenLastCalledWith(
      {},
      'rep-1',
      expect.objectContaining({ equalTimestampMode: 'same_kind' }),
    )
    expect(listRepConversationsMock).toHaveBeenLastCalledWith(
      {},
      'rep-1',
      expect.objectContaining({ equalTimestampMode: 'exclude_all' }),
    )
  })
})
