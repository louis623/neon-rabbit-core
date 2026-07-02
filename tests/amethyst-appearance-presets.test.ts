import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  AMETHYST_APPEARANCE_PRESET_IDS,
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
import {
  AMETHYST_SKIN_CARDS,
  getAmethystSkinCard,
  normalizeAmethystSkinSelection,
} from '@/lib/amethyst/skin-cards'

describe('Amethyst appearance presets', () => {
  it('locks the customer-site template to Amethyst and defaults appearance to Sparkle Suite/Morganite', () => {
    expect(AMETHYST_CUSTOMER_SITE_TEMPLATE).toBe('amethyst')
    expect(DEFAULT_AMETHYST_APPEARANCE_PRESET).toBe('sparkle_suite_morganite')
    expect(normalizeCustomerSiteTemplate(undefined)).toBe('amethyst')
    expect(normalizeCustomerSiteTemplate('unknown-template')).toBe('amethyst')
    expect(normalizeAmethystAppearancePreset(undefined)).toBe(
      'sparkle_suite_morganite',
    )
    expect(normalizeAmethystAppearancePreset('not-real')).toBe(
      'sparkle_suite_morganite',
    )
    expect(
      buildAmethystHomepageTweakDefaults(defaultAmethystHomepageTemplateData)
        .preset,
    ).toBe('sparkle_suite_morganite')
    expect(
      buildAmethystTradeTweakDefaults(defaultAmethystTradeTemplateData).preset,
    ).toBe('sparkle_suite_morganite')
    expect(
      buildAmethystJoinTweakDefaults(defaultAmethystJoinTemplateData).preset,
    ).toBe('sparkle_suite_morganite')
  })

  it('keeps only the approved customer-site skin IDs selectable', () => {
    expect(AMETHYST_APPEARANCE_PRESET_IDS).toEqual([
      'amethyst',
      'sparkle_suite_morganite',
      'black_diamond',
      'moonstone',
      'alpine_opal',
      'rose_gold',
      'garnet',
      'amber',
      'velvet',
      'rose_quartz',
    ])
    expect(AMETHYST_SKIN_CARDS.map((skin) => skin.label)).toEqual([
      'Amethyst',
      'Sparkle Suite/Morganite',
      'Black Diamond',
      'Moonstone',
      'Alpine Opal',
      'Rose Gold',
      'Garnet',
      'Amber',
      'Velvet',
      'Rose Quartz',
    ])

    for (const legacyPreset of [
      'editorial',
      'softGlam',
      'sparkleParty',
      'maximum',
      'ED-01',
      'SG-01',
      'SP-01',
      'MX-01',
      'Editorial',
      'Soft Glam',
      'Sparkle Party',
      'Maximum',
    ]) {
      expect(normalizeAmethystAppearancePreset(legacyPreset)).toBe(
        'sparkle_suite_morganite',
      )
      expect(normalizeAmethystSkinSelection(legacyPreset)).toBe(
        'sparkle_suite_morganite',
      )
    }
  })

  it('applies one approved appearance preset across Homepage, Trade, and Join without changing flows', () => {
    const preset = getAmethystAppearancePreset('rose_gold')
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
      preset: 'rose_gold',
      primaryColor: '#e04f73',
      accentColor: '#f5c66d',
      bgTone: 'roseGold',
      bgTreatment: 'rose-gold-paper',
    })
    expect(trade).toMatchObject({
      preset: 'rose_gold',
      primaryColor: '#e04f73',
      accentColor: '#f5c66d',
      bgTone: 'roseGold',
      bgTreatment: 'rose-gold-paper',
    })
    expect(join).toMatchObject({
      preset: 'rose_gold',
      primaryColor: '#e04f73',
      accentColor: '#f5c66d',
      bgTone: 'roseGold',
      bgTreatment: 'rose-gold-paper',
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

  it('adds Sparkle Suite/Morganite as a visual-only Amethyst skin with a browsing card', () => {
    const preset = getAmethystAppearancePreset('sparkle_suite_morganite')
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
    const card = getAmethystSkinCard('sparkle_suite_morganite')
    const expectedTokens = {
      preset: 'sparkle_suite_morganite',
      primaryColor: '#ee2c9b',
      accentColor: '#ff4cae',
      bgTone: 'suiteBlush',
      headingFont: 'playfair',
      bgTreatment: 'suite-paper',
      cardSurface: 'warm-paper',
      buttonEnergy: 'suite-lift',
    }

    expect(normalizeAmethystAppearancePreset('sparkle_suite_morganite')).toBe(
      'sparkle_suite_morganite',
    )
    expect(preset.label).toBe('Sparkle Suite/Morganite')
    expect(homepage).toMatchObject(expectedTokens)
    expect(trade).toMatchObject(expectedTokens)
    expect(join).toMatchObject(expectedTokens)

    expect(homepage.showNicNac).toBe(true)
    expect(defaultAmethystHomepageTemplateData.footerLinks.tradeBoard).toBe(
      '/amethyst/Trade.html',
    )
    expect(card).toMatchObject({
      id: 'sparkle_suite_morganite',
      code: 'SS-01',
      label: 'Sparkle Suite/Morganite',
      headingFont: 'Playfair Display',
      bodyFont: 'DM Sans',
    })
    expect(card.swatches.map((swatch) => swatch.value)).toContain('#ee2c9b')
    expect(normalizeAmethystSkinSelection('SS-01')).toBe(
      'sparkle_suite_morganite',
    )
    expect(normalizeAmethystSkinSelection('Sparkle Suite/Morganite')).toBe(
      'sparkle_suite_morganite',
    )
    expect(getAmethystSkinCard('amethyst').code).toBe('AM-01')
    expect(AMETHYST_SKIN_CARDS.length).toBeGreaterThanOrEqual(2)
  })

  it('adds Black Diamond as a visual-only Amethyst skin with a browsing card', () => {
    const preset = getAmethystAppearancePreset('black_diamond')
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
    const card = getAmethystSkinCard('black_diamond')
    const expectedTokens = {
      preset: 'black_diamond',
      primaryColor: '#d4af37',
      accentColor: '#00d9ff',
      bgTone: 'blackDiamond',
      headingFont: 'playfair',
      bgTreatment: 'black-velvet',
      cardSurface: 'dark-metallic',
      buttonEnergy: 'diamond-lift',
      tradeFlair: 'cyan-diamond',
    }

    expect(normalizeAmethystAppearancePreset('black_diamond')).toBe(
      'black_diamond',
    )
    expect(preset.label).toBe('Black Diamond')
    expect(homepage).toMatchObject(expectedTokens)
    expect(trade).toMatchObject(expectedTokens)
    expect(join).toMatchObject(expectedTokens)
    expect(homepage.showNicNac).toBe(true)
    expect(defaultAmethystHomepageTemplateData.footerLinks.tradeBoard).toBe(
      '/amethyst/Trade.html',
    )
    expect(card).toMatchObject({
      id: 'black_diamond',
      code: 'BD-01',
      label: 'Black Diamond',
      headingFont: 'Playfair Display',
      bodyFont: 'DM Sans',
    })
    expect(card.swatches.map((swatch) => swatch.value)).toEqual(
      expect.arrayContaining(['#080808', '#d4af37', '#f4c2c2', '#00d9ff']),
    )
    expect(normalizeAmethystSkinSelection('BD-01')).toBe('black_diamond')
    expect(normalizeAmethystSkinSelection('Black Diamond')).toBe(
      'black_diamond',
    )
  })

  it('keeps Black Diamond public controls readable on homepage and trade pages', () => {
    const homepageCss = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.css'),
      'utf8',
    )
    const tradeCss = readFileSync(
      resolve(process.cwd(), 'public/amethyst/trade.css'),
      'utf8',
    )

    expect(homepageCss).toContain(
      'body.bg-black-velvet .hp-step-num',
    )
    expect(homepageCss).toContain(
      'body.bg-black-velvet .hp-video-play',
    )
    expect(homepageCss).toContain('color: #080808')
    expect(homepageCss).toContain('color: #00d9ff')
    expect(tradeCss).toContain(
      'body.bg-black-velvet .tp-filter-pill.active',
    )
    expect(tradeCss).toContain('color: #080808')
  })

  it('keeps light-accent public badges and active filters readable', () => {
    const homepageCss = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.css'),
      'utf8',
    )
    const tradeCss = readFileSync(
      resolve(process.cwd(), 'public/amethyst/trade.css'),
      'utf8',
    )

    for (const bgClass of [
      'body.bg-suite-paper',
      'body.bg-rose-gold-paper',
      'body.bg-amber-paper',
      'body.bg-quartz-paper',
    ]) {
      expect(homepageCss).toContain(`${bgClass} .hp-step-num`)
    }

    for (const bgClass of [
      'body.bg-suite-paper',
      'body.bg-rose-gold-paper',
      'body.bg-amber-paper',
      'body.bg-quartz-paper',
    ]) {
      expect(tradeCss).toContain(`${bgClass} .tp-filter-pill.active`)
    }

    expect(homepageCss).toContain('color: #141111')
    expect(tradeCss).toContain('.tp-filter-pill.active .count')
    expect(tradeCss).toContain('color: currentColor')
  })

  it('adds Rose Gold as a visual-only Amethyst skin with a browsing card', () => {
    const preset = getAmethystAppearancePreset('rose_gold')
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
    const card = getAmethystSkinCard('rose_gold')
    const expectedTokens = {
      preset: 'rose_gold',
      primaryColor: '#e04f73',
      accentColor: '#f5c66d',
      bgTone: 'roseGold',
      headingFont: 'playfair',
      bgTreatment: 'rose-gold-paper',
      cardSurface: 'pearl-rose',
      buttonEnergy: 'rose-gold-lift',
      tradeFlair: 'champagne-rose',
    }

    expect(normalizeAmethystAppearancePreset('rose_gold')).toBe('rose_gold')
    expect(preset.label).toBe('Rose Gold')
    expect(homepage).toMatchObject(expectedTokens)
    expect(trade).toMatchObject(expectedTokens)
    expect(join).toMatchObject(expectedTokens)
    expect(homepage.showNicNac).toBe(true)
    expect(defaultAmethystHomepageTemplateData.footerLinks.tradeBoard).toBe(
      '/amethyst/Trade.html',
    )
    expect(card).toMatchObject({
      id: 'rose_gold',
      code: 'RG-01',
      label: 'Rose Gold',
      headingFont: 'Playfair Display',
      bodyFont: 'DM Sans',
    })
    expect(card.swatches.map((swatch) => swatch.value)).toEqual(
      expect.arrayContaining(['#fff5f6', '#e04f73', '#f9a8d4', '#f5c66d']),
    )
    expect(normalizeAmethystSkinSelection('RG-01')).toBe('rose_gold')
    expect(normalizeAmethystSkinSelection('Rose Gold')).toBe('rose_gold')
  })

  it('adds Moonstone as a visual-only Amethyst skin with a browsing card', () => {
    const preset = getAmethystAppearancePreset('moonstone')
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
    const card = getAmethystSkinCard('moonstone')
    const expectedTokens = {
      preset: 'moonstone',
      primaryColor: '#7c3aed',
      accentColor: '#cbd5e1',
      bgTone: 'moonstone',
      headingFont: 'playfair',
      bgTreatment: 'moonstone-charcoal',
      cardSurface: 'silver-pearl',
      buttonEnergy: 'moonstone-lift',
      tradeFlair: 'silver-violet',
    }

    expect(normalizeAmethystAppearancePreset('moonstone')).toBe('moonstone')
    expect(preset.label).toBe('Moonstone')
    expect(homepage).toMatchObject(expectedTokens)
    expect(trade).toMatchObject(expectedTokens)
    expect(join).toMatchObject(expectedTokens)
    expect(card).toMatchObject({
      id: 'moonstone',
      code: 'MS-01',
      label: 'Moonstone',
      headingFont: 'Playfair Display',
      bodyFont: 'DM Sans',
    })
    expect(card.swatches.map((swatch) => swatch.value)).toEqual(
      expect.arrayContaining(['#15121d', '#7c3aed', '#cbd5e1']),
    )
    expect(normalizeAmethystSkinSelection('MS-01')).toBe('moonstone')
    expect(normalizeAmethystSkinSelection('Moonstone')).toBe('moonstone')
  })

  it('adds Alpine Opal as a visual-only Amethyst skin with a browsing card', () => {
    const preset = getAmethystAppearancePreset('alpine_opal')
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
    const card = getAmethystSkinCard('alpine_opal')
    const expectedTokens = {
      preset: 'alpine_opal',
      primaryColor: '#ec4899',
      accentColor: '#38bdf8',
      bgTone: 'alpineOpal',
      headingFont: 'playfair',
      bgTreatment: 'alpine-opal',
      cardSurface: 'frosted-opal',
      buttonEnergy: 'alpine-pop',
      tradeFlair: 'opal-summit',
    }

    expect(normalizeAmethystAppearancePreset('alpine_opal')).toBe('alpine_opal')
    expect(preset.label).toBe('Alpine Opal')
    expect(homepage).toMatchObject(expectedTokens)
    expect(trade).toMatchObject(expectedTokens)
    expect(join).toMatchObject(expectedTokens)
    expect(card).toMatchObject({
      id: 'alpine_opal',
      code: 'AO-01',
      label: 'Alpine Opal',
      headingFont: 'Playfair Display',
      bodyFont: 'DM Sans',
    })
    expect(card.swatches.map((swatch) => swatch.value)).toEqual(
      expect.arrayContaining(['#fdf2f8', '#ec4899', '#9333ea', '#38bdf8']),
    )
    expect(normalizeAmethystSkinSelection('AO-01')).toBe('alpine_opal')
    expect(normalizeAmethystSkinSelection('Alpine Opal')).toBe('alpine_opal')
  })

  it.each([
    {
      id: 'garnet',
      code: 'GN-01',
      label: 'Garnet',
      primaryColor: '#B91C1C',
      accentColor: '#920000',
      bgTone: 'garnet',
      headingFont: 'boska',
      bodyFont: 'switzer',
      bgTreatment: 'garnet-shell',
      cardSurface: 'blush-shell',
      buttonEnergy: 'garnet-lift',
      tradeFlair: 'ruby-polish',
    },
    {
      id: 'amber',
      code: 'AB-01',
      label: 'Amber',
      primaryColor: '#F97316',
      accentColor: '#761A00',
      bgTone: 'amber',
      headingFont: 'melodrama',
      bodyFont: 'nunito',
      bgTreatment: 'amber-paper',
      cardSurface: 'sunlit-pearl',
      buttonEnergy: 'amber-pop',
      tradeFlair: 'citrine-glow',
    },
    {
      id: 'velvet',
      code: 'VE-01',
      label: 'Velvet',
      primaryColor: '#9333EA',
      accentColor: '#6300B9',
      bgTone: 'velvet',
      headingFont: 'bitter',
      bodyFont: 'archivo',
      bgTreatment: 'velvet-orchid',
      cardSurface: 'plush-orchid',
      buttonEnergy: 'velvet-lift',
      tradeFlair: 'orchid-gloss',
    },
    {
      id: 'rose_quartz',
      code: 'RQ-01',
      label: 'Rose Quartz',
      primaryColor: '#E879F9',
      accentColor: '#63146E',
      bgTone: 'roseQuartz',
      headingFont: 'sharpie',
      bodyFont: 'ranade',
      bgTreatment: 'quartz-paper',
      cardSurface: 'pink-quartz',
      buttonEnergy: 'quartz-pop',
      tradeFlair: 'pink-spark',
    },
  ] as const)(
    'adds $label as a visual-only Amethyst skin with a browsing card',
    (skin) => {
      const preset = getAmethystAppearancePreset(skin.id)
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
      const card = getAmethystSkinCard(skin.id)
      const expectedTokens = {
        preset: skin.id,
        primaryColor: skin.primaryColor,
        accentColor: skin.accentColor,
        bgTone: skin.bgTone,
        headingFont: skin.headingFont,
        bgTreatment: skin.bgTreatment,
        cardSurface: skin.cardSurface,
        buttonEnergy: skin.buttonEnergy,
        tradeFlair: skin.tradeFlair,
      }

      expect(normalizeAmethystAppearancePreset(skin.id)).toBe(skin.id)
      expect(preset.label).toBe(skin.label)
      expect(homepage).toMatchObject(expectedTokens)
      expect(trade).toMatchObject(expectedTokens)
      expect(join).toMatchObject(expectedTokens)
      expect(homepage.showNicNac).toBe(true)
      expect(defaultAmethystHomepageTemplateData.footerLinks.tradeBoard).toBe(
        '/amethyst/Trade.html',
      )
      expect(card).toMatchObject({
        id: skin.id,
        code: skin.code,
        label: skin.label,
      })
      expect(normalizeAmethystSkinSelection(skin.code)).toBe(skin.id)
      expect(normalizeAmethystSkinSelection(skin.label)).toBe(skin.id)
    },
  )
})
