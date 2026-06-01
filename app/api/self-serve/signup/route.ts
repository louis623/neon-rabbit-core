import { NextResponse } from 'next/server'
import {
  createSelfServeSignup,
  selfServeSignupEnabled,
} from '@/lib/self-serve/signup'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!selfServeSignupEnabled()) {
    return NextResponse.json(
      {
        code: 'SELF_SERVE_NOT_OPEN',
        error: 'Sparkle Suite self-serve signup is not open yet.',
      },
      { status: 403 },
    )
  }

  try {
    const payload = await request.json().catch(() => null)
    const result = await createSelfServeSignup(payload)

    if (!result.ok) {
      return NextResponse.json(
        {
          code: result.code,
          error: result.error,
          ...(result.fields ? { fields: result.fields } : {}),
        },
        { status: result.status },
      )
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('[self-serve/signup] Error:', error)
    return NextResponse.json(
      { error: 'Unable to create your Sparkle Suite account right now.' },
      { status: 500 },
    )
  }
}
