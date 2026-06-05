import type { SupabaseClient } from '@supabase/supabase-js'
import type { WriteJewelryCatalogChangeInput } from './types'

export async function writeJewelryCatalogChange(
  supabase: SupabaseClient,
  input: WriteJewelryCatalogChangeInput,
): Promise<void> {
  try {
    const { error } = await supabase.from('jewelry_catalog_change_log').insert({
      design_id: input.designId,
      rep_id: input.repId ?? null,
      conversation_id: input.conversationId ?? null,
      change_type: input.changeType,
      issue_type: input.issueType ?? null,
      reason: input.reason ?? null,
      before_state: input.beforeState,
      after_state: input.afterState,
    })

    if (error) {
      console.error('[jewelry-catalog] change log insert failed:', error)
    }
  } catch (err) {
    console.error('[jewelry-catalog] change log exception:', err)
  }
}
