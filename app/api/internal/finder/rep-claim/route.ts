import { NextResponse } from 'next/server'

import {
  authorizeSparkleFinderRepClaimRequest,
  validateSparkleFinderRepClaim,
} from '@/lib/sparkle-finder/rep-claim'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const auth = authorizeSparkleFinderRepClaimRequest(
    request,
    process.env.SPARKLE_FINDER_TO_SUITE_REP_CLAIM_TOKEN,
  )

  if (!auth.ok) {
    return noStoreJson(
      {
        error:
          auth.reason === 'not_configured'
            ? 'Sparkle Finder rep claim is not configured.'
            : 'unauthorized',
      },
      { status: auth.status },
    )
  }

  let body: unknown

  try {
    body = await request.json()
  } catch {
    return noStoreJson({ error: 'Request body must be valid JSON.' }, { status: 400 })
  }

  try {
    const result = await validateSparkleFinderRepClaim(body, {
      supabase: createAdminClient(),
    })

    return noStoreJson(result, {
      status: result.ok ? 200 : result.status === 'not_found' ? 404 : 422,
    })
  } catch {
    return noStoreJson(
      {
        ok: false,
        status: 'rejected',
        message: 'Sparkle Finder rep claim could not be processed right now.',
      },
      { status: 500 },
    )
  }
}

function noStoreJson(body: unknown, init: ResponseInit = {}) {
  const response = NextResponse.json(body, init)
  response.headers.set('cache-control', 'no-store')

  return response
}
