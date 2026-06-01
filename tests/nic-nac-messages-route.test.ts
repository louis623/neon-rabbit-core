import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedNicNacContextMock = vi.fn()
const getRepMessagesMock = vi.fn()
const createRepSupportMessageMock = vi.fn()
const markRepMessageReadMock = vi.fn()

vi.mock('@/lib/nic-nac/auth', () => ({
  AuthError: class AuthError extends Error {},
  getAuthenticatedNicNacContext: (...args: unknown[]) =>
    getAuthenticatedNicNacContextMock(...args),
  getPaidNicNacContext: (...args: unknown[]) =>
    getAuthenticatedNicNacContextMock(...args),
}))

vi.mock('@/lib/services/rep-messages', () => ({
  getRepMessages: (...args: unknown[]) => getRepMessagesMock(...args),
  createRepSupportMessage: (...args: unknown[]) =>
    createRepSupportMessageMock(...args),
  markRepMessageRead: (...args: unknown[]) => markRepMessageReadMock(...args),
}))

import { GET, POST } from '@/app/api/nic-nac/messages/route'

describe('messages route', () => {
  beforeEach(() => {
    getAuthenticatedNicNacContextMock.mockReset()
    getRepMessagesMock.mockReset()
    createRepSupportMessageMock.mockReset()
    markRepMessageReadMock.mockReset()
  })

  it('returns the authenticated rep message center payload', async () => {
    getAuthenticatedNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { id: 'rep-1' },
      supabase: { marker: 'supabase' },
    })
    getRepMessagesMock.mockResolvedValueOnce({
      unreadCount: 1,
      messages: [{ id: 'msg-1' }],
    })

    const response = await GET(
      new Request('http://localhost/api/nic-nac/messages?limit=10&type=announcement'),
    )

    expect(getRepMessagesMock).toHaveBeenCalledWith(
      { marker: 'supabase' },
      'rep-1',
      {
        limit: 10,
        messageType: 'announcement',
        unreadOnly: false,
      },
    )
    expect(response.status).toBe(200)
  })

  it('creates a backup support request message', async () => {
    getAuthenticatedNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { id: 'rep-1' },
      supabase: { marker: 'supabase' },
    })
    createRepSupportMessageMock.mockResolvedValueOnce({ id: 'msg-2' })

    const response = await POST(
      new Request('http://localhost/api/nic-nac/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'create_support_request',
          subject: 'Need help with a late package',
          body: 'Customer needs an update before Friday.',
        }),
      }),
    )

    expect(createRepSupportMessageMock).toHaveBeenCalledWith(
      { marker: 'supabase' },
      'rep-1',
      {
        subject: 'Need help with a late package',
        body: 'Customer needs an update before Friday.',
      },
    )
    expect(response.status).toBe(200)
  })

  it('marks a message as read', async () => {
    getAuthenticatedNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { id: 'rep-1' },
      supabase: { marker: 'supabase' },
    })
    markRepMessageReadMock.mockResolvedValueOnce({ id: 'msg-1', isRead: true })

    const response = await POST(
      new Request('http://localhost/api/nic-nac/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_read',
          messageId: 'msg-1',
        }),
      }),
    )

    expect(markRepMessageReadMock).toHaveBeenCalledWith(
      { marker: 'supabase' },
      'rep-1',
      'msg-1',
    )
    expect(response.status).toBe(200)
  })
})
