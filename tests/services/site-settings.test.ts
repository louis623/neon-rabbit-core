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
      heroAnimationType: 'zoom',
      teamName: '',
      showJoinPage: true,
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
        hero_animation_type: 'pan',
        team_name: 'Moonstone Squad',
        show_join_page: false,
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
      heroAnimationType: 'pan',
      teamName: 'Moonstone Squad',
      showJoinPage: false,
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
        hero_animation_type: 'pan',
        team_name: 'Moonstone Squad',
        show_join_page: false,
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
    expect(result.heroAnimationType).toBe('pan')
  })
})
