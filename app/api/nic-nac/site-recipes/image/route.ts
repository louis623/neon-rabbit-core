import { NextResponse } from 'next/server'
import { AuthError, getPaidNicNacContext } from '@/lib/nic-nac/auth'
import { ServiceError } from '@/lib/services/errors'
import { uploadPublicSiteMedia } from '@/lib/services/storage'

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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const base64Data = normalizeText(body?.base64Data)
    if (!base64Data) {
      return NextResponse.json(
        { error: 'Recipe image data is required.' },
        { status: 400 },
      )
    }

    const { repId } = await getPaidNicNacContext()
    const imageUrl = await uploadPublicSiteMedia(repId, base64Data, {
      filename: normalizeText(body?.filename) || undefined,
      folder: 'recipes',
    })

    return NextResponse.json({ ok: true, imageUrl })
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
