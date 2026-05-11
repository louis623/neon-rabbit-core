import { ServiceError } from '@/lib/services/errors'

const WINDOW_MS = 60_000
const MAX_SUBMISSIONS_PER_WINDOW = 5
const buckets = new Map<string, number[]>()

function readString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function getClientAddress(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown'
  }

  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

function prune(entries: number[], now: number) {
  return entries.filter((timestamp) => now - timestamp < WINDOW_MS)
}

function readPayloadObject(payload: unknown) {
  return payload && typeof payload === 'object'
    ? (payload as Record<string, unknown>)
    : {}
}

export function assertPrelaunchRequestAllowed(args: {
  formName: 'intake' | 'waitlist'
  payload: unknown
  request: Request
}) {
  const payload = readPayloadObject(args.payload)
  const honeypot = readString(payload.website).trim()

  if (honeypot) {
    throw new ServiceError({
      code: 'SPAM_SUBMISSION',
      message: `${args.formName} honeypot field was filled`,
      userMessage: 'Submission could not be saved.',
      statusCode: 400,
    })
  }

  const key = `${args.formName}:${getClientAddress(args.request)}`
  const now = Date.now()
  const recent = prune(buckets.get(key) ?? [], now)

  if (recent.length >= MAX_SUBMISSIONS_PER_WINDOW) {
    buckets.set(key, recent)
    throw new ServiceError({
      code: 'RATE_LIMITED',
      message: `${args.formName} submission rate limit reached`,
      userMessage: 'Please wait a minute and try again.',
      statusCode: 429,
    })
  }

  buckets.set(key, [...recent, now])
}

export function resetPrelaunchRequestGuardForTests() {
  buckets.clear()
}
