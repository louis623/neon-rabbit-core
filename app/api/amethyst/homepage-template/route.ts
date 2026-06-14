import { NextResponse } from 'next/server'

import { loadAmethystHomepageUpcomingShows } from '@/lib/amethyst/homepage-upcoming-shows'
import { buildAmethystHomepageBootstrapScript } from '@/lib/amethyst/homepage-template-data'
import { loadAmethystPreviewTemplateData } from '@/lib/amethyst/preview-template-data'
import {
  applyPublicSiteSlugToHomepageEvents,
  applyPublicSiteSlugToTemplateData,
  getPublicSiteSlugFromRequest,
} from '@/lib/amethyst/public-site-links'
import { resolveAmethystRequestRepId } from '@/lib/amethyst/request-rep-target'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const repId = resolveAmethystRequestRepId(request)
  const targeted = Boolean(repId)
  const publicSiteSlug = getPublicSiteSlugFromRequest(request)
  const [events, templateData] = await Promise.all([
    loadAmethystHomepageUpcomingShows({ repId, targeted }),
    loadAmethystPreviewTemplateData({ repId }),
  ])
  const linkedTemplateData = applyPublicSiteSlugToTemplateData(
    templateData,
    publicSiteSlug,
  )
  const linkedEvents = applyPublicSiteSlugToHomepageEvents(events, publicSiteSlug)

  return new NextResponse(
    buildAmethystHomepageBootstrapScript(
      linkedTemplateData.homepage,
      linkedEvents,
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
