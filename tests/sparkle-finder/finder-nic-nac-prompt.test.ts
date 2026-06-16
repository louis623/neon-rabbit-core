import { describe, expect, it } from "vitest";
import { buildFinderNicNacSystemPrompt } from "../../lib/sparkle-finder/nic-nac/prompt-builder";

describe("Sparkle Finder Nic-Nac prompt builder", () => {
  it("frames Nic-Nac as the real Sparkle Finder curator with scoped tools and customer memory", () => {
    const prompt = buildFinderNicNacSystemPrompt({
      activeToolNames: ["read_customer_memory", "search_catalog", "save_favorite_rep"],
      memorySummaries: ["Usually collects rose gold rings.", "Favorite rep: Kelli Jo."],
      intents: ["memory", "catalog", "rep_discovery"],
    });

    expect(prompt).toContain("You are Nic-Nac");
    expect(prompt).toContain("Sparkle Finder curator");
    expect(prompt).toContain("Usually collects rose gold rings.");
    expect(prompt).toContain("Favorite rep: Kelli Jo.");
    expect(prompt).toContain("Active tools for this turn:");
    expect(prompt).toContain("read_customer_memory, search_catalog, save_favorite_rep");
    expect(prompt).toContain("Only call tools in the active list");
    expect(prompt).toContain("Do not add customer-to-customer trading");
    expect(prompt).toContain("Light friendly chat is okay");
  });
});
