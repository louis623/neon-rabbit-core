import { NextResponse } from 'next/server'

import { buildAmethystJoinBootstrapScript } from '@/lib/amethyst/join-template-data'
import { loadAmethystPreviewTemplateData } from '@/lib/amethyst/preview-template-data'
import { resolveAmethystRequestTarget } from '@/lib/amethyst/request-rep-target'
import { loadAmethystTradeBoardPreviewListings } from '@/lib/amethyst/trade-board-listings'

export async function GET(request: Request) {
  const target = resolveAmethystRequestTarget(request)
  const repId = target.repId ?? target.customDomain
  const targeted = target.targeted
  const publicSiteSlug = target.publicSiteSlug
  const lookupTarget = {
    ...(publicSiteSlug ? { publicSiteSlug } : {}),
    repId,
  }
  const [templateData, tradeBoardListings] = await Promise.all([
    loadAmethystPreviewTemplateData(lookupTarget),
    loadAmethystTradeBoardPreviewListings({
      ...lookupTarget,
      targeted,
      limit: 8,
    }),
  ])

  return new NextResponse(
    buildAmethystJoinBootstrapScript(
      templateData.join,
      templateData.appearancePreset,
      { publicSiteSlug, repId, targeted },
      tradeBoardListings,
    ),
    {
      headers: {
        'content-type': 'application/javascript; charset=utf-8',
        'cache-control': 'no-store',
      },
    },
  )
}
