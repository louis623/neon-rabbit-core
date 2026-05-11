import { createPublicKey, verify as verifySignature } from 'node:crypto'

import { NextResponse } from 'next/server'

import { unsubscribeCustomerAudienceByPhone } from '@/lib/services/customer-audience'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex')
const OPT_OUT_KEYWORDS = new Set([
  'stop',
  'stopall',
  'unsubscribe',
  'cancel',
  'end',
  'quit',
])
const FIVE_MINUTES_IN_SECONDS = 300

function isValidTimestamp(timestamp: string) {
  const parsed = Number(timestamp)
  if (!Number.isFinite(parsed)) return false
  return Math.abs(Math.floor(Date.now() / 1000) - parsed) <= FIVE_MINUTES_IN_SECONDS
}

function createTelnyxPublicKey(publicKey: string) {
  const trimmed = publicKey.trim()
  if (trimmed.startsWith('-----BEGIN PUBLIC KEY-----')) {
    return createPublicKey(trimmed)
  }

  const rawKey = Buffer.from(trimmed, 'base64')
  return createPublicKey({
    key: Buffer.concat([ED25519_SPKI_PREFIX, rawKey]),
    format: 'der',
    type: 'spki',
  })
}

function verifyTelnyxWebhook(request: Request, rawBody: string) {
  const publicKey = process.env.TELNYX_PUBLIC_KEY
  if (!publicKey) return true

  const signature = request.headers.get('telnyx-signature-ed25519')
  const timestamp = request.headers.get('telnyx-timestamp')

  if (!signature || !timestamp || !isValidTimestamp(timestamp)) {
    return false
  }

  try {
    return verifySignature(
      null,
      Buffer.from(`${timestamp}|${rawBody}`),
      createTelnyxPublicKey(publicKey),
      Buffer.from(signature, 'base64'),
    )
  } catch (error) {
    console.error('[telnyx/webhook] Signature verification failed:', error)
    return false
  }
}

function isOptOutMessage(payload: unknown) {
  const maybePayload = payload as {
    autoresponse_type?: unknown
    text?: unknown
  }

  if (
    typeof maybePayload?.autoresponse_type === 'string' &&
    maybePayload.autoresponse_type.trim().toUpperCase() === 'STOP'
  ) {
    return true
  }

  if (typeof maybePayload?.text !== 'string') {
    return false
  }

  return OPT_OUT_KEYWORDS.has(maybePayload.text.trim().toLowerCase())
}

function readFromPhoneNumber(payload: unknown) {
  const maybePayload = payload as {
    from?: {
      phone_number?: unknown
    }
  }

  return typeof maybePayload?.from?.phone_number === 'string'
    ? maybePayload.from.phone_number
    : ''
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()

    if (!verifyTelnyxWebhook(request, rawBody)) {
      return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 403 })
    }

    const body = JSON.parse(rawBody) as {
      data?: {
        event_type?: unknown
        payload?: unknown
      }
    }

    if (body?.data?.event_type !== 'message.received') {
      return NextResponse.json({ ok: true })
    }

    if (!isOptOutMessage(body.data.payload)) {
      return NextResponse.json({ ok: true })
    }

    const fromPhoneNumber = readFromPhoneNumber(body.data.payload)
    if (!fromPhoneNumber) {
      return NextResponse.json({ ok: true })
    }

    await unsubscribeCustomerAudienceByPhone(createAdminClient(), fromPhoneNumber, {
      markStopKeywordReceived: true,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
    }

    console.error('[telnyx/webhook] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook.' },
      { status: 500 },
    )
  }
}
