import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'

import {
  SPARKLE_PUBLIC_ORIGIN,
  buildSparkleRobots,
  resolveSparkleRequestOriginFromHeaders,
} from '@/lib/seo/sparkle-crawl'

export const dynamic = 'force-dynamic'

async function resolveRobotsOrigin() {
  try {
    return resolveSparkleRequestOriginFromHeaders(await headers())
  } catch {
    return SPARKLE_PUBLIC_ORIGIN
  }
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  return buildSparkleRobots(await resolveRobotsOrigin())
}
