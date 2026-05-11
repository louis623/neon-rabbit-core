import { NextResponse } from 'next/server'

import { loadAmethystHomepageUpcomingShows } from '@/lib/amethyst/homepage-upcoming-shows'
import { buildAmethystHomepageBootstrapScript } from '@/lib/amethyst/homepage-template-data'

export async function GET() {
  const events = await loadAmethystHomepageUpcomingShows()

  return new NextResponse(buildAmethystHomepageBootstrapScript(undefined, events), {
    headers: {
      'content-type': 'application/javascript; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}
