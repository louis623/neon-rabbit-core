import { NextResponse } from 'next/server'

import {
  buildPrelaunchSignWellMetadata,
  getPrelaunchSignWellConfig,
  normalizePrelaunchAgreementGateType,
} from '@/lib/prelaunch/signwell'
import {
  AuthError,
  getAuthenticatedOperator,
  OperatorAuthError,
} from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function readString(body: Record<string, unknown>, key: string) {
  const value = body[key]
  return typeof value === 'string' ? value.trim() : null
}

function parseAgreementGatePayload(body: unknown) {
  if (!body || typeof body !== 'object') return null

  const record = body as Record<string, unknown>
  const gateType = normalizePrelaunchAgreementGateType(record.gateType)
  const intakeId = readString(record, 'intakeId')

  if (!gateType) {
    return {
      error: 'gateType must be service_agreement.',
    }
  }

  if (!intakeId) {
    return {
      error: 'intakeId is required.',
    }
  }

  return {
    gateType,
    intakeId,
    waitlistId: readString(record, 'waitlistId'),
  }
}

export async function POST(request: Request) {
  try {
    const operator = await getAuthenticatedOperator()
    const body = await request.json()
    const payload = parseAgreementGatePayload(body)

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid request payload.' },
        { status: 400 },
      )
    }

    if ('error' in payload) {
      return NextResponse.json({ error: payload.error }, { status: 400 })
    }

    const metadata = buildPrelaunchSignWellMetadata({
      gateType: payload.gateType,
      intakeId: payload.intakeId,
      waitlistId: payload.waitlistId,
      operatorRepId: operator.repId,
    })
    const config = getPrelaunchSignWellConfig()

    if (!config) {
      return NextResponse.json(
        {
          code: 'SIGNWELL_NOT_CONFIGURED',
          error: 'SignWell agreement sending is not configured yet.',
          gateType: payload.gateType,
          metadata,
        },
        { status: 503 },
      )
    }

    return NextResponse.json(
      {
        code: 'SIGNWELL_SEND_NOT_ENABLED',
        error:
          'SignWell agreement sending is waiting for final legal/template review.',
        gateType: payload.gateType,
        templateId: config.templateId,
        metadata,
      },
      { status: 501 },
    )
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

    console.error('[prelaunch/signwell/agreement] Error:', error)
    return NextResponse.json(
      { error: 'Failed to prepare this agreement.' },
      { status: 500 },
    )
  }
}
