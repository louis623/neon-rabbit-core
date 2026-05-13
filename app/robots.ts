import type { MetadataRoute } from 'next'

import { buildSparkleRobots } from '@/lib/seo/sparkle-crawl'

export default function robots(): MetadataRoute.Robots {
  return buildSparkleRobots()
}
