import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import {
  defaultAmethystSiteContent,
  makeAmethystSiteContent,
} from '@/lib/amethyst/site-content'
import { AmethystHomepage } from '@/components/amethyst/amethyst-homepage'

describe('Amethyst homepage template', () => {
  it('renders the locked header nav, dual ticker, key homepage sections, and footer copy from placeholder content', () => {
    const html = renderToStaticMarkup(
      createElement(AmethystHomepage, {
        content: defaultAmethystSiteContent,
      }),
    )

    expect(html).toContain('Home')
    expect(html).toContain('Trade Board')
    expect(html).toContain('Join Team')
    expect(html).toContain('Learn about Bomb Party')
    expect(html).toContain('Upcoming Shows')
    expect(html).toContain('Featured Trade Board')
    expect(html).toContain('What is Bomb Party?')
    expect(html).toContain('Never miss a show.')
    expect(html).toContain('Want to do this too?')
    expect(html).toContain(defaultAmethystSiteContent.businessName)
    expect(html).toContain(defaultAmethystSiteContent.repName)
    expect(html).toContain(defaultAmethystSiteContent.tradeBoardListings[0].title)
  })

  it('uses the supplied site content instead of hardcoded rep-specific strings', () => {
    const customContent = makeAmethystSiteContent({
      repName: 'Jordan Avery',
      businessName: 'Moonlit Velvet',
      heroHeadline: 'Custom reveals. Custom energy. Custom sparkle.',
      announcementItems: ['Text alerts every Friday'],
      footerColumn: {
        title: 'Next Drops',
        links: [{ label: 'Gemstone Weekend', href: '#events' }],
      },
    })

    const html = renderToStaticMarkup(
      createElement(AmethystHomepage, {
        content: customContent,
      }),
    )

    expect(html).toContain('Jordan Avery')
    expect(html).toContain('Moonlit Velvet')
    expect(html).toContain('Custom reveals. Custom energy. Custom sparkle.')
    expect(html).toContain('Text alerts every Friday')
    expect(html).toContain('Next Drops')
    expect(html).toContain('Gemstone Weekend')
    expect(html).not.toContain(defaultAmethystSiteContent.businessName)
  })
})
