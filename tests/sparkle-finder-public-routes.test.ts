import { beforeEach, describe, expect, it, vi } from 'vitest'

const listSparkleFinderCatalogItemsMock = vi.fn()
const listSparkleFinderCatalogFacetsMock = vi.fn()
const getSparkleFinderCatalogItemMock = vi.fn()
const getSparkleFinderAvailabilityMock = vi.fn()
const listSparkleFinderLiveShowsMock = vi.fn()

vi.mock('@/lib/sparkle-finder/public-api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/sparkle-finder/public-api')>(
    '@/lib/sparkle-finder/public-api',
  )

  return {
    ...actual,
    listSparkleFinderCatalogFacets: (...args: unknown[]) =>
      listSparkleFinderCatalogFacetsMock(...args),
    listSparkleFinderCatalogItems: (...args: unknown[]) =>
      listSparkleFinderCatalogItemsMock(...args),
    getSparkleFinderCatalogItem: (...args: unknown[]) =>
      getSparkleFinderCatalogItemMock(...args),
    getSparkleFinderAvailability: (...args: unknown[]) =>
      getSparkleFinderAvailabilityMock(...args),
    listSparkleFinderLiveShows: (...args: unknown[]) =>
      listSparkleFinderLiveShowsMock(...args),
  }
})

import { GET as getFinderAvailability } from '@/app/api/public/finder/availability/route'
import { GET as getFinderCatalog } from '@/app/api/public/finder/catalog/route'
import { GET as getFinderCatalogFacets } from '@/app/api/public/finder/catalog/facets/route'
import { GET as getFinderCatalogDetail } from '@/app/api/public/finder/catalog/[designId]/route'
import { GET as getFinderLiveShows } from '@/app/api/public/finder/live-shows/route'

describe('Sparkle Finder public routes', () => {
  beforeEach(() => {
    listSparkleFinderCatalogFacetsMock.mockReset()
    listSparkleFinderCatalogItemsMock.mockReset()
    getSparkleFinderCatalogItemMock.mockReset()
    getSparkleFinderAvailabilityMock.mockReset()
    listSparkleFinderLiveShowsMock.mockReset()
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

  it('passes public catalog browse filters into the shared catalog service', async () => {
    listSparkleFinderCatalogItemsMock.mockResolvedValueOnce([])

    const response = await getFinderCatalog(
      new Request(
        'http://localhost/api/public/finder/catalog?query=opal&type=ring&collection=Midnight%20Garden&material=Rose%20gold&stone=Pink%20opal&label=diamond&year=2026&limit=12',
      ),
    )

    expect(response.status).toBe(200)
    expect(listSparkleFinderCatalogItemsMock).toHaveBeenCalledWith({
      query: 'opal',
      jewelryType: 'ring',
      collection: 'Midnight Garden',
      material: 'Rose gold',
      mainStone: 'Pink opal',
      label: 'diamond',
      collectionYear: 2026,
      limit: 12,
    })
  })

  it('rejects malformed public catalog collection years', async () => {
    const response = await getFinderCatalog(
      new Request('http://localhost/api/public/finder/catalog?year=twenty-six'),
    )

    expect(response.status).toBe(400)
    expect(listSparkleFinderCatalogItemsMock).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({
      error: 'year must be a four-digit collection year.',
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

  it('returns dynamic public catalog facets without caching', async () => {
    listSparkleFinderCatalogFacetsMock.mockResolvedValueOnce({
      collections: [{ value: 'Midnight Garden', count: 2 }],
      materials: [{ value: 'Rose gold', count: 2 }],
      stones: [{ value: 'Pearl', count: 1 }],
      types: [{ value: 'ring', count: 2 }],
      labels: [{ value: 'diamond', count: 1 }],
      years: [{ value: '2026', count: 2 }],
    })

    const response = await getFinderCatalogFacets(
      new Request(
        'http://localhost/api/public/finder/catalog/facets?query=opal&type=ring&material=Rose%20gold&stone=Pearl&label=diamond&collection=Midnight%20Garden&year=2026',
      ),
    )

    expect(listSparkleFinderCatalogFacetsMock).toHaveBeenCalledWith({
      query: 'opal',
      jewelryType: 'ring',
      collection: 'Midnight Garden',
      material: 'Rose gold',
      mainStone: 'Pearl',
      label: 'diamond',
      collectionYear: 2026,
    })
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({
      facets: {
        collections: [{ value: 'Midnight Garden', count: 2 }],
        materials: [{ value: 'Rose gold', count: 2 }],
        stones: [{ value: 'Pearl', count: 1 }],
        types: [{ value: 'ring', count: 2 }],
        labels: [{ value: 'diamond', count: 1 }],
        years: [{ value: '2026', count: 2 }],
      },
    })
  })

  it('rejects malformed public catalog facet years', async () => {
    const response = await getFinderCatalogFacets(
      new Request('http://localhost/api/public/finder/catalog/facets?year=ancient'),
    )

    expect(response.status).toBe(400)
    expect(listSparkleFinderCatalogFacetsMock).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({
      error: 'year must be a four-digit collection year.',
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
    const availability = {
      listingId: 'listing-1',
      rep: {
        repId: 'rep-1',
        showName: 'Gracie Test Studio',
        repFirstName: 'Gracie',
        customerSiteUrl: 'https://www.yoursparklesuite.com/gracieteststudio',
      },
      nextShow: {
        showId: 'show-1',
        repId: 'rep-1',
        startsAt: '2026-06-10T00:00:00.000Z',
        title: 'Wednesday Reveal',
        status: 'scheduled',
      },
    }
    getSparkleFinderAvailabilityMock.mockResolvedValueOnce({
      requestedItem: { designId: 'design-1', itemNumber: 'RG100' },
      exactMatches: [availability],
      similarMatches: [{ ...availability, listingId: 'listing-2' }],
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
    const body = await response.json()
    expect(body).toEqual({
      requestedItem: { designId: 'design-1', itemNumber: 'RG100' },
      exactMatches: [availability],
      similarMatches: [{ ...availability, listingId: 'listing-2' }],
    })
    expect(JSON.stringify(body)).not.toContain('businessName')
    expect(JSON.stringify(body)).not.toContain('tradeBoardPath')
    expect(JSON.stringify(body)).not.toContain('customerSitePath')
  })

  it('returns public live shows without requiring item availability', async () => {
    listSparkleFinderLiveShowsMock.mockResolvedValueOnce([
      {
        showId: 'show-1',
        showName: 'Gracie Test Studio',
        repFirstName: 'Gracie',
        startsAt: '2026-06-10T00:00:00.000Z',
        status: 'scheduled',
        customerSiteUrl: 'https://www.yoursparklesuite.com/gracieteststudio',
      },
    ])

    const response = await getFinderLiveShows(
      new Request('http://localhost/api/public/finder/live-shows?limit=12'),
    )

    expect(listSparkleFinderLiveShowsMock).toHaveBeenCalledWith({ limit: 12 })
    expect(getSparkleFinderAvailabilityMock).not.toHaveBeenCalled()
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({
      shows: [
        {
          showId: 'show-1',
          showName: 'Gracie Test Studio',
          repFirstName: 'Gracie',
          startsAt: '2026-06-10T00:00:00.000Z',
          status: 'scheduled',
          customerSiteUrl: 'https://www.yoursparklesuite.com/gracieteststudio',
        },
      ],
    })
  })

  it('rejects invalid live show limits', async () => {
    const response = await getFinderLiveShows(
      new Request('http://localhost/api/public/finder/live-shows?limit=bad'),
    )

    expect(response.status).toBe(400)
    expect(listSparkleFinderLiveShowsMock).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toEqual({
      error: 'limit must be a positive whole number.',
    })
  })
})
