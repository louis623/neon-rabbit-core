import { describe, expect, it } from "vitest";
import {
  getFinderNicNacToolIntentsForText,
  summarizeFinderNicNacMemoryHints,
} from "../../lib/sparkle-finder/nic-nac/curator";
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
