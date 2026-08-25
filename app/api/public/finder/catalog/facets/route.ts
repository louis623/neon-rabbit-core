import {
  CatalogV2ConfigurationError,
  CatalogV2RequestError,
  listSparkleFinderCatalogFacetsV2,
  parseFinderCatalogRequest,
} from '@/lib/sparkle-finder/catalog-v2'
import { checkFinderCatalogRateLimit } from '@/lib/sparkle-finder/catalog-route-guard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
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
  try {
    const { filters } = parseFinderCatalogRequest(new URL(request.url))
    return Response.json(await listSparkleFinderCatalogFacetsV2({ filters }), {
      headers: noStoreHeaders(),
    })
  } catch (error) {
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
