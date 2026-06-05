import { beforeEach, describe, expect, it, vi } from 'vitest'

const listSparkleFinderCatalogItemsMock = vi.fn()
const getSparkleFinderCatalogItemMock = vi.fn()
const getSparkleFinderAvailabilityMock = vi.fn()

vi.mock('@/lib/sparkle-finder/public-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/sparkle-finder/public-api')>(
    '@/lib/sparkle-finder/public-api',
  )

  return {
    ...actual,
    listSparkleFinderCatalogItems: (...args: unknown[]) =>
      listSparkleFinderCatalogItemsMock(...args),
    getSparkleFinderCatalogItem: (...args: unknown[]) =>
      getSparkleFinderCatalogItemMock(...args),
    getSparkleFinderAvailability: (...args: unknown[]) =>
      getSparkleFinderAvailabilityMock(...args),
  }
})

import { GET as getFinderAvailability } from '@/app/api/public/finder/availability/route'
import { GET as getFinderCatalog } from '@/app/api/public/finder/catalog/route'
import { GET as getFinderCatalogDetail } from '@/app/api/public/finder/catalog/[designId]/route'

describe('Sparkle Finder public routes', () => {
  beforeEach(() => {
    listSparkleFinderCatalogItemsMock.mockReset()
    getSparkleFinderCatalogItemMock.mockReset()
    getSparkleFinderAvailabilityMock.mockReset()
  })

  it('returns public catalog search results without caching', async () => {
    listSparkleFinderCatalogItemsMock.mockResolvedValueOnce([
      {
        designId: 'design-1',
        itemNumber: 'RG100',
        designName: 'Aurora Ring',
        collectionYear: 2026,
        searchTags: ['ring'],
      },
    ])

    const response = await getFinderCatalog(
      new Request('http://localhost/api/public/finder/catalog?query=aurora&limit=10'),
    )

    expect(listSparkleFinderCatalogItemsMock).toHaveBeenCalledWith({
      query: 'aurora',
      limit: 10,
    })
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({
      items: [
        {
          designId: 'design-1',
          itemNumber: 'RG100',
          designName: 'Aurora Ring',
          collectionYear: 2026,
          searchTags: ['ring'],
        },
      ],
    })
  })

  it('rejects invalid catalog limits', async () => {
    const response = await getFinderCatalog(
      new Request('http://localhost/api/public/finder/catalog?limit=bad'),
    )

    expect(response.status).toBe(400)
    expect(listSparkleFinderCatalogItemsMock).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({
      error: 'limit must be a positive whole number.',
    })
  })

  it('returns a single public catalog item by design id', async () => {
    getSparkleFinderCatalogItemMock.mockResolvedValueOnce({
      designId: 'design-1',
      itemNumber: 'RG100',
      designName: 'Aurora Ring',
    })

    const response = await getFinderCatalogDetail(
      new Request('http://localhost/api/public/finder/catalog/design-1'),
      { params: Promise.resolve({ designId: 'design-1' }) },
    )

    expect(getSparkleFinderCatalogItemMock).toHaveBeenCalledWith({
      designId: 'design-1',
    })
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({
      item: {
        designId: 'design-1',
        itemNumber: 'RG100',
        designName: 'Aurora Ring',
      },
    })
  })

  it('returns 404 when a public catalog item does not exist', async () => {
    getSparkleFinderCatalogItemMock.mockResolvedValueOnce(null)

    const response = await getFinderCatalogDetail(
      new Request('http://localhost/api/public/finder/catalog/missing'),
      { params: Promise.resolve({ designId: 'missing' }) },
    )

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      error: 'catalog item not found',
    })
  })

  it('requires designId for public availability lookups', async () => {
    const response = await getFinderAvailability(
      new Request('http://localhost/api/public/finder/availability'),
    )

    expect(response.status).toBe(400)
    expect(getSparkleFinderAvailabilityMock).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({
      error: 'designId is required.',
    })
  })

  it('returns public exact and similar availability matches', async () => {
    getSparkleFinderAvailabilityMock.mockResolvedValueOnce({
      requestedItem: { designId: 'design-1', itemNumber: 'RG100' },
      exactMatches: [{ listingId: 'listing-1' }],
      similarMatches: [{ listingId: 'listing-2' }],
    })

    const response = await getFinderAvailability(
      new Request(
        'http://localhost/api/public/finder/availability?designId=design-1&limit=8',
      ),
    )

    expect(getSparkleFinderAvailabilityMock).toHaveBeenCalledWith({
      designId: 'design-1',
      limit: 8,
    })
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({
      requestedItem: { designId: 'design-1', itemNumber: 'RG100' },
      exactMatches: [{ listingId: 'listing-1' }],
      similarMatches: [{ listingId: 'listing-2' }],
    })
  })
})
