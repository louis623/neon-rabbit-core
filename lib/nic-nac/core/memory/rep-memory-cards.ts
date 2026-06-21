import type { SupabaseClient } from '@supabase/supabase-js'
import type { NicNacMemoryCard } from '@/lib/nic-nac/core/context-assembler'
import {
  isUnsafeNicNacMemoryText,
  REDACTED_UNSAFE_MEMORY_SUMMARY,
} from '@/lib/nic-nac/core/memory/safety'
import {
  DEFAULT_REP_MEMORY_SOURCE,
  DEFAULT_REP_MEMORY_TYPE,
  REP_MEMORY_SOURCES,
  REP_MEMORY_TYPES,
  type RepMemorySource,
  type RepMemoryType,
} from '@/lib/nic-nac/memory'

const DEFAULT_REP_MEMORY_CARD_LIMIT = 6
const MAX_REP_MEMORY_CARD_LIMIT = 12

export type RepNoteMemoryRow = {
  id: string
  summary: string
  conversation_date: string
  memory_type?: RepMemoryType | null
  memory_source?: RepMemorySource | null
}

export async function loadSuiteRepMemoryCards(input: {
  repId: string
  supabase: Pick<SupabaseClient, 'from'>
  limit?: number
  onError?: (error: Error) => void | Promise<void>
}): Promise<NicNacMemoryCard[]> {
  const limit = normalizeRepMemoryCardLimit(input.limit)

  try {
    const { data, error } = await input.supabase
      .from('rep_notes')
      .select('id, summary, conversation_date, memory_type, memory_source')
      .eq('rep_id', input.repId)
      .order('conversation_date', { ascending: false })
      .limit(limit)

    if (error || !data) {
      throw error ?? new Error('rep_notes memory card read returned no rows')
    }

    return buildSuiteRepMemoryCards({
      repId: input.repId,
      rows: data as RepNoteMemoryRow[],
    })
  } catch (err) {
    try {
      await input.onError?.(err as Error)
    } catch {
      /* memory context is optional and must never block Nic-Nac */
    }
    return []
  }
}

export function buildSuiteRepMemoryCards(input: {
  repId: string
  rows: RepNoteMemoryRow[]
}): NicNacMemoryCard[] {
  const ownerId = `suite_rep:${input.repId}`

  return input.rows.map((row) => {
    const memoryType = normalizeMemoryType(row.memory_type)
    const memorySource = normalizeMemorySource(row.memory_source)
    const unsafe = isUnsafeNicNacMemoryText(row.summary)

    return {
      id: row.id,
      scope: 'shared_linked_human',
      ownerId,
      title: buildRepMemoryCardTitle(memoryType, memorySource),
      summary: unsafe ? REDACTED_UNSAFE_MEMORY_SUMMARY : row.summary,
      priority: getRepMemoryPriority(memoryType, memorySource),
      safety: unsafe ? 'blocked' : 'safe',
      source: `rep_notes:${memoryType}:${memorySource}`,
      updatedAt: row.conversation_date,
    }
  })
}

function normalizeRepMemoryCardLimit(limit: number | undefined): number {
  if (limit === undefined) return DEFAULT_REP_MEMORY_CARD_LIMIT
  return Math.min(
    Math.max(Math.trunc(limit), 1),
    MAX_REP_MEMORY_CARD_LIMIT,
  )
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

function buildRepMemoryCardTitle(
  memoryType: RepMemoryType,
  memorySource: RepMemorySource,
): string {
  const sourceLabel =
    memorySource === 'explicit'
      ? 'explicit'
      : memorySource === 'guarded'
        ? 'guarded'
        : 'learned'

  return `${sourceLabel} ${memoryType.replace(/_/g, ' ')}`
}

function getRepMemoryPriority(
  memoryType: RepMemoryType,
  memorySource: RepMemorySource,
): number {
  const sourceBoost =
    memorySource === 'explicit' ? 40 : memorySource === 'guarded' ? 5 : 15
  const typePriority: Record<RepMemoryType, number> = {
    preference: 50,
    show_process: 45,
    customer_pattern: 40,
    follow_up: 35,
    show_summary: 25,
    issue: 30,
    general: 10,
  }

  return typePriority[memoryType] + sourceBoost
}
