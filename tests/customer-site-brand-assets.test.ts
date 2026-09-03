import { describe, expect, it } from 'vitest'

import {
  getCustomerSiteMark,
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

  it('keeps the share card tied to the selected customer-site skin', () => {
    expect(getCustomerSiteSharePalette('sparkle_suite_morganite')).toMatchObject({
      background: '#5b1e3b',
      accent: '#ee2c9b',
    })
    expect(getCustomerSiteSharePalette('emerald_garden')).toMatchObject({
      background: '#123c35',
      accent: '#059669',
    })
    expect(getCustomerSiteSharePalette('rose_gold')).toMatchObject({
      background: '#54202f',
      accent: '#e04f73',
    })
  })
})
