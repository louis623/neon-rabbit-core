import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  AMETHYST_APPEARANCE_PRESET_IDS,
  DEFAULT_AMETHYST_APPEARANCE_PRESET,
  getAmethystAppearancePreset,
  normalizeAmethystAppearancePreset,
  normalizeCustomerSiteTemplate,
} from '@/lib/amethyst/appearance-presets'
import {
  AMETHYST_SKIN_CARDS,
  getAmethystSkinCard,
  normalizeAmethystSkinSelection,
} from '@/lib/amethyst/skin-cards'
import { buildAmethystHomepageTweakDefaults, defaultAmethystHomepageTemplateData } from '@/lib/amethyst/homepage-template-data'
import { buildAmethystTradeTweakDefaults, defaultAmethystTradeTemplateData } from '@/lib/amethyst/trade-template-data'
import { buildAmethystJoinTweakDefaults, defaultAmethystJoinTemplateData } from '@/lib/amethyst/join-template-data'

describe('Enchanted Gnome Garden registry and data contract', () => {
  it('recognizes the approved preset while preserving the template and Morganite fallback', () => {
    expect(normalizeAmethystAppearancePreset('gnome_garden')).toBe('gnome_garden')
    expect(normalizeCustomerSiteTemplate('gnome_garden')).toBe('amethyst')
    expect(DEFAULT_AMETHYST_APPEARANCE_PRESET).toBe('sparkle_suite_morganite')
    for (const value of [undefined, null, '', 'not_a_skin']) {
      expect(normalizeAmethystAppearancePreset(value)).toBe('sparkle_suite_morganite')
    }
  })

  it('resolves its browse code, complete name, and natural short name to the same saved preset', () => {
    for (const value of ['gnome_garden', 'GG-01', ' gg-01 ', 'Enchanted Gnome Garden', 'enchanted gnome garden', 'Gnome Garden']) {
      expect(normalizeAmethystSkinSelection(value)).toBe('gnome_garden')
    }
    const card = getAmethystSkinCard('gnome_garden')
    expect(card).toMatchObject({ id: 'gnome_garden', code: 'GG-01', label: 'Enchanted Gnome Garden', headingFont: 'Playfair Display', bodyFont: 'DM Sans' })
    expect(card.swatches.map(({ value }) => value)).toEqual(expect.arrayContaining(['#173126', '#FFF3D6', '#F4C45E', '#842421']))
    expect(new Set(AMETHYST_SKIN_CARDS.map(({ code }) => code)).size).toBe(AMETHYST_SKIN_CARDS.length)
  })

  it('propagates one visual token set through the three real template builders without changing their content or flow defaults', () => {
    const preset = getAmethystAppearancePreset('gnome_garden')
    expect(preset.values).toMatchObject({
      primaryColor: '#842421', accentColor: '#F4C45E', bgTone: 'gnomeGarden',
      headingFont: 'playfair', bodyFont: 'dmSans', bgTreatment: 'gnome-garden',
      cardSurface: 'storybook-parchment', buttonEnergy: 'lantern-lift',
      tradeFlair: 'mushroom-glow', textureOverlay: 'fireflies', cursorEffect: 'default', tickerSpeed: 1,
    })
    const pages = [
      [buildAmethystHomepageTweakDefaults(defaultAmethystHomepageTemplateData), buildAmethystHomepageTweakDefaults(defaultAmethystHomepageTemplateData, 'gnome_garden')],
      [buildAmethystTradeTweakDefaults(defaultAmethystTradeTemplateData), buildAmethystTradeTweakDefaults(defaultAmethystTradeTemplateData, 'gnome_garden')],
      [buildAmethystJoinTweakDefaults(defaultAmethystJoinTemplateData), buildAmethystJoinTweakDefaults(defaultAmethystJoinTemplateData, 'gnome_garden')],
    ]
    // Homepage may retain an explicitly saved hero motion; all shared visual tokens must agree.
    const sharedValues = Object.fromEntries(Object.entries(preset.values).filter(([key]) => key !== 'heroMotion'))
    for (const [before, after] of pages) {
      expect(after).toMatchObject({ ...sharedValues, preset: 'gnome_garden' })
      const visualKeys = new Set([...Object.keys(preset.values), 'preset'])
      const contentOnly = (value: object) => Object.fromEntries(Object.entries(value).filter(([key]) => !visualKeys.has(key)))
      expect(contentOnly(after)).toEqual(contentOnly(before))
    }
  })

  it('adds database acceptance without updating customers, defaults, or dropping legacy values', () => {
    const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/20260905090000_add_gnome_garden_appearance_preset.sql'), 'utf8')
    for (const id of [...AMETHYST_APPEARANCE_PRESET_IDS, 'pearl', 'luxe', 'ocean_sapphire']) {
      expect(migration).toContain(`'${id}'`)
    }
    expect(migration).toContain('site_settings_appearance_preset_check')
    expect(migration).not.toMatch(/\b(?:UPDATE|DELETE|INSERT|SET\s+DEFAULT)\b/i)
  })
})
