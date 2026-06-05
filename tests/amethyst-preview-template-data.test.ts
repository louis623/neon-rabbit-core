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
import { AMETHYST_APPEARANCE_PRESET_IDS } from '@/lib/amethyst/appearance-presets'
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
  appearancePreset: 'sparkle_suite_morganite',
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
  it('uses one polished demo identity when preview data cannot load', async () => {
    const data = await loadAmethystPreviewTemplateData({
      env: {},
      dependencies: {
        createAdminClient: vi.fn(),
      },
    })
    const serialized = JSON.stringify(data)

    expect(data.homepage.repName).toBe('Sasha Rivera')
    expect(data.homepage.businessName).toBe('Sparkle by Sasha')
    expect(data.trade.repName).toBe('Sasha Rivera')
    expect(data.trade.businessName).toBe('Sparkle by Sasha')
    expect(data.join.repName).toBe('Sasha Rivera')
    expect(data.join.businessName).toBe('Sparkle by Sasha')
    expect(data.join.teamName).toBe('Sparkle by Sasha')
    expect(serialized).not.toMatch(/\b(?:Rep Name|Show Name)\b/)
  })

  it('normalizes legacy placeholder demo settings to the shared demo identity', () => {
    const legacySettings: SiteSettingsDashboardResult = {
      ...demoSettings,
      displayName: 'Jane',
      businessName: "Jane's Sparkle Party",
      teamName: "Jane's Sparkle Party",
      tagline:
        "Give customers one polished place to see Jane's next live, join updates, and browse trade-friendly Sparkle Suite links.",
      bannerText: "Welcome to Jane's Sparkle Party",
      tickerText: '',
      tickerVisible: false,
    }

    const homepage = mapPreviewSettingsToHomepageTemplateData(legacySettings)
    const trade = mapPreviewSettingsToTradeTemplateData(legacySettings)
    const join = mapPreviewSettingsToJoinTemplateData(legacySettings)
    const serialized = JSON.stringify({ homepage, trade, join })

    expect(homepage.repName).toBe('Sasha Rivera')
    expect(homepage.businessName).toBe('Sparkle by Sasha')
    expect(trade.repName).toBe('Sasha Rivera')
    expect(trade.businessName).toBe('Sparkle by Sasha')
    expect(join.repName).toBe('Sasha Rivera')
    expect(join.businessName).toBe('Sparkle by Sasha')
    expect(join.teamName).toBe('Sparkle by Sasha')
    expect(serialized).not.toContain('Jane')
    expect(serialized).not.toMatch(/\b(?:Rep Name|Show Name)\b/)
  })

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

    expect(data.appearancePreset).toBe('sparkle_suite_morganite')
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
    expect(data.appearancePreset).toBe('sparkle_suite_morganite')
    expect(data.trade.footerLinks.home).toBe(
      '/amethyst/Homepage.html?c=rep-target',
    )
    expect(data.join.footerLinks.tradeBoard).toBe(
      '/amethyst/Trade.html?c=rep-target',
    )
  })

  it('overlays required setup draft copy onto the targeted customer-site preview', async () => {
    const data = await loadAmethystPreviewTemplateData({
      repId: 'rep-gracie',
      env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
      },
      dependencies: {
        createAdminClient: vi.fn(() => ({ from: vi.fn() })) as unknown as typeof createAdminClient,
        resolveAmethystPreviewRep: vi.fn(async () => ({
          id: 'rep-gracie',
          email: 'smoke.rep@example.com',
          shop_link: null,
          streaming_links: {},
        })),
        getSiteSettingsDashboard: vi.fn(async () => ({
          ...demoSettings,
          displayName: 'Gracie Smoke',
          businessName: 'Gracie Smoke',
          bannerText: 'Welcome to Gracie Smoke',
          tagline: 'A polished place to shop Gracie Smoke.',
          teamName: 'Gracie Smoke',
        })),
        getRequiredSetupState: vi.fn(async () => ({
          id: 'setup-gracie',
          repId: 'rep-gracie',
          status: 'required_setup',
          currentStep: 'final_preview_approval',
          completedSteps: [],
          steps: [],
          answers: {
            account_basics: {
              conversationName: 'Gracie Smoke',
              customerFacingDisplayName: "Gracie's Sparkle Party",
              liveShowName: "Gracie's Sparkle Party Live",
              bestContactEmail: 'smoke.rep@example.com',
              bombPartyRepStoreLink: 'https://bombparty.com/graciesmoke',
              primaryLiveShowOrSocialLink:
                'https://www.tiktok.com/@graciessparkleparty',
            },
            site_skin: {
              selectedLookCode: 'RQ-01',
            },
            welcome_copy: {
              headline: "Welcome to Gracie's Sparkle Party.",
              supportingLine:
                'Join me for fun jewelry reveals, friendly live shows, and sparkle you can shop anytime.',
            },
            about_page: {
              selectedAboutCopy:
                "Welcome to Gracie's Sparkle Party. I believe jewelry should make you smile, and every customer should feel seen.",
            },
            show_schedule: {
              scheduleSummary:
                'Tuesdays and Thursdays at 7 PM Mountain Time, with occasional Saturday pop-up shows announced on TikTok.',
            },
          },
          generatedCopy: {},
          supportState: {},
          dashboardUnlockedAt: null,
          createdAt: '2026-06-04T18:00:00Z',
          updatedAt: '2026-06-04T18:30:00Z',
          nextStep: 'final_preview_approval',
          canUnlockDashboard: false,
        })),
      },
    })

    expect(data.appearancePreset).toBe('rose_quartz')
    expect(data.homepage.businessName).toBe("Gracie's Sparkle Party")
    expect(data.homepage.teamName).toBe("Gracie's Sparkle Party Live")
    expect(data.homepage.heroHeadline).toBe("Welcome to Gracie's Sparkle Party.")
    expect(data.homepage.heroSub).toBe(
      'Join me for fun jewelry reveals, friendly live shows, and sparkle you can shop anytime.',
    )
    expect(data.homepage.aboutParagraphs[0]).toContain(
      "Welcome to Gracie's Sparkle Party",
    )
    expect(data.homepage.aboutParagraphs[2]).toContain(
      'Tuesdays and Thursdays at 7 PM Mountain Time',
    )
    expect(data.homepage.streamLinks.shop).toBe(
      'https://bombparty.com/graciesmoke',
    )
    expect(data.homepage.streamLinks.tiktok).toBe(
      'https://www.tiktok.com/@graciessparkleparty',
    )
    expect(JSON.stringify(data.homepage)).not.toContain('A polished place to shop Gracie Smoke.')
  })

  it('maps Nic-Nac welcome subheadline and schedule answer aliases into preview data', async () => {
    const data = await loadAmethystPreviewTemplateData({
      repId: 'rep-aliases',
      env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
      },
      dependencies: {
        createAdminClient: vi.fn(() => ({ from: vi.fn() })) as unknown as typeof createAdminClient,
        resolveAmethystPreviewRep: vi.fn(async () => ({
          id: 'rep-aliases',
          email: 'aliases@example.com',
          shop_link: null,
          streaming_links: {},
        })),
        getSiteSettingsDashboard: vi.fn(async () => ({
          ...demoSettings,
          displayName: 'Alias Smoke',
          businessName: 'Alias Smoke Sparkle',
          teamName: 'Alias Smoke Sparkle',
        })),
        getRequiredSetupState: vi.fn(async () => ({
          id: 'setup-aliases',
          repId: 'rep-aliases',
          status: 'required_setup',
          currentStep: 'final_preview_approval',
          completedSteps: [],
          steps: [],
          answers: {
            welcome_copy: {
              subheadline: 'The exact saved subheadline.',
            },
            show_schedule: {
              answer: 'The exact saved schedule.',
            },
          },
          generatedCopy: {},
          supportState: {},
          dashboardUnlockedAt: null,
          createdAt: null,
          updatedAt: null,
          nextStep: 'final_preview_approval',
          canUnlockDashboard: false,
        })),
      },
    })

    expect(data.homepage.heroSub).toBe('The exact saved subheadline.')
    expect(data.homepage.aboutParagraphs[2]).toContain(
      'The exact saved schedule.',
    )
  })

  it.each(AMETHYST_APPEARANCE_PRESET_IDS)(
    'keeps required setup copy independent from the %s Look',
    async (appearancePreset) => {
      const data = await loadAmethystPreviewTemplateData({
        repId: `rep-${appearancePreset}`,
        env: {
          NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
          SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
        },
        dependencies: {
          createAdminClient: vi.fn(() => ({ from: vi.fn() })) as unknown as typeof createAdminClient,
          resolveAmethystPreviewRep: vi.fn(async () => ({
            id: `rep-${appearancePreset}`,
            email: `${appearancePreset}@example.com`,
            shop_link: null,
            streaming_links: {},
          })),
          getSiteSettingsDashboard: vi.fn(async () => ({
            ...demoSettings,
            appearancePreset,
          })),
          getRequiredSetupState: vi.fn(async () => ({
            id: `setup-${appearancePreset}`,
            repId: `rep-${appearancePreset}`,
            status: 'required_setup',
            currentStep: 'final_preview_approval',
            completedSteps: [],
            steps: [],
            answers: {
              account_basics: {
                customerFacingDisplayName: 'Every Look Sparkle',
              },
              welcome_copy: {
                headline: 'Every Look gets the same Nic-Nac copy.',
                supportingLine:
                  'The selected Look changes the style, not the saved setup content.',
              },
              site_skin: {
                selectedLook: appearancePreset,
              },
            },
            generatedCopy: {},
            supportState: {},
            dashboardUnlockedAt: null,
            createdAt: null,
            updatedAt: null,
            nextStep: 'final_preview_approval',
            canUnlockDashboard: false,
          })),
        },
      })

      expect(data.appearancePreset).toBe(appearancePreset)
      expect(data.homepage.businessName).toBe('Every Look Sparkle')
      expect(data.homepage.heroHeadline).toBe(
        'Every Look gets the same Nic-Nac copy.',
      )
      expect(data.homepage.heroSub).toBe(
        'The selected Look changes the style, not the saved setup content.',
      )
    },
  )

  it('preserves the saved Look when a partial setup draft has no skin selection yet', async () => {
    const data = await loadAmethystPreviewTemplateData({
      repId: 'rep-partial-look',
      env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
      },
      dependencies: {
        createAdminClient: vi.fn(() => ({ from: vi.fn() })) as unknown as typeof createAdminClient,
        resolveAmethystPreviewRep: vi.fn(async () => ({
          id: 'rep-partial-look',
          email: 'partial@example.com',
          shop_link: null,
          streaming_links: {},
        })),
        getSiteSettingsDashboard: vi.fn(async () => ({
          ...demoSettings,
          appearancePreset: 'black_diamond',
        })),
        getRequiredSetupState: vi.fn(async () => ({
          id: 'setup-partial-look',
          repId: 'rep-partial-look',
          status: 'required_setup',
          currentStep: 'welcome_copy',
          completedSteps: [],
          steps: [],
          answers: {
            account_basics: {
              customerFacingDisplayName: 'Partial Look Sparkle',
            },
            welcome_copy: {
              headline: 'Partial drafts should not reset the Look.',
            },
          },
          generatedCopy: {},
          supportState: {},
          dashboardUnlockedAt: null,
          createdAt: null,
          updatedAt: null,
          nextStep: 'site_skin',
          canUnlockDashboard: false,
        })),
      },
    })

    expect(data.appearancePreset).toBe('black_diamond')
    expect(data.homepage.businessName).toBe('Partial Look Sparkle')
    expect(data.homepage.heroHeadline).toBe(
      'Partial drafts should not reset the Look.',
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

    expect(data.appearancePreset).toBe('sparkle_suite_morganite')
    expect(data.homepage).toBe(defaultAmethystHomepageTemplateData)
    expect(data.trade).toBe(defaultAmethystTradeTemplateData)
    expect(data.join).toBe(defaultAmethystJoinTemplateData)
  })
})
