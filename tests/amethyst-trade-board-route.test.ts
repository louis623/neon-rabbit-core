import { beforeEach, describe, expect, it, vi } from 'vitest'

const loadAmethystTradeBoardPreviewListingsMock = vi.fn()

vi.mock('@/lib/amethyst/trade-board-listings', () => ({
  loadAmethystTradeBoardPreviewListings: (...args: unknown[]) =>
    loadAmethystTradeBoardPreviewListingsMock(...args),
}))

import { GET } from '@/app/api/amethyst/trade-board/route'

describe('GET /api/amethyst/trade-board', () => {
  beforeEach(() => {
    loadAmethystTradeBoardPreviewListingsMock.mockReset()
  })

  it('returns the current available trade board listings without caching', async () => {
    loadAmethystTradeBoardPreviewListingsMock.mockResolvedValueOnce([
      { id: 'listing-1', name: 'Birthday Bloom Ring' },
    ])

    const response = await GET(
      new Request('http://localhost/api/amethyst/trade-board?c=rep-1'),
    )

    expect(loadAmethystTradeBoardPreviewListingsMock).toHaveBeenCalledWith({
      repId: 'rep-1',
      targeted: true,
    })
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({
      listings: [{ id: 'listing-1', name: 'Birthday Bloom Ring' }],
    })
  })

  it('uses the public site slug from the customer-site referer before refreshing board listings', async () => {
    loadAmethystTradeBoardPreviewListingsMock.mockResolvedValueOnce([
      { id: 'listing-2', name: 'The Florence Earrings' },
    ])

    const response = await GET(
      new Request(
        'https://www.yoursparklesuite.com/api/amethyst/trade-board?previewRefresh=7',
        {
          headers: {
            referer: 'https://www.yoursparklesuite.com/LouisFizzFest/trade',
          },
        },
      ),
    )

    expect(loadAmethystTradeBoardPreviewListingsMock).toHaveBeenCalledWith({
      publicSiteSlug: 'louisfizzfest',
      repId: null,
      targeted: true,
    })
    await expect(response.json()).resolves.toEqual({
      listings: [{ id: 'listing-2', name: 'The Florence Earrings' }],
    })
  })
})
