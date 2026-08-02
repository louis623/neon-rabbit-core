import { z } from 'zod'
import { tool } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { NicNacToolError } from '@/lib/nic-nac/errors'
import {
  normalizeAmethystAppearancePreset,
  normalizeCustomerSiteTemplate,
} from '@/lib/amethyst/appearance-presets'
import { normalizeAmethystSkinSelection } from '@/lib/amethyst/skin-cards'
import type { ToolDefinition } from './types'

const inputSchema = z.object({
  bannerText: z.string().optional(),
  bannerVisible: z.boolean().optional(),
  tickerText: z.string().optional(),
  tickerVisible: z.boolean().optional(),
  tagline: z.string().optional(),
  heroAnimationType: z.enum(['still', 'sparkle_rise', 'soft_glow']).optional(),
  teamName: z.string().optional(),
  showJoinPage: z.boolean().optional(),
  customerSiteTemplate: z.string().optional(),
  appearancePreset: z.string().optional(),
  aboutNarrative: z.string().max(3000).optional(),
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
  customer_site_template: string | null
  appearance_preset: string | null
  about_narrative: string | null
}

type RepsSocialHandlesRow = {
  social_handles: Record<string, string> | null
}

function throwUpdateError(code: string, cause: unknown): never {
  throw new NicNacToolError({
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
      'This can patch banner, ticker, tagline, About narrative, controlled hero motion, team name, join-page visibility, the customer-facing Amethyst site appearance preset, and social handles. customerSiteTemplate is always normalized back to Amethyst. Custom hero images are not supported.',
    inputSchema,
    execute: async ({
      bannerText,
      bannerVisible,
      tickerText,
      tickerVisible,
      tagline,
      heroAnimationType,
      teamName,
      showJoinPage,
      customerSiteTemplate,
      appearancePreset,
      aboutNarrative,
      socialHandles,
    }) => {
      const hasAnyPatch =
        bannerText !== undefined ||
        bannerVisible !== undefined ||
        tickerText !== undefined ||
        tickerVisible !== undefined ||
        tagline !== undefined ||
        heroAnimationType !== undefined ||
        teamName !== undefined ||
        showJoinPage !== undefined ||
        customerSiteTemplate !== undefined ||
        appearancePreset !== undefined ||
        aboutNarrative !== undefined ||
        socialHandles !== undefined

      if (!hasAnyPatch) {
        throw new NicNacToolError({
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
      if (heroAnimationType !== undefined) {
        siteSettingsPatch.hero_animation_type = heroAnimationType
      }
      if (teamName !== undefined) siteSettingsPatch.team_name = teamName
      if (showJoinPage !== undefined) siteSettingsPatch.show_join_page = showJoinPage
      if (customerSiteTemplate !== undefined) {
        siteSettingsPatch.customer_site_template =
          normalizeCustomerSiteTemplate(customerSiteTemplate)
      }
      if (appearancePreset !== undefined) {
        siteSettingsPatch.appearance_preset =
          normalizeAmethystSkinSelection(appearancePreset)
      }
      if (aboutNarrative !== undefined) {
        siteSettingsPatch.about_narrative = aboutNarrative.trim() || null
      }

      const updatedFields: string[] = []
      const updated: Record<string, unknown> = {}

      if (Object.keys(siteSettingsPatch).length > 0) {
        const { data, error } = await ctx.supabase
          .from('site_settings')
          .update(siteSettingsPatch)
          .eq('rep_id', ctx.repId)
          .select(
            'banner_text, banner_visible, ticker_text, ticker_visible, tagline, hero_image_url, hero_animation_type, team_name, show_join_page, customer_site_template, appearance_preset, about_narrative',
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
        if (customerSiteTemplate !== undefined) {
          updatedFields.push('customerSiteTemplate')
          updated.customerSiteTemplate = normalizeCustomerSiteTemplate(
            row.customer_site_template,
          )
        }
        if (appearancePreset !== undefined) {
          updatedFields.push('appearancePreset')
          updated.appearancePreset = normalizeAmethystAppearancePreset(
            row.appearance_preset,
          )
        }
        if (aboutNarrative !== undefined) {
          updatedFields.push('aboutNarrative')
          updated.aboutNarrative = row.about_narrative
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
