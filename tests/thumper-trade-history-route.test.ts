import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedThumperContextMock = vi.fn()
const getTradeHistoryMock = vi.fn()

vi.mock('@/lib/thumper/auth', () => ({
  AuthError: class AuthError extends Error {},
  getAuthenticatedThumperContext: (...args: unknown[]) =>
    getAuthenticatedThumperContextMock(...args),
}))

vi.mock('@/lib/services/trade-requests', () => ({
  getTradeHistory: (...args: unknown[]) => getTradeHistoryMock(...args),
}))

import { GET } from '@/app/api/thumper/trade-history/route'

describe('trade history route', () => {
  beforeEach(() => {
    getAuthenticatedThumperContextMock.mockReset()
    getTradeHistoryMock.mockReset()
  })

  it('returns trade history with summary analytics', async () => {
    getAuthenticatedThumperContextMock.mockResolvedValueOnce({
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
        topDesign: null,
        repeatCustomers: [],
      },
    })

    const response = await GET(
      new Request('http://localhost/api/thumper/trade-history?limit=20'),
    )

    expect(getTradeHistoryMock).toHaveBeenCalledWith(
      { marker: 'supabase' },
      'rep-1',
      { limit: 20 },
    )
    expect(response.status).toBe(200)
  })
})
