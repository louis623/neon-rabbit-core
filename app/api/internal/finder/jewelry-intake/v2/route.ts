import { timingSafeEqual } from 'node:crypto'

import { NextResponse } from 'next/server'

import {
  processSparkleFinderStudioIntakeV2,
  type SparkleFinderStudioIntakeV2Result,
} from '@/lib/sparkle-finder/studio-intake-v2'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 64 * 1024
const RATE_WINDOW_MS = 60_000
const RATE_LIMIT = 120
const MAX_RATE_BUCKETS = 10_000
const requestWindows = new Map<string, { count: number; startedAt: number }>()

export async function POST(request: Request) {
  const expectedToken = process.env.SPARKLE_FINDER_TO_SUITE_INTAKE_TOKEN?.trim()
  if (!expectedToken) {
    return noStoreJson(
      { error: 'Sparkle Finder intake is not configured.' },
      { status: 503 },
    )
  }
  if (!matchesBearerToken(request.headers.get('authorization'), expectedToken)) {
    return noStoreJson({ error: 'unauthorized' }, { status: 401 })
  }

  const rateKey = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')?.trim()
    || 'finder-service'
  if (!allowRequest(rateKey)) {
    const response = noStoreJson(
      failure(
        'temporary_failure',
        true,
        'rate_limited',
        'Showcase Studio is receiving too many requests. Please try again shortly.',
      ),
      { status: 429 },
    )
    response.headers.set('retry-after', '60')
    return response
  }

  const contentType = request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
  if (contentType !== 'application/json') {
    return noStoreJson(
      failure(
        'invalid_details',
        false,
        'invalid_content_type',
        'Showcase Studio requests must use JSON.',
      ),
      { status: 415 },
    )
  }

  let body: unknown
  try {
    body = await readBoundedJson(request)
  } catch (error) {
    const tooLarge = error instanceof BodyTooLargeError
    return noStoreJson(
      failure(
        'invalid_details',
        false,
        tooLarge ? 'request_too_large' : 'invalid_json',
        tooLarge
          ? 'Showcase Studio received too much request data.'
          : 'Showcase Studio received malformed JSON.',
      ),
      { status: tooLarge ? 413 : 400 },
    )
  }

  try {
    const result = await processSparkleFinderStudioIntakeV2(body, {
      supabase: createAdminClient(),
    })
    return noStoreJson(result, { status: statusForResult(result) })
  } catch {
    const result = failure(
      'database_failed',
      true,
      'intake_service_unavailable',
      'Showcase Studio could not save this step right now. Please try again.',
    )
    return noStoreJson(result, { status: 503 })
  }
}

async function readBoundedJson(request: Request): Promise<unknown> {
  const contentLength = request.headers.get('content-length')
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) throw new BodyTooLargeError()
  if (!request.body) throw new SyntaxError('Missing request body.')

  const reader = request.body.getReader()
  const decoder = new TextDecoder()
  let bytesRead = 0
  let body = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    bytesRead += value.byteLength
    if (bytesRead > MAX_BODY_BYTES) {
      await reader.cancel()
      throw new BodyTooLargeError()
    }
    body += decoder.decode(value, { stream: true })
  }
  body += decoder.decode()
  return JSON.parse(body)
}

function matchesBearerToken(authorization: string | null, expectedToken: string): boolean {
  const suppliedToken = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : ''
  const supplied = Buffer.from(suppliedToken)
  const expected = Buffer.from(expectedToken)
  return supplied.length === expected.length && timingSafeEqual(supplied, expected)
}

function allowRequest(key: string): boolean {
  const now = Date.now()
  const current = requestWindows.get(key)
  if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
    if (!current && requestWindows.size >= MAX_RATE_BUCKETS) {
      for (const [bucketKey, bucket] of requestWindows) {
        if (now - bucket.startedAt >= RATE_WINDOW_MS) requestWindows.delete(bucketKey)
      }
      if (requestWindows.size >= MAX_RATE_BUCKETS) {
        const oldestKey = requestWindows.keys().next().value as string | undefined
        if (oldestKey) requestWindows.delete(oldestKey)
      }
    }
    requestWindows.set(key, { count: 1, startedAt: now })
    return true
  }
  current.count += 1
  return current.count <= RATE_LIMIT
}

function statusForResult(result: SparkleFinderStudioIntakeV2Result): number {
  if (result.ok) return 200
  if (result.status === 'invalid_details') return 400
  if (result.status === 'photo_rejected') return 422
  if (result.status === 'invalid_selection' || result.status === 'conflicting_replay') return 409
  return 503
}

function failure(
  status: Extract<SparkleFinderStudioIntakeV2Result, { ok: false }>['status'],
  retryable: boolean,
  errorCode: string,
  customerMessage: string,
): SparkleFinderStudioIntakeV2Result {
  return {
    schemaVersion: 2,
    ok: false,
    status,
    retryable,
    errorCode,
    customerMessage,
  }
}

function noStoreJson(body: unknown, init: ResponseInit = {}) {
  const response = NextResponse.json(body, init)
  response.headers.set('cache-control', 'no-store')
  response.headers.set('x-content-type-options', 'nosniff')
  return response
}

class BodyTooLargeError extends Error {}
