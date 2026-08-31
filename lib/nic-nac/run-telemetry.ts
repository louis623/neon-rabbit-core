import { createAdminClient } from '@/lib/supabase/admin'
import { evaluateNicNacRunThresholds } from '@/lib/nic-nac/run-thresholds'
import type { NicNacToolIntent } from '@/lib/nic-nac/tools'
import type {
  NicNacModelPolicyKey,
  NicNacModelProvider,
  NicNacReasoningLevel,
} from '@/lib/nic-nac/core/model-policy'
import type { NicNacProductContext } from '@/lib/nic-nac/core/product-context'
import type { NicNacAssembledContext } from '@/lib/nic-nac/core/context-assembler'
import { getNicNacLinkedHumanId } from '@/lib/nic-nac/core/context-assembler'

export type NicNacRunStatus = 'complete' | 'aborted' | 'error'

export type NicNacRunUsage = {
  inputTokens?: number | null
  outputTokens?: number | null
  totalTokens?: number | null
  cacheReadTokens?: number | null
  cacheWriteTokens?: number | null
  estimatedCostCents?: number | null
}

export type NicNacRunToolFailure = {
  toolName: string
  errorTier: string
  code?: string | null
  stage?: string | null
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
  modelPolicy?: NicNacModelPolicyKey
  modelProvider?: NicNacModelProvider
  reasoningLevel?: NicNacReasoningLevel
  productContext?: NicNacProductContext
  status: NicNacRunStatus
  latencyMs: number
  intents: NicNacToolIntent[]
  toolNames: string[]
  executedToolNames?: string[]
  toolFailures?: NicNacRunToolFailure[]
  modelContext: NicNacRunModelContext
  contextAssembly?: NicNacAssembledContext['telemetry']
  usage?: NicNacRunUsage
  errorMessage?: string
  workflow?: {
    id: string
    type: string
    phaseBefore?: string
    phaseAfter?: string
    statusBefore?: string
    statusAfter?: string
    toolPolicySource?: string
    photoRoles?: unknown[]
    hardFailPhraseCount?: number
    hardFailPhrases?: string[]
  }
}): Promise<void> {
  try {
    const productTelemetry = summarizeProductContext(args.productContext)
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
      model_policy: args.modelPolicy ?? null,
      model_provider: args.modelProvider ?? null,
      reasoning_level: args.reasoningLevel ?? null,
      product: productTelemetry?.product ?? null,
      surface: productTelemetry?.surface ?? null,
      actor_type: productTelemetry?.actorType ?? null,
      account_tier: productTelemetry?.accountTier ?? null,
      linked_human_id: productTelemetry?.linkedHumanId ?? null,
      product_context: productTelemetry?.productContext ?? {},
      memory_card_count: args.contextAssembly?.memoryCardCount ?? 0,
      blocked_memory_card_count:
        args.contextAssembly?.blockedMemoryCardCount ?? 0,
      memory_scopes: args.contextAssembly?.memoryScopes ?? [],
      memory_context_truncated: args.contextAssembly?.truncated ?? false,
      status: args.status,
      latency_ms: args.latencyMs,
      input_tokens: args.usage?.inputTokens ?? null,
      output_tokens: args.usage?.outputTokens ?? null,
      total_tokens: args.usage?.totalTokens ?? null,
      cache_read_tokens: args.usage?.cacheReadTokens ?? null,
      cache_write_tokens: args.usage?.cacheWriteTokens ?? null,
      estimated_cost_cents: args.usage?.estimatedCostCents ?? null,
      routed_intents: args.intents,
      tool_names: args.toolNames,
      tool_count: args.toolNames.length,
      executed_tool_names: args.executedToolNames ?? [],
      executed_tool_count: args.executedToolNames?.length ?? 0,
      tool_failure_count: args.toolFailures?.length ?? 0,
      tool_failures: args.toolFailures ?? [],
      model_message_count: args.modelContext.modelMessageCount,
      original_message_count: args.modelContext.originalMessageCount,
      dropped_message_count: args.modelContext.droppedMessageCount,
      estimated_context_tokens: args.modelContext.estimatedTokens,
      context_compacted: args.modelContext.wasCompacted,
      rollover_recommended: thresholds.rolloverRecommended,
      rollover_reasons: thresholds.reasons,
      workflow_id: args.workflow?.id ?? null,
      workflow_type: args.workflow?.type ?? null,
      workflow_phase_before: args.workflow?.phaseBefore ?? null,
      workflow_phase_after: args.workflow?.phaseAfter ?? null,
      workflow_status_before: args.workflow?.statusBefore ?? null,
      workflow_status_after: args.workflow?.statusAfter ?? null,
      tool_policy_source: args.workflow?.toolPolicySource ?? null,
      workflow_photo_roles: args.workflow?.photoRoles ?? [],
      hard_fail_phrase_count: args.workflow?.hardFailPhraseCount ?? 0,
      hard_fail_phrases: args.workflow?.hardFailPhrases ?? [],
      error_message: args.errorMessage ?? null,
    })
    if (error) {
      console.error('[nic-nac] logNicNacRun insert failed:', error)
    }
  } catch (err) {
    console.error('[nic-nac] logNicNacRun exception:', err)
  }
}

function summarizeProductContext(context: NicNacProductContext | undefined) {
  if (!context) return null

  const linkedSuiteRepId =
    context.actor.linkedSuiteRepId ?? context.actor.suiteRepId ?? null
  const linkedHumanId = getNicNacLinkedHumanId(context) ?? null

  return {
    product: context.product,
    surface: context.surface,
    actorType: context.actor.type,
    accountTier: context.actor.accountTier,
    linkedHumanId,
    productContext: {
      product: context.product,
      surface: context.surface,
      actorType: context.actor.type,
      accountTier: context.actor.accountTier,
      linkedSuiteRepId,
    },
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
