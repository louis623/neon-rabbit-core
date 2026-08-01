import { NextResponse } from 'next/server'
import { AuthError, getPaidNicNacContext } from '@/lib/nic-nac/auth'
import { uploadPublicSiteMedia } from '@/lib/services/storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const base64Data = normalizeText(body?.base64Data)
    if (!base64Data) {
      return NextResponse.json(
        { error: 'Choose an image to upload.' },
        { status: 400 },
      )
    }

    const { repId } = await getPaidNicNacContext()
    const imageUrl = await uploadPublicSiteMedia(repId, base64Data, {
      filename: normalizeText(body?.filename) || 'homepage-media',
      folder: 'profile',
    })

    return NextResponse.json({ ok: true, imageUrl })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
    }
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    throw error
  }
}
