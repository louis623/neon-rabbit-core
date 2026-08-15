import { NextResponse } from 'next/server'

import {
  authenticateControlCenterOperator,
  AuthError,
  controlCenterSessionCookie,
  createControlCenterSessionValue,
  OperatorAuthError,
} from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { username?: unknown; password?: unknown }
  const username = typeof body.username === 'string' ? body.username : ''
  const password = typeof body.password === 'string' ? body.password : ''

  try {
    const operator = await authenticateControlCenterOperator(username, password)
    const session = createControlCenterSessionValue(operator)
    const response = NextResponse.json({ ok: true })
    response.cookies.set(controlCenterSessionCookie.name, session.value, {
      ...controlCenterSessionCookie.options,
      expires: new Date(session.expiresAt),
      maxAge: controlCenterSessionCookie.maxAge,
    })
    return response
  } catch (error) {
    if (error instanceof AuthError || error instanceof OperatorAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error('[control-center/session] Error:', error)
    return NextResponse.json({ error: 'Unable to sign in to Control Center.' }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(controlCenterSessionCookie.name, '', {
    ...controlCenterSessionCookie.options,
    maxAge: 0,
  })
  return response
}
