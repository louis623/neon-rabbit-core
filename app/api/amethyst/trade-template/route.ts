import { NextResponse } from 'next/server'

import { loadAmethystTradeBoardPreviewListings } from '@/lib/amethyst/trade-board-listings'
import { buildAmethystTradeBootstrapScript } from '@/lib/amethyst/trade-template-data'

export async function GET() {
  const listings = await loadAmethystTradeBoardPreviewListings()

  return new NextResponse(buildAmethystTradeBootstrapScript(undefined, listings), {
    headers: {
      'content-type': 'application/javascript; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}
