import { NextResponse } from 'next/server'

import {
  controlCenterSessionCookie,
  createControlCenterSessionValue,
  hasControlCenterAccessSession,
} from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Migrates the original /control-center-scoped session cookie to the
// site-wide cookie used by /api/control-center. This keeps already-open
// operator tabs working after the independent-access rollout.
export async function GET() {
  if (!(await hasControlCenterAccessSession())) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
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
