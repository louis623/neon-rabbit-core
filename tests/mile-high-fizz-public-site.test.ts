import { describe, expect, it, vi } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  loadAmethystPreviewTemplateData,
  mapPreviewSettingsToHomepageTemplateData,
  mapPreviewSettingsToJoinTemplateData,
  mapPreviewSettingsToTradeTemplateData,
} from '@/lib/amethyst/preview-template-data'
import { buildAmethystHomepageBootstrapScript } from '@/lib/amethyst/homepage-template-data'
import type { createAdminClient } from '@/lib/supabase/admin'
import type { SiteSettingsDashboardResult } from '@/lib/services/types'

const mileHighFizzSettings: SiteSettingsDashboardResult = {
  displayName: 'Lindsey Chapman',
  businessName: 'Mile High Fizz',
  email: 'lindseychapman1188@gmail.com',
  phone: '',
  bannerText: 'Mile High Fizz updates',
  bannerVisible: true,
  tickerText: 'New show reminders and sparkle updates from Lindsey.',
  tickerVisible: true,
  tagline: 'Revealing something magical together.',
  heroImageUrl: '',
  heroAnimationType: 'sparkle_rise',
  teamName: 'Mile High Fizz',
  showJoinPage: true,
  customerSiteTemplate: 'amethyst',
  appearancePreset: 'black_diamond',
  socialHandles: {
    tiktok: '@lindze1188',
    facebook: 'MileHighFizz',
    instagram: '',
  },
}

const mileHighFizzExtras = {
  shopLink: 'https://www.bombparty.com/party/123456',
  streamingLinks: {
    tiktok: 'https://www.tiktok.com/@lindze1188',
    facebook: 'https://www.facebook.com/groups/milehighfizzvip',
  },
}

function viCreateAdminClient() {
  return vi.fn(() => ({ from: vi.fn() })) as unknown as typeof createAdminClient
}

describe('Mile High Fizz hybrid public site contract', () => {
  it('maps Lindsey to a Mile High Fizz homepage instead of a generic Sparkle shell', () => {
    const homepage = mapPreviewSettingsToHomepageTemplateData(
      mileHighFizzSettings,
      mileHighFizzExtras,
    )

    expect(homepage.repName).toBe('Lindsey')
    expect(homepage.businessName).toBe('Mile High Fizz')
    expect(homepage.heroHeadline).toBe('Mile High Fizz')
    expect(homepage.heroSub).toContain('Revealing something magical together')
    expect((homepage as { heroVideoUrl?: string }).heroVideoUrl).toBe(
      '/mile-high-fizz/hero.mp4',
    )
    expect((homepage as { promoTickerText?: string }).promoTickerText).toContain(
      '10TH ANNIVERSARY SPECIAL',
    )
    expect((homepage as { announcementText?: string }).announcementText).toContain(
      'Introducing the Sterling Club',
    )
    expect(homepage.aboutHeadline).toBe('What is a Bomb Party?')
    expect(homepage.aboutParagraphs.join(' ')).toContain(
      'Experience the thrilling, must-watch excitement of a Bomb Party jewelry reveal',
    )
    expect(homepage.signupTitle).toBe('Never Miss a Show!')
    expect(homepage.joinTeamUrl).toBe('/amethyst/Join.html')
    expect(homepage.footerLinks.joinTeam).toBe('/amethyst/Join.html')
    expect(homepage.footerLinks.faq).toBe('#signup')
    expect(homepage.publicSiteVariant).toBe('mile_high_fizz_hybrid')
    expect(homepage.streamLinks.tiktok).toBe('https://www.tiktok.com/@lindze1188')
    expect(homepage.streamLinks.facebook).toBe(
      'https://www.facebook.com/groups/milehighfizzvip',
    )
  })

  it('serializes the protected Mile High Fizz variant for static runtime branching', () => {
    const homepage = mapPreviewSettingsToHomepageTemplateData(
      mileHighFizzSettings,
      mileHighFizzExtras,
    )
    const script = buildAmethystHomepageBootstrapScript(homepage)

    expect(script).toContain('"publicSiteVariant":"mile_high_fizz_hybrid"')
  })

  it('activates Join navigation only for the Mile High Fizz hybrid variant', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )

    expect(jsx).toContain('const isMileHighFizzHybrid')
    expect(jsx).toContain('isMileHighFizzHybrid && CONTENT.footerLinks?.joinTeam')
    expect(jsx).toContain('Join Team</a>')
  })

  it('renders Mile High Fizz as the migrated Readdy site shell instead of a generic Amethyst hero', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )
    const css = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.css'),
      'utf8',
    )

    expect(jsx).toContain('function MileHighFizzHomepage')
    expect(jsx).toContain('mhf-announcement-banner')
    expect(jsx).toContain('mhf-promo-ticker')
    expect(jsx).toContain('mhf-header-menu')
    expect(jsx).toContain('<video')
    expect(jsx).toContain('CONTENT.heroVideoUrl')
    expect(jsx).toContain('Shop Bomb Party')
    expect(jsx).toContain('Join My Team')
    expect(jsx).toContain('Watch Live Reveal')
    expect(jsx).toContain('MileHighFizzHomepage')
    expect(jsx).toContain('body.classList.add("mile-high-fizz")')
    expect(css).toContain('.mhf-hero-video')
    expect(css).toContain('.mhf-logo-gradient')
    expect(css).toContain('.mhf-cta-shop')
    expect(css).toContain('.mhf-cta-join')
    expect(css).toContain('.mhf-cta-watch')
  })

  it('self-hosts the Mile High Fizz hero video asset', () => {
    expect(
      existsSync(resolve(process.cwd(), 'public/mile-high-fizz/hero.mp4')),
    ).toBe(true)
  })

  it('restyles below-hero Sparkle automations in Mile High Fizz branding', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )
    const css = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.css'),
      'utf8',
    )

    expect(jsx).toContain('mhf-below-hero-shell')
    expect(jsx).toContain('mhf-automation-panel')
    expect(css).toContain('.mhf-below-hero-shell')
    expect(css).toContain('body.mile-high-fizz .mhf-automation-panel .hp-section')
    expect(css).toContain('body.mile-high-fizz .mhf-automation-panel #wibp')
    expect(css).toContain('body.mile-high-fizz .mhf-automation-panel .hp-event-card')
    expect(css).toContain('body.mile-high-fizz .mhf-automation-panel .hp-signup-card')
    expect(css).toContain('body.mile-high-fizz .mhf-automation-panel .hp-footer')
    expect(css).toContain('linear-gradient(135deg, #fdf2f8')
    expect(css).toContain('linear-gradient(90deg, #ec4899, #9333ea, #3b82f6)')
  })

  it('keeps Trade Board standard while dressing it for Mile High Fizz', () => {
    const trade = mapPreviewSettingsToTradeTemplateData(
      mileHighFizzSettings,
      mileHighFizzExtras,
    )

    expect(trade.businessName).toBe('Mile High Fizz')
    expect(trade.repName).toBe('Lindsey')
    expect(trade.tradeHeroTitle).toContain('Mile High Fizz Trade Board')
    expect(trade.tradeRules).toContain('Item-for-item only.')
    expect(trade.footerLinks.home).toBe('/amethyst/Homepage.html')
    expect(trade.footerLinks.tradeBoard).toBe('/amethyst/Trade.html')
    expect(trade.footerLinks.joinTeam).toBe('/amethyst/Join.html')
    expect((trade as { publicSiteVariant?: string }).publicSiteVariant).toBe(
      'mile_high_fizz_hybrid',
    )
  })

  it('renders the public Trade Board in Mile High Fizz styling without changing mechanics', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/trade.jsx'),
      'utf8',
    )
    const css = readFileSync(
      resolve(process.cwd(), 'public/amethyst/trade.css'),
      'utf8',
    )

    expect(jsx).toContain('const isMileHighFizzHybrid')
    expect(jsx).toContain('mhf-trade-page')
    expect(jsx).toContain('mhf-trade-shell')
    expect(jsx).toContain('mhf-trade-board-panel')
    expect(css).toContain('body.mile-high-fizz-trade')
    expect(css).toContain('.mhf-trade-shell')
    expect(css).toContain('body.mile-high-fizz-trade .tp-hero')
    expect(css).toContain('body.mile-high-fizz-trade .tp-filters')
    expect(css).toContain('body.mile-high-fizz-trade .tp-card')
    expect(css).toContain('body.mile-high-fizz-trade .tp-sheet')
    expect(css).toContain('body.mile-high-fizz-trade .hp-footer')
    expect(css).toContain('linear-gradient(135deg, #fdf2f8')
    expect(css).toContain('linear-gradient(90deg, #ec4899, #9333ea, #3b82f6)')
  })

  it('recreates Lindsey join page content for the internal Sparkle page', () => {
    const join = mapPreviewSettingsToJoinTemplateData(
      mileHighFizzSettings,
      mileHighFizzExtras,
    )

    expect(join.businessName).toBe('Mile High Fizz')
    expect(join.teamName).toBe('Mile High Fizz')
    expect((join as { publicSiteVariant?: string }).publicSiteVariant).toBe(
      'mile_high_fizz_hybrid',
    )
    expect((join as { heroTitle?: string }).heroTitle).toBe(
      'Welcome to the Diamond Peak Society',
    )
    expect(join.promoText).toContain('$599 Launch Pack')
    expect(join.heroPitch).toContain('Turn Your Passion into Profit')
    expect(join.heroPitch).toContain('Diamond reveal')
    expect(join.finalPitch).toContain('turn your passion for jewelry into a thriving business')
    expect(join.faqAnswers.whatIsTeam).toContain('Supportive Community')
    expect(join.faqAnswers.whatIsTeam).toContain('Diamond Peak Society')
    expect(join.faqAnswers.support).toContain('one-on-one support')
    expect(join.footerLinks.home).toBe('/amethyst/Homepage.html')
    expect(join.footerLinks.tradeBoard).toBe('/amethyst/Trade.html')
    expect(join.footerLinks.joinTeam).toBe('/amethyst/Join.html')
  })

  it('preserves custom Mile High Fizz Join copy in targeted preview loads', async () => {
    const data = await loadAmethystPreviewTemplateData({
      repId: 'rep-mile-high-fizz',
      publicSiteSlug: 'milehighfizz',
      env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
      },
      dependencies: {
        createAdminClient: viCreateAdminClient(),
        resolveAmethystPreviewRep: async () => ({
          id: 'rep-mile-high-fizz',
          email: 'lindseychapman1188@gmail.com',
          shop_link: mileHighFizzExtras.shopLink,
          streaming_links: mileHighFizzExtras.streamingLinks,
        }),
        getSiteSettingsDashboard: async () => mileHighFizzSettings,
        getRequiredSetupState: async () => ({
          id: 'setup-mile-high-fizz',
          repId: 'rep-mile-high-fizz',
          status: 'dashboard_unlocked',
          currentStep: 'final_preview_approval',
          completedSteps: [],
          steps: [],
          answers: {},
          generatedCopy: {},
          supportState: {},
          dashboardUnlockedAt: '2026-06-17T14:19:21.563Z',
          createdAt: null,
          updatedAt: null,
          nextStep: null,
          canUnlockDashboard: true,
        }),
      },
    })

    expect(data.homepage.publicSiteVariant).toBe('mile_high_fizz_hybrid')
    expect((data.join as { publicSiteVariant?: string }).publicSiteVariant).toBe(
      'mile_high_fizz_hybrid',
    )
    expect((data.join as { heroTitle?: string }).heroTitle).toBe(
      'Welcome to the Diamond Peak Society',
    )
    expect(data.join.heroPitch).toContain('Turn Your Passion into Profit')
    expect(data.join.heroPitch).toContain('Diamond reveal')
    expect(data.join.faqAnswers.whatIsTeam).toContain('Supportive Community')
    expect(data.homepage.footerLinks.home).toBe('/milehighfizz')
    expect(data.homepage.footerLinks.tradeBoard).toBe('/milehighfizz/trade')
    expect(data.homepage.footerLinks.joinTeam).toBe('/milehighfizz/join')
    expect(data.join.footerLinks.joinTeam).toBe('/milehighfizz/join')
  })

  it('renders the public Join page in Mile High Fizz styling with migrated Join copy', () => {
    const jsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/join.jsx'),
      'utf8',
    )
    const css = readFileSync(
      resolve(process.cwd(), 'public/amethyst/join.css'),
      'utf8',
    )

    expect(jsx).toContain('const isMileHighFizzHybrid')
    expect(jsx).toContain('mhf-join-page')
    expect(jsx).toContain('mhf-join-shell')
    expect(jsx).toContain('CONTENT.heroTitle')
    expect(css).toContain('body.mile-high-fizz-join')
    expect(css).toContain('.mhf-join-shell')
    expect(css).toContain('body.mile-high-fizz-join .jp-hero')
    expect(css).toContain('body.mile-high-fizz-join .jp-section')
    expect(css).toContain('body.mile-high-fizz-join .jp-benefit-card')
    expect(css).toContain('body.mile-high-fizz-join .jp-faq-item')
    expect(css).toContain('body.mile-high-fizz-join .jp-final-card')
    expect(css).toContain('linear-gradient(135deg, #fdf2f8')
    expect(css).toContain('linear-gradient(90deg, #ec4899, #9333ea, #3b82f6)')
  })
})
