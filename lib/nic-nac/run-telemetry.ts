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

export type NicNacRunHealth = {
  runId: string
  status: NicNacRunStatus
  createdAt: string
  latencyMs: number
  inputTokens: number | null
  totalTokens: number | null
  estimatedContextTokens: number
  contextCompacted: boolean
  rolloverRecommended: boolean
  rolloverReasons: string[]
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

export async function getLatestNicNacRunHealth(
  repId: string,
  conversationId: string,
): Promise<NicNacRunHealth | null> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('nic_nac_runs')
      .select(
        [
          'run_id',
          'status',
          'created_at',
          'latency_ms',
          'input_tokens',
          'total_tokens',
          'estimated_context_tokens',
          'context_compacted',
          'rollover_recommended',
          'rollover_reasons',
        ].join(','),
      )
      .eq('rep_id', repId)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[nic-nac] getLatestNicNacRunHealth failed:', error)
      return null
    }
    if (!data) return null
    const row = data as unknown as {
      run_id: string
      status: NicNacRunStatus
      created_at: string
      latency_ms: number
      input_tokens: number | null
      total_tokens: number | null
      estimated_context_tokens: number
      context_compacted: boolean
      rollover_recommended: boolean
      rollover_reasons: string[] | null
    }

    return {
      runId: row.run_id,
      status: row.status,
      createdAt: row.created_at,
      latencyMs: row.latency_ms,
      inputTokens: row.input_tokens ?? null,
      totalTokens: row.total_tokens ?? null,
      estimatedContextTokens: row.estimated_context_tokens,
      contextCompacted: row.context_compacted,
      rolloverRecommended: row.rollover_recommended,
      rolloverReasons: row.rollover_reasons ?? [],
    }
  } catch (err) {
    console.error('[nic-nac] getLatestNicNacRunHealth exception:', err)
    return null
  }
}
