import { NextResponse } from 'next/server'

import {
  type PrelaunchLaunchSetupProfileStatus,
  upsertPrelaunchLaunchSetupProfile,
} from '@/lib/prelaunch/setup-profiles'
import {
  AuthError,
  getAuthenticatedOperator,
  OperatorAuthError,
} from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function readOptionalString(value: unknown) {
  const cleaned = readString(value)
  return cleaned.length > 0 ? cleaned : null
}

function readOptionalDomain(value: unknown) {
  return readOptionalString(value)?.toLowerCase() ?? null
}

function readOpenQuestions(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return readString(value)
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function readStatus(value: unknown): PrelaunchLaunchSetupProfileStatus {
  return readString(value) === 'ready' ? 'ready' : 'draft'
}

function isJsonRequest(request: Request) {
  return (
    request.headers.get('content-type')?.includes('application/json') ?? false
  )
}

function sanitizeReturnTo(value: string) {
  if (value.startsWith('/control-center/intake')) return value
  return '/control-center/intake'
}

async function parsePayload(request: Request) {
  if (isJsonRequest(request)) {
    const body = (await request.json()) as Record<string, unknown>

    return {
      launchBuildId: readString(body.launchBuildId),
      businessName: readString(body.businessName),
      publicSiteGoal: readString(body.publicSiteGoal),
      customDomain: readOptionalDomain(body.customDomain),
      primarySocialUrl: readOptionalString(body.primarySocialUrl),
      secondarySocialUrl: readOptionalString(body.secondarySocialUrl),
      shopUrl: readOptionalString(body.shopUrl),
      brandNotes: readString(body.brandNotes),
      mustHaveLaunchNotes: readString(body.mustHaveLaunchNotes),
      openQuestions: readOpenQuestions(body.openQuestions),
      status: readStatus(body.status),
      returnTo: '/control-center/intake',
      wantsJson: true,
    }
  }

  const form = await request.formData()

  return {
    launchBuildId: readString(form.get('launchBuildId')),
    businessName: readString(form.get('businessName')),
    publicSiteGoal: readString(form.get('publicSiteGoal')),
    customDomain: readOptionalDomain(form.get('customDomain')),
    primarySocialUrl: readOptionalString(form.get('primarySocialUrl')),
    secondarySocialUrl: readOptionalString(form.get('secondarySocialUrl')),
    shopUrl: readOptionalString(form.get('shopUrl')),
    brandNotes: readString(form.get('brandNotes')),
    mustHaveLaunchNotes: readString(form.get('mustHaveLaunchNotes')),
    openQuestions: readOpenQuestions(form.get('openQuestions')),
    status: readStatus(form.get('status')),
    returnTo: sanitizeReturnTo(readString(form.get('returnTo'))),
    wantsJson: false,
  }
}

export async function POST(request: Request) {
  try {
    await getAuthenticatedOperator()
    const payload = await parsePayload(request)

    if (!payload.launchBuildId) {
      return NextResponse.json(
        { error: 'launchBuildId is required.' },
        { status: 400 },
      )
    }

    if (!payload.businessName) {
      return NextResponse.json(
        { error: 'businessName is required.' },
        { status: 400 },
      )
    }

    const profile = await upsertPrelaunchLaunchSetupProfile({
      launchBuildId: payload.launchBuildId,
      businessName: payload.businessName,
      publicSiteGoal: payload.publicSiteGoal,
      customDomain: payload.customDomain,
      primarySocialUrl: payload.primarySocialUrl,
      secondarySocialUrl: payload.secondarySocialUrl,
      shopUrl: payload.shopUrl,
      brandNotes: payload.brandNotes,
      mustHaveLaunchNotes: payload.mustHaveLaunchNotes,
      openQuestions: payload.openQuestions,
      status: payload.status,
    })

    if (!payload.wantsJson) {
      return NextResponse.redirect(new URL(payload.returnTo, request.url), 303)
    }

    return NextResponse.json({ ok: true, profile })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request payload.' },
        { status: 400 },
      )
    }
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    if (error instanceof OperatorAuthError) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    console.error('[control-center/intake/setup-profile] Error:', error)
    return NextResponse.json(
      { error: 'Failed to save this setup profile.' },
      { status: 500 },
    )
  }
}
