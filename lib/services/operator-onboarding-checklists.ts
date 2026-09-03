import type { SupabaseClient } from '@supabase/supabase-js'
import { buildOperatorOnboardingChecklist, isOperatorOnboardingChecklistItemKey, type OperatorOnboardingChecklistEntry, type OperatorOnboardingChecklistItem } from '@/lib/control-center/operator-onboarding-checklist'

interface ChecklistRow { rep_id: string; item_key: string; is_completed: boolean; updated_at: string | null }
function normalizeEntry(row: ChecklistRow): OperatorOnboardingChecklistEntry | null { return isOperatorOnboardingChecklistItemKey(row.item_key) ? { itemKey: row.item_key, isCompleted: row.is_completed === true, updatedAt: row.updated_at } : null }
export async function listOperatorOnboardingChecklists(supabase: SupabaseClient, repIds: readonly string[]): Promise<Record<string, OperatorOnboardingChecklistItem[]>> {
  const uniqueRepIds = [...new Set(repIds.filter((repId) => repId.trim()))]
  if (!uniqueRepIds.length) return {}
  const { data, error } = await supabase.from('operator_onboarding_checklist_items').select('rep_id, item_key, is_completed, updated_at').in('rep_id', uniqueRepIds)
  if (error) throw error
  const entriesByRep = new Map<string, OperatorOnboardingChecklistEntry[]>()
  for (const row of (data ?? []) as ChecklistRow[]) { const entry = normalizeEntry(row); if (!entry) continue; const entries = entriesByRep.get(row.rep_id) ?? []; entries.push(entry); entriesByRep.set(row.rep_id, entries) }
  return Object.fromEntries(uniqueRepIds.map((repId) => [repId, buildOperatorOnboardingChecklist(entriesByRep.get(repId))]))
}
