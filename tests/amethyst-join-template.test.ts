import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  buildAmethystJoinBootstrapScript,
  buildAmethystJoinTweakDefaults,
  defaultAmethystJoinTemplateData,
} from '@/lib/amethyst/join-template-data'

describe('Amethyst join page template data wiring', () => {
  it('ships mobile hero typography safeguards for narrow customer screens', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'public/amethyst/join.css'),
      'utf8',
    )

    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.jp-hero-card[\s\S]*?box-sizing:\s*border-box;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.jp-hero-inner[\s\S]*?width:\s*100vw;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.jp-hero-inner[\s\S]*?margin-inline:\s*calc\(50% - 50vw\);/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.jp-hero-card[\s\S]*?width:\s*calc\(100vw - 48px\);/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.jp-hero-card[\s\S]*?max-width:\s*340px;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.jp-hero-title[\s\S]*?font-size:\s*clamp\(32px,\s*9\.6vw,\s*44px\);/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.jp-hero-title[\s\S]*?max-width:\s*10ch;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.jp-hero-title[\s\S]*?overflow-wrap:\s*anywhere;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.jp-hero-promo[\s\S]*?max-width:\s*100%;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.jp-hero-promo[\s\S]*?display:\s*flex;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.jp-hero-promo[\s\S]*?box-sizing:\s*border-box;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.jp-hero-promo[\s\S]*?white-space:\s*normal;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.jp-hero-pitch[\s\S]*?overflow-wrap:\s*anywhere;/)
    expect(css).toMatch(/@media\s+\(max-width:\s*640px\)[\s\S]*?\.jp-hero-pitch[\s\S]*?max-width:\s*24ch;/)
  })

  it('maps structured editable content into the locked join-page tweak defaults', () => {
    const defaults = buildAmethystJoinTweakDefaults(
      defaultAmethystJoinTemplateData,
    )

    expect(defaults.teamName).toBe(defaultAmethystJoinTemplateData.teamName)
    expect(defaults.repName).toBe(defaultAmethystJoinTemplateData.repName)
    expect(defaults.repCity).toBe(defaultAmethystJoinTemplateData.repCity)
    expect(defaults.repState).toBe(defaultAmethystJoinTemplateData.repState)
    expect(defaults.businessName).toBe(
      defaultAmethystJoinTemplateData.businessName,
    )
    expect(defaults.teamMemberCount).toBe(
      defaultAmethystJoinTemplateData.teamMembers.length,
    )
    expect(defaults.promoText).toBe(defaultAmethystJoinTemplateData.promoText)
    expect(defaults.heroPitch).toBe(defaultAmethystJoinTemplateData.heroPitch)
    expect(defaults.heroCtaText).toBe(
      defaultAmethystJoinTemplateData.heroCtaText,
    )
    expect(defaults.finalPitch).toBe(defaultAmethystJoinTemplateData.finalPitch)
    expect(defaults.bpReferralUrl).toBe(
      defaultAmethystJoinTemplateData.bpReferralUrl,
    )
    expect(defaults.tickerTopText).toBe(
      defaultAmethystJoinTemplateData.tickerTopText,
    )
  })

  it('serializes the full editable join-page payload for the locked export runtime', () => {
    const script = buildAmethystJoinBootstrapScript(
      defaultAmethystJoinTemplateData,
    )

    expect(script).toContain('window.AMETHYST_JOIN_TEMPLATE_DATA')
    expect(script).toContain('"teamMembers"')
    expect(script).toContain('"faqAnswers"')
    expect(script).toContain('"footerTagline"')
    expect(script).toContain('"legalDisclaimer"')
    expect(script).toContain('"repCity"')
    expect(script).toContain('"bpIncomeDisclosureUrl"')
    expect(script).toContain('"shopUrl"')
    expect(script).toContain('"repSocialLinks"')
    expect(script).toContain('"socialLinks"')
    expect(script).toContain('"footerLinks"')
  })

  it('loads the runtime bootstrap script before the locked join-page export', () => {
    const html = readFileSync(
      resolve(process.cwd(), 'public/amethyst/Join.html'),
      'utf8',
    )

    expect(html).toContain('<script src="/api/amethyst/join-template"></script>')
  })

  it('ships crawl and sharing metadata with the locked join export', () => {
    const html = readFileSync(
      resolve(process.cwd(), 'public/amethyst/Join.html'),
      'utf8',
    )

    expect(html).toContain(
      '<meta name="description" content="Learn how to join Jane\'s Sparkle Party and build a Bomb Party business with practical support from an active team." />',
    )
    expect(html).toContain(
      '<link rel="canonical" href="https://www.yoursparklesuite.com/amethyst/Join.html" />',
    )
    expect(html).toContain('<meta name="robots" content="index,follow" />')
    expect(html).toContain(
      '<meta property="og:title" content="Jane\'s Sparkle Party - Join the Team" />',
    )
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />')
  })

  it('uses the shared top navigation pattern on the locked join-page export', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/join.jsx'),
      'utf8',
    )

    expect(jsx).toContain('className="hp-header-nav"')
    expect(jsx).toContain('Trade Board')
    expect(jsx).toContain('Join Team')
    expect(jsx).toContain('"/amethyst/Homepage.html"')
  })

  it('renders the sticky live reveal queue strip below the ticker on the join page', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/join.jsx'),
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
    expect(css).toContain('.hp-queue-modal-mask')
  })

  it('centers the join hero card and its contents to match the sections below', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'public/amethyst/join.css'),
      'utf8',
    )

    expect(css).toContain('justify-content: center;')
    expect(css).toContain('text-align: center;')
    expect(css).toContain('margin: 0 auto;')
  })

  it('ships the Sparkle Suite/Morganite skin in the local join preset picker', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/join.jsx'),
      'utf8',
    )
    const html = readFileSync(
      resolve(process.cwd(), 'public/amethyst/Join.html'),
      'utf8',
    )

    expect(jsx).toContain('sparkle_suite_morganite')
    expect(jsx).toContain('Sparkle Suite/Morganite')
    expect(html).toContain('DM+Sans')
    expect(html).toContain('Playfair+Display')
  })

  it('ships the Black Diamond skin in the local join preset picker', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/join.jsx'),
      'utf8',
    )
    const html = readFileSync(
      resolve(process.cwd(), 'public/amethyst/Join.html'),
      'utf8',
    )

    expect(jsx).toContain('black_diamond')
    expect(jsx).toContain('Black Diamond')
    expect(html).toContain('DM+Sans')
    expect(html).toContain('Playfair+Display')
  })

  it('ships the Rose Gold skin in the local join preset picker', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/join.jsx'),
      'utf8',
    )
    const html = readFileSync(
      resolve(process.cwd(), 'public/amethyst/Join.html'),
      'utf8',
    )

    expect(jsx).toContain('rose_gold')
    expect(jsx).toContain('Rose Gold')
    expect(html).toContain('DM+Sans')
    expect(html).toContain('Playfair+Display')
  })

  it('ships the approved batch skins in the local join preset picker', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/join.jsx'),
      'utf8',
    )
    const html = readFileSync(
      resolve(process.cwd(), 'public/amethyst/Join.html'),
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

  it('does not ship legacy placeholder skins in the local join preset picker', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/join.jsx'),
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

  it('includes localized wrappers and a Bomb Party IDS link on the join page', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/join.jsx'),
      'utf8',
    )

    expect(jsx).toContain('Bomb Party Income Disclosure Statement')
    expect(jsx).toContain('document.title = `Join ${t.teamName} | ${t.repName}')
    expect(jsx).toContain('Rep city')
    expect(jsx).toContain('rep city and state')
  })
})
