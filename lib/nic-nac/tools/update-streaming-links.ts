import { z } from 'zod'
import { tool } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { NicNacToolError } from '@/lib/nic-nac/errors'
import type { ToolDefinition } from './types'

const inputSchema = z.object({
  streamingLinks: z.record(z.string(), z.string().min(1)),
})

type RepsStreamingLinksRow = {
  streaming_links: Record<string, string> | null
}

function throwUpdateError(cause: unknown): never {
  throw new NicNacToolError({
    code: 'STREAMING_LINKS_UPDATE_FAILED',
    userMessage:
      "I couldn't update your streaming links - try again or I can escalate this.",
    cause,
  })
}

export function makeUpdateStreamingLinksTool(ctx: {
  repId: string
  supabase: SupabaseClient
}) {
  return tool({
    description:
      "Replace the authenticated rep's streaming links map on their reps profile. " +
      'Pass the full object you want saved.',
    inputSchema,
    execute: async ({ streamingLinks }) => {
      const { data, error } = await ctx.supabase
        .from('reps')
        .update({
          streaming_links: streamingLinks,
        })
        .eq('id', ctx.repId)
        .select('streaming_links')
        .single()

      if (error || !data) {
        throwUpdateError(error ?? new Error('reps update returned no row'))
      }

      const savedLinks =
        (data as RepsStreamingLinksRow).streaming_links ?? {}

      return {
        streamingLinks: savedLinks,
        platforms: Object.keys(savedLinks),
      }
    },
  })
}

export const updateStreamingLinksTool: ToolDefinition = {
  name: 'update_streaming_links',
  readOnly: false,
  build: (ctx) =>
    makeUpdateStreamingLinksTool({
      repId: ctx.repId,
      supabase: ctx.supabase,
    }),
}
