import { describe, expect, it } from 'vitest'

import { defaultAmethystHomepageEvents } from '@/lib/amethyst/homepage-upcoming-shows'
import {
  applyPublicSiteSlugToHomepageEvents,
  applyPublicSiteSlugToTemplateData,
  getPublicSiteSlugFromRequest,
} from '@/lib/amethyst/public-site-links'
import { DEFAULT_AMETHYST_APPEARANCE_PRESET } from '@/lib/amethyst/appearance-presets'
import { defaultAmethystHomepageTemplateData } from '@/lib/amethyst/homepage-template-data'
import { defaultAmethystJoinTemplateData } from '@/lib/amethyst/join-template-data'
import { defaultAmethystTradeTemplateData } from '@/lib/amethyst/trade-template-data'

describe('Amethyst public site slug links', () => {
  it('normalizes valid slugs and rejects invalid slugs from template requests', () => {
    expect(
      getPublicSiteSlugFromRequest(
        new Request('https://www.yoursparklesuite.com/api/amethyst/homepage-template?publicSiteSlug=MileHighFizz'),
      ),
    ).toBe('milehighfizz')

    expect(
      getPublicSiteSlugFromRequest(
        new Request('https://www.yoursparklesuite.com/api/amethyst/homepage-template?publicSiteSlug=mile-high-fizz'),
      ),
    ).toBeNull()
  })

  it('rewrites customer-facing home, trade, and event collection links to the slug routes', () => {
    const data = applyPublicSiteSlugToTemplateData(
      {
        appearancePreset: DEFAULT_AMETHYST_APPEARANCE_PRESET,
        homepage: defaultAmethystHomepageTemplateData,
        trade: defaultAmethystTradeTemplateData,
        join: defaultAmethystJoinTemplateData,
      },
      'milehighfizz',
    )
    const events = applyPublicSiteSlugToHomepageEvents(
      defaultAmethystHomepageEvents,
      'milehighfizz',
    )

    expect(data.homepage.footerLinks.home).toBe('/milehighfizz')
    expect(data.homepage.footerLinks.tradeBoard).toBe('/milehighfizz/trade')
    expect(data.trade.footerLinks.home).toBe('/milehighfizz')
    expect(data.trade.footerLinks.tradeBoard).toBe('/milehighfizz/trade')
    expect(data.trade.footerLinks.pastShows).toBe('/milehighfizz#events')
    expect(events[0].collections[0].href).toBe(
      '/milehighfizz/trade?collection=Citrine%20Sun%20Series',
    )
  })
})
