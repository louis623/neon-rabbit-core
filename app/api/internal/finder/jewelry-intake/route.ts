import { NextResponse } from 'next/server'

import {
  authorizeSparkleFinderIntakeRequest,
  publishSparkleFinderJewelryIntake,
} from '@/lib/sparkle-finder/internal-intake'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const auth = authorizeSparkleFinderIntakeRequest(
    request,
    process.env.SPARKLE_FINDER_TO_SUITE_INTAKE_TOKEN,
  )

  if (!auth.ok) {
    return noStoreJson(
      {
        error:
          auth.reason === 'not_configured'
            ? 'Sparkle Finder intake is not configured.'
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
    const result = await publishSparkleFinderJewelryIntake(body, {
      supabase: createAdminClient(),
    })

    return noStoreJson(result, { status: result.ok ? 200 : 422 })
  } catch {
    return noStoreJson(
      {
        ok: false,
        status: 'rejected',
        message: 'Sparkle Finder intake could not be processed right now.',
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
