import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthenticatedNicNacContextMock = vi.fn()
const getFulfillmentQueueMock = vi.fn()
const updateFulfillmentStatusMock = vi.fn()

vi.mock('@/lib/nic-nac/auth', () => ({
  AuthError: class AuthError extends Error {},
  getAuthenticatedNicNacContext: (...args: unknown[]) =>
    getAuthenticatedNicNacContextMock(...args),
  getPaidNicNacContext: (...args: unknown[]) =>
    getAuthenticatedNicNacContextMock(...args),
}))

vi.mock('@/lib/services/trade-fulfillment', () => ({
  getFulfillmentQueue: (...args: unknown[]) => getFulfillmentQueueMock(...args),
  updateFulfillmentStatus: (...args: unknown[]) =>
    updateFulfillmentStatusMock(...args),
}))

import { GET, POST } from '@/app/api/nic-nac/fulfillment-queue/route'

describe('fulfillment queue route', () => {
  beforeEach(() => {
    getAuthenticatedNicNacContextMock.mockReset()
    getFulfillmentQueueMock.mockReset()
    updateFulfillmentStatusMock.mockReset()
  })

  it('returns the authenticated rep fulfillment queue', async () => {
    getAuthenticatedNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { id: 'rep-1' },
      supabase: { marker: 'supabase' },
    })
    getFulfillmentQueueMock.mockResolvedValueOnce([{ fulfillmentId: 'ful-1' }])

    const response = await GET()

    expect(getFulfillmentQueueMock).toHaveBeenCalledWith(
      { marker: 'supabase' },
      'rep-1',
    )
    expect(response.status).toBe(200)
  })

  it('updates fulfillment status from the dashboard fallback action', async () => {
    getAuthenticatedNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-1',
      rep: { id: 'rep-1' },
      supabase: { marker: 'supabase' },
    })
    updateFulfillmentStatusMock.mockResolvedValueOnce({
      fulfillmentId: 'ful-1',
      requestId: 'request-1',
      previousStatus: 'approved',
      status: 'shipped',
      completedAt: null,
      shouldPromptAddToBoard: false,
    })

    const response = await POST(
      new Request('http://localhost/api/nic-nac/fulfillment-queue', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          requestId: 'request-1',
          nextStatus: 'shipped',
          shippingNotes: 'Dropped at USPS',
        }),
      }),
    )

    expect(updateFulfillmentStatusMock).toHaveBeenCalledWith(
      { marker: 'supabase' },
      'rep-1',
      {
        requestId: 'request-1',
        nextStatus: 'shipped',
        shippingNotes: 'Dropped at USPS',
        addToBoard: false,
      },
    )
    expect(response.status).toBe(200)
  })
})
