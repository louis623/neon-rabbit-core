import { z } from 'zod'
import { tool } from 'ai'
import type { SupabaseClient } from '@supabase/supabase-js'
import { logIncident } from '@/lib/nic-nac/guardian-telemetry'
import {
  DEFAULT_REP_MEMORY_SOURCE,
  DEFAULT_REP_MEMORY_TYPE,
  REP_MEMORY_SOURCES,
  REP_MEMORY_TYPES,
  type RepMemorySource,
  type RepMemoryType,
} from '@/lib/nic-nac/memory'
import {
  isUnsafeNicNacMemoryText,
  REDACTED_UNSAFE_MEMORY_SUMMARY,
} from '@/lib/nic-nac/core/memory/safety'
import type { ToolDefinition } from './types'

const DEFAULT_LIMIT = 5
const MAX_LIMIT = 20
const inputSchema = z.object({
  limit: z.number().int().positive().max(MAX_LIMIT).optional(),
})

type RepNoteRow = {
  id: string
  summary: string
  conversation_date: string
  memory_type?: RepMemoryType | null
  memory_source?: RepMemorySource | null
}

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined) return DEFAULT_LIMIT
  return Math.min(Math.max(Math.trunc(limit), 1), MAX_LIMIT)
}

export function makeReadRecentRepNotesTool(ctx: {
  repId: string
  supabase: SupabaseClient
  conversationId: string
  runId: string
}) {
  return tool({
    description:
      "Read the authenticated rep's recent memory notes for conversation context. " +
      'Use this internally to pull recent conversation summaries.',
    inputSchema,
    execute: async ({ limit }) => {
      const normalizedLimit = normalizeLimit(limit)

      try {
        const { data, error } = await ctx.supabase
          .from('rep_notes')
          .select('id, summary, conversation_date, memory_type, memory_source')
          .eq('rep_id', ctx.repId)
          .order('conversation_date', { ascending: false })
          .limit(normalizedLimit)

        if (error || !data) {
          throw error ?? new Error('rep_notes read returned no rows')
        }

        const notes = (data as RepNoteRow[]).map((note) => {
          const redacted = isUnsafeNicNacMemoryText(note.summary)

          return {
            noteId: note.id,
            summary: redacted ? REDACTED_UNSAFE_MEMORY_SUMMARY : note.summary,
            conversationDate: note.conversation_date,
            memoryType: normalizeMemoryType(note.memory_type),
            memorySource: redacted
              ? 'guarded'
              : normalizeMemorySource(note.memory_source),
            ...(redacted ? { redacted: true } : {}),
          }
        })

        return {
          count: notes.length,
          notes,
        }
      } catch (err) {
        try {
          await logIncident({
            errorType: 'rep_note_read_failed',
            repId: ctx.repId,
            conversationId: ctx.conversationId,
            severity: 'warn',
            details: {
              toolName: 'read_recent_rep_notes',
              runId: ctx.runId,
              message: (err as Error)?.message ?? String(err),
            },
          })
        } catch {
          /* swallow - missing memory context should not derail the conversation */
        }

        return {
          count: 0,
          notes: [],
          unavailable: true,
        }
      }
    },
  })
}

function normalizeMemoryType(value: RepMemoryType | null | undefined): RepMemoryType {
  return value && REP_MEMORY_TYPES.includes(value)
    ? value
    : DEFAULT_REP_MEMORY_TYPE
}

function normalizeMemorySource(
  value: RepMemorySource | null | undefined,
): RepMemorySource {
  return value && REP_MEMORY_SOURCES.includes(value)
    ? value
    : DEFAULT_REP_MEMORY_SOURCE
}

export const readRecentRepNotesTool: ToolDefinition = {
  name: 'read_recent_rep_notes',
  readOnly: true,
  build: (ctx) =>
    makeReadRecentRepNotesTool({
      repId: ctx.repId,
      supabase: ctx.supabase,
      conversationId: ctx.conversationId,
      runId: ctx.runId,
    }),
}
