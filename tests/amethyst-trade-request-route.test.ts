import { beforeEach, describe, expect, it, vi } from 'vitest'

import { errors } from '@/lib/services/errors'

const createAdminClientMock = vi.fn(() => ({ admin: true }))
const submitTradeRequestMock = vi.fn()
const getTradeRequestNotificationSummaryMock = vi.fn()
const notifyRepOfTradeRequestMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => createAdminClientMock(),
}))

vi.mock('@/lib/services/trade-requests', () => ({
  submitTradeRequest: (...args: unknown[]) => submitTradeRequestMock(...args),
  getTradeRequestNotificationSummary: (...args: unknown[]) =>
    getTradeRequestNotificationSummaryMock(...args),
}))

vi.mock('@/lib/thumper/trade-request-notifications', () => ({
  notifyRepOfTradeRequest: (...args: unknown[]) =>
    notifyRepOfTradeRequestMock(...args),
}))

import { POST } from '@/app/api/amethyst/trade-requests/route'

describe('POST /api/amethyst/trade-requests', () => {
  beforeEach(() => {
    createAdminClientMock.mockClear()
    submitTradeRequestMock.mockReset()
    getTradeRequestNotificationSummaryMock.mockReset()
    notifyRepOfTradeRequestMock.mockReset()
  })

  it('submits the request through the trade-request service and returns 201', async () => {
    submitTradeRequestMock.mockResolvedValueOnce({
      requestId: 'request-1',
      listingId: 'listing-1',
    })
    getTradeRequestNotificationSummaryMock.mockResolvedValueOnce({
      requestId: 'request-1',
      repId: 'rep-1',
      customerName: 'Jamie',
      customerDescription: 'Birthday ring, size 8',
      listing: {
        id: 'listing-1',
        itemNumber: 'RG31452',
        designName: 'Celeste Ring',
        collectionName: 'Birthday',
        typePrefix: 'RG',
        bpMsrp: 128,
      },
    })

    const response = await POST(
      new Request('http://localhost/api/amethyst/trade-requests', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          listingId: 'listing-1',
          customerName: 'Jamie',
          customerDescription: 'Birthday ring, size 8',
          clickwrapAcknowledged: true,
        }),
      }),
    )

    expect(createAdminClientMock).toHaveBeenCalledTimes(1)
    expect(submitTradeRequestMock).toHaveBeenCalledWith(
      { admin: true },
      expect.objectContaining({
        listingId: 'listing-1',
        customerName: 'Jamie',
        customerDescription: 'Birthday ring, size 8',
        clickwrapAcknowledged: true,
      }),
    )
    expect(getTradeRequestNotificationSummaryMock).toHaveBeenCalledWith(
      { admin: true },
      'request-1',
    )
    expect(notifyRepOfTradeRequestMock).toHaveBeenCalledWith(
      { admin: true },
      expect.objectContaining({
        requestId: 'request-1',
        customerName: 'Jamie',
      }),
    )
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      requestId: 'request-1',
      listingId: 'listing-1',
    })
  })

  it('still returns 201 when the Nic-Nac notification follow-up fails', async () => {
    submitTradeRequestMock.mockResolvedValueOnce({
      requestId: 'request-1',
      listingId: 'listing-1',
    })
    getTradeRequestNotificationSummaryMock.mockResolvedValueOnce({
      requestId: 'request-1',
      repId: 'rep-1',
      customerName: 'Jamie',
      customerDescription: 'Birthday ring, size 8',
      listing: {
        id: 'listing-1',
        itemNumber: 'RG31452',
        designName: 'Celeste Ring',
        collectionName: 'Birthday',
        typePrefix: 'RG',
        bpMsrp: 128,
      },
    })
    notifyRepOfTradeRequestMock.mockRejectedValueOnce(
      new Error('notification insert failed'),
    )

    const response = await POST(
      new Request('http://localhost/api/amethyst/trade-requests', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          listingId: 'listing-1',
          customerName: 'Jamie',
          customerDescription: 'Birthday ring, size 8',
          clickwrapAcknowledged: true,
        }),
      }),
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      requestId: 'request-1',
      listingId: 'listing-1',
    })
  })

  it('maps ServiceError responses to the right status and customer-safe message', async () => {
    submitTradeRequestMock.mockRejectedValueOnce(errors.REQUEST_ALREADY_EXISTS())

    const response = await POST(
      new Request('http://localhost/api/amethyst/trade-requests', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          listingId: 'listing-1',
          customerName: 'Jamie',
          customerDescription: 'Birthday ring, size 8',
          clickwrapAcknowledged: true,
        }),
      }),
    )

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      code: 'REQUEST_ALREADY_EXISTS',
      error: 'That piece already has a pending trade request.',
    })
  })

  it('returns 400 for malformed JSON bodies', async () => {
    const response = await POST(
      new Request('http://localhost/api/amethyst/trade-requests', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: '{invalid',
      }),
    )

    expect(submitTradeRequestMock).not.toHaveBeenCalled()
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid request payload.',
    })
  })
})
