import { createAdminClient } from '@/lib/supabase/admin'

export async function logNicNacRollover(args: {
  repId: string
  sourceConversationId: string
  destinationConversationId: string
  carriedMessageCount: number
  reason?: string
}): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('nic_nac_rollovers').insert({
      rep_id: args.repId,
      source_conversation_id: args.sourceConversationId,
      destination_conversation_id: args.destinationConversationId,
      carried_message_count: args.carriedMessageCount,
      reason: args.reason ?? 'run_health_threshold',
    })
    if (error) {
      console.error('[nic-nac] logNicNacRollover insert failed:', error)
    }
  } catch (err) {
    console.error('[nic-nac] logNicNacRollover exception:', err)
  }
}
