import { NextResponse } from 'next/server'

import { getApprovedPrelaunchQrManifest } from '@/lib/prelaunch/qr-assets'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json(
    {
      ok: true,
      ...getApprovedPrelaunchQrManifest({
        baseUrl: process.env.NEXT_PUBLIC_APP_URL,
      }),
    },
    {
      headers: {
        'cache-control': 'no-store',
      },
    },
  )
}
