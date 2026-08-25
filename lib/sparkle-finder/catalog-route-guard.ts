export const FINDER_CATALOG_RATE_LIMIT = 60
export const FINDER_CATALOG_RATE_WINDOW_MS = 60_000

const MAX_RATE_BUCKETS = 2_048

interface RateBucket {
  count: number
  resetAt: number
}

const rateBuckets = new Map<string, RateBucket>()

export interface FinderCatalogRateLimitResult {
  allowed: boolean
  retryAfterSeconds: number
}

export class FinderCatalogBodyTooLargeError extends Error {
  constructor() {
    super('Catalog batch request body is too large.')
    this.name = 'FinderCatalogBodyTooLargeError'
  }
}

export function checkFinderCatalogRateLimit(
  request: Request,
  nowMs = Date.now(),
): FinderCatalogRateLimitResult {
  const key = requestClientKey(request)
  const existing = rateBuckets.get(key)
  if (!existing || existing.resetAt <= nowMs) {
    makeRoomForRateBucket(nowMs)
    rateBuckets.set(key, {
      count: 1,
      resetAt: nowMs + FINDER_CATALOG_RATE_WINDOW_MS,
    })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  existing.count += 1
  if (existing.count <= FINDER_CATALOG_RATE_LIMIT) {
    return { allowed: true, retryAfterSeconds: 0 }
  }

  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - nowMs) / 1_000)),
  }
}

export function resetFinderCatalogRateLimitsForTests() {
  rateBuckets.clear()
}

export async function readBoundedFinderCatalogBody(
  request: Request,
  maxBytes: number,
): Promise<string> {
  const reader = request.body?.getReader()
  if (!reader) return ''

  const decoder = new TextDecoder('utf-8', { fatal: true })
  let byteCount = 0
  let body = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      byteCount += value.byteLength
      if (byteCount > maxBytes) {
        await reader.cancel()
        throw new FinderCatalogBodyTooLargeError()
      }
      body += decoder.decode(value, { stream: true })
    }
    return body + decoder.decode()
  } catch (error) {
    if (error instanceof FinderCatalogBodyTooLargeError) throw error
    throw new Error('Catalog batch request body could not be read.')
  } finally {
    reader.releaseLock()
  }
}

function requestClientKey(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const candidate = forwarded || request.headers.get('x-real-ip')?.trim() || 'unknown'
  return candidate.slice(0, 128)
}

function makeRoomForRateBucket(nowMs: number) {
  if (rateBuckets.size < MAX_RATE_BUCKETS) return
  for (const [key, bucket] of rateBuckets) {
    if (bucket.resetAt <= nowMs) rateBuckets.delete(key)
  }
  if (rateBuckets.size < MAX_RATE_BUCKETS) return
  const oldestKey = rateBuckets.keys().next().value as string | undefined
  if (oldestKey) rateBuckets.delete(oldestKey)
}
