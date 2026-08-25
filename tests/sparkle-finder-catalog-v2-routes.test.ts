import { beforeEach, describe, expect, it, vi } from 'vitest'

const catalogMocks = vi.hoisted(() => ({
  parseRequest: vi.fn(),
  listPage: vi.fn(),
  listFacets: vi.fn(),
  parseBatch: vi.fn(),
  listBatch: vi.fn(),
}))

vi.mock('@/lib/sparkle-finder/catalog-v2', async () => {
  const actual = await vi.importActual<typeof import('@/lib/sparkle-finder/catalog-v2')>(
    '@/lib/sparkle-finder/catalog-v2',
  )
  return {
    ...actual,
    parseFinderCatalogRequest: catalogMocks.parseRequest,
    listSparkleFinderCatalogPageV2: catalogMocks.listPage,
    listSparkleFinderCatalogFacetsV2: catalogMocks.listFacets,
    parseFinderCatalogBatchBody: catalogMocks.parseBatch,
    listSparkleFinderCatalogBatchV2: catalogMocks.listBatch,
  }
})

import { GET as getCatalog } from '@/app/api/public/finder/catalog/route'
import { POST as postCatalogBatch } from '@/app/api/public/finder/catalog/batch/route'
import { GET as getCatalogFacets } from '@/app/api/public/finder/catalog/facets/route'
import {
  CatalogV2ConfigurationError,
  CatalogV2RequestError,
} from '@/lib/sparkle-finder/catalog-v2'
import {
  FINDER_CATALOG_RATE_LIMIT,
  resetFinderCatalogRateLimitsForTests,
} from '@/lib/sparkle-finder/catalog-route-guard'

describe('Sparkle Finder catalog v2 routes', () => {
  beforeEach(() => {
    for (const mock of Object.values(catalogMocks)) mock.mockReset()
    resetFinderCatalogRateLimitsForTests()
  })

  it('extends the existing catalog route with schema and authoritative page metadata', async () => {
    const parsed = { filters: { query: 'ruby' }, limit: 24, position: null }
    const payload = {
      schemaVersion: 2,
      items: [{ designId: 'design-ruby', itemNumber: 'ER13229' }],
      pageInfo: { totalCount: 51, hasMore: true, nextCursor: 'opaque.next' },
    }
    catalogMocks.parseRequest.mockReturnValue(parsed)
    catalogMocks.listPage.mockResolvedValue(payload)

    const response = await getCatalog(
      new Request('https://suite.test/api/public/finder/catalog?query=ruby'),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(catalogMocks.parseRequest).toHaveBeenCalledWith(expect.any(URL))
    expect(catalogMocks.listPage).toHaveBeenCalledWith(parsed)
    await expect(response.json()).resolves.toEqual(payload)
  })

  it('returns a clear 400 for an invalid or filter-mismatched cursor', async () => {
    catalogMocks.parseRequest.mockImplementation(() => {
      throw new CatalogV2RequestError('Catalog cursor does not match these filters.')
    })

    const response = await getCatalog(
      new Request('https://suite.test/api/public/finder/catalog?cursor=wrong'),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'Catalog cursor does not match these filters.',
    })
    expect(catalogMocks.listPage).not.toHaveBeenCalled()
  })

  it('returns 503 instead of an authoritative empty catalog when storage is unavailable', async () => {
    catalogMocks.parseRequest.mockReturnValue({ filters: {}, limit: 24, position: null })
    catalogMocks.listPage.mockRejectedValue(
      new CatalogV2ConfigurationError('Catalog storage is unavailable.'),
    )

    const response = await getCatalog(
      new Request('https://suite.test/api/public/finder/catalog'),
    )

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: 'Catalog storage is unavailable.',
    })
  })

  it('returns exact complete facets from the catalog v2 query', async () => {
    const parsed = { filters: { label: 'diamond' }, limit: 24, position: null }
    const payload = {
      schemaVersion: 2,
      facets: {
        collections: [{ value: 'January 2026', count: 501 }],
        materials: [],
        stones: [],
        types: [],
        labels: [{ value: 'diamond', count: 501 }],
        years: [{ value: '2026', count: 501 }],
      },
    }
    catalogMocks.parseRequest.mockReturnValue(parsed)
    catalogMocks.listFacets.mockResolvedValue(payload)

    const response = await getCatalogFacets(
      new Request('https://suite.test/api/public/finder/catalog/facets?label=diamond'),
    )

    expect(catalogMocks.listFacets).toHaveBeenCalledWith({ filters: parsed.filters })
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual(payload)
  })

  it('provides exact batch hydration without falling through to catalog detail', async () => {
    const designIds = [
      '00000000-0000-4000-8000-000000000002',
      '00000000-0000-4000-8000-000000000001',
    ]
    const payload = {
      schemaVersion: 2,
      items: [{ designId: designIds[1] }],
      missingDesignIds: [designIds[0]],
    }
    catalogMocks.parseBatch.mockReturnValue(designIds)
    catalogMocks.listBatch.mockResolvedValue(payload)

    const response = await postCatalogBatch(
      new Request('https://suite.test/api/public/finder/catalog/batch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ designIds }),
      }),
    )

    expect(catalogMocks.parseBatch).toHaveBeenCalledWith({ designIds })
    expect(catalogMocks.listBatch).toHaveBeenCalledWith({ designIds })
    expect(response.headers.get('cache-control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual(payload)
  })

  it('rejects oversized batch bodies before parsing JSON', async () => {
    const response = await postCatalogBatch(
      new Request('https://suite.test/api/public/finder/catalog/batch', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': '9000',
        },
        body: '{}',
      }),
    )

    expect(response.status).toBe(413)
    expect(catalogMocks.parseBatch).not.toHaveBeenCalled()
    expect(catalogMocks.listBatch).not.toHaveBeenCalled()
  })

  it('requires JSON content type for catalog batches', async () => {
    const response = await postCatalogBatch(
      new Request('https://suite.test/api/public/finder/catalog/batch', {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: '{}',
      }),
    )

    expect(response.status).toBe(415)
    expect(catalogMocks.parseBatch).not.toHaveBeenCalled()
  })

  it('stops reading a streamed batch body once the byte cap is exceeded', async () => {
    const request = new Request('https://suite.test/api/public/finder/catalog/batch', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ padding: 'x'.repeat(9_000) }),
    })
    expect(request.headers.get('content-length')).toBeNull()

    const response = await postCatalogBatch(request)

    expect(response.status).toBe(413)
    expect(catalogMocks.parseBatch).not.toHaveBeenCalled()
    expect(catalogMocks.listBatch).not.toHaveBeenCalled()
  })

  it('rate limits repeated catalog requests before querying', async () => {
    catalogMocks.parseRequest.mockReturnValue({ filters: {}, limit: 24, position: null })
    catalogMocks.listPage.mockResolvedValue({
      schemaVersion: 2,
      items: [],
      pageInfo: { totalCount: 0, hasMore: false, nextCursor: null },
    })
    const makeRequest = () =>
      new Request('https://suite.test/api/public/finder/catalog', {
        headers: { 'x-forwarded-for': '203.0.113.44' },
      })

    for (let index = 0; index < FINDER_CATALOG_RATE_LIMIT; index += 1) {
      expect((await getCatalog(makeRequest())).status).toBe(200)
    }
    const response = await getCatalog(makeRequest())

    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('60')
    expect(catalogMocks.listPage).toHaveBeenCalledTimes(FINDER_CATALOG_RATE_LIMIT)
  })
})
