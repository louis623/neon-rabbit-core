import { NextResponse } from 'next/server'

import {
  AuthError,
  getPaidNicNacContext,
} from '@/lib/nic-nac/auth'
import { ServiceError } from '@/lib/services/errors'
import { getTradeRequestRevealScreenshotForRep } from '@/lib/services/trade-requests'
import { getTradeRequestRevealScreenshotSignedUrl } from '@/lib/services/storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function serviceErrorResponse(error: ServiceError) {
  return NextResponse.json(
    { code: error.code, error: error.userMessage },
    { status: error.statusCode },
  )
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ requestId: string }> },
) {
  try {
    const { requestId } = await context.params
    const { repId, supabase } = await getPaidNicNacContext()
    const screenshot = await getTradeRequestRevealScreenshotForRep(
      supabase,
      repId,
      requestId,
    )

    if (!screenshot) {
      return NextResponse.json(
        { error: 'Screenshot is unavailable or has expired.' },
        { status: 410 },
      )
    }

    const signedUrl = await getTradeRequestRevealScreenshotSignedUrl(
      screenshot.objectPath,
    )
    return NextResponse.redirect(signedUrl, 307)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    if (error instanceof ServiceError) return serviceErrorResponse(error)
    throw error
  }
}
