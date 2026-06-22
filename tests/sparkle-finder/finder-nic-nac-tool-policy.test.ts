import { describe, expect, it } from "vitest";
import { getFinderNicNacToolIntentsForText } from "../../lib/sparkle-finder/nic-nac/curator";
import {
  FINDER_NIC_NAC_TOOL_INTENT_CAPABILITIES,
  FINDER_SUITE_WORKSPACE_REQUIRED_MESSAGE,
  createFinderNicNacProductContext,
  filterFinderNicNacToolIntentsForContext,
} from "../../lib/sparkle-finder/nic-nac/tool-policy";

describe("Sparkle Finder Nic-Nac tool policy", () => {
  it("assigns every Finder routed intent to an explicit capability requirement", () => {
    expect(Object.keys(FINDER_NIC_NAC_TOOL_INTENT_CAPABILITIES).sort()).toEqual([
      "availability",
      "catalog",
      "collection",
      "memory",
      "profile",
      "rep_discovery",
      "showcase",
      "social",
      "studio",
      "suite_workspace",
    ]);
    expect(FINDER_NIC_NAC_TOOL_INTENT_CAPABILITIES.memory.requirement).toBe("finder_memory");
    expect(FINDER_NIC_NAC_TOOL_INTENT_CAPABILITIES.collection.requirement).toBe("finder_account");
    expect(FINDER_NIC_NAC_TOOL_INTENT_CAPABILITIES.suite_workspace.requirement).toBe("suite_workspace");
  });

  it("blocks Sparkle Suite workspace mutation requests on the Finder surface", () => {
    const requestedIntents = getFinderNicNacToolIntentsForText("Add ER13229 to my Trade Board.");

    expect(requestedIntents).toEqual(["suite_workspace"]);

    const result = filterFinderNicNacToolIntentsForContext(
      createFinderNicNacProductContext({
        actorType: "linked_rep",
        accountTier: "silver",
        linkedSuiteRepId: "suite-rep-1",
      }),
      requestedIntents,
    );

    expect(result.allowedIntents).toEqual([]);
    expect(result.allowedToolNames).toEqual([]);
    expect(result.blockedIntents).toEqual([
      {
        intent: "suite_workspace",
        reason: "suite_workspace_required",
        message: FINDER_SUITE_WORKSPACE_REQUIRED_MESSAGE,
      },
    ]);
  });

  it("distinguishes board discovery wording from Suite board mutation wording", () => {
    expect(getFinderNicNacToolIntentsForText("Show me my Trade Board.")).not.toContain("suite_workspace");
    expect(getFinderNicNacToolIntentsForText("List ER13229 on my Trade Board.")).toEqual(["suite_workspace"]);
  });

  it("blocks common shorthand for Suite workspace mutations", () => {
    expect(getFinderNicNacToolIntentsForText("Add ER13229 to my board.")).toEqual(["suite_workspace"]);
    expect(getFinderNicNacToolIntentsForText("Put ER13229 on my board.")).toEqual(["suite_workspace"]);
    expect(getFinderNicNacToolIntentsForText("Take ER13229 off my board.")).toEqual(["suite_workspace"]);
    expect(getFinderNicNacToolIntentsForText("Mark that trade as shipped.")).toEqual(["suite_workspace"]);
    expect(getFinderNicNacToolIntentsForText("Change my homepage hero.")).toEqual(["suite_workspace"]);
    expect(getFinderNicNacToolIntentsForText("Schedule my next live show.")).toEqual(["suite_workspace"]);
  });

  it("blocks all Finder tools on mixed Suite mutation and memory turns", () => {
    const requestedIntents = getFinderNicNacToolIntentsForText(
      "Add ER13229 to my Trade Board and remember I like short prompts.",
    );

    expect(requestedIntents).toEqual(["suite_workspace", "memory"]);

    const result = filterFinderNicNacToolIntentsForContext(
      createFinderNicNacProductContext({
        actorType: "linked_rep",
        accountTier: "silver",
        linkedSuiteRepId: "suite-rep-1",
      }),
      requestedIntents,
    );

    expect(result.allowedIntents).toEqual([]);
    expect(result.allowedToolNames).toEqual([]);
    expect(result.blockedIntents.map((blocked) => blocked.intent)).toEqual(["suite_workspace", "memory"]);
    expect(result.blockedIntents.every((blocked) => blocked.reason === "suite_workspace_required")).toBe(true);
  });

  it("keeps normal Finder discovery tools available for linked reps", () => {
    const result = filterFinderNicNacToolIntentsForContext(
      createFinderNicNacProductContext({
        actorType: "linked_rep",
        accountTier: "silver",
        linkedSuiteRepId: "suite-rep-1",
      }),
      ["memory", "rep_discovery", "availability"],
    );

    expect(result.allowedIntents).toEqual(["memory", "rep_discovery", "availability"]);
    expect(result.allowedToolNames).toEqual([
      "read_customer_memory",
      "write_customer_memory",
      "list_favorite_reps",
      "save_favorite_rep",
      "find_rep_board_availability",
      "list_upcoming_live_shows",
    ]);
    expect(result.blockedIntents).toEqual([]);
  });

  it("keeps Finder collection, Showcase, Studio, and profile tools available for linked reps", () => {
    const result = filterFinderNicNacToolIntentsForContext(
      createFinderNicNacProductContext({
        actorType: "linked_rep",
        accountTier: "silver",
        linkedSuiteRepId: "suite-rep-1",
      }),
      ["collection", "showcase", "studio", "profile"],
    );

    expect(result.allowedIntents).toEqual(["collection", "showcase", "studio", "profile"]);
    expect(result.allowedToolNames).toEqual([
      "list_customer_collection",
      "save_my_collection_item",
      "summarize_my_showcase",
      "save_my_showcase_piece",
      "get_showcase_studio_requirements",
      "read_my_profile_status",
      "update_my_profile",
    ]);
    expect(result.blockedIntents).toEqual([]);
  });
});
