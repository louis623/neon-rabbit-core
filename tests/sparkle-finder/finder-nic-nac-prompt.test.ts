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
    expect(prompt).toContain("the feature is always the Dance Floor");
    expect(prompt).toContain("jewelry offered there are dancers");
    expect(prompt).toContain("availableListingCount, listingId, listedAt, boardItemCount");
    expect(prompt).toContain("Treat those names as internal only");
  });

  it("normalizes legacy linked memory to the approved Dance Floor vocabulary", () => {
    const prompt = buildFinderNicNacSystemPrompt({
      activeToolNames: ["read_customer_memory"],
      intents: ["memory"],
      memorySummaries: [
        "Ask before adding duplicate Trade Board items or sharing rep board links.",
        "Use board inventory, board matches, available listings, and board context.",
      ],
    });

    expect(prompt).toContain("Ask before adding duplicate dancers or sharing Dance Floor links.");
    expect(prompt).toContain("Use dancers, dancer leads, dancers, and Dance Floor context.");
    expect(prompt).not.toContain("Trade Board");
    expect(prompt).not.toContain("rep board links");
    expect(prompt).not.toContain("board inventory");
    expect(prompt).not.toContain("board matches");
    expect(prompt).not.toContain("available listings");
    expect(prompt).not.toContain("board context");
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

  it("tells linked Sparkle Suite reps that Suite mutations require the Suite surface", () => {
    const prompt = buildFinderNicNacSystemPrompt({
      activeToolNames: ["read_customer_memory"],
      intents: ["memory"],
      accountContext: {
        actorType: "linked_rep",
        accountTier: "silver",
        linkedSuiteBusinessName: "BlingKitchen",
        linkedSuiteRepId: "rep-bling-kitchen",
      },
    });

    expect(prompt).toContain("Current surface: Sparkle Finder");
    expect(prompt).toContain("linked Sparkle Suite rep");
    expect(prompt).toContain("BlingKitchen");
    expect(prompt).toContain("same Nic-Nac");
    expect(prompt).toContain("Finder tools only");
    expect(prompt).toContain("I need you logged into Sparkle Suite");
    expect(prompt).toContain("Open Sparkle Suite and I can pick it up there");
  });
});
