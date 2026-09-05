import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  getCustomerSiteMark,
  getCustomerSiteMarkAssetPath,
  getCustomerSiteMarkFontFamily,
  getCustomerSiteSharePalette,
  getCustomerSiteShareTagline,
} from '@/lib/amethyst/customer-site-brand-assets'

describe('customer-site brand assets', () => {
  it('uses the representative business initial for a stable mark', () => {
    expect(getCustomerSiteMark("Bri's Glowtique", 'Brianna')).toBe('B')
    expect(getCustomerSiteMark('  ', 'Avery')).toBe('A')
  })

  it('normalizes the legacy live-show welcome copy for sharing', () => {
    expect(getCustomerSiteShareTagline('Welcome to Kim Live Show site.')).toBe(
      "Welcome to Kim's Live Show Site.",
    )
    expect(getCustomerSiteShareTagline('Follow along for new reveals.')).toBe(
      'Follow along for new reveals.',
    )
  })

  it('uses the embedded display typeface for every compact mark', () => {
    expect(getCustomerSiteMarkFontFamily('theblingkitchen.com')).toBe(
      '"Playfair Display", Georgia, serif',
    )
    expect(getCustomerSiteMarkFontFamily('www.theblingkitchen.com')).toBe(
      '"Playfair Display", Georgia, serif',
    )
    expect(getCustomerSiteMarkFontFamily('brisglowtique.com')).toBe(
      '"Playfair Display", Georgia, serif',
    )
  })

  it('maps the approved Gnome Forest mark only to Kim\'s customer domain', () => {
    expect(getCustomerSiteMarkAssetPath('goforthebling.com')).toBe(
      '/customer-site-assets/goforthebling-gnome-forest-monogram-g.png',
    )
    expect(getCustomerSiteMarkAssetPath('www.goforthebling.com')).toBe(
      '/customer-site-assets/goforthebling-gnome-forest-monogram-g.png',
    )
    expect(getCustomerSiteMarkAssetPath('yoursparklesuite.com')).toBeNull()
    expect(getCustomerSiteMarkAssetPath('example.com')).toBeNull()
  })

  it('keeps the share card tied to the selected customer-site skin', () => {
    expect(getCustomerSiteSharePalette('sparkle_suite_morganite')).toMatchObject({
      background: '#5b1e3b',
      accent: '#ee2c9b',
    })
    expect(getCustomerSiteSharePalette('emerald_garden')).toMatchObject({
      background: '#123c35',
      accent: '#059669',
    })
    expect(getCustomerSiteSharePalette('gnome_garden')).toMatchObject({
      background: '#173a28',
      foreground: '#fff7dc',
      secondary: '#f4dfb4',
      accent: '#842421',
    })
    expect(getCustomerSiteSharePalette('rose_gold')).toMatchObject({
      background: '#54202f',
      accent: '#e04f73',
    })
  })

  it('builds the Gnome Forest share card from the approved skin artwork', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'app/opengraph-image.tsx'),
      'utf8',
    )

    expect(source).toContain("brand.preset === 'gnome_garden'")
    expect(source).toContain(
      '/customer-site-assets/goforthebling-gnome-forest-share-forest.jpg',
    )
    expect(source).toContain(
      '/customer-site-assets/goforthebling-gnome-forest-share-gnome.png',
    )
    expect(source).toContain(
      '/customer-site-assets/goforthebling-gnome-forest-share-lantern.png',
    )
    expect(source).toContain('Gnome Forest')
    expect(source).toContain('brand.heroTitle')
    expect(source).toContain('brand.heroSubtitle')
  })
})
