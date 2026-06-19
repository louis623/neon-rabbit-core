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
  buildAmethystPantryBootstrapScript,
  defaultAmethystPantryTemplateData,
} from '@/lib/amethyst/pantry-template-data'
import {
  BLING_KITCHEN_PROFILE,
  BLING_KITCHEN_RECIPE_COUNT,
} from '@/lib/bling-kitchen/profile'
import { recipes } from '@/lib/bling-kitchen/recipes'
import { REQUIRED_SETUP_STEPS } from '@/lib/self-serve/required-setup'
import type { SiteSettingsDashboardResult } from '@/lib/services/types'
import type { createAdminClient } from '@/lib/supabase/admin'

const blingKitchenSettings: SiteSettingsDashboardResult = {
  displayName: 'Heather',
  businessName: 'BlingKitchen',
  email: BLING_KITCHEN_PROFILE.email,
  phone: '',
  bannerText: BLING_KITCHEN_PROFILE.announcementText,
  bannerVisible: true,
  tickerText: BLING_KITCHEN_PROFILE.promoTickerText,
  tickerVisible: true,
  tagline: 'Serving Sparkle from the Heart of the Home',
  heroImageUrl: '',
  heroAnimationType: 'sparkle_rise',
  teamName: BLING_KITCHEN_PROFILE.teamName,
  showJoinPage: true,
  customerSiteTemplate: 'amethyst',
  appearancePreset: 'amethyst',
  socialHandles: {
    tiktok: '@blingkitchen',
    facebook: BLING_KITCHEN_PROFILE.facebookVipUrl,
    instagram: '',
  },
}

const blingKitchenExtras = {
  shopLink: BLING_KITCHEN_PROFILE.shopUrl,
  streamingLinks: {
    tiktok: BLING_KITCHEN_PROFILE.tiktokUrl,
    facebook: BLING_KITCHEN_PROFILE.facebookVipUrl,
  },
}

function viCreateAdminClient() {
  return vi.fn(() => ({ from: vi.fn() })) as unknown as typeof createAdminClient
}

describe('BlingKitchen hybrid public site contract', () => {
  it('maps Heather to the BlingKitchen homepage with Pantry preserved', () => {
    const homepage = mapPreviewSettingsToHomepageTemplateData(
      blingKitchenSettings,
      blingKitchenExtras,
    )

    expect(homepage.publicSiteVariant).toBe('bling_kitchen_hybrid')
    expect(homepage.repName).toBe('Heather')
    expect(homepage.businessName).toBe('BlingKitchen')
    expect(homepage.teamName).toBe('Opal Sparkling Gems')
    expect(homepage.heroHeadline).toBe('BlingKitchen')
    expect(homepage.heroSub).toContain('heart of her Ohio kitchen')
    expect(homepage.heroImageUrl).toBe(BLING_KITCHEN_PROFILE.heroImageUrl)
    expect(homepage.pantryPageUrl).toBe('/amethyst/Pantry.html')
    expect(homepage.footerLinks.joinTeam).toBe('/amethyst/Join.html')
    expect(homepage.streamLinks.tiktok).toBe(BLING_KITCHEN_PROFILE.tiktokUrl)
  })

  it('serializes the BlingKitchen homepage variant for runtime branching', () => {
    const homepage = mapPreviewSettingsToHomepageTemplateData(
      blingKitchenSettings,
      blingKitchenExtras,
    )
    const script = buildAmethystHomepageBootstrapScript(homepage)

    expect(script).toContain('"publicSiteVariant":"bling_kitchen_hybrid"')
    expect(script).toContain('"pantryPageUrl":"/amethyst/Pantry.html"')
  })

  it('keeps Trade Board and Join mechanics standard while dressing them for Heather', () => {
    const trade = mapPreviewSettingsToTradeTemplateData(
      blingKitchenSettings,
      blingKitchenExtras,
    )
    const join = mapPreviewSettingsToJoinTemplateData(
      blingKitchenSettings,
      blingKitchenExtras,
    )

    expect(trade.publicSiteVariant).toBe('bling_kitchen_hybrid')
    expect(trade.tradeHeroTitle).toBe('BlingKitchen Trade Board')
    expect(trade.tradeRules).toContain('Item-for-item only.')
    expect(join.publicSiteVariant).toBe('bling_kitchen_hybrid')
    expect(join.teamName).toBe('Opal Sparkling Gems')
    expect(join.heroTitle).toBe('Join the Team')
    expect(join.bpReferralUrl).toBe(BLING_KITCHEN_PROFILE.joinPackUrl)
  })

  it('preserves source recipes as structured Pantry content', () => {
    expect(BLING_KITCHEN_RECIPE_COUNT).toBe(26)
    expect(defaultAmethystPantryTemplateData.recipeCount).toBe(26)
    expect(defaultAmethystPantryTemplateData.recipes).toHaveLength(26)
    expect(recipes.map((recipe) => recipe.title)).toEqual(
      expect.arrayContaining([
        'Chocolate-Dipped Strawberries',
        'Homemade Coffee Creamer',
        'Family Pasta Sauce',
      ]),
    )
    expect(recipes[0]).toMatchObject({
      category: 'Baking',
      tiktokUrl: expect.stringContaining('tiktok.com/@blingkitchen/video/'),
    })
  })

  it('serializes Pantry recipes and route links for the runtime page', () => {
    const script = buildAmethystPantryBootstrapScript(
      defaultAmethystPantryTemplateData,
      {
        targeted: true,
        repId: 'rep-bling-kitchen',
        publicSiteSlug: 'blingkitchen',
      },
    )

    expect(script).toContain('window.AMETHYST_PANTRY_TEMPLATE_DATA')
    expect(script).toContain('"recipeCount":26')
    expect(script).toContain('"title":"Chocolate-Dipped Strawberries"')
    expect(script).toContain('"publicSiteSlug":"blingkitchen"')
  })

  it('rewrites bespoke public links for the BlingKitchen slug', async () => {
    const data = await loadAmethystPreviewTemplateData({
      repId: 'rep-bling-kitchen',
      publicSiteSlug: 'blingkitchen',
      env: {
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
      },
      dependencies: {
        createAdminClient: viCreateAdminClient(),
        resolveAmethystPreviewRep: async () => ({
          id: 'rep-bling-kitchen',
          email: BLING_KITCHEN_PROFILE.email,
          shop_link: BLING_KITCHEN_PROFILE.shopUrl,
          streaming_links: blingKitchenExtras.streamingLinks,
        }),
        getSiteSettingsDashboard: async () => blingKitchenSettings,
        getJoinTeamRoster: async () => [],
        getRequiredSetupState: async () => ({
          id: 'setup-bling-kitchen',
          repId: 'rep-bling-kitchen',
          status: 'dashboard_unlocked',
          currentStep: 'final_preview_approval',
          completedSteps: [],
          steps: REQUIRED_SETUP_STEPS,
          answers: {},
          generatedCopy: {},
          supportState: {},
          dashboardUnlockedAt: '2026-06-19T12:00:00.000Z',
          createdAt: null,
          updatedAt: null,
          nextStep: null,
          canUnlockDashboard: true,
        }),
      },
    })

    expect(data.homepage.footerLinks.home).toBe('/blingkitchen')
    expect(data.homepage.footerLinks.tradeBoard).toBe('/blingkitchen/trade')
    expect(data.homepage.footerLinks.joinTeam).toBe('/blingkitchen/join')
    expect(data.homepage.pantryPageUrl).toBe('/blingkitchen/in-the-pantry')
    expect(data.trade.footerLinks.tradeBoard).toBe('/blingkitchen/trade')
    expect(data.join.footerLinks.joinTeam).toBe('/blingkitchen/join')
  })

  it('renders BlingKitchen Home, Trade, Join, and Pantry runtime shells', () => {
    const homepageJsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/homepage.jsx'),
      'utf8',
    )
    const tradeJsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/trade.jsx'),
      'utf8',
    )
    const joinJsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/join.jsx'),
      'utf8',
    )
    const pantryJsx = readFileSync(
      resolve(process.cwd(), 'public/amethyst/pantry.jsx'),
      'utf8',
    )
    const pantryHtml = readFileSync(
      resolve(process.cwd(), 'public/amethyst/Pantry.html'),
      'utf8',
    )

    expect(homepageJsx).toContain('function BlingKitchenHomepage')
    expect(homepageJsx).toContain('isBlingKitchenHybrid')
    expect(homepageJsx).toContain('bk-home-pantry-callout')
    expect(tradeJsx).toContain('isBlingKitchenHybrid')
    expect(tradeJsx).toContain('bk-trade-board-panel')
    expect(joinJsx).toContain('isBlingKitchenHybrid')
    expect(joinJsx).toContain('bk-join-shell')
    expect(pantryJsx).toContain('function PantryPage')
    expect(pantryJsx).toContain('AMETHYST_PANTRY_TEMPLATE_DATA')
    expect(pantryJsx).toContain('recipe.tiktokUrl')
    expect(pantryHtml).toContain('class="bk-pantry-page"')
    expect(pantryHtml).toContain('data-template-src="/api/amethyst/pantry-template"')
  })
})
