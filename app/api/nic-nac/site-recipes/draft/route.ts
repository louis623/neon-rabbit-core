import { NextResponse } from 'next/server'
import { AuthError, getPaidNicNacContext } from '@/lib/nic-nac/auth'
import { ServiceError } from '@/lib/services/errors'
import {
  buildSiteRecipeDraftFromImages,
  type SiteRecipeDraftImageRole,
} from '@/lib/nic-nac/site-recipe-draft-builder'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function serviceErrorResponse(error: ServiceError) {
  return NextResponse.json(
    {
      code: error.code,
      error: error.userMessage,
    },
    { status: error.statusCode },
  )
}

function modelDraftErrorResponse(error: unknown) {
  console.error('[site-recipes:draft] model draft build failed', error)

  return NextResponse.json(
    {
      code: 'MODEL_UNAVAILABLE',
      error:
        'The uploaded photos are saved, but recipe photo reading is temporarily unavailable. Please try again later.',
    },
    { status: 503 },
  )
}

function readImageRole(value: unknown): SiteRecipeDraftImageRole | null {
  return value === 'display_photo' || value === 'recipe_card' ? value : null
}

function readImages(value: unknown) {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    const role = readImageRole((item as { role?: unknown })?.role)
    const url = normalizeText((item as { url?: unknown })?.url)
    return role && url ? [{ role, url }] : []
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    await getPaidNicNacContext()

    const title = normalizeText(body?.title)
    const images = readImages(body?.images)

    if (!title) {
      return NextResponse.json(
        { error: 'Recipe title is required.' },
        { status: 400 },
      )
    }

    if (!images.some((image) => image.role === 'recipe_card')) {
      return NextResponse.json(
        { error: 'Upload at least one readable recipe-source photo first.' },
        { status: 400 },
      )
    }

    let draft
    try {
      draft = await buildSiteRecipeDraftFromImages({ title, images })
    } catch (error) {
      return modelDraftErrorResponse(error)
    }

    return NextResponse.json({ ok: true, draft })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
    }

    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }

    if (error instanceof ServiceError) {
      return serviceErrorResponse(error)
    }

    throw error
  }
}
