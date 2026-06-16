import { NextResponse } from 'next/server'

import { resolveAmethystPreviewRep } from '@/lib/amethyst/preview-rep'
import { resolveAmethystRequestTarget } from '@/lib/amethyst/request-rep-target'
import { ServiceError } from '@/lib/services/errors'
import { unsubscribeCustomerAudienceByContact } from '@/lib/services/customer-audience'
import type { CustomerAudienceUnsubscribeInput } from '@/lib/services/types'
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

async function parseUnsubscribePayload(
  request: Request,
): Promise<Omit<CustomerAudienceUnsubscribeInput, 'repId'>> {
  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const body = await request.json()

    return {
      phone: readString(body?.phone),
      email: readString(body?.email),
      unsubscribeSms: readBoolean(body?.unsubscribeSms ?? body?.unsubscribe_sms),
      unsubscribeEmail: readBoolean(
        body?.unsubscribeEmail ?? body?.unsubscribe_email,
      ),
    }
  }

  const formData = await request.formData()

  return {
    phone: readString(formData.get('phone')),
    email: readString(formData.get('email')),
    unsubscribeSms: readBoolean(
      formData.get('unsubscribeSms') ?? formData.get('unsubscribe_sms'),
    ),
    unsubscribeEmail: readBoolean(
      formData.get('unsubscribeEmail') ?? formData.get('unsubscribe_email'),
    ),
  }
}

export async function POST(request: Request) {
  try {
    const payload = await parseUnsubscribePayload(request)
    const admin = createAdminClient()
    const target = resolveAmethystRequestTarget(request)
    const rep = await resolveAmethystPreviewRep(admin, {
      env: process.env,
      publicSiteSlug: target.publicSiteSlug,
      repId: target.repId ?? target.customDomain,
      select: 'id, email',
    })

    if (!rep?.id) {
      return NextResponse.json(
        { error: 'Unsubscribe is temporarily unavailable right now.' },
        { status: 503 },
      )
    }

    await unsubscribeCustomerAudienceByContact(admin, {
      repId: rep.id,
      ...payload,
    })

    return NextResponse.json({ ok: true })
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

    console.error('[amethyst/customer-audience/unsubscribe] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process unsubscribe right now.' },
      { status: 500 },
    )
  }
}
