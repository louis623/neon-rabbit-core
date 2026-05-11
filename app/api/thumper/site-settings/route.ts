import { NextResponse } from 'next/server'
import {
  getAuthenticatedThumperContext,
  AuthError,
} from '@/lib/thumper/auth'
import { ServiceError } from '@/lib/services/errors'
import {
  getSiteSettingsDashboard,
  updateSiteSettingsDashboard,
} from '@/lib/services/site-settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { repId, supabase } = await getAuthenticatedThumperContext()
    const settings = await getSiteSettingsDashboard(supabase, repId)
    return NextResponse.json(settings)
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }

    if (error instanceof ServiceError) {
      return NextResponse.json(
        {
          code: error.code,
          error: error.userMessage,
        },
        { status: error.statusCode },
      )
    }

    throw error
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { repId, supabase } = await getAuthenticatedThumperContext()
    const settings = await updateSiteSettingsDashboard(supabase, repId, body ?? {})

    return NextResponse.json({
      ok: true,
      settings,
    })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
    }

    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }

    if (error instanceof ServiceError) {
      return NextResponse.json(
        {
          code: error.code,
          error: error.userMessage,
        },
        { status: error.statusCode },
      )
    }

    throw error
  }
}
