import { NextResponse } from 'next/server'
import { AuthError, getPaidNicNacContext } from '@/lib/nic-nac/auth'
import { ServiceError } from '@/lib/services/errors'
import {
  getTeamOnboardingAccess,
  sendTeamOnboardingMessage,
} from '@/lib/services/team-onboarding'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function serviceErrorResponse(error: ServiceError) {
  return NextResponse.json(
    { code: error.code, error: error.userMessage },
    { status: error.statusCode },
  )
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ participantId: string }> },
) {
  try {
    const body = await request.json()
    const { participantId } = await params
    const { repId, supabase } = await getPaidNicNacContext()
    const access = await getTeamOnboardingAccess(supabase, repId)

    if (!access.enabled) {
      return NextResponse.json(
        {
          code: 'TEAM_MANAGEMENT_ADDON_REQUIRED',
          error: 'Team Management is a paid add-on.',
          access,
        },
        { status: 403 },
      )
    }

    const message = await sendTeamOnboardingMessage(createAdminClient(), participantId, {
      ownerRepId: repId,
      senderType: 'team_lead',
      body: body?.body,
      clientRequestId:
        typeof body?.clientRequestId === 'string' ? body.clientRequestId : undefined,
    })

    return NextResponse.json({ ok: true, message })
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
