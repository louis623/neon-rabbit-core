import { describe, expect, it } from "vitest";
import { isNicNacOpenAIConfigured } from "../../lib/nic-nac/core/model-provider";

describe("Sparkle Finder Nic-Nac model provider", () => {
  it("treats a non-empty OpenAI key as configured", () => {
    expect(isNicNacOpenAIConfigured(" sk-live-test ")).toBe(true);
  });

  it("treats missing or blank OpenAI keys as not configured", () => {
    expect(isNicNacOpenAIConfigured(undefined)).toBe(false);
    expect(isNicNacOpenAIConfigured("")).toBe(false);
    expect(isNicNacOpenAIConfigured("   ")).toBe(false);
  });
});
