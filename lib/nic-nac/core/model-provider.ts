import { createOpenAI } from '@ai-sdk/openai'
import type { ProviderOptions } from '@ai-sdk/provider-utils'
import type {
  NicNacModelPolicy,
  NicNacReasoningLevel,
} from '@/lib/nic-nac/core/model-policy'

const openai = createOpenAI({ baseURL: 'https://api.openai.com/v1' })

export function getNicNacLanguageModel(policy: NicNacModelPolicy) {
  return openai(policy.modelId)
}

function toOpenAIReasoningEffort(reasoning: NicNacReasoningLevel) {
  return reasoning === 'none' ? 'none' : reasoning
}

export function getNicNacProviderOptions(
  policy: NicNacModelPolicy,
): ProviderOptions | undefined {
  return {
    openai: {
      reasoningEffort: toOpenAIReasoningEffort(policy.reasoning),
    },
  }
}
