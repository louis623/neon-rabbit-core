import { NextResponse } from 'next/server'

import { ServiceError, errors } from '@/lib/services/errors'
import {
  getTeamOnboardingParticipantByToken,
  recordTeamOnboardingProgress,
  sendTeamOnboardingMessage,
  toTeamOnboardingPublicMessage,
  toTeamOnboardingPublicProgressItem,
} from '@/lib/services/team-onboarding'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getTeamOnboardingCorsHeaders,
  getTeamOnboardingPublicHeaders,
} from '@/lib/team-onboarding/public-cors'
import {
  checkTeamOnboardingPublicRateLimit,
  type TeamOnboardingPublicAction,
} from '@/lib/team-onboarding/public-rate-limit'

function publicErrorResponse(error: ServiceError, request: Request) {
  const userMessage =
    error.code === 'UNAUTHORIZED'
      ? 'This onboarding link is invalid or has been turned off. Ask your team leader for a fresh link.'
      : error.userMessage

  return NextResponse.json(
    { code: error.code, error: userMessage },
    { status: error.statusCode, headers: getTeamOnboardingPublicHeaders(request) },
  )
}

function rateLimitedResponse(
  request: Request,
  action: TeamOnboardingPublicAction,
  inviteToken: string,
) {
  const result = checkTeamOnboardingPublicRateLimit(request, action, inviteToken)
  if (result.allowed) return null

  const headers = getTeamOnboardingPublicHeaders(request)
  headers.set('Retry-After', String(result.retryAfterSeconds))
  return NextResponse.json(
    {
      code: 'RATE_LIMITED',
      error: 'Too many onboarding requests. Wait a moment and try again.',
    },
    { status: 429, headers },
  )
}

function requireInviteToken(token: unknown) {
  if (typeof token === 'string' && token.trim()) return token.trim()
  throw errors.INVALID_INPUT(
    'invite token required',
    'This onboarding link is missing its private invite token.',
  )
}

export function inviteTokenFromQuery(request: Request) {
  return new URL(request.url).searchParams.get('invite')
}

export async function handleTeamOnboardingAccessGet(
  request: Request,
  token: unknown,
) {
  try {
    const inviteToken = requireInviteToken(token)
    const limited = rateLimitedResponse(request, 'access', inviteToken)
    if (limited) return limited
    const state = await getTeamOnboardingParticipantByToken(
      createAdminClient(),
      inviteToken,
    )
    return NextResponse.json(state, {
      headers: getTeamOnboardingPublicHeaders(request),
    })
  } catch (error) {
    if (error instanceof ServiceError) return publicErrorResponse(error, request)
    throw error
  }
}

export async function handleTeamOnboardingProgressPost(
  request: Request,
  token: unknown,
) {
  try {
    const inviteToken = requireInviteToken(token)
    const limited = rateLimitedResponse(request, 'progress', inviteToken)
    if (limited) return limited
    const body = await request.json()
    const progress = await recordTeamOnboardingProgress(
      createAdminClient(),
      inviteToken,
      { stepId: body?.stepId, status: body?.status },
    )
    return NextResponse.json(
      { ok: true, progress: toTeamOnboardingPublicProgressItem(progress) },
      { headers: getTeamOnboardingPublicHeaders(request) },
    )
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request payload.' },
        { status: 400, headers: getTeamOnboardingPublicHeaders(request) },
      )
    }
    if (error instanceof ServiceError) return publicErrorResponse(error, request)
    throw error
  }
}

export async function handleTeamOnboardingMessagePost(
  request: Request,
  token: unknown,
) {
  try {
    const inviteToken = requireInviteToken(token)
    const limited = rateLimitedResponse(request, 'messages', inviteToken)
    if (limited) return limited
    const body = await request.json()
    const message = await sendTeamOnboardingMessage(
      createAdminClient(),
      inviteToken,
      {
        senderType: 'participant',
        body: body?.body,
        clientRequestId:
          typeof body?.clientRequestId === 'string'
            ? body.clientRequestId
            : undefined,
      },
    )
    return NextResponse.json(
      { ok: true, message: toTeamOnboardingPublicMessage(message) },
      { headers: getTeamOnboardingPublicHeaders(request) },
    )
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request payload.' },
        { status: 400, headers: getTeamOnboardingPublicHeaders(request) },
      )
    }
    if (error instanceof ServiceError) return publicErrorResponse(error, request)
    throw error
  }
}

export function handleTeamOnboardingOptions(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: getTeamOnboardingCorsHeaders(request),
  })
}
