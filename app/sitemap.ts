import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'

import {
  SPARKLE_PUBLIC_ORIGIN,
  buildSparkleSitemap,
  resolveSparkleRequestOriginFromHeaders,
} from '@/lib/seo/sparkle-crawl'
import {
  buildCustomerSiteSitemap,
  loadCustomerSiteCrawlData,
} from '@/lib/seo/customer-site-crawl'

export const dynamic = 'force-dynamic'

async function resolveSitemapOrigin() {
  try {
    return resolveSparkleRequestOriginFromHeaders(await headers())
  } catch {
    return SPARKLE_PUBLIC_ORIGIN
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await resolveSitemapOrigin()
  const customerSite = await loadCustomerSiteCrawlData(origin)
  return customerSite
    ? buildCustomerSiteSitemap(origin, customerSite)
    : buildSparkleSitemap(origin)
}
