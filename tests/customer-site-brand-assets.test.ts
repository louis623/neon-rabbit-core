import { describe, expect, it } from 'vitest'

import {
  getCustomerSiteMark,
  getCustomerSiteSharePalette,
} from '@/lib/amethyst/customer-site-brand-assets'

describe('customer-site brand assets', () => {
  it('uses the representative business initial for a stable mark', () => {
    expect(getCustomerSiteMark("Bri's Glowtique", 'Brianna')).toBe('B')
    expect(getCustomerSiteMark('  ', 'Avery')).toBe('A')
  })

  it('keeps the share card tied to the selected customer-site skin', () => {
    expect(getCustomerSiteSharePalette('emerald_garden')).toMatchObject({
      background: '#123c35',
      accent: '#059669',
    })
    expect(getCustomerSiteSharePalette('rose_gold').accent).toBe('#e04f73')
  })
})
