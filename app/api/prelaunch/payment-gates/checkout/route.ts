import { NextResponse } from 'next/server'

import { buildPrelaunchPaymentCheckoutEmailContent } from '@/lib/prelaunch/email-content'
import {
  buildPrelaunchPaymentGateMetadata,
  getPrelaunchPaymentGatePriceId,
  normalizePrelaunchPaymentGateType,
} from '@/lib/prelaunch/payment-gates'
import { sendPrelaunchEmail } from '@/lib/prelaunch/waitlist-email'
import { getStripe, stripeEnabled } from '@/lib/stripe/client'
import { getAppUrl } from '@/lib/stripe/config'
import { createAdminClient } from '@/lib/supabase/admin'
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
  const requestedGateType = readString(record, 'gateType')
  const gateType =
    normalizePrelaunchPaymentGateType(record.gateType) ?? 'start_work_fee'
  const intakeId = readString(record, 'intakeId')
  const launchBuildId = readString(record, 'launchBuildId')

  if (requestedGateType && !normalizePrelaunchPaymentGateType(record.gateType)) {
    return {
      error: 'gateType must be start_work_fee or launch_fee.',
    }
  }

  if (!intakeId && !launchBuildId) {
    return {
      error: 'intakeId or launchBuildId is required.',
    }
  }

  return {
    gateType,
    intakeId,
    launchBuildId,
    waitlistId: readString(record, 'waitlistId'),
    returnTo: readString(record, 'returnTo'),
  }
}

function isJsonRequest(request: Request) {
  return (
    request.headers.get('content-type')?.includes('application/json') ?? false
  )
}

function sanitizeReturnTo(value: string) {
  if (value.startsWith('/control-center/intake')) return value
  return '/control-center/intake#launch-gates'
}

async function parseRequestPayload(request: Request) {
  if (isJsonRequest(request)) return parsePaymentGatePayload(await request.json())

  const form = await request.formData()
  return parsePaymentGatePayload({
    gateType: form.get('gateType'),
    intakeId: form.get('intakeId'),
    launchBuildId: form.get('launchBuildId'),
    waitlistId: form.get('waitlistId'),
    returnTo: form.get('returnTo'),
  })
}

async function loadPaymentGateSubject(input: {
  launchBuildId?: string | null
  intakeId?: string | null
  waitlistId?: string | null
}) {
  const admin = createAdminClient()

  if (input.launchBuildId) {
    const { data, error } = await admin
      .from('sparkle_suite_launch_builds')
      .select('id, waitlist_id, intake_submission_id, lead_name, lead_email')
      .eq('id', input.launchBuildId)
      .single()

    if (error) throw error

    return {
      admin,
      launchBuildId: data.id as string,
      waitlistId: (data.waitlist_id as string | null) ?? input.waitlistId ?? null,
      intakeId:
        (data.intake_submission_id as string | null) ?? input.intakeId ?? null,
      name: data.lead_name as string,
      email: data.lead_email as string,
    }
  }

  if (input.waitlistId) {
    const { data, error } = await admin
      .from('sparkle_suite_waitlist')
      .select('id, intake_submission_id, name, email')
      .eq('id', input.waitlistId)
      .single()

    if (error) throw error

    return {
      admin,
      launchBuildId: null,
      waitlistId: data.id as string,
      intakeId:
        (data.intake_submission_id as string | null) ?? input.intakeId ?? null,
      name: data.name as string,
      email: data.email as string,
    }
  }

  throw new Error('A launch build or waitlist lead is required for checkout.')
}

function buildCheckoutReturnUrl(path: string, params: Record<string, string>) {
  const url = new URL(path, getAppUrl())
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return url.toString()
}

function toStripeMetadata(metadata: Record<string, string | null | undefined>) {
  return Object.fromEntries(
    Object.entries(metadata).filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === 'string' && entry[1].trim().length > 0,
    ),
  )
}

export async function POST(request: Request) {
  try {
    const operator = await getAuthenticatedOperator()
    const payload = await parseRequestPayload(request)

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
      intakeId: payload.intakeId || payload.launchBuildId || 'prelaunch',
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

    if (!stripeEnabled()) {
      return NextResponse.json(
        {
          code: 'STRIPE_CONFIGURATION_MISSING',
          error: 'Stripe is not configured.',
        },
        { status: 503 },
      )
    }

    const subject = await loadPaymentGateSubject({
      launchBuildId: payload.launchBuildId,
      intakeId: payload.intakeId,
      waitlistId: payload.waitlistId,
    })
    const finalMetadata = {
      ...metadata,
      sparkle_suite_payment_gate: 'true',
      launch_build_id: subject.launchBuildId,
      intake_submission_id: subject.intakeId,
      waitlist_id: subject.waitlistId,
      lead_email: subject.email,
    }
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: subject.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: buildCheckoutReturnUrl('/prelaunch/payment/success', {
        session_id: '{CHECKOUT_SESSION_ID}',
      }),
      cancel_url: buildCheckoutReturnUrl('/prelaunch/payment/cancelled', {}),
      metadata: toStripeMetadata(finalMetadata),
    })

    const checkoutEmail = session.url
      ? await sendPrelaunchEmail({
          email: subject.email,
          content: buildPrelaunchPaymentCheckoutEmailContent({
            name: subject.name,
            checkoutUrl: session.url,
          }),
        })
      : ({ status: 'failed', error: 'Stripe returned no checkout URL.' } as const)

    const { error: paymentGateInsertError } = await subject.admin
      .from('sparkle_suite_payment_gates')
      .insert({
        gate_type: payload.gateType,
        status: 'checkout_created',
        operator_rep_id: operator.repId,
        launch_build_id: subject.launchBuildId,
        intake_submission_id: subject.intakeId,
        waitlist_id: subject.waitlistId,
        stripe_checkout_session_id: session.id,
        stripe_customer_id:
          typeof session.customer === 'string' ? session.customer : null,
        stripe_price_id: priceId,
        amount_cents: session.amount_total,
        currency: session.currency ?? 'usd',
        livemode: session.livemode,
        metadata: finalMetadata,
        checkout_created_at: new Date().toISOString(),
        checkout_email_status: checkoutEmail.status,
        checkout_email_provider_id:
          checkoutEmail.status === 'sent' ? checkoutEmail.providerId : null,
        checkout_email_error:
          checkoutEmail.status === 'failed'
            ? checkoutEmail.error
            : checkoutEmail.status === 'skipped'
              ? checkoutEmail.reason
              : null,
        checkout_email_sent_at:
          checkoutEmail.status === 'sent' ? new Date().toISOString() : null,
      })

    if (paymentGateInsertError) throw paymentGateInsertError

    if (!isJsonRequest(request)) {
      return NextResponse.redirect(
        new URL(sanitizeReturnTo(payload.returnTo ?? ''), request.url),
        303,
      )
    }

    return NextResponse.json({
      ok: true,
      code: 'PAYMENT_GATE_CHECKOUT_CREATED',
      gateType: payload.gateType,
      priceId,
      checkoutSessionId: session.id,
      checkoutUrl: session.url,
      checkoutEmail: { status: checkoutEmail.status },
      metadata: finalMetadata,
    })
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
