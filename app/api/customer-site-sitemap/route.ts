import {
  loadCustomerSiteCrawlData,
  renderCustomerSiteSitemapXml,
} from '@/lib/seo/customer-site-crawl'
import { normalizeAmethystCustomDomainCandidate } from '@/lib/amethyst/host-routing'

export const dynamic = 'force-dynamic'

function customerOrigin(request: Request) {
  const domain = normalizeAmethystCustomDomainCandidate(
    new URL(request.url).searchParams.get('c'),
  )
  return domain ? `https://${domain}` : null
}

export async function GET(request: Request) {
  const origin = customerOrigin(request)
  if (!origin) return new Response('Not found', { status: 404 })

  const customerSite = await loadCustomerSiteCrawlData(origin)
  if (!customerSite) return new Response('Not found', { status: 404 })

  return new Response(renderCustomerSiteSitemapXml(origin, customerSite), {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/xml; charset=utf-8',
    },
  })
}
