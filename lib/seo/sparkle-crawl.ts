import type { MetadataRoute } from 'next'

export const SPARKLE_PUBLIC_ORIGIN = 'https://www.yoursparklesuite.com'

type SparklePublicRoute = {
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  priority: number
}

const SPARKLE_PUBLIC_LAST_MODIFIED = new Date('2026-05-10')

const SPARKLE_PUBLIC_ROUTES: SparklePublicRoute[] = [
  {
    path: '/prelaunch',
    changeFrequency: 'weekly',
    priority: 1,
  },
  {
    path: '/privacy-policy',
    changeFrequency: 'yearly',
    priority: 0.4,
  },
  {
    path: '/terms-and-conditions',
    changeFrequency: 'yearly',
    priority: 0.4,
  },
]

export function normalizeSparkleOrigin(
  origin: string | URL = SPARKLE_PUBLIC_ORIGIN,
): string {
  const parsed = new URL(origin)

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Sparkle crawl origins must use http or https.')
  }

  return parsed.origin
}

export function buildSparkleSitemap(
  origin: string | URL = SPARKLE_PUBLIC_ORIGIN,
): MetadataRoute.Sitemap {
  const normalizedOrigin = normalizeSparkleOrigin(origin)

  return SPARKLE_PUBLIC_ROUTES.map((route) => ({
    url: `${normalizedOrigin}${route.path}`,
    lastModified: SPARKLE_PUBLIC_LAST_MODIFIED,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}

export function buildSparkleRobots(
  origin: string | URL = SPARKLE_PUBLIC_ORIGIN,
): MetadataRoute.Robots {
  const normalizedOrigin = normalizeSparkleOrigin(origin)

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/internal/'],
      },
    ],
    sitemap: `${normalizedOrigin}/sitemap.xml`,
    host: normalizedOrigin,
  }
}
