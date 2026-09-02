import { describe, expect, it } from 'vitest'
import {
  missingCustomerShowPlatforms,
  resolveCustomerShowPlatformLinks,
} from '@/lib/amethyst/show-platform-links'

describe('customer show platform links', () => {
  it('uses the matching configured customer-site links, including multiple named platforms', () => {
    expect(
      resolveCustomerShowPlatformLinks('TikTok + Whatnot', {
        tiktok: '@sparkle-demo',
        whatnot: '@sparkle-live',
        facebook: '@not-this-show',
      }),
    ).toEqual([
      {
        kind: 'tiktok',
        label: 'Watch on TikTok',
        href: 'https://www.tiktok.com/@sparkle-demo',
      },
      {
        kind: 'whatnot',
        label: 'Watch on Whatnot',
        href: 'https://www.whatnot.com/user/sparkle-live',
      },
    ])
  })

  it('does not turn an old event-level destination into a link', () => {
    expect(resolveCustomerShowPlatformLinks('TikTok', {})).toEqual([])
    expect(missingCustomerShowPlatforms('TikTok', {})).toEqual(['tiktok'])
  })

  it('does not expose malformed or non-HTTPS configured values', () => {
    expect(resolveCustomerShowPlatformLinks('Instagram', { instagram: 'http://example.com' })).toEqual([])
    expect(missingCustomerShowPlatforms('Instagram', { instagram: 'not a link' })).toEqual(['instagram'])
  })
})
