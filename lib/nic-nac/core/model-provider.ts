import { createOpenAI } from "@ai-sdk/openai";
import type { NicNacModelPolicy, NicNacReasoningLevel } from "./model-policy";

const openai = createOpenAI({ baseURL: "https://api.openai.com/v1" });

export function getNicNacLanguageModel(policy: NicNacModelPolicy) {
  return openai(policy.modelId);
}

function toOpenAIReasoningEffort(reasoning: NicNacReasoningLevel) {
  return reasoning === "none" ? "none" : reasoning;
}

export function getNicNacProviderOptions(policy: NicNacModelPolicy) {
  return {
    openai: {
      reasoningEffort: toOpenAIReasoningEffort(policy.reasoning),
    },
  };
}
