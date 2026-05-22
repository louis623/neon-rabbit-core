import { NextResponse } from 'next/server'

import { loadAmethystPreviewTemplateData } from '@/lib/amethyst/preview-template-data'
import { loadAmethystTradeBoardPreviewListings } from '@/lib/amethyst/trade-board-listings'
import { buildAmethystTradeBootstrapScript } from '@/lib/amethyst/trade-template-data'

export async function GET() {
  const [listings, templateData] = await Promise.all([
    loadAmethystTradeBoardPreviewListings(),
    loadAmethystPreviewTemplateData(),
  ])

  return new NextResponse(
    buildAmethystTradeBootstrapScript(templateData.trade, listings),
    {
      headers: {
        'content-type': 'application/javascript; charset=utf-8',
        'cache-control': 'no-store',
      },
    },
  )
}
