import { describe, expect, it, vi } from 'vitest'

import {
  defaultAmethystHomepageTemplateData,
} from '@/lib/amethyst/homepage-template-data'
import {
  defaultAmethystTradeTemplateData,
} from '@/lib/amethyst/trade-template-data'
import {
  defaultAmethystJoinTemplateData,
} from '@/lib/amethyst/join-template-data'
import {
  loadAmethystPreviewTemplateData,
  mapPreviewSettingsToHomepageTemplateData,
  mapPreviewSettingsToJoinTemplateData,
  mapPreviewSettingsToTradeTemplateData,
} from '@/lib/amethyst/preview-template-data'
import type { createAdminClient } from '@/lib/supabase/admin'
import type { SiteSettingsDashboardResult } from '@/lib/services/types'

const demoSettings: SiteSettingsDashboardResult = {
  displayName: 'Launch Demo Rep',
  businessName: 'Sparkle Suite Demo Boutique',
  email: 'demo@example.com',
  phone: '',
  bannerText: 'Demo launch week',
  bannerVisible: true,
  tickerText: 'New demo listings added before every live show.',
  tickerVisible: true,
  tagline: 'Sparkle picks, trade board favorites, and show-night fizz.',
  heroImageUrl: '',
  heroAnimationType: 'zoom',
  teamName: 'Sparkle Demo Circle',
  showJoinPage: true,
  customerSiteTemplate: 'amethyst',
  appearancePreset: 'softGlam',
  socialHandles: {
    tiktok: '@sparklesuitedemo',
    instagram: '@sparklesuitedemo',
    facebook: 'sparklesuitedemo',
  },
}

const repExtras = {
  shopLink: 'https://www.bombparty.com/shop/sparkle-suite-demo',
  streamingLinks: {
    tiktok: 'https://www.tiktok.com/@sparklesuitedemo',
    facebook: 'https://www.facebook.com/sparklesuitedemo',
  },
}

describe('Amethyst preview template data', () => {
  it('maps connected demo settings into homepage data', () => {
    const data = mapPreviewSettingsToHomepageTemplateData(
      demoSettings,
      repExtras,
    )

    expect(data.repName).toBe('Launch Demo Rep')
    expect(data.businessName).toBe('Sparkle Suite Demo Boutique')
    expect(data.teamName).toBe('Sparkle Demo Circle')
    expect(data.tagline).toBe(
      'Sparkle picks, trade board favorites, and show-night fizz.',
    )
    expect(data.tickerTopText).toBe(
      'Demo launch week | New demo listings added before every live show.',
    )
    expect(data.streamLinks.shop).toBe(
      'https://www.bombparty.com/shop/sparkle-suite-demo',
    )
    expect(data.streamLinks.tiktok).toBe(
      'https://www.tiktok.com/@sparklesuitedemo',
    )
    expect(data.legalDisclaimer).toContain('Sparkle Suite Demo Boutique')
  })

  it('maps connected demo settings into trade and join data', () => {
    const trade = mapPreviewSettingsToTradeTemplateData(
      demoSettings,
      repExtras,
    )
    const join = mapPreviewSettingsToJoinTemplateData(demoSettings, repExtras)

    expect(trade.repName).toBe('Launch Demo Rep')
    expect(trade.businessName).toBe('Sparkle Suite Demo Boutique')
    expect(trade.shopUrl).toBe(
      'https://www.bombparty.com/shop/sparkle-suite-demo',
    )
    expect(trade.tickerTopText).toContain('New demo listings')
    expect(join.repName).toBe('Launch Demo Rep')
    expect(join.businessName).toBe('Sparkle Suite Demo Boutique')
    expect(join.teamName).toBe('Sparkle Demo Circle')
    expect(join.bpReferralUrl).toBe(
      'https://www.bombparty.com/shop/sparkle-suite-demo',
    )
  })

  it('returns defaults when Supabase env is missing', async () => {
    const data = await loadAmethystPreviewTemplateData({
      env: {},
      dependencies: {
        createAdminClient: vi.fn(),
      },
    })

    expect(data.appearancePreset).toBe('amethyst')
    expect(data.homepage).toBe(defaultAmethystHomepageTemplateData)
    expect(data.trade).toBe(defaultAmethystTradeTemplateData)
    expect(data.join).toBe(defaultAmethystJoinTemplateData)
  })

  it('passes an explicit customer rep target into the resolver', async () => {
    const createAdminClientMock = vi.fn(() => ({ from: vi.fn() }))
    const resolveAmethystPreviewRep = vi.fn(async () => ({
      id: 'rep-target',
      email: 'target@example.com',
      shop_link: 'https://example.com/shop',
      streaming_links: {},
    }))
    const getSiteSettingsDashboard = vi.fn(async () => demoSettings)

    const data = await loadAmethystPreviewTemplateData({
      repId: 'rep-target',
      env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
      },
      dependencies: {
        createAdminClient:
          createAdminClientMock as unknown as typeof createAdminClient,
        resolveAmethystPreviewRep,
        getSiteSettingsDashboard,
      },
    })

    expect(resolveAmethystPreviewRep).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        repId: 'rep-target',
        select: 'id, email, shop_link, streaming_links',
      }),
    )
    expect(data.homepage.joinTeamUrl).toBe('/amethyst/Join.html?c=rep-target')
    expect(data.homepage.footerLinks.tradeBoard).toBe(
      '/amethyst/Trade.html?c=rep-target',
    )
    expect(data.appearancePreset).toBe('softGlam')
    expect(data.trade.footerLinks.home).toBe(
      '/amethyst/Homepage.html?c=rep-target',
    )
    expect(data.join.footerLinks.tradeBoard).toBe(
      '/amethyst/Trade.html?c=rep-target',
    )
  })

  it('falls back to defaults when lookup fails', async () => {
    const data = await loadAmethystPreviewTemplateData({
      env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
      },
      dependencies: {
        createAdminClient: vi.fn(() => ({})) as unknown as typeof createAdminClient,
        resolveAmethystPreviewRep: vi.fn(async () => {
          throw new Error('lookup failed')
        }),
      },
    })

    expect(data.appearancePreset).toBe('amethyst')
    expect(data.homepage).toBe(defaultAmethystHomepageTemplateData)
    expect(data.trade).toBe(defaultAmethystTradeTemplateData)
    expect(data.join).toBe(defaultAmethystJoinTemplateData)
  })
})
