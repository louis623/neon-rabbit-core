import { describe, expect, it } from "vitest";
import {
  getDiamondAndUnicornItems,
  getJewelryItems,
  matchJewelryItemToRepBoardListings,
} from "../../lib/sparkle-finder/service";
import {
  filterJewelryItemsByBombPartyLabel,
  filterJewelryItemsByCollection,
  filterJewelryItemsByJewelryType,
  searchJewelryItemsByText,
  withNextShowContext,
} from "../../lib/sparkle-finder/search";
import type { JewelryItem } from "../../lib/sparkle-finder/types";

describe("Sparkle Finder fixture search adapters", () => {
  it("returns available exact board listing matches before broader matches", () => {
    const matches = matchJewelryItemToRepBoardListings("jewel-rainbow-crown-ring");

    expect(matches[0]).toMatchObject({
      requestId: "fixture-request-jewel-rainbow-crown-ring",
      jewelryItemId: "jewel-rainbow-crown-ring",
      matchType: "exact_item",
      confidenceLabel: "exact",
    });
    expect(matches.some((match) => match.matchType === "same_collection_type")).toBe(true);
  });

  it("falls back to same collection and jewelry type when no exact listing is available", () => {
    const matches = matchJewelryItemToRepBoardListings("jewel-lilac-orbit-ring");

    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      requestId: "fixture-request-jewel-lilac-orbit-ring",
      jewelryItemId: "jewel-lilac-orbit-ring",
      matchType: "same_collection_type",
      confidenceLabel: "similar",
    });
  });

  it("filters Diamonds & Unicorns items using Bomb Party labels only", () => {
    const items = getDiamondAndUnicornItems();

    expect(items).toHaveLength(4);
    expect(items.map((item) => item.bpLabel).sort()).toEqual([
      "diamond",
      "diamond",
      "unicorn",
      "unicorn",
    ]);
    expect(filterJewelryItemsByBombPartyLabel(items, "standard")).toEqual([]);
  });

  it("filters fixture jewelry by collection, jewelry type, text, and next-show context", () => {
    const collectionItems = filterJewelryItemsByCollection("Celestial Lights");
    const ringItems = filterJewelryItemsByJewelryType(collectionItems, "ring");
    const textMatches = searchJewelryItemsByText(ringItems, "crown");
    const contextualMatches = withNextShowContext(textMatches);

    expect(textMatches).toHaveLength(1);
    expect(contextualMatches[0]).toMatchObject({
      id: "jewel-rainbow-crown-ring",
      nextLiveShow: expect.objectContaining({
        id: "show-sierra-tonight",
        status: "scheduled",
      }),
    });
  });

  it("searches API-shaped jewelry records by tags and collection year", () => {
    const items: JewelryItem[] = [
      {
        id: "design-api",
        name: "Garden Gala Bracelet",
        collectionName: "Garden Gala",
        collectionYear: 2026,
        jewelryType: "bracelet",
        imageUrl: "",
        bpLabel: "standard",
        itemNumber: "BR1001",
        knownRepListingIds: [],
        searchTags: ["rose gold", "garden"],
        availableListingCount: 1,
      },
    ];

    expect(searchJewelryItemsByText(items, "rose gold")).toHaveLength(1);
    expect(searchJewelryItemsByText(items, "2026")).toHaveLength(1);
  });

  it("returns empty arrays for searches and matches with no fixture result", () => {
    expect(searchJewelryItemsByText(undefined, "no-such-sparkle")).toEqual([]);
    expect(filterJewelryItemsByCollection("Unknown Collection")).toEqual([]);
    expect(matchJewelryItemToRepBoardListings("jewel-missing")).toEqual([]);
  });

  it("returns fresh fixture records so callers cannot mutate adapter state", () => {
    const firstRead = getJewelryItems();

    firstRead[0].name = "Changed Outside The Adapter";

    expect(getJewelryItems()[0].name).toBe("Rainbow Crown Ring");
  });
});
