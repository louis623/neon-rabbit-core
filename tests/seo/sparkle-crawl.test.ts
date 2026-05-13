import { describe, expect, it } from 'vitest'

import {
  SPARKLE_PUBLIC_ORIGIN,
  buildSparkleRobots,
  buildSparkleSitemap,
  normalizeSparkleOrigin,
} from '@/lib/seo/sparkle-crawl'

describe('Sparkle Suite crawl helpers', () => {
  it('keeps the production public origin as the default crawl base', () => {
    expect(SPARKLE_PUBLIC_ORIGIN).toBe('https://www.yoursparklesuite.com')

    expect(buildSparkleSitemap()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: 'https://www.yoursparklesuite.com/prelaunch',
          priority: 1,
        }),
        expect.objectContaining({
          url: 'https://www.yoursparklesuite.com/privacy-policy',
        }),
        expect.objectContaining({
          url: 'https://www.yoursparklesuite.com/terms-and-conditions',
        }),
      ]),
    )
    expect(buildSparkleRobots()).toEqual(
      expect.objectContaining({
        host: 'https://www.yoursparklesuite.com',
        sitemap: 'https://www.yoursparklesuite.com/sitemap.xml',
      }),
    )
  })

  it('can generate sitemap and robots payloads for a custom domain origin', () => {
    const origin = normalizeSparkleOrigin('https://sparklebysasha.example/')

    expect(origin).toBe('https://sparklebysasha.example')
    expect(buildSparkleSitemap(origin)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: 'https://sparklebysasha.example/prelaunch',
        }),
      ]),
    )
    expect(buildSparkleRobots(origin)).toEqual(
      expect.objectContaining({
        host: 'https://sparklebysasha.example',
        sitemap: 'https://sparklebysasha.example/sitemap.xml',
      }),
    )
  })

  it('rejects non-web origins before they can become crawl URLs', () => {
    expect(() => normalizeSparkleOrigin('javascript:alert(1)')).toThrow(
      /http or https/,
    )
  })
})
