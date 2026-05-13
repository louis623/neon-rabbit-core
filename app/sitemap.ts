import type { MetadataRoute } from 'next'

import { buildSparkleSitemap } from '@/lib/seo/sparkle-crawl'

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSparkleSitemap()
}
