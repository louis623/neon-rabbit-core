import { describe, expect, it } from 'vitest'

import { formatCustomerAudienceCsv } from '@/lib/services/customer-audience'

describe('customer audience CSV export', () => {
  it('keeps the full rep-owned profile while safely escaping spreadsheet values', () => {
    const csv = formatCustomerAudienceCsv([
      {
        id: 'aud-1',
        name: '=HYPERLINK("https://example.com")',
        email: 'jamie@example.com',
        phone: '+15555550101',
        address: '101 Sparkle Way',
        birthday: '10-12',
        favoriteGemOrStone: 'Moonstone',
        favoriteMaterial: 'Gold',
        favoriteCut: 'Oval',
        favoriteCollection: 'Simply Studs',
        notes: 'Local pickup',
        tags: ['VIP', 'local'],
        smsConsent: true,
        emailConsent: false,
        marketingConsent: true,
        canReceiveSms: true,
        canReceiveEmail: false,
        consentDate: '2026-08-16T12:00:00Z',
        createdAt: '2026-08-16T12:00:00Z',
        smsOptedOutAt: null,
        emailOptedOutAt: null,
        stopKeywordReceivedAt: null,
      },
    ])

    expect(csv).toContain('Favorite Gem or Stone')
    expect(csv).toContain('SMS Reachable')
    expect(csv).toContain('"\'=HYPERLINK(""https://example.com"")"')
    expect(csv).toContain('"VIP, local"')
    expect(csv).toContain('"Yes","No","Yes","Yes","No"')
  })
})
