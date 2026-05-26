import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'

import {
  SPARKLE_PUBLIC_ORIGIN,
  buildSparkleSitemap,
  resolveSparkleRequestOriginFromHeaders,
} from '@/lib/seo/sparkle-crawl'

export const dynamic = 'force-dynamic'

async function resolveSitemapOrigin() {
  try {
    return resolveSparkleRequestOriginFromHeaders(await headers())
  } catch {
    return SPARKLE_PUBLIC_ORIGIN
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSparkleSitemap(await resolveSitemapOrigin())
}
