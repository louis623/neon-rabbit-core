import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMock = vi.fn()
const createRequestMock = vi.fn()
const getConversationMock = vi.fn()

vi.mock('@/lib/nic-nac/auth', () => ({
  AuthError: class AuthError extends Error {},
  getAuthenticatedNicNacContext: (...args: unknown[]) => authMock(...args),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ marker: 'admin' }),
}))
vi.mock('@/lib/services/workspace-rep-network', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/lib/services/workspace-rep-network')
  >()),
  createRepMessageRequest: (...args: unknown[]) => createRequestMock(...args),
}))
vi.mock('@/lib/services/workspace-conversations', () => ({
  getRepConversation: (...args: unknown[]) => getConversationMock(...args),
}))

import { POST } from '@/app/api/nic-nac/conversations/rep-requests/route'
import {
  buildSafeRepMessageRequestContext,
  moderateRepNetworkConversation,
} from '@/lib/services/workspace-rep-network'

const senderRepId = '00000000-0000-4000-8000-000000000001'
const recipientRepId = '00000000-0000-4000-8000-000000000002'

function request(body: Record<string, unknown>) {
  return new Request('http://localhost/api/nic-nac/conversations/rep-requests', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('Rep Network request security', () => {
  beforeEach(() => {
    authMock.mockReset()
    createRequestMock.mockReset()
    getConversationMock.mockReset()
  })

  it('rejects caller-authored context snapshots before authentication', async () => {
    const response = await POST(
      request({
        recipientRepId,
        body: 'Could we coordinate on this?',
        clientRequestId: 'request-1',
        contextType: 'rep_profile',
        contextSnapshot: {
          href: 'https://example.com/phish',
          privateEmail: 'do-not-store@example.com',
        },
      }),
    )

    expect(response.status).toBe(400)
    expect(authMock).not.toHaveBeenCalled()
    expect(createRequestMock).not.toHaveBeenCalled()
  })

  it('passes only validated context identifiers to the service', async () => {
    authMock.mockResolvedValueOnce({
      repId: senderRepId,
      rep: { display_name: 'Sender', business_name: 'Sender Sparkles' },
    })
    createRequestMock.mockResolvedValueOnce({
      conversationId: '00000000-0000-4000-8000-000000000099',
      state: 'pending',
      created: true,
    })
    getConversationMock.mockResolvedValueOnce({
      conversation: { id: '00000000-0000-4000-8000-000000000099' },
      messages: [],
    })

    const response = await POST(
      request({
        recipientRepId,
        body: 'Could we coordinate on this?',
        clientRequestId: 'request-2',
        contextType: 'rep_profile',
        contextId: recipientRepId,
      }),
    )

    expect(response.status).toBe(201)
    expect(createRequestMock).toHaveBeenCalledWith(
      { marker: 'admin' },
      {
        senderRepId,
        senderDisplayName: 'Sender Sparkles',
        recipientRepId,
        body: 'Could we coordinate on this?',
        clientRequestId: 'request-2',
        contextType: 'rep_profile',
        contextId: recipientRepId,
      },
    )
  })

  it('constructs a bounded profile context instead of accepting display metadata', async () => {
    const context = await buildSafeRepMessageRequestContext({} as never, {
      senderRepId,
      recipientRepId,
      recipientLabel: 'Recipient Sparkles'.repeat(20),
      contextType: 'rep_profile',
      contextId: recipientRepId,
    })

    expect(context).toEqual({
      type: 'rep_profile',
      id: recipientRepId,
      snapshot: {
        label: 'Rep Network',
        value: expect.any(String),
        href: '/nic-nac?section=messages&view=rep-network',
        source: 'rep_profile',
      },
    })
    expect(context.snapshot.value.length).toBeLessThanOrEqual(160)
    expect(JSON.stringify(context)).not.toContain('example.com')
  })

  it('rejects a profile context that points at another rep', async () => {
    await expect(
      buildSafeRepMessageRequestContext({} as never, {
        senderRepId,
        recipientRepId,
        recipientLabel: 'Recipient Sparkles',
        contextType: 'rep_profile',
        contextId: '00000000-0000-4000-8000-000000000003',
      }),
    ).rejects.toMatchObject({ code: 'REP_NETWORK_CONTEXT_NOT_FOUND' })
  })
})

describe('Rep Network moderation write integrity', () => {
  it('does not return success when the message-removal write fails', async () => {
    const auditInsert = vi.fn()
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'workspace_conversations') {
          const chain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'conversation-1', conversation_type: 'rep_direct', state: 'open' },
              error: null,
            }),
          }
          return chain
        }
        if (table === 'workspace_conversation_reports') {
          const chain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'report-1' }, error: null }),
          }
          return chain
        }
        if (table === 'workspace_conversation_messages') {
          return {
            select: vi.fn(() => {
              const chain = {
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'message-1', sender_rep_id: senderRepId },
                  error: null,
                }),
              }
              return chain
            }),
            update: vi.fn(() => {
              const chain = {
                eq: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'write failed' },
                }),
              }
              return chain
            }),
          }
        }
        return { insert: auditInsert }
      }),
    }

    await expect(
      moderateRepNetworkConversation(supabase as never, {
        conversationId: 'conversation-1',
        operatorId: 'operator-1',
        action: 'remove_message',
        reason: 'Unsafe content',
        messageId: 'message-1',
      }),
    ).rejects.toMatchObject({ code: 'REP_NETWORK_MODERATION_FAILED' })
    expect(auditInsert).not.toHaveBeenCalled()
  })

  it('does not report success when audit recording fails', async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'workspace_conversations') {
          return {
            select: vi.fn(() => {
              const chain = {
                eq: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'conversation-1', conversation_type: 'rep_direct', state: 'open' },
                  error: null,
                }),
              }
              return chain
            }),
            update: vi.fn(() => {
              const chain = {
                eq: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { id: 'conversation-1' }, error: null }),
              }
              return chain
            }),
          }
        }
        if (table === 'workspace_conversation_reports') {
          const chain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'report-1' }, error: null }),
          }
          return chain
        }
        return {
          insert: vi.fn().mockResolvedValue({ error: { message: 'audit unavailable' } }),
        }
      }),
    }

    await expect(
      moderateRepNetworkConversation(supabase as never, {
        conversationId: 'conversation-1',
        operatorId: 'operator-1',
        action: 'close_conversation',
        reason: 'Safety review',
      }),
    ).rejects.toMatchObject({ code: 'REP_NETWORK_MODERATION_FAILED' })
  })
})
