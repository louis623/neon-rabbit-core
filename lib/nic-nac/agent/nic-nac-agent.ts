import {
  ToolLoopAgent,
  stepCountIs,
  type LanguageModel,
  type TimeoutConfiguration,
  type ToolLoopAgentOnFinishCallback,
  type ToolLoopAgentOnStepFinishCallback,
  type ToolSet,
} from 'ai'
import type { ModelMessage, ProviderOptions } from '@ai-sdk/provider-utils'
import type { NicNacProductContext } from '@/lib/nic-nac/core/product-context'
import {
  getNicNacModelPolicy,
  type NicNacModelPolicy,
  type NicNacModelPolicyKey,
} from '@/lib/nic-nac/core/model-policy'
import {
  getNicNacLanguageModel,
  getNicNacProviderOptions,
} from '@/lib/nic-nac/core/model-provider'
import type { ToolContext } from '@/lib/nic-nac/tools/types'
import {
  buildNicNacCapabilityCatalog,
  type NicNacCapabilityCatalog,
} from '@/lib/nic-nac/agent/capability-catalog'
import {
  buildNicNacAgentInstructions,
  type NicNacAgentMode,
} from '@/lib/nic-nac/agent/instructions'

export const NIC_NAC_AGENT_DEFAULT_MAX_STEPS = 6
export const NIC_NAC_AGENT_HARD_MAX_STEPS = 8
export const NIC_NAC_AGENT_DEFAULT_MAX_OUTPUT_TOKENS = 1_600
export const NIC_NAC_AGENT_DEFAULT_MAX_RETRIES = 1
export const NIC_NAC_AGENT_DEFAULT_TIMEOUT = {
  totalMs: 75_000,
  stepMs: 35_000,
  chunkMs: 25_000,
} satisfies TimeoutConfiguration

export type NicNacAgentStreamInput = {
  messages: ModelMessage[]
  abortSignal?: AbortSignal
  timeout?: number | TimeoutConfiguration
  onStepFinish?: ToolLoopAgentOnStepFinishCallback<ToolSet>
}

export type CreateNicNacAgentInput = {
  id?: string
  model: LanguageModel
  instructions: string
  tools: ToolSet
  providerOptions?: ProviderOptions
  maxSteps?: number
  maxOutputTokens?: number
  maxRetries?: number
  onStepFinish?: ToolLoopAgentOnStepFinishCallback<ToolSet>
  onFinish?: ToolLoopAgentOnFinishCallback<ToolSet>
  experimentalContext?: unknown
}

export type NicNacAgentRunner = {
  readonly id: string
  readonly tools: ToolSet
  readonly toolChoice: 'auto'
  readonly maxSteps: number
  readonly maxOutputTokens: number
  readonly maxRetries: number
  readonly timeout: TimeoutConfiguration
  stream: (input: NicNacAgentStreamInput) => ReturnType<
    ToolLoopAgent<never, ToolSet>['stream']
  >
}

function normalizeMaxSteps(maxSteps: number | undefined): number {
  if (maxSteps === undefined) return NIC_NAC_AGENT_DEFAULT_MAX_STEPS
  if (!Number.isInteger(maxSteps) || maxSteps < 1) {
    throw new Error('[nic-nac] maxSteps must be a positive integer')
  }

  return Math.min(maxSteps, NIC_NAC_AGENT_HARD_MAX_STEPS)
}

/**
 * Thin route-facing wrapper around the AI SDK agent loop. Keeping the SDK
 * object private gives the route one stable seam to mock while preserving the
 * normal model-selected `auto` tool policy.
 */
export function createNicNacAgent({
  id = 'nic-nac-workspace-agent',
  model,
  instructions,
  tools,
  providerOptions,
  maxSteps,
  maxOutputTokens,
  maxRetries,
  onStepFinish,
  onFinish,
  experimentalContext,
}: CreateNicNacAgentInput): NicNacAgentRunner {
  const boundedMaxSteps = normalizeMaxSteps(maxSteps)
  const boundedMaxOutputTokens =
    maxOutputTokens ?? NIC_NAC_AGENT_DEFAULT_MAX_OUTPUT_TOKENS
  const boundedMaxRetries = maxRetries ?? NIC_NAC_AGENT_DEFAULT_MAX_RETRIES
  if (!Number.isInteger(boundedMaxOutputTokens) || boundedMaxOutputTokens < 1) {
    throw new Error('[nic-nac] maxOutputTokens must be a positive integer')
  }
  if (!Number.isInteger(boundedMaxRetries) || boundedMaxRetries < 0) {
    throw new Error('[nic-nac] maxRetries must be a non-negative integer')
  }
  const agent = new ToolLoopAgent<never, ToolSet>({
    id,
    model,
    instructions,
    tools,
    toolChoice: 'auto',
    stopWhen: stepCountIs(boundedMaxSteps),
    providerOptions,
    maxOutputTokens: boundedMaxOutputTokens,
    maxRetries: boundedMaxRetries,
    onStepFinish,
    onFinish,
    experimental_context: experimentalContext,
  })

  return {
    id,
    tools,
    toolChoice: 'auto',
    maxSteps: boundedMaxSteps,
    maxOutputTokens: boundedMaxOutputTokens,
    maxRetries: boundedMaxRetries,
    timeout: NIC_NAC_AGENT_DEFAULT_TIMEOUT,
    stream: ({ messages, abortSignal, timeout, onStepFinish: callOnStepFinish }) =>
      agent.stream({
        messages,
        abortSignal,
        timeout: timeout ?? NIC_NAC_AGENT_DEFAULT_TIMEOUT,
        onStepFinish: callOnStepFinish,
      }),
  }
}

export type CreateConfiguredNicNacAgentInput = {
  id?: string
  mode?: NicNacAgentMode
  productContext: NicNacProductContext
  toolContext: ToolContext
  repDisplayName?: string
  memoryContext?: string
  taskContext?: string
  additionalInstructions?: string[]
  modelPolicyKey?: NicNacModelPolicyKey
  modelPolicy?: NicNacModelPolicy
  maxSteps?: number
  maxOutputTokens?: number
  maxRetries?: number
  onStepFinish?: ToolLoopAgentOnStepFinishCallback<ToolSet>
  onFinish?: ToolLoopAgentOnFinishCallback<ToolSet>
  experimentalContext?: unknown
}

export type ConfiguredNicNacAgent = {
  agent: NicNacAgentRunner
  catalog: NicNacCapabilityCatalog
  instructions: string
  modelPolicy: NicNacModelPolicy
}

/**
 * Application-level factory for the default-off harness. It keeps the current
 * provider/model policy and permission-scoped capability construction out of
 * the route while leaving authentication, persistence, approvals, and UI
 * streaming at the route boundary.
 */
export function createConfiguredNicNacAgent({
  id,
  mode = 'workspace',
  productContext,
  toolContext,
  repDisplayName,
  memoryContext,
  taskContext,
  additionalInstructions,
  modelPolicyKey = 'human_default',
  modelPolicy: suppliedModelPolicy,
  maxSteps,
  maxOutputTokens,
  maxRetries,
  onStepFinish,
  onFinish,
  experimentalContext,
}: CreateConfiguredNicNacAgentInput): ConfiguredNicNacAgent {
  const modelPolicy = suppliedModelPolicy ?? getNicNacModelPolicy(modelPolicyKey)
  const catalog = buildNicNacCapabilityCatalog({
    mode,
    productContext,
    toolContext,
  })
  const instructions = buildNicNacAgentInstructions({
    mode,
    productContext,
    repDisplayName,
    blockedToolIntents: catalog.blockedIntents,
    memoryContext,
    taskContext,
    additionalInstructions,
  })
  const agent = createNicNacAgent({
    id,
    model: getNicNacLanguageModel(modelPolicy),
    instructions,
    tools: catalog.tools,
    providerOptions: getNicNacProviderOptions(modelPolicy),
    maxSteps,
    maxOutputTokens,
    maxRetries,
    onStepFinish,
    onFinish,
    experimentalContext,
  })

  return { agent, catalog, instructions, modelPolicy }
}
