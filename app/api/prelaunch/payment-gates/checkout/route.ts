import { NextResponse } from 'next/server'

import {
  buildPrelaunchPaymentGateMetadata,
  getPrelaunchPaymentGatePriceId,
  normalizePrelaunchPaymentGateType,
} from '@/lib/prelaunch/payment-gates'
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

function parsePaymentGatePayload(body: unknown) {
  if (!body || typeof body !== 'object') return null

  const record = body as Record<string, unknown>
  const gateType = normalizePrelaunchPaymentGateType(record.gateType)
  const intakeId = readString(record, 'intakeId')

  if (!gateType) {
    return {
      error: 'gateType must be start_work_fee or launch_fee.',
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
    const payload = parsePaymentGatePayload(body)

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid request payload.' },
        { status: 400 },
      )
    }

    if ('error' in payload) {
      return NextResponse.json({ error: payload.error }, { status: 400 })
    }

    const metadata = buildPrelaunchPaymentGateMetadata({
      gateType: payload.gateType,
      intakeId: payload.intakeId,
      waitlistId: payload.waitlistId,
      operatorRepId: operator.repId,
    })
    const priceId = getPrelaunchPaymentGatePriceId(payload.gateType)

    if (!priceId) {
      return NextResponse.json(
        {
          code: 'PAYMENT_GATE_PRICE_NOT_CONFIGURED',
          error:
            'The Stripe price for this payment gate is not configured yet.',
          gateType: payload.gateType,
          metadata,
        },
        { status: 503 },
      )
    }

    return NextResponse.json(
      {
        code: 'PAYMENT_GATE_CHECKOUT_NOT_ENABLED',
        error:
          'Payment gate checkout is waiting for final Stripe price review.',
        gateType: payload.gateType,
        priceId,
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

    console.error('[prelaunch/payment-gates/checkout] Error:', error)
    return NextResponse.json(
      { error: 'Failed to prepare this payment gate.' },
      { status: 500 },
    )
  }
}
