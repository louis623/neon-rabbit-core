import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FindThisForMe } from "../../components/nic-nac/FindThisForMe";
import { getLocalDevAuthState } from "../../lib/sparkle-finder/auth";
import { findNicNacMatchesForItem } from "../../lib/sparkle-finder/nic-nac";
import type { FinderAvailabilityResult } from "../../lib/sparkle-finder/catalog-service";
import type { JewelryItem } from "../../lib/sparkle-finder/types";

describe("Nic-Nac find-this-for-me flow", () => {
  it("returns exact item matches before same collection and type fallback matches", () => {
    const result = findNicNacMatchesForItem(getLocalDevAuthState("silver"), "jewel-rainbow-crown-ring");

    expect(result).toMatchObject({
      ok: true,
      requestedItem: {
        id: "jewel-rainbow-crown-ring",
      },
    });

    if (!result.ok) {
      throw new Error("Expected Silver Nic-Nac request to be allowed.");
    }

    expect(result.results.map((match) => match.matchType)).toEqual(["exact_item", "same_collection_type"]);
    expect(result.results[0]).toMatchObject({
      confidenceLabel: "Exact item lead",
      rep: {
        businessName: "Sierra Sparkle Studio",
        siteUrl: "https://sparklesuite.example/reps/sierra",
      },
      listing: {
        id: "listing-rainbow-crown-sierra",
        boardUrl: "https://sparklesuite.example/reps/sierra/board/rainbow-crown",
      },
      nextLiveShow: {
        id: "show-sierra-tonight",
        title: "Celestial Lights Preview",
      },
    });
  });

  it("maps Sparkle Suite API availability into bounded Nic-Nac exact and similar leads", () => {
    const result = findNicNacMatchesForItem(
      getLocalDevAuthState("silver"),
      "design-api",
      apiAvailability(),
    );

    if (!result.ok) {
      throw new Error("Expected Silver Nic-Nac API request to be allowed.");
    }

    expect(result.requestedItem).toMatchObject({
      id: "design-api",
      name: "Garden Gala Bracelet",
    });
    expect(result.results.map((match) => match.matchType)).toEqual(["exact_item", "same_collection_type"]);
    expect(result.results[0]).toMatchObject({
      confidenceLabel: "Exact item lead",
      matchedItem: {
        id: "design-api",
      },
      rep: {
        businessName: "Sparkle Suite Demo Boutique",
      },
      listing: {
        id: "listing-exact-api",
        boardUrl: "/amethyst/trade?c=rep-demo",
      },
      nextLiveShow: {
        id: "show-demo",
        title: "Demo Live",
      },
    });
  });

  it("falls back to same collection and jewelry type when no exact item lead is available", () => {
    const result = findNicNacMatchesForItem(getLocalDevAuthState("silver"), "jewel-lilac-orbit-ring");

    if (!result.ok) {
      throw new Error("Expected Silver Nic-Nac request to be allowed.");
    }

    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({
      matchType: "same_collection_type",
      confidenceLabel: "Same collection and type",
      matchedItem: {
        id: "jewel-moon-orbit-ring",
        collectionName: "Orbit Garden",
        jewelryType: "ring",
      },
      rep: {
        businessName: "Kelli Jo Sparkles",
      },
      listing: {
        id: "listing-moon-orbit-kelli",
      },
      nextLiveShow: {
        id: "show-kelli-glimmer",
      },
    });
  });

  it("returns a bounded no-match result without escalating into chat", () => {
    const result = findNicNacMatchesForItem(getLocalDevAuthState("silver"), "jewel-golden-heart-necklace");

    if (!result.ok) {
      throw new Error("Expected Silver Nic-Nac request to be allowed.");
    }

    expect(result.results).toEqual([]);
    expect(result.emptyState).toContain("No fixture-backed rep board leads yet");
  });

  it("shows the Silver upgrade prompt for Free and anonymous visitors instead of running search", () => {
    const freeResult = findNicNacMatchesForItem(getLocalDevAuthState("free"), "jewel-rainbow-crown-ring");
    const anonymousResult = findNicNacMatchesForItem(getLocalDevAuthState("anonymous"), "jewel-rainbow-crown-ring");
    const freeMarkup = renderToStaticMarkup(
      createElement(FindThisForMe, {
        accountState: getLocalDevAuthState("free"),
        jewelryItemId: "jewel-rainbow-crown-ring",
      }),
    );

    expect(freeResult).toMatchObject({
      ok: false,
      reason: "silver_required",
      results: [],
    });
    expect(anonymousResult).toMatchObject({
      ok: false,
      reason: "silver_required",
      results: [],
    });
    expect(freeMarkup).toContain("Browse for free. Let Nic-Nac hunt for you with Silver.");
    expect(freeMarkup).toContain("/silver");
    expect(freeMarkup).not.toContain("Sierra Sparkle Studio");
  });

  it("renders bounded Silver match results with rep, board, rep site, and next-show context", () => {
    const markup = renderToStaticMarkup(
      createElement(FindThisForMe, {
        accountState: getLocalDevAuthState("silver"),
        jewelryItemId: "jewel-rainbow-crown-ring",
      }),
    );

    expect(markup).toContain("Nic-Nac, find this for me");
    expect(markup).toContain("Sierra Sparkle Studio");
    expect(markup).toContain("Open rep board path");
    expect(markup).toContain("Open rep profile");
    expect(markup).toContain("Next show");
    expect(markup).not.toContain("chat");
  });

  it("renders API-backed Sparkle Suite leads with public rep links", () => {
    const markup = renderToStaticMarkup(
      createElement(FindThisForMe, {
        accountState: getLocalDevAuthState("silver"),
        jewelryItemId: "design-api",
        availability: {
          ...apiAvailability(),
          similarMatches: [],
        },
      }),
    );

    expect(markup).toContain("1 Sparkle Suite lead");
    expect(markup).toContain("https://www.yoursparklesuite.com/amethyst/trade?c=rep-demo");
    expect(markup).not.toContain("fixture lead");
    expect(markup).not.toContain("fixture-backed");
  });

  it("renders fixture-backed Nic-Nac results as preview leads with local rep board paths", () => {
    const markup = renderToStaticMarkup(
      createElement(FindThisForMe, {
        accountState: getLocalDevAuthState("silver"),
        jewelryItemId: "jewel-rainbow-crown-ring",
      }),
    );

    expect(markup).toContain("2 preview leads");
    expect(markup).toContain("/rep-boards?listing=rainbow-crown");
    expect(markup).not.toContain("Sparkle Suite lead");
  });

  it("does not invent a fallback lead when a Silver collection has no selected item", () => {
    const markup = renderToStaticMarkup(
      createElement(FindThisForMe, {
        accountState: getLocalDevAuthState("silver"),
      }),
    );

    expect(markup).toContain("Add an existing library record");
    expect(markup).not.toContain("Sierra Sparkle Studio");
    expect(markup).not.toContain("Exact item lead");
  });
});

function apiAvailability(): FinderAvailabilityResult {
  const requestedItem: JewelryItem = {
    id: "design-api",
    name: "Garden Gala Bracelet",
    collectionName: "Demo Garden",
    collectionYear: null,
    jewelryType: "bracelet",
    imageUrl: "",
    bpLabel: "standard",
    itemNumber: "BR1001",
    knownRepListingIds: [],
    searchTags: [],
    availableListingCount: 1,
  };

  return {
    requestedItem,
    exactMatches: [
      {
        listingId: "listing-exact-api",
        listedAt: "2026-06-06T12:00:00.000Z",
        photoUrl: "",
        item: requestedItem,
        rep: {
          repId: "rep-demo",
          displayName: "Demo Rep",
          businessName: "Sparkle Suite Demo Boutique",
          profilePhotoUrl: "",
          customerSitePath: "/amethyst?c=rep-demo",
          tradeBoardPath: "/amethyst/trade?c=rep-demo",
        },
        nextShow: {
          showId: "show-demo",
          repId: "rep-demo",
          platform: "TikTok",
          startsAt: "2026-06-06T20:00:00.000Z",
          durationMinutes: 60,
          title: "Demo Live",
          description: "",
          status: "scheduled",
        },
      },
    ],
    similarMatches: [
      {
        listingId: "listing-similar-api",
        listedAt: "2026-06-06T12:30:00.000Z",
        photoUrl: "",
        item: {
          ...requestedItem,
          id: "design-similar",
          name: "Garden Gala Sister Bracelet",
        },
        rep: {
          repId: "rep-demo",
          displayName: "Demo Rep",
          businessName: "Sparkle Suite Demo Boutique",
          profilePhotoUrl: "",
          customerSitePath: "/amethyst?c=rep-demo",
          tradeBoardPath: "/amethyst/trade?c=rep-demo",
        },
        nextShow: null,
      },
    ],
  };
}
