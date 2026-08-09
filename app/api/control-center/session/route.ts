import { NextResponse } from 'next/server'

import {
  controlCenterSessionCookie,
  createControlCenterSessionValue,
  isValidControlCenterAccessCode,
} from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { accessCode?: unknown }
  const accessCode = typeof body.accessCode === 'string' ? body.accessCode : ''
  if (!isValidControlCenterAccessCode(accessCode)) {
    return NextResponse.json({ error: 'That Control Center access code is not valid.' }, { status: 401 })
  }

  const session = createControlCenterSessionValue()
  const response = NextResponse.json({ ok: true })
  response.cookies.set(controlCenterSessionCookie.name, session.value, {
    ...controlCenterSessionCookie.options,
    expires: new Date(session.expiresAt),
    maxAge: controlCenterSessionCookie.maxAge,
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(controlCenterSessionCookie.name, '', {
    ...controlCenterSessionCookie.options,
    maxAge: 0,
  })
  return response
}
