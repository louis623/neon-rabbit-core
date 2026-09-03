import type { SupabaseClient } from '@supabase/supabase-js'

import {
  buildOperatorOnboardingChecklist,
  isOperatorOnboardingChecklistItemKey,
  isOperatorOnboardingChecklistStatus,
  type OperatorOnboardingChecklistEntry,
  type OperatorOnboardingChecklistItem,
} from '@/lib/control-center/operator-onboarding-checklist'

interface ChecklistRow {
  rep_id: string
  item_key: string
  status: string
  evidence_summary: string | null
  updated_at: string | null
  completed_at: string | null
}

function textOrNull(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function normalizeEntry(row: ChecklistRow): OperatorOnboardingChecklistEntry | null {
  if (!isOperatorOnboardingChecklistItemKey(row.item_key) || !isOperatorOnboardingChecklistStatus(row.status)) return null
  return {
    itemKey: row.item_key,
    status: row.status,
    evidenceSummary: textOrNull(row.evidence_summary),
    updatedAt: textOrNull(row.updated_at),
    completedAt: textOrNull(row.completed_at),
  }
}

export async function listOperatorOnboardingChecklists(
  supabase: SupabaseClient,
  repIds: readonly string[],
): Promise<Record<string, OperatorOnboardingChecklistItem[]>> {
  const uniqueRepIds = [...new Set(repIds.filter((repId) => repId.trim()))]
  if (uniqueRepIds.length === 0) return {}

  const { data, error } = await supabase
    .from('operator_onboarding_checklist_items')
    .select('rep_id, item_key, status, evidence_summary, updated_at, completed_at')
    .in('rep_id', uniqueRepIds)

  if (error) throw error

  const entriesByRep = new Map<string, OperatorOnboardingChecklistEntry[]>()
  for (const row of (data ?? []) as ChecklistRow[]) {
    const entry = normalizeEntry(row)
    if (!entry) continue
    const entries = entriesByRep.get(row.rep_id) ?? []
    entries.push(entry)
    entriesByRep.set(row.rep_id, entries)
  }

  return Object.fromEntries(uniqueRepIds.map((repId) => [repId, buildOperatorOnboardingChecklist(entriesByRep.get(repId))]))
}
