import {
  DEFAULT_FINDER_AVAILABILITY_LIMIT,
  MAX_FINDER_AVAILABILITY_LIMIT,
  getSparkleFinderAvailability,
  parseSparkleFinderLimit,
} from '@/lib/sparkle-finder/public-api'
import {
  FinderAvailabilityConfigurationError,
  FinderAvailabilityCursorError,
  MAX_FINDER_AVAILABILITY_CURSOR_LENGTH,
} from '@/lib/sparkle-finder/availability-v2'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 120
const RATE_LIMIT_MAX_BUCKETS = 10_000
const availabilityRateBuckets = new Map<string, number[]>()

export async function GET(request: Request) {
  if (!allowAvailabilityRequest(request)) {
    return Response.json(
      { error: 'Too many availability requests. Please try again shortly.' },
      { status: 429, headers: noStoreHeaders() },
    )
  }

  const url = new URL(request.url)
  const designId = url.searchParams.get('designId')?.trim()
  if (!designId) {
    return Response.json(
      { error: 'designId is required.' },
      { status: 400, headers: noStoreHeaders() },
    )
  }
  if (designId.length > 100) {
    return Response.json(
      { error: 'designId must be 100 characters or fewer.' },
      { status: 400, headers: noStoreHeaders() },
    )
  }

  const exactCursor = url.searchParams.get('exactCursor')?.trim() || undefined
  const similarCursor = url.searchParams.get('similarCursor')?.trim() || undefined
  if (
    (exactCursor?.length ?? 0) > MAX_FINDER_AVAILABILITY_CURSOR_LENGTH ||
    (similarCursor?.length ?? 0) > MAX_FINDER_AVAILABILITY_CURSOR_LENGTH
  ) {
    return Response.json(
      {
        error: `availability cursor must be ${MAX_FINDER_AVAILABILITY_CURSOR_LENGTH} characters or fewer.`,
      },
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

  try {
    const availability = await getSparkleFinderAvailability({
      designId,
      limit,
      ...(exactCursor ? { exactCursor } : {}),
      ...(similarCursor ? { similarCursor } : {}),
    })
    if (!availability.requestedItem) {
      return Response.json(
        { error: 'catalog item not found' },
        { status: 404, headers: noStoreHeaders() },
      )
    }

    return Response.json(availability, { headers: noStoreHeaders() })
  } catch (error) {
    if (error instanceof FinderAvailabilityCursorError) {
      return Response.json(
        { error: error.message },
        { status: 400, headers: noStoreHeaders() },
      )
    }
    if (error instanceof FinderAvailabilityConfigurationError) {
      return Response.json(
        { error: error.message },
        { status: error.status, headers: noStoreHeaders() },
      )
    }
    console.error('[sparkle-finder/availability] Public availability failed:', error)
    return Response.json(
      { error: 'Availability is temporarily unavailable.' },
      { status: 503, headers: noStoreHeaders() },
    )
  }
}

function allowAvailabilityRequest(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const clientAddress = forwarded || request.headers.get('x-real-ip')?.trim() || 'unknown'
  const now = Date.now()
  const recent = (availabilityRateBuckets.get(clientAddress) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  )
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    availabilityRateBuckets.set(clientAddress, recent)
    return false
  }
  if (
    !availabilityRateBuckets.has(clientAddress) &&
    availabilityRateBuckets.size >= RATE_LIMIT_MAX_BUCKETS
  ) {
    const oldestKey = availabilityRateBuckets.keys().next().value as string | undefined
    if (oldestKey) availabilityRateBuckets.delete(oldestKey)
  }
  availabilityRateBuckets.set(clientAddress, [...recent, now])
  return true
}

function noStoreHeaders() {
  return {
    'cache-control': 'no-store',
  }
}
