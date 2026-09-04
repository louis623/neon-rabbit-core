import { describe, expect, it } from 'vitest'

import {
  buildCustomerSiteLlmsText,
  buildCustomerSiteSitemap,
} from '@/lib/seo/customer-site-crawl'

const kim = {
  businessName: 'Go for the Bling',
  repName: 'Kim',
  summary: "Kim's live jewelry community.",
  showJoinPage: true,
  showPantryPage: false,
  repLocation: 'Ohio',
}

describe('customer-site crawl content', () => {
  it('uses the customer domain and only the routes that customer publishes', () => {
    expect(buildCustomerSiteSitemap('https://goforthebling.com', kim)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: 'https://goforthebling.com/', priority: 1 }),
        expect.objectContaining({ url: 'https://goforthebling.com/trade' }),
        expect.objectContaining({ url: 'https://goforthebling.com/join' }),
      ]),
    )
    expect(buildCustomerSiteSitemap('https://goforthebling.com', kim)).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: expect.stringContaining('prelaunch') }),
        expect.objectContaining({ url: expect.stringContaining('in-the-pantry') }),
      ]),
    )
  })

  it('renders actual customer identity rather than the demo llms fallback', () => {
    const llms = buildCustomerSiteLlmsText('https://goforthebling.com', kim)
    expect(llms).toContain('# Go for the Bling')
    expect(llms).toContain('Rep: Kim')
    expect(llms).toContain('https://goforthebling.com/trade')
    expect(llms).not.toContain("Jane's Sparkle Party")
  })
})
