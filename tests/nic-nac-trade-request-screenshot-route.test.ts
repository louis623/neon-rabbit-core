import { beforeEach, describe, expect, it, vi } from 'vitest'

const getPaidNicNacContextMock = vi.fn()
const getTradeRequestRevealScreenshotForRepMock = vi.fn()
const getTradeRequestRevealScreenshotSignedUrlMock = vi.fn()

const { MockAuthError } = vi.hoisted(() => ({
  MockAuthError: class MockAuthError extends Error {},
}))

vi.mock('@/lib/nic-nac/auth', () => ({
  AuthError: MockAuthError,
  getPaidNicNacContext: (...args: unknown[]) =>
    getPaidNicNacContextMock(...args),
}))

vi.mock('@/lib/services/trade-requests', () => ({
  getTradeRequestRevealScreenshotForRep: (...args: unknown[]) =>
    getTradeRequestRevealScreenshotForRepMock(...args),
}))

vi.mock('@/lib/services/storage', () => ({
  getTradeRequestRevealScreenshotSignedUrl: (...args: unknown[]) =>
    getTradeRequestRevealScreenshotSignedUrlMock(...args),
}))

import { GET } from '@/app/api/nic-nac/trade-requests/[requestId]/reveal-screenshot/route'

describe('GET /api/nic-nac/trade-requests/[requestId]/reveal-screenshot', () => {
  beforeEach(() => {
    getPaidNicNacContextMock.mockReset()
    getTradeRequestRevealScreenshotForRepMock.mockReset()
    getTradeRequestRevealScreenshotSignedUrlMock.mockReset()
  })

  it('redirects the owning rep to a fresh signed screenshot URL', async () => {
    getPaidNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-1',
      supabase: { marker: 'auth-client' },
    })
    getTradeRequestRevealScreenshotForRepMock.mockResolvedValueOnce({
      objectPath: 'rep-1/request-1/reveal.png',
      contentType: 'image/png',
      sizeBytes: 123,
      uploadedAt: '2026-06-17T12:00:00.000Z',
      expiresAt: '2026-06-19T12:00:00.000Z',
    })
    getTradeRequestRevealScreenshotSignedUrlMock.mockResolvedValueOnce(
      'https://signed.example.com/reveal.png',
    )

    const response = await GET(
      new Request(
        'http://localhost/api/nic-nac/trade-requests/request-1/reveal-screenshot',
      ),
      { params: Promise.resolve({ requestId: 'request-1' }) },
    )

    expect(getTradeRequestRevealScreenshotForRepMock).toHaveBeenCalledWith(
      { marker: 'auth-client' },
      'rep-1',
      'request-1',
    )
    expect(getTradeRequestRevealScreenshotSignedUrlMock).toHaveBeenCalledWith(
      'rep-1/request-1/reveal.png',
    )
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'https://signed.example.com/reveal.png',
    )
  })

  it('returns 410 when the screenshot is expired or unavailable', async () => {
    getPaidNicNacContextMock.mockResolvedValueOnce({
      repId: 'rep-1',
      supabase: { marker: 'auth-client' },
    })
    getTradeRequestRevealScreenshotForRepMock.mockResolvedValueOnce(null)

    const response = await GET(
      new Request(
        'http://localhost/api/nic-nac/trade-requests/request-1/reveal-screenshot',
      ),
      { params: Promise.resolve({ requestId: 'request-1' }) },
    )

    expect(response.status).toBe(410)
    expect(getTradeRequestRevealScreenshotSignedUrlMock).not.toHaveBeenCalled()
  })

  it('requires a signed-in paid rep context', async () => {
    getPaidNicNacContextMock.mockRejectedValueOnce(new MockAuthError('nope'))

    const response = await GET(
      new Request(
        'http://localhost/api/nic-nac/trade-requests/request-1/reveal-screenshot',
      ),
      { params: Promise.resolve({ requestId: 'request-1' }) },
    )

    expect(response.status).toBe(401)
  })
})
