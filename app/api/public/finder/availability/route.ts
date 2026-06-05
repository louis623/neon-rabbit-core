import {
  DEFAULT_FINDER_AVAILABILITY_LIMIT,
  MAX_FINDER_AVAILABILITY_LIMIT,
  getSparkleFinderAvailability,
  parseSparkleFinderLimit,
} from '@/lib/sparkle-finder/public-api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const designId = url.searchParams.get('designId')?.trim()
  if (!designId) {
    return Response.json(
      { error: 'designId is required.' },
      { status: 400, headers: noStoreHeaders() },
    )
  }

  const limit = parseSparkleFinderLimit(
    url.searchParams.get('limit'),
    DEFAULT_FINDER_AVAILABILITY_LIMIT,
    MAX_FINDER_AVAILABILITY_LIMIT,
  )
  if (limit === null) {
    return Response.json(
      { error: 'limit must be a positive whole number.' },
      { status: 400, headers: noStoreHeaders() },
    )
  }

  const availability = await getSparkleFinderAvailability({ designId, limit })
  if (!availability.requestedItem) {
    return Response.json(
      { error: 'catalog item not found' },
      { status: 404, headers: noStoreHeaders() },
    )
  }

  return Response.json(availability, { headers: noStoreHeaders() })
}

function noStoreHeaders() {
  return {
    'cache-control': 'no-store',
  }
}
