import { describe, expect, it } from 'vitest'

import {
  resolveAmethystRequestRepId,
  resolveAmethystRequestTarget,
} from '@/lib/amethyst/request-rep-target'

describe('Amethyst request rep target', () => {
  it('reads an explicit customer target from the API query string', () => {
    expect(
      resolveAmethystRequestRepId(
        new Request('http://localhost/api/amethyst/homepage-template?c=rep-1'),
      ),
    ).toBe('rep-1')
  })

  it('reads the customer target from the public page referer', () => {
    expect(
      resolveAmethystRequestRepId(
        new Request('http://localhost/api/amethyst/homepage-template', {
          headers: {
            referer: 'http://localhost/amethyst/Homepage.html?c=rep-2',
          },
        }),
      ),
    ).toBe('rep-2')
  })

  it('reads the public site slug from a customer-site referer path', () => {
    expect(
      resolveAmethystRequestTarget(
        new Request('https://www.yoursparklesuite.com/api/amethyst/trade-board', {
          headers: {
            referer: 'https://www.yoursparklesuite.com/LouisFizzFest/trade',
          },
        }),
      ),
    ).toEqual({
      customDomain: null,
      publicSiteSlug: 'louisfizzfest',
      repId: null,
      source: 'referer-public-site-slug',
      targeted: true,
    })
  })

  it('normalizes a custom-domain request host when there is no explicit target', () => {
    expect(
      resolveAmethystRequestRepId(
        new Request('https://SparkleBySasha.example:443/api/amethyst/homepage-template'),
      ),
    ).toBe('sparklebysasha.example')
  })

  it('ignores local and preview hosts so demo fallbacks still apply', () => {
    expect(
      resolveAmethystRequestRepId(
        new Request('http://localhost:3000/api/amethyst/homepage-template'),
      ),
    ).toBeNull()

    expect(
      resolveAmethystRequestRepId(
        new Request('https://sparkle-suite-git-wave-1.vercel.app/api/amethyst/homepage-template'),
      ),
    ).toBeNull()
  })

  it('uses the proxy-preserved custom domain after a customer-site rewrite', () => {
    expect(
      resolveAmethystRequestRepId(
        new Request('https://www.yoursparklesuite.com/customer-site/join', {
          headers: { 'x-sparkle-customer-domain': 'theblingkitchen.com' },
        }),
      ),
    ).toBe('theblingkitchen.com')
  })

  it('uses the custom-domain target for API routes instead of treating api as a public slug', () => {
    expect(
      resolveAmethystRequestTarget(
        new Request('https://sparklebysasha.example/api/amethyst/homepage-template'),
      ),
    ).toEqual({
      customDomain: 'sparklebysasha.example',
      publicSiteSlug: null,
      repId: null,
      source: 'custom-domain',
      targeted: true,
    })
  })

  it('ignores the canonical Sparkle Suite platform host so slug pages do not become custom-domain lookups', () => {
    expect(
      resolveAmethystRequestRepId(
        new Request('https://www.yoursparklesuite.com/api/amethyst/trade-board'),
      ),
    ).toBeNull()
  })

  it('keeps an explicit target ahead of a custom-domain host', () => {
    expect(
      resolveAmethystRequestRepId(
        new Request(
          'https://sparklebysasha.example/api/amethyst/homepage-template?repId=rep-override',
        ),
      ),
    ).toBe('rep-override')
  })
})
