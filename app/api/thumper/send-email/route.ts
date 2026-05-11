import { NextResponse } from 'next/server'
import { getCustomerAudienceMember } from '@/lib/services/customer-audience'
import { ServiceError, errors } from '@/lib/services/errors'
import { sendEmailNotification } from '@/lib/services/email-notifications'
import {
  getAuthenticatedThumperContext,
  AuthError,
} from '@/lib/thumper/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function readText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const audienceId = readText(body?.audienceId)
    const subject = readText(body?.subject)
    const message = readText(body?.body)

    const { repId, supabase } = await getAuthenticatedThumperContext()
    const customer = await getCustomerAudienceMember(supabase, repId, audienceId)

    if (!customer) {
      return NextResponse.json(
        { error: "I couldn't find that customer in your audience." },
        { status: 404 },
      )
    }

    if (!customer.canReceiveEmail || !customer.email) {
      throw errors.INVALID_INPUT(
        'customer cannot receive email',
        'That customer cannot receive email right now.',
      )
    }

    const result = await sendEmailNotification(repId, {
      recipientEmail: customer.email,
      subject,
      body: message,
    })

    return NextResponse.json({
      ok: true,
      result,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      },
    })
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 })
    }

    if (err instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }

    if (err instanceof ServiceError) {
      return NextResponse.json(
        {
          code: err.code,
          error: err.userMessage,
        },
        { status: err.statusCode },
      )
    }

    throw err
  }
}
