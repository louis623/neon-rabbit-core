import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import HomePage, { metadata } from '@/app/page'
import { SparkleSuitePublicLanding } from '@/app/_components/sparkle-suite-public-landing'
import {
  sparkleSuitePublicLandingContent,
  sparkleSuitePublicLandingSafety,
} from '@/lib/sparkle-suite/public-landing-content'

function renderLanding() {
  return renderToStaticMarkup(createElement(SparkleSuitePublicLanding))
}

describe('Sparkle Suite public landing page', () => {
  it('defines the approved hero, CTA, and section copy', () => {
    expect(sparkleSuitePublicLandingContent.hero.headline).toBe(
      'Make your Bomb Party customer experience feel more polished.',
    )
    expect(sparkleSuitePublicLandingContent.hero.primaryCta.label).toBe(
      'Get Sparkle Suite',
    )
    expect(sparkleSuitePublicLandingContent.hero.secondaryCta.label).toBe(
      'See What It Does',
    )
    expect(sparkleSuitePublicLandingContent.comparison.heading).toBe(
      'Less scattered. More polished.',
    )
    expect(sparkleSuitePublicLandingContent.features.items.map((item) => item.title)).toEqual([
      'Trade board',
      'Live queue',
      'Live event calendar',
      'Email updates',
      'SMS updates',
      'Nic-Nac',
    ])
  })

  it('renders every approved landing-page section', () => {
    const html = renderLanding()

    expect(html).toContain('Make your Bomb Party customer experience feel more')
    expect(html).toContain('polished.')
    expect(html).toContain('Less scattered. More polished.')
    expect(html).toContain('The tools behind the smoother experience.')
    expect(html).toContain('Customers should know where to go.')
    expect(html).toContain('Less repeating. More selling.')
    expect(html).toContain('Ready to make your customer experience feel more polished?')
    expect(html).toContain('Is Sparkle Suite affiliated with Bomb Party?')
    expect(html).toContain('class="sparkle-landing"')
    expect(html).toContain('sl-cascade')
    expect(html).toContain('class="sl-comparison"')
  })

  it('renders the hero product mockup as a CSS 3D scene', () => {
    const html = renderLanding()

    expect(html).toContain('sl-product-scene')
    expect(html).toContain('sl-product-stage')
    expect(html).toContain('sl-depth-object--screen')
    expect(html).toContain('sl-depth-object--queue')
    expect(html).toContain('sl-depth-object--trade')
    expect(html).toContain('sl-depth-object--calendar')
    expect(html).toContain('sl-depth-object--email')
    expect(html).toContain('sl-depth-object--sms')
    expect(html).toContain('sl-depth-object--nic-nac')
  })

  it('keeps the trademark and no-jewelry guardrails visible in rendered output', () => {
    const html = renderLanding()
    const heroEnd = html.indexOf('Less scattered. More polished.')
    const heroHtml = heroEnd > -1 ? html.slice(0, heroEnd) : html

    expect(sparkleSuitePublicLandingSafety.disclaimer).toBe(
      'Sparkle Suite is an independent tool for reps. We are not affiliated with, endorsed by, sponsored by, or officially connected to Bomb Party.',
    )
    expect(html).toContain(sparkleSuitePublicLandingSafety.disclaimer)
    expect(heroHtml).not.toContain('BB business')
    expect(heroHtml).not.toContain('launch flow')
    expect(heroHtml).not.toContain('backend')
    expect(heroHtml).not.toContain('modules')
    expect(html).not.toContain('AI-powered platform')
    expect(html).not.toContain('ring photo')
    expect(html).not.toContain('gemstone')
    expect(html).not.toContain('jewelry image')
    expect(html).not.toContain('>SS<')
  })

  it('routes the root page to the public landing page without a redirect', () => {
    const html = renderToStaticMarkup(createElement(HomePage))

    expect(html).toContain('Make your Bomb Party customer experience feel more')
    expect(html).toContain('polished.')
    expect(html).toContain('application/ld+json')
    expect(html).not.toContain('NEXT_REDIRECT')
  })

  it('exports public landing metadata without third-party brand-led framing', () => {
    expect(metadata.title).toEqual({ absolute: 'Sparkle Suite' })
    expect(metadata.description).toBe(
      'Make your live-show customer experience feel more polished with Sparkle Suite.',
    )
    expect(JSON.stringify(metadata)).not.toContain('Bomb Party')
  })
})
