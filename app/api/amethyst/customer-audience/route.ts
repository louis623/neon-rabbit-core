import { NextResponse } from 'next/server'

import { resolveAmethystPreviewRep } from '@/lib/amethyst/preview-rep'
import { resolveAmethystRequestRepId } from '@/lib/amethyst/request-rep-target'
import { ServiceError } from '@/lib/services/errors'
import { createCustomerAudienceSignup } from '@/lib/services/customer-audience'
import type { CustomerAudienceSignupInput } from '@/lib/services/types'
import { createAdminClient } from '@/lib/supabase/admin'

function readString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function readBoolean(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return (
      normalized === 'true' ||
      normalized === '1' ||
      normalized === 'yes' ||
      normalized === 'on'
    )
  }
  return false
}

async function parseSignupPayload(
  request: Request,
): Promise<CustomerAudienceSignupInput> {
  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const body = await request.json()

    return {
      firstName: readString(body?.firstName ?? body?.first_name),
      lastName: readString(body?.lastName ?? body?.last_name),
      email: readString(body?.email),
      phone: readString(body?.phone),
      smsConsent: readBoolean(body?.smsConsent ?? body?.sms_consent),
      emailConsent: readBoolean(body?.emailConsent ?? body?.email_consent),
      marketingConsent: readBoolean(
        body?.marketingConsent ?? body?.marketing_consent,
      ),
    }
  }

  const formData = await request.formData()

  return {
    firstName: readString(formData.get('first_name') ?? formData.get('firstName')),
    lastName: readString(formData.get('last_name') ?? formData.get('lastName')),
    email: readString(formData.get('email')),
    phone: readString(formData.get('phone')),
    smsConsent: readBoolean(
      formData.get('sms_consent') ?? formData.get('smsConsent'),
    ),
    emailConsent: readBoolean(
      formData.get('email_consent') ?? formData.get('emailConsent'),
    ),
    marketingConsent: readBoolean(
      formData.get('marketing_consent') ?? formData.get('marketingConsent'),
    ),
  }
}

export async function POST(request: Request) {
  try {
    const payload = await parseSignupPayload(request)
    const admin = createAdminClient()
    const repId = resolveAmethystRequestRepId(request)
    const rep = await resolveAmethystPreviewRep(admin, {
      env: process.env,
      repId,
      select: 'id, email',
    })

    if (!rep?.id) {
      return NextResponse.json(
        { error: 'Signup is temporarily unavailable right now.' },
        { status: 503 },
      )
    }

    await createCustomerAudienceSignup(admin, rep.id, payload)

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
    }

    if (error instanceof ServiceError) {
      return NextResponse.json(
        {
          code: error.code,
          error: error.userMessage,
        },
        { status: error.statusCode },
      )
    }

    console.error('[amethyst/customer-audience] Error:', error)
    return NextResponse.json(
      { error: 'Failed to save signup right now.' },
      { status: 500 },
    )
  }
}
