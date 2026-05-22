import { NextResponse } from 'next/server'

import { loadAmethystHomepageUpcomingShows } from '@/lib/amethyst/homepage-upcoming-shows'
import { buildAmethystHomepageBootstrapScript } from '@/lib/amethyst/homepage-template-data'
import { loadAmethystPreviewTemplateData } from '@/lib/amethyst/preview-template-data'

export async function GET() {
  const [events, templateData] = await Promise.all([
    loadAmethystHomepageUpcomingShows(),
    loadAmethystPreviewTemplateData(),
  ])

  return new NextResponse(
    buildAmethystHomepageBootstrapScript(templateData.homepage, events),
    {
      headers: {
        'content-type': 'application/javascript; charset=utf-8',
        'cache-control': 'no-store',
      },
    },
  )
}
