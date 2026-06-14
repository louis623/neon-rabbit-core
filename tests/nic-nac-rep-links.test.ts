import { describe, expect, it } from 'vitest'

import {
  buildCustomerSparkleSiteHref,
  buildCustomerTradeBoardHref,
} from '@/lib/nic-nac/rep-links'

describe('Nic-Nac rep customer links', () => {
  it('uses public site slugs for customer-facing Sparkle Suite sites', () => {
    expect(
      buildCustomerSparkleSiteHref({
        repId: 'rep-1',
        publicSiteSlug: 'graciesparkleparty',
      }),
    ).toBe('/graciesparkleparty')
  })

  it('trims and lowercases public site slugs without adding separators', () => {
    expect(
      buildCustomerSparkleSiteHref({
        repId: 'rep-1',
        publicSiteSlug: '  GracieSparkleParty  ',
      }),
    ).toBe('/graciesparkleparty')
  })

  it('keeps the old Sparkle Suite homepage fallback for object rep ids', () => {
    expect(buildCustomerSparkleSiteHref({ repId: 'rep-1' })).toBe(
      '/amethyst/Homepage.html?c=rep-1',
    )
  })

  it('keeps string input compatibility for customer-facing Sparkle Suite sites', () => {
    expect(buildCustomerSparkleSiteHref('rep-1')).toBe(
      '/amethyst/Homepage.html?c=rep-1',
    )
  })

  it('uses public site slugs for customer-facing trade boards', () => {
    expect(
      buildCustomerTradeBoardHref({
        repId: 'rep-1',
        publicSiteSlug: 'graciesparkleparty',
      }),
    ).toBe('/graciesparkleparty/trade')
  })
})
