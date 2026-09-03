import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'

const ALLOWED_ORIGINS = new Set(['https://grok.com', 'https://www.grok.com'])

export function laneAccountingSecurityResponse(request: Request) {
  const token = process.env.LANE_ACCOUNTING_INGEST_TOKEN?.trim() ?? ''
  if (!token) {
    return NextResponse.json({ error: 'Lane accounting connector is not configured.' }, { status: 503 })
  }

  const origin = request.headers.get('origin')
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return NextResponse.json({ error: 'forbidden origin' }, { status: 403 })
  }

  const authorization = request.headers.get('authorization')
  const supplied = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : ''
  const actual = Buffer.from(supplied)
  const expected = Buffer.from(token)
  if (!actual.length || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return NextResponse.json({ error: 'unauthorized' }, {
      status: 401,
      headers: { 'www-authenticate': 'Bearer realm="Sparkle Suite Lane Accounting"' },
    })
  }

  return null
}
