import { describe, expect, it, vi } from 'vitest'

vi.mock('next/font/google', () => ({
  DM_Sans: () => ({ variable: '--font-prelaunch-sans' }),
  Geist: () => ({ variable: '--font-geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono' }),
  Italiana: () => ({ variable: '--font-amethyst-display' }),
  Playfair_Display: () => ({ variable: '--font-prelaunch-display' }),
}))

import robots from '@/app/robots'
import sitemap from '@/app/sitemap'
import { metadata as rootMetadata } from '@/app/layout'
import { metadata as prelaunchMetadata } from '@/app/prelaunch/page'
import { metadata as loginMetadata } from '@/app/login/page'
import { alt as openGraphImageAlt, size as openGraphImageSize } from '@/app/opengraph-image'

describe('Sparkle Suite crawl and metadata signals', () => {
  it('keeps global metadata neutral while using www as the canonical live host', () => {
    expect(rootMetadata.metadataBase).toEqual(
      new URL('https://www.yoursparklesuite.com'),
    )
    expect(rootMetadata.alternates).toBeUndefined()
    expect(rootMetadata.robots).toBeUndefined()
    expect(rootMetadata.openGraph).toBeUndefined()
    expect(rootMetadata.twitter).toBeUndefined()
  })

  it('sets the prelaunch canonical and sharing metadata', () => {
    expect(prelaunchMetadata.alternates).toEqual({
      canonical: '/prelaunch',
    })
    expect(prelaunchMetadata.robots).toEqual({
      index: true,
      follow: true,
    })
    expect(prelaunchMetadata.openGraph).toEqual(
      expect.objectContaining({
        url: '/prelaunch',
        siteName: 'Sparkle Suite',
        images: [
          {
            url: '/opengraph-image',
            width: 1200,
            height: 630,
            alt: 'Sparkle Suite coming soon: a better customer experience starts with a better rep setup.',
          },
        ],
      }),
    )
    expect(prelaunchMetadata.twitter).toEqual(
      expect.objectContaining({
        card: 'summary_large_image',
        images: [
          {
            url: '/opengraph-image',
            alt: 'Sparkle Suite coming soon: a better customer experience starts with a better rep setup.',
          },
        ],
      }),
    )
  })

  it('generates a focused sitemap for public prelaunch pages', () => {
    expect(sitemap()).toEqual(
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
  })

  it('allows public crawl paths while keeping utility paths out', () => {
    expect(robots()).toEqual(
      expect.objectContaining({
        sitemap: 'https://www.yoursparklesuite.com/sitemap.xml',
        rules: expect.arrayContaining([
          expect.objectContaining({
            allow: '/',
            disallow: ['/api/', '/internal/'],
          }),
        ]),
      }),
    )
    expect(loginMetadata.robots).toEqual({
      index: false,
      follow: false,
    })
  })

  it('defines a polished social share image for the public site', () => {
    expect(openGraphImageSize).toEqual({
      width: 1200,
      height: 630,
    })
    expect(openGraphImageAlt).toBe(
      'Sparkle Suite coming soon: a better customer experience starts with a better rep setup.',
    )
  })
})
