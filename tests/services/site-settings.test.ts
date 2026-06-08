import { describe, expect, it, vi } from 'vitest'

import {
  getSiteSettingsDashboard,
  updateSiteSettingsDashboard,
} from '@/lib/services/site-settings'

function makeSelectSingle(response: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(response)
  const maybeSingle = vi.fn().mockResolvedValue(response)
  const eq = vi.fn(() => ({ single, maybeSingle }))
  const select = vi.fn(() => ({ eq }))

  return {
    api: { select },
    spies: { select, eq, single, maybeSingle },
  }
}

function makeUpsertSingle(response: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(response)
  const select = vi.fn(() => ({ single }))
  const upsert = vi.fn(() => ({ select }))

  return {
    api: { upsert },
    spies: { upsert, select, single },
  }
}

function makeUpdateSingle(response: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(response)
  const select = vi.fn(() => ({ single }))
  const eq = vi.fn(() => ({ select }))
  const update = vi.fn(() => ({ eq }))

  return {
    api: { update },
    spies: { update, eq, select, single },
  }
}

describe('site settings service', () => {
  it('returns rep profile data with safe defaults when site settings row is missing', async () => {
    const siteSettingsChain = makeSelectSingle({ data: null, error: null })
    const repsChain = makeSelectSingle({
      data: {
        display_name: 'Louis',
        business_name: 'Sparkle by Sasha',
        email: 'louis@example.com',
        phone: '+19045551234',
        social_handles: {
          instagram: '@sparklebysasha',
        },
      },
      error: null,
    })

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'site_settings') return siteSettingsChain.api
        if (table === 'reps') return repsChain.api
        throw new Error(`Unexpected table ${table}`)
      }),
    }

    const result = await getSiteSettingsDashboard(supabase as never, 'rep-1')

    expect(result).toEqual({
      displayName: 'Louis',
      businessName: 'Sparkle by Sasha',
      email: 'louis@example.com',
      phone: '+19045551234',
      bannerText: '',
      bannerVisible: false,
      tickerText: '',
      tickerVisible: false,
      tagline: '',
      heroImageUrl: '',
      heroAnimationType: 'sparkle_rise',
      teamName: '',
      showJoinPage: true,
      customerSiteTemplate: 'amethyst',
      appearancePreset: 'sparkle_suite_morganite',
      socialHandles: {
        instagram: '@sparklebysasha',
      },
    })
  })

  it('upserts site settings, updates rep profile fields, and trims empty social handles', async () => {
    const siteSettingsChain = makeUpsertSingle({
      data: {
        banner_text: 'Going live tonight',
        banner_visible: true,
        ticker_text: 'Fresh reveals every Tuesday',
        ticker_visible: true,
        tagline: 'Live sparkle, zero stress.',
        hero_image_url: 'https://cdn.example.com/hero.jpg',
        hero_animation_type: 'soft_glow',
        team_name: 'Moonstone Squad',
        show_join_page: false,
        customer_site_template: 'amethyst',
        appearance_preset: 'rose_gold',
      },
      error: null,
    })
    const repsChain = makeUpdateSingle({
      data: {
        display_name: 'Louis',
        business_name: 'Sparkle by Sasha',
        email: 'hello@sparklebysasha.com',
        phone: '+19045551234',
        social_handles: {
          instagram: '@sparklebysasha',
          facebook: 'sparklebysasha',
        },
      },
      error: null,
    })

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'site_settings') return siteSettingsChain.api
        if (table === 'reps') return repsChain.api
        throw new Error(`Unexpected table ${table}`)
      }),
    }

    const result = await updateSiteSettingsDashboard(supabase as never, 'rep-1', {
      displayName: 'Louis',
      businessName: 'Sparkle by Sasha',
      email: 'hello@sparklebysasha.com',
      phone: '+19045551234',
      bannerText: 'Going live tonight',
      bannerVisible: true,
      tickerText: 'Fresh reveals every Tuesday',
      tickerVisible: true,
      tagline: 'Live sparkle, zero stress.',
      heroImageUrl: 'https://cdn.example.com/hero.jpg',
      heroAnimationType: 'soft_glow',
      teamName: 'Moonstone Squad',
      showJoinPage: false,
      customerSiteTemplate: 'not-a-real-template',
      appearancePreset: 'rose_gold',
      socialHandles: {
        instagram: '@sparklebysasha',
        facebook: 'sparklebysasha',
        tiktok: '   ',
      },
    })

    expect(siteSettingsChain.spies.upsert).toHaveBeenCalledWith(
      {
        rep_id: 'rep-1',
        banner_text: 'Going live tonight',
        banner_visible: true,
        ticker_text: 'Fresh reveals every Tuesday',
        ticker_visible: true,
        tagline: 'Live sparkle, zero stress.',
        hero_image_url: 'https://cdn.example.com/hero.jpg',
        hero_animation_type: 'soft_glow',
        team_name: 'Moonstone Squad',
        show_join_page: false,
        customer_site_template: 'amethyst',
        appearance_preset: 'rose_gold',
      },
      { onConflict: 'rep_id' },
    )
    expect(repsChain.spies.update).toHaveBeenCalledWith({
      display_name: 'Louis',
      business_name: 'Sparkle by Sasha',
      email: 'hello@sparklebysasha.com',
      phone: '+19045551234',
      social_handles: {
        instagram: '@sparklebysasha',
        facebook: 'sparklebysasha',
      },
    })
    expect(result.socialHandles).toEqual({
      instagram: '@sparklebysasha',
      facebook: 'sparklebysasha',
    })
    expect(result.showJoinPage).toBe(false)
    expect(result.heroAnimationType).toBe('soft_glow')
    expect(result.customerSiteTemplate).toBe('amethyst')
    expect(result.appearancePreset).toBe('rose_gold')
  })

  it('lets Nic-Nac save only the customer-site appearance preset', async () => {
    const siteSettingsChain = makeUpsertSingle({
      data: {
        banner_text: null,
        banner_visible: false,
        ticker_text: null,
        ticker_visible: false,
        tagline: null,
        hero_image_url: null,
        hero_animation_type: 'sparkle_rise',
        team_name: null,
        show_join_page: true,
        customer_site_template: 'amethyst',
        appearance_preset: 'sparkle_suite_morganite',
      },
      error: null,
    })
    const repsChain = makeSelectSingle({
      data: {
        display_name: 'Jane',
        business_name: "Jane's Sparkle Party",
        email: 'jane@example.com',
        phone: null,
        social_handles: null,
      },
      error: null,
    })

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'site_settings') return siteSettingsChain.api
        if (table === 'reps') return repsChain.api
        throw new Error(`Unexpected table ${table}`)
      }),
    }

    const result = await updateSiteSettingsDashboard(supabase as never, 'rep-1', {
      appearancePreset: 'sparkle_suite_morganite',
    })

    expect(siteSettingsChain.spies.upsert).toHaveBeenCalledWith(
      {
        rep_id: 'rep-1',
        appearance_preset: 'sparkle_suite_morganite',
      },
      { onConflict: 'rep_id' },
    )
    expect(repsChain.spies.select).toHaveBeenCalled()
    expect(result).toMatchObject({
      displayName: 'Jane',
      businessName: "Jane's Sparkle Party",
      customerSiteTemplate: 'amethyst',
      appearancePreset: 'sparkle_suite_morganite',
    })
  })

  it('normalizes legacy placeholder appearance presets to the Morganite default', async () => {
    const siteSettingsChain = makeUpsertSingle({
      data: {
        banner_text: null,
        banner_visible: false,
        ticker_text: null,
        ticker_visible: false,
        tagline: null,
        hero_image_url: null,
        hero_animation_type: 'sparkle_rise',
        team_name: null,
        show_join_page: true,
        customer_site_template: 'amethyst',
        appearance_preset: 'sparkle_suite_morganite',
      },
      error: null,
    })
    const repsChain = makeSelectSingle({
      data: {
        display_name: 'Jane',
        business_name: "Jane's Sparkle Party",
        email: 'jane@example.com',
        phone: null,
        social_handles: null,
      },
      error: null,
    })

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'site_settings') return siteSettingsChain.api
        if (table === 'reps') return repsChain.api
        throw new Error(`Unexpected table ${table}`)
      }),
    }

    const result = await updateSiteSettingsDashboard(supabase as never, 'rep-1', {
      appearancePreset: 'softGlam',
    })

    expect(siteSettingsChain.spies.upsert).toHaveBeenCalledWith(
      {
        rep_id: 'rep-1',
        appearance_preset: 'sparkle_suite_morganite',
      },
      { onConflict: 'rep_id' },
    )
    expect(result.appearancePreset).toBe('sparkle_suite_morganite')
  })

  it('saves the Sparkle Suite/Morganite skin while keeping the customer-site template Amethyst', async () => {
    const siteSettingsChain = makeUpsertSingle({
      data: {
        banner_text: null,
        banner_visible: false,
        ticker_text: null,
        ticker_visible: false,
        tagline: null,
        hero_image_url: null,
        hero_animation_type: 'sparkle_rise',
        team_name: null,
        show_join_page: true,
        customer_site_template: 'amethyst',
        appearance_preset: 'sparkle_suite_morganite',
      },
      error: null,
    })
    const repsChain = makeSelectSingle({
      data: {
        display_name: 'Jane',
        business_name: "Jane's Sparkle Party",
        email: 'jane@example.com',
        phone: null,
        social_handles: null,
      },
      error: null,
    })

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'site_settings') return siteSettingsChain.api
        if (table === 'reps') return repsChain.api
        throw new Error(`Unexpected table ${table}`)
      }),
    }

    const result = await updateSiteSettingsDashboard(supabase as never, 'rep-1', {
      customerSiteTemplate: 'some-other-template',
      appearancePreset: 'sparkle_suite_morganite',
    })

    expect(siteSettingsChain.spies.upsert).toHaveBeenCalledWith(
      {
        rep_id: 'rep-1',
        customer_site_template: 'amethyst',
        appearance_preset: 'sparkle_suite_morganite',
      },
      { onConflict: 'rep_id' },
    )
    expect(result.customerSiteTemplate).toBe('amethyst')
    expect(result.appearancePreset).toBe('sparkle_suite_morganite')
  })

  it('saves the Black Diamond skin while keeping the customer-site template Amethyst', async () => {
    const siteSettingsChain = makeUpsertSingle({
      data: {
        banner_text: null,
        banner_visible: false,
        ticker_text: null,
        ticker_visible: false,
        tagline: null,
        hero_image_url: null,
        hero_animation_type: 'sparkle_rise',
        team_name: null,
        show_join_page: true,
        customer_site_template: 'amethyst',
        appearance_preset: 'black_diamond',
      },
      error: null,
    })
    const repsChain = makeSelectSingle({
      data: {
        display_name: 'Jane',
        business_name: "Jane's Sparkle Party",
        email: 'jane@example.com',
        phone: null,
        social_handles: null,
      },
      error: null,
    })

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'site_settings') return siteSettingsChain.api
        if (table === 'reps') return repsChain.api
        throw new Error(`Unexpected table ${table}`)
      }),
    }

    const result = await updateSiteSettingsDashboard(supabase as never, 'rep-1', {
      customerSiteTemplate: 'some-other-template',
      appearancePreset: 'black_diamond',
    })

    expect(siteSettingsChain.spies.upsert).toHaveBeenCalledWith(
      {
        rep_id: 'rep-1',
        customer_site_template: 'amethyst',
        appearance_preset: 'black_diamond',
      },
      { onConflict: 'rep_id' },
    )
    expect(result.customerSiteTemplate).toBe('amethyst')
    expect(result.appearancePreset).toBe('black_diamond')
  })

  it('saves the Rose Gold skin while keeping the customer-site template Amethyst', async () => {
    const siteSettingsChain = makeUpsertSingle({
      data: {
        banner_text: null,
        banner_visible: false,
        ticker_text: null,
        ticker_visible: false,
        tagline: null,
        hero_image_url: null,
        hero_animation_type: 'sparkle_rise',
        team_name: null,
        show_join_page: true,
        customer_site_template: 'amethyst',
        appearance_preset: 'rose_gold',
      },
      error: null,
    })
    const repsChain = makeSelectSingle({
      data: {
        display_name: 'Jane',
        business_name: "Jane's Sparkle Party",
        email: 'jane@example.com',
        phone: null,
        social_handles: null,
      },
      error: null,
    })

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'site_settings') return siteSettingsChain.api
        if (table === 'reps') return repsChain.api
        throw new Error(`Unexpected table ${table}`)
      }),
    }

    const result = await updateSiteSettingsDashboard(supabase as never, 'rep-1', {
      customerSiteTemplate: 'some-other-template',
      appearancePreset: 'rose_gold',
    })

    expect(siteSettingsChain.spies.upsert).toHaveBeenCalledWith(
      {
        rep_id: 'rep-1',
        customer_site_template: 'amethyst',
        appearance_preset: 'rose_gold',
      },
      { onConflict: 'rep_id' },
    )
    expect(result.customerSiteTemplate).toBe('amethyst')
    expect(result.appearancePreset).toBe('rose_gold')
  })

  it.each([
    'garnet',
    'amber',
    'velvet',
    'rose_quartz',
  ] as const)(
    'saves the %s skin while keeping the customer-site template Amethyst',
    async (appearancePreset) => {
      const siteSettingsChain = makeUpsertSingle({
        data: {
          banner_text: null,
          banner_visible: false,
          ticker_text: null,
          ticker_visible: false,
          tagline: null,
          hero_image_url: null,
          hero_animation_type: 'sparkle_rise',
          team_name: null,
          show_join_page: true,
          customer_site_template: 'amethyst',
          appearance_preset: appearancePreset,
        },
        error: null,
      })
      const repsChain = makeSelectSingle({
        data: {
          display_name: 'Jane',
          business_name: "Jane's Sparkle Party",
          email: 'jane@example.com',
          phone: null,
          social_handles: null,
        },
        error: null,
      })

      const supabase = {
        from: vi.fn((table: string) => {
          if (table === 'site_settings') return siteSettingsChain.api
          if (table === 'reps') return repsChain.api
          throw new Error(`Unexpected table ${table}`)
        }),
      }

      const result = await updateSiteSettingsDashboard(supabase as never, 'rep-1', {
        customerSiteTemplate: 'some-other-template',
        appearancePreset,
      })

      expect(siteSettingsChain.spies.upsert).toHaveBeenCalledWith(
        {
          rep_id: 'rep-1',
          customer_site_template: 'amethyst',
          appearance_preset: appearancePreset,
        },
        { onConflict: 'rep_id' },
      )
      expect(result.customerSiteTemplate).toBe('amethyst')
      expect(result.appearancePreset).toBe(appearancePreset)
    },
  )
})
