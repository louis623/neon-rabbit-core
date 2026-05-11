import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import {
  defaultAmethystSiteContent,
  makeAmethystSiteContent,
} from '@/lib/amethyst/site-content'
import { AmethystHomepage } from '@/components/amethyst/amethyst-homepage'

describe('Amethyst homepage template', () => {
  it('renders the locked homepage shell and key export interactions from placeholder content', () => {
    const html = renderToStaticMarkup(
      createElement(AmethystHomepage, {
        content: defaultAmethystSiteContent,
      }),
    )

    expect(html).toContain('aria-label="Menu"')
    expect(html).toContain('Shop')
    expect(html).toContain('Watch Live')
    expect(html).toContain('Trade Board')
    expect(html).toContain('Upcoming Shows')
    expect(html).toContain('What is Bomb Party?')
    expect(html).toContain('Never miss a show.')
    expect(html).toContain('Want to do this too?')
    expect(html).toContain('Add to calendar')
    expect(html).toContain('aria-label="Open Nic-Nac"')
    expect(html).toContain(defaultAmethystSiteContent.businessName)
    expect(html).toContain(defaultAmethystSiteContent.repName)
    expect(html).toContain(defaultAmethystSiteContent.announcementItems[0])
    expect(html).toContain('First name')
    expect(html).toContain('Last name')
    expect(html).toContain('Email')
    expect(html).toContain('Phone')
    expect(html).toContain('sms_consent')
    expect(html).toContain('email_consent')
    expect(html).toContain('marketing_consent')
    expect(html).toContain('/amethyst/unsubscribe')
    expect(html).not.toContain('Featured Trade Board')
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
