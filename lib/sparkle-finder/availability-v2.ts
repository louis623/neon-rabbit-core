import { createHmac, timingSafeEqual } from 'node:crypto'

export const MAX_FINDER_AVAILABILITY_CURSOR_LENGTH = 1024

const CURSOR_VERSION = 1
const CURSOR_SORT = 'listed-at-id-desc-v1'
const CURSOR_MAX_AGE_MS = 24 * 60 * 60 * 1000
const CURSOR_CLOCK_SKEW_MS = 5 * 60 * 1000

export type FinderAvailabilityBucket = 'exact' | 'similar'

interface FinderAvailabilityCursorPayload {
  v: typeof CURSOR_VERSION
  sort: typeof CURSOR_SORT
  designId: string
  bucket: FinderAvailabilityBucket
  issuedAt: number
  listedAt: string | null
  listingId: string
}

export interface FinderAvailabilityCursorPosition {
  listedAt: string | null
  listingId: string
}

export interface FinderAvailabilityPageInfo {
  totalLeadCount: number
  totalDancerCount: number
  hasMore: boolean
  nextCursor: string | null
}

export class FinderAvailabilityCursorError extends Error {
  constructor(message = 'availability cursor is invalid or does not match this request.') {
    super(message)
    this.name = 'FinderAvailabilityCursorError'
  }
}

export class FinderAvailabilityConfigurationError extends Error {
  readonly status = 503

  constructor(message = 'Availability storage is unavailable.') {
    super(message)
    this.name = 'FinderAvailabilityConfigurationError'
  }
}

export function encodeFinderAvailabilityCursor(args: {
  designId: string
  bucket: FinderAvailabilityBucket
  listedAt: string | null
  listingId: string
  secret?: string
  issuedAt?: number
}) {
  const payload: FinderAvailabilityCursorPayload = {
    v: CURSOR_VERSION,
    sort: CURSOR_SORT,
    designId: args.designId,
    bucket: args.bucket,
    issuedAt: args.issuedAt ?? Date.now(),
    listedAt: args.listedAt,
    listingId: args.listingId,
  }
  validateCursorPayload(payload)

  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const signature = signCursor(encoded, resolveCursorSecret(args.secret))
  return `${encoded}.${signature}`
}

export function decodeFinderAvailabilityCursor(args: {
  cursor: string
  designId: string
  bucket: FinderAvailabilityBucket
  secret?: string
  now?: number
}): FinderAvailabilityCursorPosition {
  if (
    !args.cursor ||
    args.cursor.length > MAX_FINDER_AVAILABILITY_CURSOR_LENGTH ||
    args.cursor.split('.').length !== 2
  ) {
    throw new FinderAvailabilityCursorError()
  }

  const [encoded, suppliedSignature] = args.cursor.split('.') as [string, string]
  const expectedSignature = signCursor(encoded, resolveCursorSecret(args.secret))
  const suppliedBuffer = Buffer.from(suppliedSignature, 'utf8')
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8')
  if (
    suppliedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(suppliedBuffer, expectedBuffer)
  ) {
    throw new FinderAvailabilityCursorError()
  }

  let payload: unknown
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
  } catch {
    throw new FinderAvailabilityCursorError()
  }
  validateCursorPayload(payload)
  if (payload.designId !== args.designId || payload.bucket !== args.bucket) {
    throw new FinderAvailabilityCursorError()
  }
  const now = args.now ?? Date.now()
  if (
    payload.issuedAt > now + CURSOR_CLOCK_SKEW_MS ||
    now - payload.issuedAt > CURSOR_MAX_AGE_MS
  ) {
    throw new FinderAvailabilityCursorError('availability cursor has expired.')
  }

  return { listedAt: payload.listedAt, listingId: payload.listingId }
}

export function buildFinderAvailabilityPage<
  T extends {
    listingId: string
    listedAt: string | null
    quantityAvailable: number
  },
>(args: {
  bucket: FinderAvailabilityBucket
  designId: string
  rows: T[]
  limit: number
  totalLeadCount: number
  totalDancerCount: number
  secret?: string
}): { matches: T[]; pageInfo: FinderAvailabilityPageInfo } {
  if (!Number.isInteger(args.limit) || args.limit < 1) {
    throw new Error('Finder availability page limit is invalid.')
  }
  if (
    !Number.isInteger(args.totalLeadCount) ||
    args.totalLeadCount < 0 ||
    !Number.isInteger(args.totalDancerCount) ||
    args.totalDancerCount < 0
  ) {
    throw new Error('Finder availability totals are invalid.')
  }

  const listingIds = new Set<string>()
  let currentRowsDancerCount = 0
  for (const row of args.rows) {
    if (listingIds.has(row.listingId)) {
      throw new Error('Finder availability page contains a duplicate listing id.')
    }
    listingIds.add(row.listingId)
    if (!Number.isInteger(row.quantityAvailable) || row.quantityAvailable < 1) {
      throw new Error('Finder availability page contains an invalid net quantity.')
    }
    currentRowsDancerCount += row.quantityAvailable
  }
  if (
    args.totalLeadCount < args.rows.length ||
    args.totalDancerCount < currentRowsDancerCount
  ) {
    throw new Error('Finder availability totals are smaller than the current page.')
  }

  const matches = args.rows.slice(0, args.limit)
  const hasMore = args.rows.length > args.limit
  const last = hasMore ? matches.at(-1) : null

  return {
    matches,
    pageInfo: {
      totalLeadCount: args.totalLeadCount,
      totalDancerCount: args.totalDancerCount,
      hasMore,
      nextCursor: last
        ? encodeFinderAvailabilityCursor({
            designId: args.designId,
            bucket: args.bucket,
            listedAt: last.listedAt,
            listingId: last.listingId,
            secret: args.secret,
          })
        : null,
    },
  }
}

function validateCursorPayload(
  payload: unknown,
): asserts payload is FinderAvailabilityCursorPayload {
  if (!payload || typeof payload !== 'object') {
    throw new FinderAvailabilityCursorError()
  }
  const value = payload as Partial<FinderAvailabilityCursorPayload>
  if (
    value.v !== CURSOR_VERSION ||
    value.sort !== CURSOR_SORT ||
    (value.bucket !== 'exact' && value.bucket !== 'similar') ||
    typeof value.designId !== 'string' ||
    !value.designId.trim() ||
    value.designId.length > 100 ||
    typeof value.listingId !== 'string' ||
    !value.listingId.trim() ||
    value.listingId.length > 100 ||
    !Number.isSafeInteger(value.issuedAt) ||
    Number(value.issuedAt) < 1 ||
    !isValidListedAt(value.listedAt)
  ) {
    throw new FinderAvailabilityCursorError()
  }
}

function isValidListedAt(value: unknown): value is string | null {
  if (value === null) return true
  return (
    typeof value === 'string' &&
    value.length <= 40 &&
    Number.isFinite(Date.parse(value))
  )
}

function resolveCursorSecret(explicit?: string) {
  const secret =
    explicit?.trim() ||
    process.env.SPARKLE_FINDER_CURSOR_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!secret) {
    throw new Error('Sparkle Finder cursor signing is not configured.')
  }
  return secret
}

function signCursor(encodedPayload: string, secret: string) {
  return createHmac('sha256', secret)
    .update(`sparkle-finder-availability:${encodedPayload}`)
    .digest('base64url')
}
