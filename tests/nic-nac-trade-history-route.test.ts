import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedNicNacContextMock = vi.fn()
const getTradeHistoryMock = vi.fn()

vi.mock('@/lib/nic-nac/auth', () => ({
  AuthError: class AuthError extends Error {},
  getAuthenticatedNicNacContext: (...args: unknown[]) =>
    getAuthenticatedNicNacContextMock(...args),
  getPaidNicNacContext: (...args: unknown[]) =>
    getAuthenticatedNicNacContextMock(...args),
}))

vi.mock('@/lib/services/trade-requests', () => ({
  getTradeHistory: (...args: unknown[]) => getTradeHistoryMock(...args),
}))

import { GET } from '@/app/api/nic-nac/trade-history/route'

describe('trade history route', () => {
  beforeEach(() => {
    getAuthenticatedNicNacContextMock.mockReset()
    getTradeHistoryMock.mockReset()
  })

  it('returns trade history with summary analytics', async () => {
    getAuthenticatedNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { id: 'rep-1' },
      supabase: { marker: 'supabase' },
    })
    getTradeHistoryMock.mockResolvedValueOnce({
      items: [{ requestId: 'request-1' }],
      summary: {
        totalCompleted: 1,
        totalMsrpTraded: 80,
        avgFulfillmentDays: 3,
        repeatCustomers: [],
      },
    })

    const response = await GET(
      new Request('http://localhost/api/nic-nac/trade-history?limit=20'),
    )

    expect(getTradeHistoryMock).toHaveBeenCalledWith(
      { marker: 'supabase' },
      'rep-1',
      { limit: 20 },
    )
    expect(response.status).toBe(200)
  })
})
