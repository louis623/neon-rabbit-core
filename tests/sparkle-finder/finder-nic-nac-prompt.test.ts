import { describe, expect, it } from "vitest";
import { buildFinderNicNacSystemPrompt } from "../../lib/sparkle-finder/nic-nac/prompt-builder";

describe("Sparkle Finder Nic-Nac prompt builder", () => {
  const bannedSocialCommercePrompt =
    "Do not suggest DMs, friend requests, buying from members, selling your jewelry, message seller workflows, customer-to-customer trading, customer marketplace features, escrow, payment, fulfillment, or disputes";

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
    expect(prompt).toContain(bannedSocialCommercePrompt);
    expect(prompt).toContain("Light friendly chat is okay");
  });

  it("includes the full social-commerce prohibition for non-social tool intents", () => {
    const prompt = buildFinderNicNacSystemPrompt({
      activeToolNames: ["search_catalog"],
      intents: ["catalog"],
    });

    expect(prompt).toContain(bannedSocialCommercePrompt);
  });

  it("frames public collector help as one-way follows and Showcases without social commerce", () => {
    const prompt = buildFinderNicNacSystemPrompt({
      activeToolNames: ["find_public_showcases", "list_followed_collectors"],
      intents: ["social"],
    });

    expect(prompt).toContain("public collectors");
    expect(prompt).toContain("Public Showcases");
    expect(prompt).toContain("one-way follows");
    expect(prompt).toContain("blocking and reporting");
    expect(prompt).toContain(bannedSocialCommercePrompt);
  });
});
