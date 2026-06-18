import { NextResponse } from 'next/server'
import { AuthError, getPaidNicNacContext } from '@/lib/nic-nac/auth'
import { ServiceError } from '@/lib/services/errors'
import {
  getJoinTeamRoster,
  removeJoinTeamMember,
  reorderJoinTeamRoster,
  upsertJoinTeamMember,
} from '@/lib/services/join-team-roster'

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
    const members = await getJoinTeamRoster(supabase, repId, {
      visibleOnly: false,
    })

    return NextResponse.json({ members })
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
      const result = await removeJoinTeamMember(supabase, repId, body?.memberId)
      return NextResponse.json({ ok: true, ...result })
    }

    if (action === 'reorder') {
      const result = await reorderJoinTeamRoster(supabase, repId, {
        memberIds: body?.memberIds,
      })
      return NextResponse.json({ ok: true, ...result })
    }

    const member = await upsertJoinTeamMember(supabase, repId, body?.member ?? body)
    return NextResponse.json({ ok: true, member })
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
