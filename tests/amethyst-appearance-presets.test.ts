import { describe, expect, it } from 'vitest'

import {
  AMETHYST_CUSTOMER_SITE_TEMPLATE,
  DEFAULT_AMETHYST_APPEARANCE_PRESET,
  applyAmethystAppearancePreset,
  getAmethystAppearancePreset,
  normalizeAmethystAppearancePreset,
  normalizeCustomerSiteTemplate,
} from '@/lib/amethyst/appearance-presets'
import {
  buildAmethystHomepageTweakDefaults,
  defaultAmethystHomepageTemplateData,
} from '@/lib/amethyst/homepage-template-data'
import {
  buildAmethystJoinTweakDefaults,
  defaultAmethystJoinTemplateData,
} from '@/lib/amethyst/join-template-data'
import {
  buildAmethystTradeTweakDefaults,
  defaultAmethystTradeTemplateData,
} from '@/lib/amethyst/trade-template-data'

describe('Amethyst appearance presets', () => {
  it('locks the customer-site template to Amethyst and defaults appearance to Amethyst', () => {
    expect(AMETHYST_CUSTOMER_SITE_TEMPLATE).toBe('amethyst')
    expect(DEFAULT_AMETHYST_APPEARANCE_PRESET).toBe('amethyst')
    expect(normalizeCustomerSiteTemplate(undefined)).toBe('amethyst')
    expect(normalizeCustomerSiteTemplate('unknown-template')).toBe('amethyst')
    expect(normalizeAmethystAppearancePreset(undefined)).toBe('amethyst')
    expect(normalizeAmethystAppearancePreset('not-real')).toBe('amethyst')
  })

  it('applies one approved appearance preset across Homepage, Trade, and Join without changing flows', () => {
    const preset = getAmethystAppearancePreset('softGlam')
    const homepage = applyAmethystAppearancePreset(
      buildAmethystHomepageTweakDefaults(defaultAmethystHomepageTemplateData),
      preset.id,
    )
    const trade = applyAmethystAppearancePreset(
      buildAmethystTradeTweakDefaults(defaultAmethystTradeTemplateData),
      preset.id,
    )
    const join = applyAmethystAppearancePreset(
      buildAmethystJoinTweakDefaults(defaultAmethystJoinTemplateData),
      preset.id,
    )

    expect(homepage).toMatchObject({
      preset: 'softGlam',
      primaryColor: '#480DDF',
      accentColor: '#D209E3',
      bgTone: 'lavender',
      bgTreatment: 'mesh',
    })
    expect(trade).toMatchObject({
      preset: 'softGlam',
      primaryColor: '#480DDF',
      accentColor: '#D209E3',
      bgTone: 'lavender',
      bgTreatment: 'mesh',
    })
    expect(join).toMatchObject({
      preset: 'softGlam',
      primaryColor: '#480DDF',
      accentColor: '#D209E3',
      bgTone: 'lavender',
      bgTreatment: 'mesh',
    })

    expect(homepage.showNicNac).toBe(true)
    expect(trade.showNicNac).toBe(true)
    expect(join.showNicNac).toBe(true)
    expect(defaultAmethystHomepageTemplateData.footerLinks.tradeBoard).toBe(
      '/amethyst/Trade.html',
    )
    expect(defaultAmethystJoinTemplateData.footerLinks.home).toBe(
      '/amethyst/Homepage.html',
    )
    expect(defaultAmethystTradeTemplateData.footerLinks.joinTeam).toBe(
      '/amethyst/Join.html',
    )
  })
})
