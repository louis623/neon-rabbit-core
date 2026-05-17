import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedNicNacContextMock = vi.fn()
const getAuthenticatedRepMock = vi.fn()
const getTradeRequestsMock = vi.fn()
const approveTradeMock = vi.fn()
const rejectTradeMock = vi.fn()

vi.mock('@/lib/nic-nac/auth', () => ({
  AuthError: class AuthError extends Error {},
  getAuthenticatedNicNacContext: (...args: unknown[]) =>
    getAuthenticatedNicNacContextMock(...args),
}))

vi.mock('@/lib/supabase/auth', () => ({
  AuthError: class AuthError extends Error {},
  getAuthenticatedRep: (...args: unknown[]) => getAuthenticatedRepMock(...args),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({ marker: 'admin' })),
}))

vi.mock('@/lib/services/trade-requests', () => ({
  getTradeRequests: (...args: unknown[]) => getTradeRequestsMock(...args),
  approveTrade: (...args: unknown[]) => approveTradeMock(...args),
  rejectTrade: (...args: unknown[]) => rejectTradeMock(...args),
}))

import { GET, POST } from '@/app/api/nic-nac/trade-requests/route'

describe('trade requests route', () => {
  beforeEach(() => {
    getAuthenticatedNicNacContextMock.mockReset()
    getAuthenticatedRepMock.mockReset()
    getTradeRequestsMock.mockReset()
    approveTradeMock.mockReset()
    rejectTradeMock.mockReset()
  })

  it('returns pending requests for the authenticated rep', async () => {
    getAuthenticatedNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { id: 'rep-1' },
      supabase: { marker: 'supabase' },
    })
    getTradeRequestsMock.mockResolvedValueOnce([{ id: 'request-1' }])

    const response = await GET(
      new Request(
        'http://localhost/api/nic-nac/trade-requests?status=pending&limit=12',
      ),
    )

    expect(getTradeRequestsMock).toHaveBeenCalledWith(
      { marker: 'supabase' },
      'rep-1',
      { statusFilter: 'pending', limit: 12 },
    )
    expect(response.status).toBe(200)
  })

  it('approves a request through the fallback action', async () => {
    getAuthenticatedRepMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { id: 'rep-1' },
    })
    approveTradeMock.mockResolvedValueOnce({
      requestId: 'request-1',
      fulfillmentId: 'fulfillment-1',
      listingId: 'listing-1',
      customerName: 'Jamie',
    })

    const response = await POST(
      new Request('http://localhost/api/nic-nac/trade-requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          requestId: 'request-1',
          repNotes: 'Approved from dashboard',
        }),
      }),
    )

    expect(approveTradeMock).toHaveBeenCalledWith(
      { marker: 'admin' },
      'rep-1',
      'request-1',
      'Approved from dashboard',
    )
    expect(response.status).toBe(200)
  })

  it('rejects a request through the fallback action', async () => {
    getAuthenticatedRepMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { id: 'rep-1' },
    })
    rejectTradeMock.mockResolvedValueOnce({
      requestId: 'request-2',
      listingId: 'listing-2',
      listingRestored: true,
    })

    const response = await POST(
      new Request('http://localhost/api/nic-nac/trade-requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          requestId: 'request-2',
          reason: 'not_interested',
          repNotes: 'Not the right fit',
        }),
      }),
    )

    expect(rejectTradeMock).toHaveBeenCalledWith(
      { marker: 'admin' },
      'rep-1',
      'request-2',
      'not_interested',
      'Not the right fit',
    )
    expect(response.status).toBe(200)
  })
})
