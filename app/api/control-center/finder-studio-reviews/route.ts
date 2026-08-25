import { NextResponse } from 'next/server'
import { z } from 'zod'

import {
  finalizeSparkleFinderStudioReviewV2,
  listSparkleFinderStudioReviewQueue,
} from '@/lib/sparkle-finder/studio-intake-v2'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  AuthError,
  getControlCenterAccess,
  OperatorAuthError,
} from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_REVIEW_BODY_BYTES = 8 * 1024

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(25),
}).strict()

const finalizeSchema = z.object({
  finderSubmissionId: z.string().uuid(),
  suiteDesignId: z.string().uuid(),
  reviewNote: z.string().trim().max(2_000).optional(),
}).strict()

export async function GET(request: Request) {
  try {
    await getControlCenterAccess()
    const url = new URL(request.url)
    const input = querySchema.parse({
      limit: url.searchParams.get('limit') ?? undefined,
    })
    const result = await listSparkleFinderStudioReviewQueue({
      supabase: createAdminClient(),
      limit: input.limit,
    })
    return noStoreJson(result)
  } catch (error) {
    return handleReviewRouteError(error, 'list')
  }
}

export async function PATCH(request: Request) {
  try {
    const { operator } = await getControlCenterAccess()
    const input = finalizeSchema.parse(await readBoundedJson(request))
    const result = await finalizeSparkleFinderStudioReviewV2({
      supabase: createAdminClient(),
      finderSubmissionId: input.finderSubmissionId,
      suiteDesignId: input.suiteDesignId,
      reviewerEmail: operator.email,
      reviewerRepId: operator.repId,
      ...(input.reviewNote ? { reviewNote: input.reviewNote } : {}),
    })
    return noStoreJson(result, {
      status: result.ok
        ? 200
        : result.status === 'invalid_selection' || result.status === 'conflicting_replay'
          ? 409
          : 503,
    })
  } catch (error) {
    return handleReviewRouteError(error, 'finalize')
  }
}

async function readBoundedJson(request: Request) {
  const contentLength = request.headers.get('content-length')
  if (contentLength && Number(contentLength) > MAX_REVIEW_BODY_BYTES) {
    throw new ReviewBodyTooLargeError()
  }
  if (!request.body) throw new SyntaxError('Missing request body.')

  const reader = request.body.getReader()
  const decoder = new TextDecoder()
  let bytesRead = 0
  let body = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    bytesRead += value.byteLength
    if (bytesRead > MAX_REVIEW_BODY_BYTES) {
      await reader.cancel()
      throw new ReviewBodyTooLargeError()
    }
    body += decoder.decode(value, { stream: true })
  }
  body += decoder.decode()
  return JSON.parse(body) as unknown
}

function handleReviewRouteError(error: unknown, action: 'list' | 'finalize') {
  if (error instanceof AuthError) {
    return noStoreJson({ error: 'unauthenticated' }, { status: 401 })
  }
  if (error instanceof OperatorAuthError) {
    return noStoreJson({ error: 'forbidden' }, { status: 403 })
  }
  if (
    error instanceof SyntaxError ||
    error instanceof z.ZodError ||
    error instanceof ReviewBodyTooLargeError
  ) {
    return noStoreJson(
      { error: 'Check the Studio review details and try again.' },
      { status: error instanceof ReviewBodyTooLargeError ? 413 : 400 },
    )
  }

  console.error(`[control-center/finder-studio-reviews] ${action} failed`, error)
  return noStoreJson(
    { error: 'Studio reviews could not be updated right now.' },
    { status: 500 },
  )
}

function noStoreJson(body: unknown, init: ResponseInit = {}) {
  const response = NextResponse.json(body, init)
  response.headers.set('cache-control', 'no-store')
  response.headers.set('x-content-type-options', 'nosniff')
  return response
}

class ReviewBodyTooLargeError extends Error {}
