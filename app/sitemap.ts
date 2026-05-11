import type { MetadataRoute } from 'next'

const siteUrl = 'https://www.yoursparklesuite.com'
const lastModified = new Date('2026-05-10')

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl}/prelaunch`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteUrl}/privacy-policy`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${siteUrl}/terms-and-conditions`,
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ]
}
