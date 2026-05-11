import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  buildAmethystJoinBootstrapScript,
  buildAmethystJoinTweakDefaults,
  defaultAmethystJoinTemplateData,
} from '@/lib/amethyst/join-template-data'

describe('Amethyst join page template data wiring', () => {
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
