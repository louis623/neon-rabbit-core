import type { NicNacModelPolicy } from '@/lib/nic-nac/core/model-policy'
import type { NicNacRunUsage } from '@/lib/nic-nac/run-telemetry'

type NicNacModelPricing = {
  modelPrefix: string
  inputCentsPerMillion: number
  cachedInputCentsPerMillion: number
  outputCentsPerMillion: number
}

// OpenAI standard, short-context text pricing checked June 21, 2026.
const OPENAI_STANDARD_SHORT_CONTEXT_PRICING: NicNacModelPricing[] = [
  {
    modelPrefix: 'gpt-5.5',
    inputCentsPerMillion: 500,
    cachedInputCentsPerMillion: 50,
    outputCentsPerMillion: 3_000,
  },
  {
    modelPrefix: 'gpt-5.4-mini',
    inputCentsPerMillion: 75,
    cachedInputCentsPerMillion: 7.5,
    outputCentsPerMillion: 450,
  },
  {
    modelPrefix: 'gpt-5.4',
    inputCentsPerMillion: 250,
    cachedInputCentsPerMillion: 25,
    outputCentsPerMillion: 1_500,
  },
]

function getOpenAIStandardShortContextPricing(modelId: string) {
  return OPENAI_STANDARD_SHORT_CONTEXT_PRICING.find((pricing) =>
    isApprovedModelFamily(modelId, pricing.modelPrefix),
  )
}

function isApprovedModelFamily(modelId: string, modelPrefix: string) {
  if (modelId === modelPrefix) return true
  return new RegExp(`^${escapeRegExp(modelPrefix)}-\\d{4}-\\d{2}-\\d{2}$`).test(
    modelId,
  )
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function hasNicNacModelCostPricing(policy: NicNacModelPolicy): boolean {
  if (policy.provider !== 'openai') return false
  return Boolean(getOpenAIStandardShortContextPricing(policy.modelId))
}

export function estimateNicNacRunCostCents(
  policy: NicNacModelPolicy,
  usage: NicNacRunUsage | undefined,
): number | null {
  if (policy.provider !== 'openai') return null
  if (!usage) return null

  const pricing = getOpenAIStandardShortContextPricing(policy.modelId)
  if (!pricing) return null

  const inputTokens = Math.max(0, usage.inputTokens ?? 0)
  const cachedInputTokens = Math.min(
    inputTokens,
    Math.max(0, usage.cacheReadTokens ?? 0),
  )
  const uncachedInputTokens = inputTokens - cachedInputTokens
  const outputTokens = Math.max(0, usage.outputTokens ?? 0)

  const estimatedCents =
    (uncachedInputTokens * pricing.inputCentsPerMillion +
      cachedInputTokens * pricing.cachedInputCentsPerMillion +
      outputTokens * pricing.outputCentsPerMillion) /
    1_000_000

  if (estimatedCents <= 0) return 0

  return Math.ceil(estimatedCents)
}
