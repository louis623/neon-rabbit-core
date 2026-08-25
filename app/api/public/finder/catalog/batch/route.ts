import {
  CatalogV2ConfigurationError,
  CatalogV2RequestError,
  MAX_FINDER_CATALOG_BATCH_BODY_BYTES,
  listSparkleFinderCatalogBatchV2,
  parseFinderCatalogBatchBody,
} from '@/lib/sparkle-finder/catalog-v2'
import {
  FinderCatalogBodyTooLargeError,
  checkFinderCatalogRateLimit,
  readBoundedFinderCatalogBody,
} from '@/lib/sparkle-finder/catalog-route-guard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const rateLimit = checkFinderCatalogRateLimit(request)
  if (!rateLimit.allowed) {
    return Response.json(
      { error: 'Catalog request rate limit exceeded.' },
      {
        status: 429,
        headers: { ...noStoreHeaders(), 'retry-after': String(rateLimit.retryAfterSeconds) },
      },
    )
  }

  const contentType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase()
  if (contentType !== 'application/json') {
    return Response.json(
      { error: 'Catalog batch request content-type must be application/json.' },
      { status: 415, headers: noStoreHeaders() },
    )
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (Number.isFinite(contentLength) && contentLength > MAX_FINDER_CATALOG_BATCH_BODY_BYTES) {
    return Response.json(
      { error: 'Catalog batch request body is too large.' },
      { status: 413, headers: noStoreHeaders() },
    )
  }

  try {
    const bodyText = await readBoundedFinderCatalogBody(
      request,
      MAX_FINDER_CATALOG_BATCH_BODY_BYTES,
    )
    let body: unknown
    try {
      body = JSON.parse(bodyText)
    } catch {
      throw new CatalogV2RequestError('Catalog batch request must be valid JSON.')
    }
    const designIds = parseFinderCatalogBatchBody(body)
    return Response.json(await listSparkleFinderCatalogBatchV2({ designIds }), {
      headers: noStoreHeaders(),
    })
  } catch (error) {
    if (error instanceof FinderCatalogBodyTooLargeError) {
      return Response.json(
        { error: error.message },
        { status: 413, headers: noStoreHeaders() },
      )
    }
    if (error instanceof CatalogV2RequestError || error instanceof CatalogV2ConfigurationError) {
      return Response.json(
        { error: error.message },
        { status: error.status, headers: noStoreHeaders() },
      )
    }
    throw error
  }
}

function noStoreHeaders() {
  return {
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  }
}
