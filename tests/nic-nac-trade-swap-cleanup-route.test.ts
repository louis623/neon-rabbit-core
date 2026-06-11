import { beforeEach, describe, expect, it, vi } from 'vitest'

const getPaidNicNacContextMock = vi.fn()
const getTradeSwapCleanupQueueMock = vi.fn()

vi.mock('@/lib/nic-nac/auth', () => ({
  getPaidNicNacContext: () => getPaidNicNacContextMock(),
  AuthError: class AuthError extends Error {},
}))

vi.mock('@/lib/services/trade-swaps', () => ({
  getTradeSwapCleanupQueue: (...args: unknown[]) =>
    getTradeSwapCleanupQueueMock(...args),
}))

import { GET } from '@/app/api/nic-nac/trade-swap-cleanup/route'

beforeEach(() => {
  getPaidNicNacContextMock.mockReset()
  getTradeSwapCleanupQueueMock.mockReset()
})

describe('GET /api/nic-nac/trade-swap-cleanup', () => {
  it('returns unresolved trade swap replacement items', async () => {
    getPaidNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-1',
      supabase: { auth: true },
    })
    getTradeSwapCleanupQueueMock.mockResolvedValueOnce([
      {
        swapId: 'swap-1',
        requestId: 'req-1',
        customerName: 'Jamie',
        outgoingListingId: 'listing-1',
        revealedItemNumber: 'ER00001',
        revealedRingSize: null,
        replacementStatus: 'needs_catalog_details',
        createdAt: '2026-06-11T20:00:00.000Z',
      },
    ])

    const response = await GET()

    expect(getTradeSwapCleanupQueueMock).toHaveBeenCalledWith(
      { auth: true },
      'rep-1',
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual([
      expect.objectContaining({
        customerName: 'Jamie',
        revealedItemNumber: 'ER00001',
      }),
    ])
  })
})
