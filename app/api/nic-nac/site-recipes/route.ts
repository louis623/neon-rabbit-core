import { NextResponse } from 'next/server'
import { AuthError, getPaidNicNacContext } from '@/lib/nic-nac/auth'
import { ServiceError } from '@/lib/services/errors'
import {
  getPublicSiteRecipes,
  removePublicSiteRecipe,
  reorderPublicSiteRecipes,
  upsertPublicSiteRecipe,
} from '@/lib/services/site-recipes'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function serviceErrorResponse(error: ServiceError) {
  return NextResponse.json(
    {
      code: error.code,
      error: error.userMessage,
    },
    { status: error.statusCode },
  )
}

export async function GET() {
  try {
    const { repId, supabase } = await getPaidNicNacContext()
    const recipes = await getPublicSiteRecipes(supabase, repId, {
      visibleOnly: false,
    })

    return NextResponse.json({ recipes })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }

    if (error instanceof ServiceError) {
      return serviceErrorResponse(error)
    }

    throw error
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { repId, supabase } = await getPaidNicNacContext()
    const action = typeof body?.action === 'string' ? body.action : 'upsert'

    if (action === 'remove') {
      const result = await removePublicSiteRecipe(supabase, repId, body?.recipeId)
      return NextResponse.json({ ok: true, ...result })
    }

    if (action === 'reorder') {
      const result = await reorderPublicSiteRecipes(supabase, repId, {
        recipeIds: body?.recipeIds,
      })
      return NextResponse.json({ ok: true, ...result })
    }

    const recipe = await upsertPublicSiteRecipe(supabase, repId, body?.recipe ?? body)
    return NextResponse.json({ ok: true, recipe })
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
