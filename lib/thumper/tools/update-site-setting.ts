import { z } from 'zod'
import { tool } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ThumperToolError } from '@/lib/thumper/errors'
import type { ToolDefinition } from './types'

const inputSchema = z.object({
  bannerText: z.string().optional(),
  bannerVisible: z.boolean().optional(),
  tickerText: z.string().optional(),
  tickerVisible: z.boolean().optional(),
  tagline: z.string().optional(),
  heroImageUrl: z.string().optional(),
  heroAnimationType: z.enum(['zoom', 'pan']).optional(),
  teamName: z.string().optional(),
  showJoinPage: z.boolean().optional(),
  socialHandles: z.record(z.string(), z.string().min(1)).optional(),
})

type SiteSettingsRow = {
  banner_text: string | null
  banner_visible: boolean | null
  ticker_text: string | null
  ticker_visible: boolean | null
  tagline: string | null
  hero_image_url: string | null
  hero_animation_type: string | null
  team_name: string | null
  show_join_page: boolean | null
}

type RepsSocialHandlesRow = {
  social_handles: Record<string, string> | null
}

function throwUpdateError(code: string, cause: unknown): never {
  throw new ThumperToolError({
    code,
    userMessage:
      "I couldn't update those site settings - try again or I can escalate this.",
    cause,
  })
}

export function makeUpdateSiteSettingTool(ctx: {
  repId: string
  supabase: SupabaseClient
}) {
  return tool({
    description:
      "Update one or more site customization settings for the authenticated rep. " +
      'This can patch banner, ticker, tagline, hero image, hero animation, team name, join-page visibility, and social handles.',
    inputSchema,
    execute: async ({
      bannerText,
      bannerVisible,
      tickerText,
      tickerVisible,
      tagline,
      heroImageUrl,
      heroAnimationType,
      teamName,
      showJoinPage,
      socialHandles,
    }) => {
      const hasAnyPatch =
        bannerText !== undefined ||
        bannerVisible !== undefined ||
        tickerText !== undefined ||
        tickerVisible !== undefined ||
        tagline !== undefined ||
        heroImageUrl !== undefined ||
        heroAnimationType !== undefined ||
        teamName !== undefined ||
        showJoinPage !== undefined ||
        socialHandles !== undefined

      if (!hasAnyPatch) {
        throw new ThumperToolError({
          code: 'NO_SITE_SETTING_FIELDS',
          userMessage:
            'Tell me what you want to change on your site, and I can update it.',
        })
      }

      const siteSettingsPatch: Record<string, unknown> = {}
      if (bannerText !== undefined) siteSettingsPatch.banner_text = bannerText
      if (bannerVisible !== undefined) siteSettingsPatch.banner_visible = bannerVisible
      if (tickerText !== undefined) siteSettingsPatch.ticker_text = tickerText
      if (tickerVisible !== undefined) siteSettingsPatch.ticker_visible = tickerVisible
      if (tagline !== undefined) siteSettingsPatch.tagline = tagline
      if (heroImageUrl !== undefined) siteSettingsPatch.hero_image_url = heroImageUrl
      if (heroAnimationType !== undefined) {
        siteSettingsPatch.hero_animation_type = heroAnimationType
      }
      if (teamName !== undefined) siteSettingsPatch.team_name = teamName
      if (showJoinPage !== undefined) siteSettingsPatch.show_join_page = showJoinPage

      const updatedFields: string[] = []
      const updated: Record<string, unknown> = {}

      if (Object.keys(siteSettingsPatch).length > 0) {
        const { data, error } = await ctx.supabase
          .from('site_settings')
          .update(siteSettingsPatch)
          .eq('rep_id', ctx.repId)
          .select(
            'banner_text, banner_visible, ticker_text, ticker_visible, tagline, hero_image_url, hero_animation_type, team_name, show_join_page',
          )
          .single()

        if (error || !data) {
          throwUpdateError(
            'SITE_SETTINGS_UPDATE_FAILED',
            error ?? new Error('site_settings update returned no row'),
          )
        }

        const row = data as SiteSettingsRow
        if (bannerText !== undefined) {
          updatedFields.push('bannerText')
          updated.bannerText = row.banner_text
        }
        if (bannerVisible !== undefined) {
          updatedFields.push('bannerVisible')
          updated.bannerVisible = row.banner_visible
        }
        if (tickerText !== undefined) {
          updatedFields.push('tickerText')
          updated.tickerText = row.ticker_text
        }
        if (tickerVisible !== undefined) {
          updatedFields.push('tickerVisible')
          updated.tickerVisible = row.ticker_visible
        }
        if (tagline !== undefined) {
          updatedFields.push('tagline')
          updated.tagline = row.tagline
        }
        if (heroImageUrl !== undefined) {
          updatedFields.push('heroImageUrl')
          updated.heroImageUrl = row.hero_image_url
        }
        if (heroAnimationType !== undefined) {
          updatedFields.push('heroAnimationType')
          updated.heroAnimationType = row.hero_animation_type
        }
        if (teamName !== undefined) {
          updatedFields.push('teamName')
          updated.teamName = row.team_name
        }
        if (showJoinPage !== undefined) {
          updatedFields.push('showJoinPage')
          updated.showJoinPage = row.show_join_page
        }
      }

      if (socialHandles !== undefined) {
        const { data, error } = await ctx.supabase
          .from('reps')
          .update({
            social_handles: socialHandles,
          })
          .eq('id', ctx.repId)
          .select('social_handles')
          .single()

        if (error || !data) {
          throwUpdateError(
            'REP_PROFILE_UPDATE_FAILED',
            error ?? new Error('reps update returned no row'),
          )
        }

        updatedFields.push('socialHandles')
        updated.socialHandles =
          (data as RepsSocialHandlesRow).social_handles ?? {}
      }

      return {
        updatedFields,
        updated,
      }
    },
  })
}

export const updateSiteSettingTool: ToolDefinition = {
  name: 'update_site_setting',
  readOnly: false,
  build: (ctx) =>
    makeUpdateSiteSettingTool({
      repId: ctx.repId,
      supabase: ctx.supabase,
    }),
}
