import { NextResponse } from 'next/server'

import { loadAmethystPreviewTemplateData } from '@/lib/amethyst/preview-template-data'
import { resolveAmethystRequestRepId } from '@/lib/amethyst/request-rep-target'
import { loadAmethystTradeBoardPreviewListings } from '@/lib/amethyst/trade-board-listings'
import { buildAmethystTradeBootstrapScript } from '@/lib/amethyst/trade-template-data'

export async function GET(request: Request) {
  const repId = resolveAmethystRequestRepId(request)
  const targeted = Boolean(repId)
  const [listings, templateData] = await Promise.all([
    loadAmethystTradeBoardPreviewListings({ repId }),
    loadAmethystPreviewTemplateData({ repId }),
  ])

  return new NextResponse(
    buildAmethystTradeBootstrapScript(
      templateData.trade,
      listings,
      templateData.appearancePreset,
      { targeted },
    ),
    {
      headers: {
        'content-type': 'application/javascript; charset=utf-8',
        'cache-control': 'no-store',
      },
    },
  )
}
