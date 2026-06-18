import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  loadAmethystPreviewTemplateData,
  mapPreviewSettingsToHomepageTemplateData,
  mapPreviewSettingsToJoinTemplateData,
  mapPreviewSettingsToTradeTemplateData,
} from '@/lib/amethyst/preview-template-data'
import { buildAmethystHomepageBootstrapScript } from '@/lib/amethyst/homepage-template-data'
import {
  BRITT_WITH_BLING_PROFILE,
  BRITT_WITH_BLING_TEAM_MEMBERS,
} from '@/lib/britt-with-bling/profile'
import { REQUIRED_SETUP_STEPS } from '@/lib/self-serve/required-setup'
import type { createAdminClient } from '@/lib/supabase/admin'
import type { JoinTeamMember, SiteSettingsDashboardResult } from '@/lib/services/types'

const brittWithBlingSettings: SiteSettingsDashboardResult = {
  displayName: 'Brittany',
  businessName: 'Britt with Bling',
  email: 'brittany@example.com',
  phone: '',
  bannerText: BRITT_WITH_BLING_PROFILE.announcementText,
  bannerVisible: true,
  tickerText: BRITT_WITH_BLING_PROFILE.promoTickerText,
  tickerVisible: true,
  tagline: 'Where Faith Meets Fizz & Every Reveal is a VIP Experience',
  heroImageUrl: '',
  heroAnimationType: 'sparkle_rise',
  teamName: 'The Virtuous Fizzers',
  showJoinPage: true,
  customerSiteTemplate: 'amethyst',
  appearancePreset: 'black_diamond',
  socialHandles: {
    tiktok: '@brittwithbling',
    facebook: BRITT_WITH_BLING_PROFILE.facebookVipUrl,
    instagram: '',
  },
}

const brittWithBlingExtras = {
  shopLink: BRITT_WITH_BLING_PROFILE.shopUrl,
  streamingLinks: {
    tiktok: BRITT_WITH_BLING_PROFILE.tiktokUrl,
    facebook: BRITT_WITH_BLING_PROFILE.facebookVipUrl,
  },
}

function viCreateAdminClient() {
  return vi.fn(() => ({ from: vi.fn() })) as unknown as typeof createAdminClient
}

function rosterRow(overrides: Partial<JoinTeamMember> = {}): JoinTeamMember {
  return {
    id: 'member-brittany',
    repId: 'rep-britt-with-bling',
    displayName: 'Brittany',
    businessName: 'Britt with Bling',
    state: 'Florida',
    city: '',
    initials: '',
    photoUrl: BRITT_WITH_BLING_TEAM_MEMBERS[0].imageUrl ?? '',
    photoAlt: 'Brittany',
    imageClassName: '',
    bio: '',
    links: {
      tiktok: BRITT_WITH_BLING_PROFILE.tiktokUrl,
      facebook: BRITT_WITH_BLING_PROFILE.facebookVipUrl,
      website: 'https://bombparty.com/brittwithbling',
    },
    sortOrder: 0,
    isVisible: true,
    createdAt: '2026-06-18T12:00:00.000Z',
    updatedAt: '2026-06-18T12:00:00.000Z',
    ...overrides,
  }
}

describe('Britt With Bling hybrid public site contract', () => {
  it('maps Brittany to the BWB homepage instead of a generic Sparkle shell', () => {
    const homepage = mapPreviewSettingsToHomepageTemplateData(
      brittWithBlingSettings,
      brittWithBlingExtras,
    )

    expect(homepage.repName).toBe('Brittany')
    expect(homepage.businessName).toBe('Britt with Bling')
    expect(homepage.teamName).toBe('The Virtuous Fizzers')
    expect(homepage.heroHeadline).toBe('Britt with Bling')
    expect(homepage.heroSub).toContain('Where Faith Meets Fizz')
    expect(homepage.heroImageUrl).toBe(BRITT_WITH_BLING_PROFILE.heroImageUrl)
    expect(homepage.promoTickerText).toContain('10TH ANNIVERSARY SPECIAL')
    expect(homepage.featuredReveal).toMatchObject({
      eyebrow: 'Style Council Elite',
      title: 'The Rise of Her',
      ctaLabel: 'Shop the Luxe Layers Collection',
    })
    expect(homepage.featuredReveal?.body).toContain('Mother of Pearl')
    expect(homepage.revealExplainer?.body).toContain(
      'Experience the thrilling, must-watch excitement',
    )
    expect(homepage.aboutHeadline).toBe('What is a Bomb Party?')
    expect(homepage.joinTeamUrl).toBe('/amethyst/Join.html')
    expect(homepage.footerLinks.joinTeam).toBe('/amethyst/Join.html')
    expect(homepage.footerLinks.faq).toBe('#wibp')
    expect(homepage.footerLinks).not.toHaveProperty('about')
    expect(homepage.publicSiteVariant).toBe('britt_with_bling_hybrid')
  })

  it('serializes the BWB variant for static runtime branching', () => {
    const homepage = mapPreviewSettingsToHomepageTemplateData(
      brittWithBlingSettings,
      brittWithBlingExtras,
    )
    const script = buildAmethystHomepageBootstrapScript(homepage)

    expect(script).toContain('"publicSiteVariant":"britt_with_bling_hybrid"')
  })

  it('keeps Trade Board mechanics standard while dressing it for BWB', () => {
    const trade = mapPreviewSettingsToTradeTemplateData(
      brittWithBlingSettings,
      brittWithBlingExtras,
    )

    expect(trade.businessName).toBe('Britt with Bling')
    expect(trade.repName).toBe('Brittany')
    expect(trade.tradeHeroTitle).toBe('Britt with Bling Trade Board')
    expect(trade.tradeRules).toContain('Item-for-item only.')
    expect(trade.footerLinks.home).toBe('/amethyst/Homepage.html')
    expect(trade.footerLinks.tradeBoard).toBe('/amethyst/Trade.html')
    expect(trade.footerLinks.joinTeam).toBe('/amethyst/Join.html')
    expect((trade as { publicSiteVariant?: string }).publicSiteVariant).toBe(
      'britt_with_bling_hybrid',
    )
  })

  it('uses the BWB Join Team copy and does not hardcode roster fallback data', () => {
    const join = mapPreviewSettingsToJoinTemplateData(
      brittWithBlingSettings,
      brittWithBlingExtras,
    )

    expect(join.businessName).toBe('Britt with Bling')
    expect(join.teamName).toBe('The Virtuous Fizzers')
    expect((join as { publicSiteVariant?: string }).publicSiteVariant).toBe(
      'britt_with_bling_hybrid',
    )
    expect((join as { heroTitle?: string }).heroTitle).toBe(
      'WELCOME TO THE VIRTUOUS FIZZERS',
    )
    expect(join.heroCtaText).toBe('CLAIM MY DIAMOND AND START MY CLIMB')
    expect(join.bpReferralUrl).toBe(BRITT_WITH_BLING_PROFILE.joinPackUrl)
    expect(join.teamMembers).toEqual([])
  })

  it('loads Nic-Nac editable roster rows into targeted BWB Join pages', async () => {
    const data = await loadAmethystPreviewTemplateData({
      repId: 'rep-britt-with-bling',
      publicSiteSlug: 'brittwithbling',
      env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
      },
      dependencies: {
        createAdminClient: viCreateAdminClient(),
        resolveAmethystPreviewRep: async () => ({
          id: 'rep-britt-with-bling',
          email: 'brittany@example.com',
          shop_link: BRITT_WITH_BLING_PROFILE.shopUrl,
          streaming_links: brittWithBlingExtras.streamingLinks,
        }),
        getSiteSettingsDashboard: async () => brittWithBlingSettings,
        getJoinTeamRoster: async () => [
          rosterRow(),
          rosterRow({
            id: 'member-lindsey',
            displayName: 'Lindsey',
            businessName: 'Mile High Fizz',
            state: 'Colorado',
            photoUrl: BRITT_WITH_BLING_TEAM_MEMBERS[3].imageUrl ?? '',
            links: {
              tiktok: 'https://www.tiktok.com/@lindze1188',
              facebook: 'https://www.facebook.com/groups/390848873287947',
              website: 'https://milehighfizz.com/',
            },
            sortOrder: 3,
          }),
        ],
        getRequiredSetupState: async () => ({
          id: 'setup-britt-with-bling',
          repId: 'rep-britt-with-bling',
          status: 'dashboard_unlocked',
          currentStep: 'final_preview_approval',
          completedSteps: [],
          steps: REQUIRED_SETUP_STEPS,
          answers: {},
          generatedCopy: {},
          supportState: {},
          dashboardUnlockedAt: '2026-06-18T12:00:00.000Z',
          createdAt: null,
          updatedAt: null,
          nextStep: null,
          canUnlockDashboard: true,
        }),
      },
    })

    expect(data.homepage.publicSiteVariant).toBe('britt_with_bling_hybrid')
    expect(data.homepage.footerLinks.home).toBe('/brittwithbling')
    expect(data.homepage.footerLinks.tradeBoard).toBe('/brittwithbling/trade')
    expect(data.homepage.footerLinks.joinTeam).toBe('/brittwithbling/join')
    expect(data.join.footerLinks.joinTeam).toBe('/brittwithbling/join')
    expect(data.join.teamMembers).toHaveLength(2)
    expect(data.join.teamMembers[0]).toMatchObject({
      id: 'member-brittany',
      name: 'Brittany',
      business: 'Britt with Bling',
      imageUrl: BRITT_WITH_BLING_TEAM_MEMBERS[0].imageUrl,
      socialLinks: {
        tiktok: BRITT_WITH_BLING_PROFILE.tiktokUrl,
        facebook: BRITT_WITH_BLING_PROFILE.facebookVipUrl,
        website: 'https://bombparty.com/brittwithbling',
      },
    })
    expect(data.join.teamMembers[1].socialLinks).not.toHaveProperty('whatnot')
  })

  it('imports all Ready.ai roster cards as seed material for the BWB tenant', () => {
    expect(BRITT_WITH_BLING_TEAM_MEMBERS).toHaveLength(23)
    expect(BRITT_WITH_BLING_TEAM_MEMBERS.map((member) => member.business)).toEqual(
      expect.arrayContaining([
        'Britt with Bling',
        'Queen of Blingy Thingz',
        'Mile High Fizz',
        'Bdubbfizz',
        'Gypsy Jewels Boutique',
        'jennfizz4keeps',
      ]),
    )
    expect(BRITT_WITH_BLING_TEAM_MEMBERS[0].socialLinks).toMatchObject({
      tiktok: BRITT_WITH_BLING_PROFILE.tiktokUrl,
      facebook: BRITT_WITH_BLING_PROFILE.facebookVipUrl,
      website: 'https://bombparty.com/brittwithbling',
    })
    expect(
      BRITT_WITH_BLING_TEAM_MEMBERS.some((member) =>
        JSON.stringify(member.socialLinks).toLowerCase().includes('whatnot'),
      ),
    ).toBe(false)
  })

  it('renders BWB homepage, Trade Board, and Join shells with BWB branding', () => {
    const homepageJsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )
    const homepageCss = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.css'),
      'utf8',
    )
    const tradeJsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/trade.jsx'),
      'utf8',
    )
    const tradeCss = readFileSync(
      resolve(process.cwd(), 'public/amethyst/trade.css'),
      'utf8',
    )
    const joinJsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/join.jsx'),
      'utf8',
    )
    const joinCss = readFileSync(
      resolve(process.cwd(), 'public/amethyst/join.css'),
      'utf8',
    )

    expect(homepageJsx).toContain('function BrittWithBlingHomepage')
    expect(homepageJsx).toContain('function BrittWithBlingFeaturedReveal')
    expect(homepageJsx).toContain('function BrittWithBlingRevealExplainer')
    expect(homepageJsx).toContain('bwb-announcement-banner')
    expect(homepageJsx).toContain('bwb-header-menu')
    expect(homepageJsx).toContain('CONTENT.heroImageUrl')
    expect(homepageJsx).toContain('bwb-featured-reveal')
    expect(homepageJsx).toContain('bwb-source-explainer')
    expect(homepageCss).toContain('body.britt-with-bling')
    expect(homepageCss).toContain('#d4af37')
    expect(homepageCss).toContain('#00d9ff')
    expect(homepageCss).toContain('.bwb-featured-video')
    expect(homepageCss).toContain('.bwb-tiktok-card')

    expect(tradeJsx).toContain('const isBrittWithBlingHybrid')
    expect(tradeJsx).toContain('bwb-trade-page')
    expect(tradeJsx).toContain('bwb-trade-board-panel')
    expect(tradeCss).toContain('body.britt-with-bling-trade')
    expect(tradeCss).toContain('body.britt-with-bling-trade .tp-card')

    expect(joinJsx).toContain('const isBrittWithBlingHybrid')
    expect(joinJsx).toContain('bwb-join-page')
    expect(joinJsx).toContain('member.socialLinks?.facebook')
    expect(joinJsx).toContain('member.socialLinks?.instagram')
    expect(joinJsx).toContain('member.socialLinks?.website')
    expect(joinCss).toContain('body.britt-with-bling-join')
    expect(joinCss).toContain('.jp-team-avatar-img')
  })
})
