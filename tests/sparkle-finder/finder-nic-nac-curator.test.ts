import { describe, expect, it } from "vitest";
import {
  getFinderNicNacToolIntentsForText,
  summarizeFinderNicNacMemoryHints,
} from "../../lib/sparkle-finder/nic-nac/curator";
import { listFinderNicNacToolNamesForIntents } from "../../lib/sparkle-finder/nic-nac/tools";
import {
  createInMemoryCustomerMemoryStore,
  getSafeCustomerMemoryForPrompt,
  writeCustomerMemory,
} from "../../lib/sparkle-finder/customer-memory";

describe("Sparkle Finder Nic-Nac curator", () => {
  it("routes collector memory, favorite reps, and rep discovery to scoped Finder tools", () => {
    expect(getFinderNicNacToolIntentsForText("Remember that I mostly collect rose gold rings.")).toContain("memory");
    expect(getFinderNicNacToolIntentsForText("Kelli Jo is one of my favorite reps.")).toEqual(["memory", "rep_discovery"]);
    expect(getFinderNicNacToolIntentsForText("Find Lindsey's next live show for this necklace.")).toContain("rep_discovery");
    expect(getFinderNicNacToolIntentsForText("Upload a missing piece from the April birthday collection.")).toContain("studio");
  });

  it("routes favorite-rep and public-collector social requests without purchase intent", () => {
    expect(getFinderNicNacToolIntentsForText("Who are my favorite reps?")).toEqual(["memory", "rep_discovery"]);
    expect(getFinderNicNacToolIntentsForText("Show me Lindsey's next live.")).toEqual(["rep_discovery"]);
    expect(getFinderNicNacToolIntentsForText("Remember Kelli Jo as one of my favorite reps.")).toEqual([
      "memory",
      "rep_discovery",
    ]);
    expect(getFinderNicNacToolIntentsForText("Find collectors with public Showcases like mine.")).toContain("social");
    expect(getFinderNicNacToolIntentsForText("Who am I following?")).toEqual(["social"]);
    expect(getFinderNicNacToolIntentsForText("Show followed collectors.")).toEqual(["social"]);
    expect(getFinderNicNacToolIntentsForText("Buy from this member.")).not.toContain("rep_discovery");
  });

  it("routes show-time requests to rep discovery and availability tools", () => {
    expect(getFinderNicNacToolIntentsForText("What is the next show time?")).toEqual([
      "rep_discovery",
      "availability",
    ]);
    expect(getFinderNicNacToolIntentsForText("Find my show-time for tonight")).toEqual([
      "rep_discovery",
      "availability",
    ]);
  });

  it("lists bounded social tool names for public collector prompts", () => {
    expect(listFinderNicNacToolNamesForIntents(["social"])).toEqual([
      "find_public_showcases",
      "list_followed_collectors",
    ]);
  });

  it("lists bounded availability tool names for rep board and live-show prompts", () => {
    expect(listFinderNicNacToolNamesForIntents(["availability"])).toEqual([
      "find_rep_board_availability",
      "list_upcoming_live_shows",
    ]);
  });

  it("lists bounded collection, Showcase, Studio, and profile tool names", () => {
    expect(listFinderNicNacToolNamesForIntents(["collection", "showcase", "studio", "profile"])).toEqual([
      "list_customer_collection",
      "summarize_my_showcase",
      "get_showcase_studio_requirements",
      "read_my_profile_status",
    ]);
  });

  it("stores safe customer-scoped curator memory without leaking between customers", async () => {
    const store = createInMemoryCustomerMemoryStore();

    await writeCustomerMemory(store, {
      userId: "customer-a",
      memoryType: "style_preference",
      summary: "Usually collects rose gold rings.",
      source: "explicit",
      confidence: "high",
    });
    await writeCustomerMemory(store, {
      userId: "customer-a",
      memoryType: "favorite_rep",
      summary: "Favorite rep: Kelli Jo.",
      source: "explicit",
      confidence: "high",
    });
    await writeCustomerMemory(store, {
      userId: "customer-b",
      memoryType: "current_hunt",
      summary: "Hunting April birthday earrings.",
      source: "explicit",
      confidence: "high",
    });

    const customerAMemory = await getSafeCustomerMemoryForPrompt(store, "customer-a");
    const customerBMemory = await getSafeCustomerMemoryForPrompt(store, "customer-b");

    expect(customerAMemory.map((memory) => memory.summary)).toEqual([
      "Usually collects rose gold rings.",
      "Favorite rep: Kelli Jo.",
    ]);
    expect(customerBMemory.map((memory) => memory.summary)).toEqual(["Hunting April birthday earrings."]);
  });

  it("rejects unsafe or unrelated life-story memory and only summarizes Finder-safe hints", async () => {
    const store = createInMemoryCustomerMemoryStore();

    const rejected = await writeCustomerMemory(store, {
      userId: "customer-a",
      memoryType: "guarded_note",
      summary: "My credit card is 4242 4242 4242 4242 and my password is sparkle.",
      source: "explicit",
      confidence: "high",
    });
    const saved = await writeCustomerMemory(store, {
      userId: "customer-a",
      memoryType: "current_hunt",
      summary: "Current hunt: April birthday earrings.",
      source: "explicit",
      confidence: "high",
    });

    const safeMemory = await getSafeCustomerMemoryForPrompt(store, "customer-a");

    expect(rejected).toEqual({ ok: false, reason: "unsafe_memory" });
    expect(saved).toMatchObject({ ok: true });
    expect(summarizeFinderNicNacMemoryHints(safeMemory)).toEqual(["Current hunt: April birthday earrings."]);
  });
});
