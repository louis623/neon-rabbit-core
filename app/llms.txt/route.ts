import { buildDefaultSparkleLlmsText } from '@/lib/seo/llms'
import { resolveSparkleRequestOrigin } from '@/lib/seo/sparkle-crawl'
import {
  buildCustomerSiteLlmsText,
  loadCustomerSiteCrawlData,
} from '@/lib/seo/customer-site-crawl'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const origin = resolveSparkleRequestOrigin(request)
  const customerSite = await loadCustomerSiteCrawlData(origin)
  return new Response(
    customerSite
      ? buildCustomerSiteLlmsText(origin, customerSite)
      : buildDefaultSparkleLlmsText(origin),
    {
      headers: {
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    },
  )
}
