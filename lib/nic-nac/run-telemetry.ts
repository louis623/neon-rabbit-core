import { createAdminClient } from '@/lib/supabase/admin'
import { evaluateNicNacRunThresholds } from '@/lib/nic-nac/run-thresholds'
import type { NicNacToolIntent } from '@/lib/nic-nac/tools'

export type NicNacRunStatus = 'complete' | 'aborted' | 'error'

export type NicNacRunUsage = {
  inputTokens?: number | null
  outputTokens?: number | null
  totalTokens?: number | null
  cacheReadTokens?: number | null
  cacheWriteTokens?: number | null
}

export type NicNacRunModelContext = {
  originalMessageCount: number
  modelMessageCount: number
  droppedMessageCount: number
  estimatedTokens: number
  wasCompacted: boolean
}

export function normalizeRunUsage(usage: unknown): NicNacRunUsage {
  const u = usage as {
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
    inputTokenDetails?: {
      cacheReadTokens?: number
      cacheWriteTokens?: number
    }
  } | null

  return {
    inputTokens: u?.inputTokens ?? null,
    outputTokens: u?.outputTokens ?? null,
    totalTokens: u?.totalTokens ?? null,
    cacheReadTokens: u?.inputTokenDetails?.cacheReadTokens ?? null,
    cacheWriteTokens: u?.inputTokenDetails?.cacheWriteTokens ?? null,
  }
}

export async function logNicNacRun(args: {
  runId: string
  repId: string
  conversationId: string
  model: string
  status: NicNacRunStatus
  latencyMs: number
  intents: NicNacToolIntent[]
  toolNames: string[]
  modelContext: NicNacRunModelContext
  usage?: NicNacRunUsage
  errorMessage?: string
}): Promise<void> {
  try {
    const thresholds = evaluateNicNacRunThresholds({
      latencyMs: args.latencyMs,
      inputTokens: args.usage?.inputTokens,
      totalTokens: args.usage?.totalTokens,
      estimatedContextTokens: args.modelContext.estimatedTokens,
      contextCompacted: args.modelContext.wasCompacted,
      droppedMessageCount: args.modelContext.droppedMessageCount,
    })
    const supabase = createAdminClient()
    const { error } = await supabase.from('nic_nac_runs').insert({
      run_id: args.runId,
      rep_id: args.repId,
      conversation_id: args.conversationId,
      model: args.model,
      status: args.status,
      latency_ms: args.latencyMs,
      input_tokens: args.usage?.inputTokens ?? null,
      output_tokens: args.usage?.outputTokens ?? null,
      total_tokens: args.usage?.totalTokens ?? null,
      cache_read_tokens: args.usage?.cacheReadTokens ?? null,
      cache_write_tokens: args.usage?.cacheWriteTokens ?? null,
      routed_intents: args.intents,
      tool_names: args.toolNames,
      tool_count: args.toolNames.length,
      model_message_count: args.modelContext.modelMessageCount,
      original_message_count: args.modelContext.originalMessageCount,
      dropped_message_count: args.modelContext.droppedMessageCount,
      estimated_context_tokens: args.modelContext.estimatedTokens,
      context_compacted: args.modelContext.wasCompacted,
      rollover_recommended: thresholds.rolloverRecommended,
      rollover_reasons: thresholds.reasons,
      error_message: args.errorMessage ?? null,
    })
    if (error) {
      console.error('[nic-nac] logNicNacRun insert failed:', error)
    }
  } catch (err) {
    console.error('[nic-nac] logNicNacRun exception:', err)
  }
}
