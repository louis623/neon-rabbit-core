import { beforeEach, describe, expect, it, vi } from 'vitest'

const createAdminClientMock = vi.fn()
const processReadyPhotoEnhancementQueueMock = vi.fn()
const getExpiredTradeRequestRevealScreenshotPathsMock = vi.fn()
const clearExpiredTradeRequestRevealScreenshotsMock = vi.fn()
const removeTradeRequestRevealScreenshotsMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: (...args: unknown[]) => createAdminClientMock(...args),
}))

vi.mock('@/lib/services/photo-enhancement-queue', () => ({
  processReadyPhotoEnhancementQueue: (...args: unknown[]) =>
    processReadyPhotoEnhancementQueueMock(...args),
}))

vi.mock('@/lib/services/trade-requests', () => ({
  getExpiredTradeRequestRevealScreenshotPaths: (...args: unknown[]) =>
    getExpiredTradeRequestRevealScreenshotPathsMock(...args),
  clearExpiredTradeRequestRevealScreenshots: (...args: unknown[]) =>
    clearExpiredTradeRequestRevealScreenshotsMock(...args),
}))

vi.mock('@/lib/services/storage', () => ({
  removeTradeRequestRevealScreenshots: (...args: unknown[]) =>
    removeTradeRequestRevealScreenshotsMock(...args),
}))

import { GET } from '@/app/api/internal/photo-enhancement/queue/route'

describe('GET /api/internal/photo-enhancement/queue', () => {
  beforeEach(() => {
    createAdminClientMock.mockReset()
    processReadyPhotoEnhancementQueueMock.mockReset()
    getExpiredTradeRequestRevealScreenshotPathsMock.mockReset()
    clearExpiredTradeRequestRevealScreenshotsMock.mockReset()
    removeTradeRequestRevealScreenshotsMock.mockReset()
    getExpiredTradeRequestRevealScreenshotPathsMock.mockResolvedValue([])
    clearExpiredTradeRequestRevealScreenshotsMock.mockResolvedValue(0)
    removeTradeRequestRevealScreenshotsMock.mockResolvedValue(undefined)
    delete process.env.CRON_SECRET
  })

  it('returns 503 when CRON_SECRET is missing', async () => {
    const response = await GET(
      new Request('http://localhost/api/internal/photo-enhancement/queue'),
    )

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: 'photo queue cron secret is not configured.',
    })
  })

  it('returns 401 when the bearer secret does not match', async () => {
    process.env.CRON_SECRET = 'secret-123'

    const response = await GET(
      new Request('http://localhost/api/internal/photo-enhancement/queue', {
        headers: { authorization: 'Bearer wrong-secret' },
      }),
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      error: 'unauthorized',
    })
  })

  it('returns 400 for an invalid limit', async () => {
    process.env.CRON_SECRET = 'secret-123'

    const response = await GET(
      new Request(
        'http://localhost/api/internal/photo-enhancement/queue?limit=nope',
        {
          headers: { authorization: 'Bearer secret-123' },
        },
      ),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'limit must be a positive whole number.',
    })
  })

  it('runs the queue with the authenticated secret and requested limit', async () => {
    process.env.CRON_SECRET = 'secret-123'
    createAdminClientMock.mockReturnValueOnce({ marker: 'admin' })
    processReadyPhotoEnhancementQueueMock.mockResolvedValueOnce({
      processedCount: 2,
      publishedCount: 1,
      reviewCount: 1,
      rejectedCount: 0,
      errorCount: 0,
      skippedCount: 0,
      items: [],
    })

    const response = await GET(
      new Request(
        'http://localhost/api/internal/photo-enhancement/queue?limit=12',
        {
          headers: { authorization: 'Bearer secret-123' },
        },
      ),
    )

    expect(processReadyPhotoEnhancementQueueMock).toHaveBeenCalledWith(
      { marker: 'admin' },
      { limit: 12 },
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      ok: true,
      result: {
        processedCount: 2,
        publishedCount: 1,
        reviewCount: 1,
        rejectedCount: 0,
        errorCount: 0,
        skippedCount: 0,
        items: [],
      },
      tradeRequestScreenshotCleanup: {
        removedCount: 0,
      },
    })
  })

  it('removes expired trade request reveal screenshots during daily maintenance', async () => {
    process.env.CRON_SECRET = 'secret-123'
    createAdminClientMock.mockReturnValueOnce({ marker: 'admin' })
    processReadyPhotoEnhancementQueueMock.mockResolvedValueOnce({
      processedCount: 0,
      publishedCount: 0,
      reviewCount: 0,
      rejectedCount: 0,
      errorCount: 0,
      skippedCount: 0,
      items: [],
    })
    getExpiredTradeRequestRevealScreenshotPathsMock.mockResolvedValueOnce([
      'rep-1/req-1/screenshot.jpg',
    ])
    clearExpiredTradeRequestRevealScreenshotsMock.mockResolvedValueOnce(1)

    const response = await GET(
      new Request('http://localhost/api/internal/photo-enhancement/queue', {
        headers: { authorization: 'Bearer secret-123' },
      }),
    )

    expect(removeTradeRequestRevealScreenshotsMock).toHaveBeenCalledWith([
      'rep-1/req-1/screenshot.jpg',
    ])
    expect(clearExpiredTradeRequestRevealScreenshotsMock).toHaveBeenCalledWith(
      { marker: 'admin' },
      ['rep-1/req-1/screenshot.jpg'],
    )
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      tradeRequestScreenshotCleanup: {
        removedCount: 1,
      },
    })
  })
})
