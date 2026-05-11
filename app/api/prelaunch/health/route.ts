import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: 'sparkle-suite-prelaunch',
      status: 'ready',
    },
    {
      headers: {
        'cache-control': 'no-store',
      },
    },
  )
}
