import { NextResponse } from 'next/server'

import { loadAmethystHomepageUpcomingShows } from '@/lib/amethyst/homepage-upcoming-shows'
import { buildAmethystHomepageBootstrapScript } from '@/lib/amethyst/homepage-template-data'
import { loadAmethystPreviewTemplateData } from '@/lib/amethyst/preview-template-data'
import {
  applyPublicSiteSlugToHomepageEvents,
  applyPublicSiteSlugToTemplateData,
} from '@/lib/amethyst/public-site-links'
import { resolveAmethystRequestTarget } from '@/lib/amethyst/request-rep-target'

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
  const [events, templateData] = await Promise.all([
    loadAmethystHomepageUpcomingShows({ ...lookupTarget, targeted }),
    loadAmethystPreviewTemplateData(lookupTarget),
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
