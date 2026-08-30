import { NextResponse } from 'next/server'
import { AuthError, getPaidNicNacContext } from '@/lib/nic-nac/auth'
import { ServiceError } from '@/lib/services/errors'
import {
  createTeamOnboardingParticipant,
  getTeamOnboardingAccess,
  listTeamOnboardingParticipants,
} from '@/lib/services/team-onboarding'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_ONBOARDING_BASE_URL =
  process.env.TEAM_ONBOARDING_BASE_URL ??
  'https://brittwithbling-start-strong.louis526569.chatgpt.site'

function serviceErrorResponse(error: ServiceError) {
  return NextResponse.json(
    { code: error.code, error: error.userMessage },
    { status: error.statusCode },
  )
}

function addonRequiredResponse(access: Awaited<ReturnType<typeof getTeamOnboardingAccess>>) {
  return NextResponse.json(
    {
      code: 'TEAM_MANAGEMENT_ADDON_REQUIRED',
      error: 'Team Management is a paid add-on.',
      access,
    },
    { status: 403 },
  )
}

export async function GET() {
  try {
    const { repId, supabase } = await getPaidNicNacContext()
    const access = await getTeamOnboardingAccess(supabase, repId)
    if (!access.enabled) return addonRequiredResponse(access)

    const participants = await listTeamOnboardingParticipants(supabase, repId)
    return NextResponse.json({ access, participants })
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
    const { repId, supabase } = await getPaidNicNacContext()
    const access = await getTeamOnboardingAccess(supabase, repId)
    if (!access.enabled) return addonRequiredResponse(access)

    const result = await createTeamOnboardingParticipant(createAdminClient(), repId, {
      displayName: body?.displayName,
      contactEmail: body?.contactEmail,
      joinTeamMemberId: body?.joinTeamMemberId,
      baseUrl:
        typeof body?.baseUrl === 'string' && body.baseUrl.trim()
          ? body.baseUrl.trim()
          : DEFAULT_ONBOARDING_BASE_URL,
    })

    return NextResponse.json({
      ok: true,
      participant: result.participant,
      accessUrl: result.accessUrl,
      delivery: 'copy_link',
    })
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
