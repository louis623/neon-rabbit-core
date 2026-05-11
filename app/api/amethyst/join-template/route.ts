import { NextResponse } from 'next/server'

import { buildAmethystJoinBootstrapScript } from '@/lib/amethyst/join-template-data'

export function GET() {
  return new NextResponse(buildAmethystJoinBootstrapScript(), {
    headers: {
      'content-type': 'application/javascript; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}
