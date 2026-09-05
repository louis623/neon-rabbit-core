import { NextResponse } from 'next/server'
import { assertPrelaunchRequestAllowed } from '@/lib/prelaunch/request-guard'
import { ServiceError } from '@/lib/services/errors'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildPublicNicNacHandoffInsert,
  PUBLIC_HANDOFF_MAX_BODY_BYTES,
  PublicHandoffBodyTooLargeError,
  publicNicNacHandoffSchema,
  readPublicHandoffBody,
} from '@/lib/sparkle-suite/public-nic-nac-handoff'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function json(body: object, status: number) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  // Only our own form can submit. No wildcard CORS or customer-domain intake.
  const origin = request.headers.get('origin')
  const allowedOrigins = ['https://www.yoursparklesuite.com', 'https://yoursparklesuite.com']
  if (process.env.NODE_ENV !== 'production') {
    const url = new URL(request.url)
    if (['localhost', '127.0.0.1'].includes(url.hostname)) allowedOrigins.push(url.origin)
  }
  if (!origin || !allowedOrigins.includes(origin)) {
    return json({ error: 'Please submit your question from the Sparkle Suite website.' }, 403)
  }
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
    return json({ error: 'Invalid request format.' }, 415)
  }
  if (Number(request.headers.get('content-length') ?? 0) > PUBLIC_HANDOFF_MAX_BODY_BYTES) {
    return json({ error: 'Please shorten your question and try again.' }, 413)
  }

  let payload: unknown
  try {
    // Shares the existing five-per-minute intake bucket; malformed requests count too.
    assertPrelaunchRequestAllowed({ formName: 'waitlist', payload: {}, request })
    payload = JSON.parse(await readPublicHandoffBody(request))
  } catch (error) {
    if (error instanceof ServiceError) return json({ error: error.userMessage }, error.statusCode)
    if (error instanceof PublicHandoffBodyTooLargeError) {
      return json({ error: 'Please shorten your question and try again.' }, 413)
    }
    return json({ error: 'Invalid request. Please check your details and try again.' }, 400)
  }
  const parsed = publicNicNacHandoffSchema.safeParse(payload)
  if (!parsed.success) {
    return json({ error: 'Enter your name, a valid email, and your question, then agree to a reply.' }, 400)
  }

  if (payload && typeof payload === 'object' && 'reviewScenario' in payload) {
    if (process.env.NODE_ENV !== 'development') {
      return json({ error: 'Review submissions are not enabled.' }, 400)
    }
    if (payload.reviewScenario === 'failure') {
      return json({ error: 'Review mode: simulated save failure. No question was saved.' }, 503)
    }
    if (payload.reviewScenario === 'success') {
      return json({ ok: true, receipt: 'REVIEW-ONLY-NOT-SAVED' }, 201)
    }
    return json({ error: 'Invalid review scenario.' }, 400)
  }

  try {
    const { data, error } = await createAdminClient()
      .from('sparkle_suite_waitlist')
      .insert(buildPublicNicNacHandoffInsert(parsed.data))
      .select('id')
      .single()
    if (error || !data?.id) throw new Error('Inquiry was not confirmed')
    // Append-only: never look up an address, overwrite a lead, or send a provider message.
    return json({ ok: true, receipt: data.id }, 201)
  } catch {
    // Contact details and database/provider errors must not enter public responses or logs.
    return json({ error: 'Your question could not be saved. Please try again in a moment.' }, 503)
  }
}
