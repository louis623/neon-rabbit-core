import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ServiceError } from '@/lib/services/errors'
import { sendTeamOnboardingMessage } from '@/lib/services/team-onboarding'
import { getTeamOnboardingCorsHeaders } from '@/lib/team-onboarding/public-cors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function serviceErrorResponse(error: ServiceError, request: Request) {
  const userMessage = error.code === 'UNAUTHORIZED'
    ? 'This onboarding link is invalid or has been turned off. Ask your team leader for a fresh link.'
    : error.userMessage

  return NextResponse.json(
    { code: error.code, error: userMessage },
    { status: error.statusCode, headers: getTeamOnboardingCorsHeaders(request) },
  )
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const body = await request.json()
    const { token } = await params
    const message = await sendTeamOnboardingMessage(createAdminClient(), token, {
      senderType: 'participant',
      body: body?.body,
    })
    return NextResponse.json(
      { ok: true, message },
      { headers: getTeamOnboardingCorsHeaders(request) },
    )
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request payload.' },
        { status: 400, headers: getTeamOnboardingCorsHeaders(request) },
      )
    }
    if (error instanceof ServiceError) return serviceErrorResponse(error, request)
    throw error
  }
}

export function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: getTeamOnboardingCorsHeaders(request),
  })
}
