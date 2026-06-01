import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  buildAmethystHomepageBootstrapScript,
  buildAmethystHomepageTweakDefaults,
  defaultAmethystHomepageTemplateData,
} from '@/lib/amethyst/homepage-template-data'

describe('Amethyst homepage template data wiring', () => {
  it('keeps locked public fallback exports on the shared demo identity', () => {
    const files = [
      'public/amethyst/Homepage.html',
      'public/amethyst/Trade.html',
      'public/amethyst/Join.html',
      'public/amethyst/Unsubscribe.html',
      'public/amethyst/homepage.jsx',
      'public/amethyst/trade.jsx',
      'public/amethyst/join.jsx',
      'public/amethyst/unsubscribe.jsx',
    ].map((file) => readFileSync(resolve(process.cwd(), file), 'utf8'))
    const serialized = files.join('\n')

    expect(serialized).toContain('Sparkle by Sasha')
    expect(serialized).not.toMatch(/\b(?:Rep Name|Show Name)\b/)
    expect(serialized).not.toContain("Jane's Sparkle Party")
  })

  it('marks animated ticker tracks as decorative and provides concise screen-reader summaries', () => {
    const homepage = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )
    const trade = readFileSync(
      resolve(process.cwd(), 'public/amethyst/trade.jsx'),
      'utf8',
    )
    const join = readFileSync(
      resolve(process.cwd(), 'public/amethyst/join.jsx'),
      'utf8',
    )
    const css = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.css'),
      'utf8',
    )

    for (const jsx of [homepage, trade, join]) {
      expect(jsx).toContain('className="hp-ticker-sr"')
      expect(jsx).toContain('aria-hidden="true"')
      expect(jsx).toContain('aria-label="Customer site updates"')
    }
    expect(css).toContain('.hp-ticker-sr')
    expect(css).toMatch(/\.hp-ticker-sr[\s\S]*?clip:\s*rect\(0 0 0 0\);/)
  })

  it('ships shared customer-facing mobile CSS containment and motion safeguards', () => {
    const tokensCss = readFileSync(
      resolve(process.cwd(), 'public/amethyst/tokens.css'),
      'utf8',
    )
    const css = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.css'),
      'utf8',
    )

    expect(tokensCss).toContain('overflow-x: clip;')
    expect(tokensCss).toContain('max-width: 100%;')
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.hp-ticker[\s\S]*?overflow-x:\s*clip;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.hp-header-nav[\s\S]*?max-width:\s*100%;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.hp-header-link[\s\S]*?font-size:\s*12px;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.hp-ticker-track[\s\S]*?min-width:\s*max-content;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.hp-trade-preview[\s\S]*?top:\s*var\(--hp-mobile-sticky-trade-top\);/)
    expect(css).toMatch(/@media\s+\(pointer:\s*coarse\)[\s\S]*?\.hp-header-link[\s\S]*?min-height:\s*44px;/)
    expect(css).toMatch(/@media\s+\(pointer:\s*coarse\)[\s\S]*?\.hp-queue-modal-close[\s\S]*?min-width:\s*44px;/)
    expect(css).toMatch(/@media\s+\(prefers-reduced-motion:\s*reduce\)[\s\S]*?transition-duration:\s*0\.01ms\s*!important;/)
    expect(css).toMatch(/@media\s+\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.hp-ticker-track[\s\S]*?animation:\s*none\s*!important;/)
    expect(css).toMatch(/@media\s+\(prefers-reduced-motion:\s*reduce\)[\s\S]*?body\.tex-sparkle::before[\s\S]*?animation:\s*none\s*!important;/)
    expect(css).toMatch(/@media\s+\(prefers-reduced-motion:\s*reduce\)[\s\S]*?body\.cta-pulse\s+\.hp-btn-primary:not\(\.outline\)[\s\S]*?animation:\s*none\s*!important;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.hp-hero-headline[\s\S]*?font-size:\s*clamp\(36px,\s*10\.5vw,\s*48px\);/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.hp-hero-inner[\s\S]*?width:\s*100vw;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.hp-hero-inner[\s\S]*?margin-inline:\s*calc\(50% - 50vw\);/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.hp-hero-headline[\s\S]*?max-width:\s*11ch;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.hp-hero-headline[\s\S]*?overflow-wrap:\s*anywhere;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.hp-hero-media\.placeholder::after[\s\S]*?align-items:\s*flex-start;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.hp-hero-media\.placeholder::after[\s\S]*?text-align:\s*center;/)
  })

  it('maps structured editable content into the locked homepage tweak defaults', () => {
    const defaults = buildAmethystHomepageTweakDefaults(
      defaultAmethystHomepageTemplateData,
    )

    expect(defaults.repName).toBe(defaultAmethystHomepageTemplateData.repName)
    expect(defaults.businessName).toBe(
      defaultAmethystHomepageTemplateData.businessName,
    )
    expect(defaults.heroHeadline).toBe(
      defaultAmethystHomepageTemplateData.heroHeadline,
    )
    expect(defaults.heroSub).toBe(defaultAmethystHomepageTemplateData.heroSub)
    expect(defaults.tickerTopText).toBe(
      defaultAmethystHomepageTemplateData.tickerTopText,
    )
  })

  it('serializes the full editable homepage payload for the locked export runtime', () => {
    const script = buildAmethystHomepageBootstrapScript(
      defaultAmethystHomepageTemplateData,
    )

    expect(script).toContain('window.AMETHYST_HOMEPAGE_TEMPLATE_DATA')
    expect(script).toContain('window.AMETHYST_HOMEPAGE_EVENTS')
    expect(script).toContain('"teamName"')
    expect(script).toContain('"aboutHeadline"')
    expect(script).toContain('"aboutParagraphs"')
    expect(script).toContain('"aboutMediaSlots"')
    expect(script).toContain('"streamLinks"')
    expect(script).toContain('"socialLinks"')
    expect(script).toContain('"eventTime"')
    expect(script).toContain('"durationMinutes"')
    expect(script).toContain('"/amethyst/Trade.html"')
    expect(script).toContain('"/amethyst/Join.html"')
  })

  it('loads the runtime bootstrap script before the locked homepage export', () => {
    const html = readFileSync(
      resolve(process.cwd(), 'public/amethyst/Homepage.html'),
      'utf8',
    )

    expect(html).toContain('<script src="/api/amethyst/homepage-template"></script>')
  })

  it('ships crawl and sharing metadata with the locked homepage export', () => {
    const html = readFileSync(
      resolve(process.cwd(), 'public/amethyst/Homepage.html'),
      'utf8',
    )

    expect(html).toContain(
      '<meta name="description" content="Shop live jewelry reveals, trade board highlights, and upcoming shows with Sparkle by Sasha." />',
    )
    expect(html).toContain(
      '<link rel="canonical" href="https://www.yoursparklesuite.com/amethyst/Homepage.html" />',
    )
    expect(html).toContain('<meta name="robots" content="index,follow" />')
    expect(html).toContain(
      '<meta property="og:title" content="Sparkle by Sasha - Live jewelry reveals" />',
    )
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />')
  })

  it('wires the locked homepage export to the Trade and Join pages', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )

    expect(jsx).toContain('className="hp-header-nav"')
    expect(jsx).toContain('getTradeBoardHref()')
    expect(jsx).toContain('getJoinTeamHref()')
  })

  it('renders one sticky live reveal queue strip under the ticker', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )
    const css = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.css'),
      'utf8',
    )

    expect(jsx).toContain('function LiveQueueStrip')
    expect(jsx).toContain('className="hp-trade-preview"')
    expect(jsx).toContain('Live Reveal Queue')
    expect(jsx).toContain('View full queue')
    expect(jsx).toContain('function LiveQueueModal')
    expect(jsx).not.toContain('Next to reveal')
    expect(jsx).not.toContain('Open trade board')
    expect(jsx).not.toContain('<LiveQueueSection />')
    expect(css).toContain('.hp-trade-preview')
    expect(css).toContain('.hp-queue-modal-mask')
    expect(css).toContain('position: sticky;')
    expect(css).toContain('top: 144px;')
  })

  it('uses a symmetrical header grid so the shared brand stays truly centered', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.css'),
      'utf8',
    )

    expect(css).toContain('grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);')
    expect(css).toContain('justify-self: start;')
    expect(css).toContain('justify-self: end;')
  })

  it('hydrates the locked homepage events from runtime data and keeps the show-card behaviors wired', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )

    expect(jsx).toContain('window.AMETHYST_HOMEPAGE_EVENTS')
    expect(jsx).toContain('Intl.DateTimeFormat')
    expect(jsx).toContain('downloadCalendarEvent')
    expect(jsx).toContain('text/calendar')
    expect(jsx).toContain('URL.createObjectURL')
    expect(jsx).toContain('event.collections.map')
    expect(jsx).toContain('event.platforms.map')
  })

  it('wires the customer signup form to the audience route with separate consent controls', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )

    expect(jsx).toContain('/api/amethyst/customer-audience')
    expect(jsx).toContain('firstName')
    expect(jsx).toContain('lastName')
    expect(jsx).toContain('smsConsent')
    expect(jsx).toContain('emailConsent')
    expect(jsx).toContain('marketingConsent')
    expect(jsx).toContain('Choose SMS, email, or both')
    expect(jsx).toContain('/amethyst/Unsubscribe.html')
  })

  it('keeps signup submission state scoped to the signup form so the homepage can fresh-load', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )
    const aboutStart = jsx.indexOf('function AboutSection')
    const signupStart = jsx.indexOf('function Signup')
    const aboutSectionSource = jsx.slice(aboutStart, signupStart)

    expect(aboutStart).toBeGreaterThan(-1)
    expect(signupStart).toBeGreaterThan(aboutStart)
    expect(aboutSectionSource).not.toContain('submitState')
  })

  it('ships the Sparkle Suite/Morganite skin in the local homepage preset picker', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )
    const html = readFileSync(
      resolve(process.cwd(), 'public/amethyst/Homepage.html'),
      'utf8',
    )

    expect(jsx).toContain('sparkle_suite_morganite')
    expect(jsx).toContain('Sparkle Suite/Morganite')
    expect(html).toContain('DM+Sans')
    expect(html).toContain('Playfair+Display')
  })

  it('ships the Black Diamond skin in the local homepage preset picker', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )
    const html = readFileSync(
      resolve(process.cwd(), 'public/amethyst/Homepage.html'),
      'utf8',
    )

    expect(jsx).toContain('black_diamond')
    expect(jsx).toContain('Black Diamond')
    expect(html).toContain('DM+Sans')
    expect(html).toContain('Playfair+Display')
  })

  it('ships the Rose Gold skin in the local homepage preset picker', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )
    const html = readFileSync(
      resolve(process.cwd(), 'public/amethyst/Homepage.html'),
      'utf8',
    )

    expect(jsx).toContain('rose_gold')
    expect(jsx).toContain('Rose Gold')
    expect(html).toContain('DM+Sans')
    expect(html).toContain('Playfair+Display')
  })

  it('ships the approved batch skins in the local homepage preset picker', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )
    const html = readFileSync(
      resolve(process.cwd(), 'public/amethyst/Homepage.html'),
      'utf8',
    )

    expect(jsx).toContain('garnet')
    expect(jsx).toContain('Garnet')
    expect(jsx).toContain('amber')
    expect(jsx).toContain('Amber')
    expect(jsx).toContain('velvet')
    expect(jsx).toContain('Velvet')
    expect(jsx).toContain('rose_quartz')
    expect(jsx).toContain('Rose Quartz')
    expect(html).toContain('Bitter')
    expect(html).toContain('Nunito')
  })

  it('does not ship legacy placeholder skins in the local homepage preset picker', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )

    expect(jsx).not.toContain('value: "editorial"')
    expect(jsx).not.toContain('value: "softGlam"')
    expect(jsx).not.toContain('value: "sparkleParty"')
    expect(jsx).not.toContain('value: "maximum", label: "Maximum"')
    expect(jsx).not.toContain('label: "Editorial"')
    expect(jsx).not.toContain('label: "Soft Glam"')
    expect(jsx).not.toContain('label: "Sparkle Party"')
  })

  it('ships a public unsubscribe export alongside the homepage', () => {
    const html = readFileSync(
      resolve(process.cwd(), 'public/amethyst/Unsubscribe.html'),
      'utf8',
    )
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/unsubscribe.jsx'),
      'utf8',
    )

    expect(html).toContain('unsubscribe.jsx')
    expect(jsx).toContain('/api/amethyst/customer-audience/unsubscribe')
  })

  it('uses large toggle-style unsubscribe rows for mobile preference changes', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/unsubscribe.jsx'),
      'utf8',
    )
    const css = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.css'),
      'utf8',
    )

    expect(jsx).toContain('className="hp-signup-check hp-unsubscribe-toggle"')
    expect(jsx).toContain('className="hp-toggle-control"')
    expect(css).toContain('.hp-unsubscribe-toggle')
    expect(css).toContain('.hp-toggle-control')
    expect(css).toMatch(/@media\s+\(pointer:\s*coarse\)[\s\S]*?\.hp-unsubscribe-toggle[\s\S]*?min-height:\s*56px;/)
  })
})
