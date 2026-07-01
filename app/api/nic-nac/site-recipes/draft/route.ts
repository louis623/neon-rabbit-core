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
        { error: 'Upload at least one readable recipe-card photo first.' },
        { status: 400 },
      )
    }

    const draft = await buildSiteRecipeDraftFromImages({ title, images })

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

    const message = error instanceof Error ? error.message : ''
    if (
      /\b(quota|insufficient_quota|billing|rate limit|model|api key)\b/i.test(message)
    ) {
      return NextResponse.json(
        {
          code: 'MODEL_UNAVAILABLE',
          error:
            'Nic-Nac can save the uploaded photos, but the recipe builder needs the OpenAI billing/quota issue cleared before it can read recipe-card images.',
        },
        { status: 503 },
      )
    }

    throw error
  }
}
