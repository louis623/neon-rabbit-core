import { z } from 'zod'
import { tool } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { NicNacToolError } from '@/lib/nic-nac/errors'
import type { ToolDefinition } from './types'

const inputSchema = z.object({
  bannerText: z.string().min(1),
})

type SiteBannerRow = {
  banner_text: string | null
  banner_visible: boolean | null
}

function throwUpdateError(cause: unknown): never {
  throw new NicNacToolError({
    code: 'SITE_SETTINGS_UPDATE_FAILED',
    userMessage:
      "I couldn't update your banner text - try again or I can escalate this.",
    cause,
  })
}

export function makeUpdateBannerTextTool(ctx: {
  repId: string
  supabase: SupabaseClient
}) {
  return tool({
    description:
      "Update the authenticated rep's site banner text. " +
      'This automatically turns the banner on when new text is set.',
    inputSchema,
    execute: async ({ bannerText }) => {
      const { data, error } = await ctx.supabase
        .from('site_settings')
        .update({
          banner_text: bannerText,
          banner_visible: true,
        })
        .eq('rep_id', ctx.repId)
        .select('banner_text, banner_visible')
        .single()

      if (error || !data) {
        throwUpdateError(error ?? new Error('site_settings update returned no row'))
      }

      const row = data as SiteBannerRow
      return {
        bannerText: row.banner_text,
        bannerVisible: row.banner_visible,
      }
    },
  })
}

export const updateBannerTextTool: ToolDefinition = {
  name: 'update_banner_text',
  readOnly: false,
  build: (ctx) =>
    makeUpdateBannerTextTool({
      repId: ctx.repId,
      supabase: ctx.supabase,
    }),
}
