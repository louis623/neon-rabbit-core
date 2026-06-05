import {
  DEFAULT_FINDER_CATALOG_LIMIT,
  MAX_FINDER_CATALOG_LIMIT,
  listSparkleFinderCatalogItems,
  parseSparkleFinderLimit,
} from '@/lib/sparkle-finder/public-api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const limit = parseSparkleFinderLimit(
    url.searchParams.get('limit'),
    DEFAULT_FINDER_CATALOG_LIMIT,
    MAX_FINDER_CATALOG_LIMIT,
  )
  if (limit === null) {
    return Response.json(
      { error: 'limit must be a positive whole number.' },
      { status: 400, headers: noStoreHeaders() },
    )
  }

  const items = await listSparkleFinderCatalogItems({
    query: url.searchParams.get('query') ?? undefined,
    limit,
  })

  return Response.json(
    { items },
    {
      headers: noStoreHeaders(),
    },
  )
}

function noStoreHeaders() {
  return {
    'cache-control': 'no-store',
  }
}
