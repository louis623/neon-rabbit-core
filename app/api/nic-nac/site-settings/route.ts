import { NextResponse } from 'next/server'
import {
  getAuthenticatedNicNacContext,
  AuthError,
} from '@/lib/nic-nac/auth'
import { ServiceError } from '@/lib/services/errors'
import {
  getSiteSettingsDashboard,
  updateSiteSettingsDashboard,
} from '@/lib/services/site-settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { repId, supabase } = await getAuthenticatedNicNacContext()
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
    const { repId, supabase } = await getAuthenticatedNicNacContext()
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
