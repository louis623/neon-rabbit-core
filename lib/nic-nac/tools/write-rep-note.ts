import { z } from 'zod'
import { tool } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { logIncident } from '@/lib/nic-nac/guardian-telemetry'
import {
  DEFAULT_REP_MEMORY_SOURCE,
  DEFAULT_REP_MEMORY_TYPE,
  REP_MEMORY_SOURCES,
  REP_MEMORY_TYPES,
} from '@/lib/nic-nac/memory'
import type { ToolDefinition } from './types'

const inputSchema = z.object({
  summary: z.string().min(1),
  conversationDate: z.string().min(1).optional(),
  memoryType: z.enum(REP_MEMORY_TYPES).default(DEFAULT_REP_MEMORY_TYPE),
  memorySource: z.enum(REP_MEMORY_SOURCES).default(DEFAULT_REP_MEMORY_SOURCE),
})

const SUMMARY_PREVIEW_LIMIT = 100

type RepNoteInsertRow = {
  conversation_date: string
}

function previewSummary(summary: string): string {
  return summary.slice(0, SUMMARY_PREVIEW_LIMIT)
}

export function makeWriteRepNoteTool(ctx: {
  repId: string
  supabase: SupabaseClient
  conversationId: string
  runId: string
}) {
  return tool({
    description:
      "Write a memory note for the authenticated rep's conversation history. " +
      'Use this internally to save a concise conversation summary.',
    inputSchema,
    execute: async ({
      summary,
      memoryType = DEFAULT_REP_MEMORY_TYPE,
      memorySource = DEFAULT_REP_MEMORY_SOURCE,
    }) => {
      const summaryPreview = previewSummary(summary)
      const conversationDate = new Date().toISOString()

      try {
        const { data, error } = await ctx.supabase
          .from('rep_notes')
          .insert({
            rep_id: ctx.repId,
            summary,
            conversation_date: conversationDate,
            memory_type: memoryType,
            memory_source: memorySource,
          })
          .select('conversation_date, memory_type, memory_source')
          .single()

        if (error || !data) {
          throw error ?? new Error('rep_notes insert returned no row')
        }

        const row = data as RepNoteInsertRow
        return {
          saved: true,
          summaryPreview,
          conversationDate: row.conversation_date,
          memoryType,
          memorySource,
        }
      } catch (err) {
        try {
          await logIncident({
            errorType: 'rep_note_write_failed',
            repId: ctx.repId,
            conversationId: ctx.conversationId,
            severity: 'warn',
            details: {
              toolName: 'write_rep_note',
              runId: ctx.runId,
              message: (err as Error)?.message ?? String(err),
            },
          })
        } catch {
          /* swallow - memory writes should never bubble to the rep */
        }

        return {
          saved: false,
          summaryPreview,
        }
      }
    },
  })
}

export const writeRepNoteTool: ToolDefinition = {
  name: 'write_rep_note',
  readOnly: false,
  build: (ctx) =>
    makeWriteRepNoteTool({
      repId: ctx.repId,
      supabase: ctx.supabase,
      conversationId: ctx.conversationId,
      runId: ctx.runId,
    }),
}
