import { NextResponse } from 'next/server'

import { loadAmethystHomepageUpcomingShows } from '@/lib/amethyst/homepage-upcoming-shows'
import { buildAmethystHomepageBootstrapScript } from '@/lib/amethyst/homepage-template-data'
import { loadAmethystPreviewTemplateData } from '@/lib/amethyst/preview-template-data'
import { resolveAmethystRequestRepId } from '@/lib/amethyst/request-rep-target'

export async function GET(request: Request) {
  const repId = resolveAmethystRequestRepId(request)
  const targeted = Boolean(repId)
  const [events, templateData] = await Promise.all([
    loadAmethystHomepageUpcomingShows({ repId, targeted }),
    loadAmethystPreviewTemplateData({ repId }),
  ])

  return new NextResponse(
    buildAmethystHomepageBootstrapScript(
      templateData.homepage,
      events,
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
