import { NextResponse } from 'next/server'

import { loadAmethystPreviewTemplateData } from '@/lib/amethyst/preview-template-data'
import {
  applyPublicSiteSlugToTemplateData,
  getPublicSiteSlugFromRequest,
} from '@/lib/amethyst/public-site-links'
import { resolveAmethystRequestRepId } from '@/lib/amethyst/request-rep-target'
import { loadAmethystTradeBoardPreviewListings } from '@/lib/amethyst/trade-board-listings'
import { buildAmethystTradeBootstrapScript } from '@/lib/amethyst/trade-template-data'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const repId = resolveAmethystRequestRepId(request)
  const targeted = Boolean(repId)
  const publicSiteSlug = getPublicSiteSlugFromRequest(request)
  const [listings, templateData] = await Promise.all([
    loadAmethystTradeBoardPreviewListings({ repId }),
    loadAmethystPreviewTemplateData({ repId }),
  ])
  const linkedTemplateData = applyPublicSiteSlugToTemplateData(
    templateData,
    publicSiteSlug,
  )

  return new NextResponse(
    buildAmethystTradeBootstrapScript(
      linkedTemplateData.trade,
      listings,
      linkedTemplateData.appearancePreset,
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
