import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import type { ProviderOptions } from '@ai-sdk/provider-utils'
import type {
  NicNacModelPolicy,
  NicNacReasoningLevel,
} from '@/lib/nic-nac/core/model-policy'

const openai = createOpenAI({ baseURL: 'https://api.openai.com/v1' })

// Keep the explicit Anthropic base URL while the fallback provider remains
// available. Some local shells have inherited ANTHROPIC_BASE_URL without /v1.
const anthropic = createAnthropic({ baseURL: 'https://api.anthropic.com/v1' })

export function getNicNacLanguageModel(policy: NicNacModelPolicy) {
  if (policy.provider === 'openai') {
    return openai(policy.modelId)
  }

  return anthropic(policy.modelId)
}

function toOpenAIReasoningEffort(reasoning: NicNacReasoningLevel) {
  return reasoning === 'none' ? 'none' : reasoning
}

export function getNicNacProviderOptions(
  policy: NicNacModelPolicy,
  options: { anthropicCacheControl?: boolean } = {},
): ProviderOptions | undefined {
  if (policy.provider === 'openai') {
    return {
      openai: {
        reasoningEffort: toOpenAIReasoningEffort(policy.reasoning),
      },
    }
  }

  if (options.anthropicCacheControl) {
    return {
      anthropic: {
        cacheControl: { type: 'ephemeral' },
      },
    }
  }

  return undefined
}
