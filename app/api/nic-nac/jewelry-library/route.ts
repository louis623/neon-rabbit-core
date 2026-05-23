import { NextResponse } from 'next/server'
import { getAuthenticatedRep, AuthError } from '@/lib/supabase/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { ServiceError } from '@/lib/services/errors'
import { processRepCustomListingPhotoUrl } from '@/lib/services/listing-photo-processing'
import { searchJewelryDatabase } from '@/lib/services/jewelry-database'
import { addListing } from '@/lib/services/trade-board'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function readLimit(url: URL) {
  const raw = url.searchParams.get('limit')
  if (!raw) return undefined
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function serviceErrorResponse(error: ServiceError) {
  return NextResponse.json(
    { code: error.code, error: error.userMessage },
    { status: error.statusCode },
  )
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const query = url.searchParams.get('query')?.trim() ?? ''
    const limit = readLimit(url)
    if (limit === null) {
      return NextResponse.json({ error: 'limit must be a whole number.' }, { status: 400 })
    }

    const { repId } = await getAuthenticatedRep()
    const results = await searchJewelryDatabase(createAdminClient(), repId, {
      query,
      limit: limit ?? undefined,
    })

    return NextResponse.json(results)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    if (error instanceof ServiceError) return serviceErrorResponse(error)
    throw error
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { repId } = await getAuthenticatedRep()
    const itemNumber =
      typeof body?.itemNumber === 'string' ? body.itemNumber.trim() : ''
    const listingPhotoUrl =
      typeof body?.listingPhotoUrl === 'string' ? body.listingPhotoUrl : undefined
    const processedListingPhotoUrl = listingPhotoUrl
      ? (
          await processRepCustomListingPhotoUrl({
            repId,
            sourceImageUrl: listingPhotoUrl,
            filenameStem: `${itemNumber || 'listing'}-listing-photo`,
          })
        ).photoUrl
      : undefined
    const result = await addListing(createAdminClient(), repId, {
      itemNumber,
      repNotes: typeof body?.repNotes === 'string' ? body.repNotes : undefined,
      tradePreferences:
        typeof body?.tradePreferences === 'string' ? body.tradePreferences : undefined,
      listingPhotoUrl: processedListingPhotoUrl,
    })

    return NextResponse.json({ ok: true, result })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
    }
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    if (error instanceof ServiceError) return serviceErrorResponse(error)
    throw error
  }
}
