import { normalizeAmethystCustomDomainCandidate } from '@/lib/amethyst/host-routing'
import { loadCustomerSiteCrawlData } from '@/lib/seo/customer-site-crawl'

export const dynamic = 'force-dynamic'

function customerOrigin(request: Request) {
  const domain = normalizeAmethystCustomDomainCandidate(
    new URL(request.url).searchParams.get('c'),
  )
  return domain ? `https://${domain}` : null
}

export async function GET(request: Request) {
  const origin = customerOrigin(request)
  if (!origin || !(await loadCustomerSiteCrawlData(origin))) {
    return new Response('Not found', { status: 404 })
  }

  return new Response(
    `User-Agent: *\nAllow: /\nDisallow: /api/\nDisallow: /internal/\nSitemap: ${origin}/sitemap.xml\n`,
    {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    },
  )
}
