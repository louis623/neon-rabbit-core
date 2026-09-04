import { createHash } from 'node:crypto'

export const TEAM_ONBOARDING_RATE_WINDOW_MS = 60_000

const MAX_IP_BUCKETS = 2_048
const MAX_INVITE_BUCKETS = 4_096
const LIMITS = {
  access: 60,
  progress: 30,
  messages: 10,
} as const

export type TeamOnboardingPublicAction = keyof typeof LIMITS

type RateBucket = {
  count: number
  resetAt: number
}

const ipBuckets = new Map<string, RateBucket>()
const inviteBuckets = new Map<string, RateBucket>()

function clientAddress(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return (
    forwarded || request.headers.get('x-real-ip')?.trim() || 'unknown'
  ).slice(0, 128)
}

function makeRoom(
  buckets: Map<string, RateBucket>,
  maximumSize: number,
  now: number,
) {
  if (buckets.size < maximumSize) return
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
  if (buckets.size < maximumSize) return
  const oldestKey = buckets.keys().next().value as string | undefined
  if (oldestKey) buckets.delete(oldestKey)
}

function consumeBucket(
  buckets: Map<string, RateBucket>,
  maximumSize: number,
  key: string,
  limit: number,
  now: number,
) {
  const current = buckets.get(key)
  if (!current || current.resetAt <= now) {
    makeRoom(buckets, maximumSize, now)
    buckets.set(key, {
      count: 1,
      resetAt: now + TEAM_ONBOARDING_RATE_WINDOW_MS,
    })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  current.count += 1
  return {
    allowed: current.count <= limit,
    retryAfterSeconds:
      current.count <= limit
        ? 0
        : Math.max(1, Math.ceil((current.resetAt - now) / 1_000)),
  }
}

export function checkTeamOnboardingPublicRateLimit(
  request: Request,
  action: TeamOnboardingPublicAction,
  inviteToken: string,
  now = Date.now(),
) {
  const address = clientAddress(request)
  const tokenFingerprint = createHash('sha256')
    .update(inviteToken)
    .digest('hex')
    .slice(0, 16)

  const ipResult = consumeBucket(
    ipBuckets,
    MAX_IP_BUCKETS,
    `${action}:${address}`,
    LIMITS[action],
    now,
  )
  if (!ipResult.allowed) return ipResult

  return consumeBucket(
    inviteBuckets,
    MAX_INVITE_BUCKETS,
    `${action}:${address}:${tokenFingerprint}`,
    LIMITS[action],
    now,
  )
}

export function resetTeamOnboardingPublicRateLimitsForTests() {
  ipBuckets.clear()
  inviteBuckets.clear()
}

export function getTeamOnboardingPublicRateLimitForTests(
  action: TeamOnboardingPublicAction,
) {
  return LIMITS[action]
}
