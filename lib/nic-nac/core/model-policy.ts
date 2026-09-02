export type NicNacModelPolicyKey =
  | 'human_default'
  | 'human_escalated'
  | 'utility_fast'
  | 'lab_synthesis'

export type NicNacModelProvider = 'openai'
export type NicNacReasoningLevel = 'none' | 'low' | 'medium' | 'high'

export interface NicNacModelPolicy {
  key: NicNacModelPolicyKey
  provider: NicNacModelProvider
  modelId: string
  reasoning: NicNacReasoningLevel
  purpose: string
}

type NicNacModelPolicyDefinition = Omit<NicNacModelPolicy, 'modelId'> & {
  defaultModelId: string
  envVar: string
}

function readEnvModel(name: string, fallback: string) {
  return process.env[name]?.trim() || fallback
}

const NIC_NAC_MODEL_POLICY_DEFINITIONS: Record<
  NicNacModelPolicyKey,
  NicNacModelPolicyDefinition
> = {
  human_default: {
    key: 'human_default',
    provider: 'openai',
    defaultModelId: 'gpt-5.6-terra',
    envVar: 'NIC_NAC_HUMAN_DEFAULT_MODEL',
    reasoning: 'medium',
    purpose: 'Default production Nic-Nac conversations.',
  },
  human_escalated: {
    key: 'human_escalated',
    provider: 'openai',
    defaultModelId: 'gpt-5.5',
    envVar: 'NIC_NAC_HUMAN_ESCALATED_MODEL',
    reasoning: 'medium',
    purpose: 'Complex, high-value, or stuck human-facing work.',
  },
  utility_fast: {
    key: 'utility_fast',
    provider: 'openai',
    defaultModelId: 'gpt-5.4-mini',
    envVar: 'NIC_NAC_UTILITY_MODEL',
    reasoning: 'low',
    purpose: 'Invisible classification, summaries, and cheap background helpers.',
  },
  lab_synthesis: {
    key: 'lab_synthesis',
    provider: 'openai',
    defaultModelId: 'gpt-5.5',
    envVar: 'NIC_NAC_LAB_SYNTHESIS_MODEL',
    reasoning: 'high',
    purpose: 'Bounded Sparkle Lab synthesis and recommendations.',
  },
}

export const NIC_NAC_MODEL_POLICIES: Record<
  NicNacModelPolicyKey,
  NicNacModelPolicy
> = Object.fromEntries(
  Object.entries(NIC_NAC_MODEL_POLICY_DEFINITIONS).map(([key, definition]) => [
    key,
    {
      key: definition.key,
      provider: definition.provider,
      modelId: definition.defaultModelId,
      reasoning: definition.reasoning,
      purpose: definition.purpose,
    },
  ]),
) as Record<NicNacModelPolicyKey, NicNacModelPolicy>

export function getNicNacModelPolicy(
  key: NicNacModelPolicyKey,
): NicNacModelPolicy {
  const definition = NIC_NAC_MODEL_POLICY_DEFINITIONS[key]

  return {
    key: definition.key,
    provider: definition.provider,
    modelId: readEnvModel(definition.envVar, definition.defaultModelId),
    reasoning: definition.reasoning,
    purpose: definition.purpose,
  }
}
