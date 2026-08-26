import { NextResponse } from 'next/server'

import { ServiceError } from '@/lib/services/errors'
import { AuthError, OperatorAuthError } from '@/lib/supabase/operator-auth'

export function operatorCommunicationError(
  error: unknown,
  fallback: string,
) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }
  if (error instanceof OperatorAuthError) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  if (error instanceof ServiceError) {
    return NextResponse.json(
      { error: error.userMessage, code: error.code },
      { status: error.statusCode },
    )
  }
  console.error('[control-center/communications] operation failed', error)
  return NextResponse.json({ error: fallback }, { status: 500 })
}
