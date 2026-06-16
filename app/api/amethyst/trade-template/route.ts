import { NextResponse } from 'next/server'

import { loadAmethystPreviewTemplateData } from '@/lib/amethyst/preview-template-data'
import {
  applyPublicSiteSlugToTemplateData,
} from '@/lib/amethyst/public-site-links'
import { resolveAmethystRequestTarget } from '@/lib/amethyst/request-rep-target'
import { loadAmethystTradeBoardPreviewListings } from '@/lib/amethyst/trade-board-listings'
import { buildAmethystTradeBootstrapScript } from '@/lib/amethyst/trade-template-data'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const target = resolveAmethystRequestTarget(request)
  const repId = target.repId ?? target.customDomain
  const targeted = target.targeted
  const publicSiteSlug = target.publicSiteSlug
  const lookupTarget = {
    ...(publicSiteSlug ? { publicSiteSlug } : {}),
    repId,
  }
  const [listings, templateData] = await Promise.all([
    loadAmethystTradeBoardPreviewListings({ ...lookupTarget, targeted }),
    loadAmethystPreviewTemplateData(lookupTarget),
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
      { publicSiteSlug, repId, targeted },
    ),
    {
      headers: {
        'content-type': 'application/javascript; charset=utf-8',
        'cache-control': 'no-store',
      },
    },
  )
}
