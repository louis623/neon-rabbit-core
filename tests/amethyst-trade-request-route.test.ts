import { beforeEach, describe, expect, it, vi } from 'vitest'

import { errors } from '@/lib/services/errors'

const createAdminClientMock = vi.fn(() => ({ admin: true }))
const submitTradeRequestMock = vi.fn()
const attachTradeRequestRevealScreenshotMock = vi.fn()
const getTradeRequestNotificationSummaryMock = vi.fn()
const notifyRepOfTradeRequestMock = vi.fn()
const resolveAmethystPreviewRepMock = vi.fn()
const uploadTradeRequestRevealScreenshotMock = vi.fn()
const removeTradeRequestRevealScreenshotsMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => createAdminClientMock(),
}))

vi.mock('@/lib/services/trade-requests', () => ({
  submitTradeRequest: (...args: unknown[]) => submitTradeRequestMock(...args),
  attachTradeRequestRevealScreenshot: (...args: unknown[]) =>
    attachTradeRequestRevealScreenshotMock(...args),
  getTradeRequestNotificationSummary: (...args: unknown[]) =>
    getTradeRequestNotificationSummaryMock(...args),
}))

vi.mock('@/lib/services/storage', () => ({
  uploadTradeRequestRevealScreenshot: (...args: unknown[]) =>
    uploadTradeRequestRevealScreenshotMock(...args),
  removeTradeRequestRevealScreenshots: (...args: unknown[]) =>
    removeTradeRequestRevealScreenshotsMock(...args),
}))

vi.mock('@/lib/nic-nac/trade-request-notifications', () => ({
  notifyRepOfTradeRequest: (...args: unknown[]) =>
    notifyRepOfTradeRequestMock(...args),
}))

vi.mock('@/lib/amethyst/preview-rep', () => ({
  resolveAmethystPreviewRep: (...args: unknown[]) =>
    resolveAmethystPreviewRepMock(...args),
}))

import { POST } from '@/app/api/amethyst/trade-requests/route'

describe('POST /api/amethyst/trade-requests', () => {
  beforeEach(() => {
    createAdminClientMock.mockClear()
    submitTradeRequestMock.mockReset()
    attachTradeRequestRevealScreenshotMock.mockReset()
    getTradeRequestNotificationSummaryMock.mockReset()
    notifyRepOfTradeRequestMock.mockReset()
    resolveAmethystPreviewRepMock.mockReset()
    uploadTradeRequestRevealScreenshotMock.mockReset()
    removeTradeRequestRevealScreenshotsMock.mockReset()
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

  it('accepts an optional reveal screenshot as multipart data and attaches it after request creation', async () => {
    resolveAmethystPreviewRepMock.mockResolvedValueOnce({
      id: 'rep-louis',
      email: 'louis@example.test',
    })
    submitTradeRequestMock.mockResolvedValueOnce({
      requestId: 'request-1',
      listingId: 'listing-1',
    })
    uploadTradeRequestRevealScreenshotMock.mockResolvedValueOnce({
      objectPath: 'rep-louis/request-1/screenshot.png',
      contentType: 'image/png',
      sizeBytes: 3,
      uploadedAt: '2026-06-17T12:00:00.000Z',
      expiresAt: '2026-06-19T12:00:00.000Z',
    })
    attachTradeRequestRevealScreenshotMock.mockResolvedValueOnce(undefined)
    getTradeRequestNotificationSummaryMock.mockResolvedValueOnce({
      requestId: 'request-1',
      repId: 'rep-louis',
      customerName: 'Jamie',
      customerDescription: 'July Birthday 2026 necklace',
      revealScreenshot: {
        objectPath: 'rep-louis/request-1/screenshot.png',
        contentType: 'image/png',
        sizeBytes: 3,
        uploadedAt: '2026-06-17T12:00:00.000Z',
        expiresAt: '2026-06-19T12:00:00.000Z',
      },
      listing: {
        id: 'listing-1',
        itemNumber: 'NK75454',
        designName: 'The Piper Necklace',
        collectionName: 'July Birthday 2026',
        typePrefix: 'NK',
        bpMsrp: 138,
      },
    })

    const form = new FormData()
    form.set('listingId', 'listing-1')
    form.set('customerName', 'Jamie')
    form.set('customerDescription', 'July Birthday 2026 necklace')
    form.set(
      'revealScreenshot',
      new File([new Uint8Array([1, 2, 3])], 'reveal.png', {
        type: 'image/png',
      }),
    )

    const response = await POST(
      new Request('https://www.yoursparklesuite.com/api/amethyst/trade-requests?publicSiteSlug=louisfizzfest', {
        method: 'POST',
        body: form,
      }),
    )

    expect(submitTradeRequestMock).toHaveBeenCalledWith(
      { admin: true },
      expect.objectContaining({
        listingId: 'listing-1',
        customerName: 'Jamie',
        customerDescription: 'July Birthday 2026 necklace',
        expectedRepId: 'rep-louis',
      }),
    )
    expect(uploadTradeRequestRevealScreenshotMock).toHaveBeenCalledWith(
      'rep-louis',
      'request-1',
      expect.any(ArrayBuffer),
      expect.objectContaining({
        contentType: 'image/png',
        filename: 'reveal.png',
      }),
    )
    expect(attachTradeRequestRevealScreenshotMock).toHaveBeenCalledWith(
      { admin: true },
      'request-1',
      expect.objectContaining({
        objectPath: 'rep-louis/request-1/screenshot.png',
      }),
    )
    expect(notifyRepOfTradeRequestMock).toHaveBeenCalledWith(
      { admin: true },
      expect.objectContaining({
        revealScreenshot: expect.objectContaining({
          objectPath: 'rep-louis/request-1/screenshot.png',
        }),
      }),
    )
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      requestId: 'request-1',
      listingId: 'listing-1',
    })
  })

  it('does not block the trade request when optional screenshot attachment fails', async () => {
    resolveAmethystPreviewRepMock.mockResolvedValueOnce({
      id: 'rep-louis',
      email: 'louis@example.test',
    })
    submitTradeRequestMock.mockResolvedValueOnce({
      requestId: 'request-1',
      listingId: 'listing-1',
    })
    uploadTradeRequestRevealScreenshotMock.mockRejectedValueOnce(
      new Error('storage failed'),
    )
    getTradeRequestNotificationSummaryMock.mockResolvedValueOnce(null)

    const form = new FormData()
    form.set('listingId', 'listing-1')
    form.set('customerName', 'Jamie')
    form.set('customerDescription', 'July Birthday 2026 necklace')
    form.set(
      'revealScreenshot',
      new File([new Uint8Array([1, 2, 3])], 'reveal.png', {
        type: 'image/png',
      }),
    )

    const response = await POST(
      new Request('https://www.yoursparklesuite.com/api/amethyst/trade-requests?publicSiteSlug=louisfizzfest', {
        method: 'POST',
        body: form,
      }),
    )

    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toEqual({
      requestId: 'request-1',
      listingId: 'listing-1',
      warning:
        'Your trade request was sent, but the screenshot could not be attached.',
    })
  })

  it('removes the uploaded screenshot if metadata attachment fails after upload', async () => {
    resolveAmethystPreviewRepMock.mockResolvedValueOnce({
      id: 'rep-louis',
      email: 'louis@example.test',
    })
    submitTradeRequestMock.mockResolvedValueOnce({
      requestId: 'request-1',
      listingId: 'listing-1',
    })
    uploadTradeRequestRevealScreenshotMock.mockResolvedValueOnce({
      objectPath: 'rep-louis/request-1/orphan.png',
      contentType: 'image/png',
      sizeBytes: 3,
      uploadedAt: '2026-06-17T12:00:00.000Z',
      expiresAt: '2026-06-19T12:00:00.000Z',
    })
    attachTradeRequestRevealScreenshotMock.mockRejectedValueOnce(
      new Error('metadata failed'),
    )
    removeTradeRequestRevealScreenshotsMock.mockResolvedValueOnce(undefined)
    getTradeRequestNotificationSummaryMock.mockResolvedValueOnce(null)

    const form = new FormData()
    form.set('listingId', 'listing-1')
    form.set('customerName', 'Jamie')
    form.set('customerDescription', 'July Birthday 2026 necklace')
    form.set(
      'revealScreenshot',
      new File([new Uint8Array([1, 2, 3])], 'reveal.png', {
        type: 'image/png',
      }),
    )

    const response = await POST(
      new Request('https://www.yoursparklesuite.com/api/amethyst/trade-requests?publicSiteSlug=louisfizzfest', {
        method: 'POST',
        body: form,
      }),
    )

    expect(removeTradeRequestRevealScreenshotsMock).toHaveBeenCalledWith([
      'rep-louis/request-1/orphan.png',
    ])
    expect(response.status).toBe(201)
  })

  it('binds customer-site trade requests to the resolved public site rep', async () => {
    resolveAmethystPreviewRepMock.mockResolvedValueOnce({
      id: 'rep-louis',
      email: 'louis@example.test',
    })
    submitTradeRequestMock.mockResolvedValueOnce({
      requestId: 'request-1',
      listingId: 'listing-1',
    })
    getTradeRequestNotificationSummaryMock.mockResolvedValueOnce(null)

    const response = await POST(
      new Request('https://www.yoursparklesuite.com/api/amethyst/trade-requests', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          referer: 'https://www.yoursparklesuite.com/LouisFizzFest/trade',
        },
        body: JSON.stringify({
          listingId: 'listing-1',
          customerName: 'Jamie',
          customerDescription: 'Birthday ring, size 8',
        }),
      }),
    )

    expect(resolveAmethystPreviewRepMock).toHaveBeenCalledWith(
      { admin: true },
      expect.objectContaining({
        publicSiteSlug: 'louisfizzfest',
        repId: null,
      }),
    )
    expect(submitTradeRequestMock).toHaveBeenCalledWith(
      { admin: true },
      expect.objectContaining({
        expectedRepId: 'rep-louis',
        listingId: 'listing-1',
      }),
    )
    expect(response.status).toBe(201)
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
