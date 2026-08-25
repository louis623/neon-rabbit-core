import { describe, expect, it, vi } from "vitest";
import {
  getFinderAvailabilityForJewelryItem,
} from "../../lib/sparkle-finder/catalog-service";
import {
  submitShowcaseStudioIntake,
  type ShowcaseStudioIntakeRequest,
} from "../../lib/sparkle-finder/showcase-studio";
import { runSparkleSuiteFinderContractCheck } from "../../scripts/check-sparkle-suite-finder-api";
import {
  suiteV2AvailabilityFixture,
  suiteV2CatalogFixture,
  suiteV2FixtureIds,
  suiteV2StudioFixture,
} from "../fixtures/sparkle-suite-finder-v2";

const baseUrl = "https://suite.example";

describe("sanitized Sparkle Suite v2 compatibility fixtures", () => {
  it("walks three catalog pages without collapsing same-item-number variants", async () => {
    const fetcher = makeFixtureContractFetcher();

    const report = await runSparkleSuiteFinderContractCheck({ baseUrl, fetcher, mode: "strict" });

    expect(report).toMatchObject({
      ok: true,
      catalogSchemaVersion: 2,
      catalogItems: 4,
      catalogPagesRead: 3,
      availabilityMatches: 2,
      availabilityLeads: 4,
      availabilityDancers: 7,
    });
    expect(report.failures).toEqual([]);
    expect(suiteV2CatalogFixture.pages[0].items.map((item) => [item.designId, item.itemNumber])).toEqual([
      [suiteV2FixtureIds.ruby, "SYN-100"],
      [suiteV2FixtureIds.quartz, "SYN-100"],
    ]);
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining("cursor=catalog-page-3"),
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining("exactCursor=exact-page-3"),
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("rejects non-adjacent cursor cycles and exact identities repeated after page two", async () => {
    const report = await runSparkleSuiteFinderContractCheck({
      baseUrl,
      fetcher: makeFixtureContractFetcher({ cycleThirdPages: true, repeatThirdPageIdentities: true }),
      mode: "strict",
    });

    expect(report.ok).toBe(false);
    expect(report.failures).toEqual(expect.arrayContaining([
      `catalog page 3 repeats designId ${suiteV2FixtureIds.ruby} from page 1.`,
      "catalog pagination repeated a prior cursor.",
      "availability exact page 3 repeats listingId listing-exact-1 from page 1.",
      "availability exact pagination repeated a prior cursor.",
    ]));
  });

  it("preserves positive quantities and clears zero and removed dancers", async () => {
    const read = (payload: unknown) => getFinderAvailabilityForJewelryItem(suiteV2FixtureIds.ruby, {
      apiBaseUrl: baseUrl,
      fetcher: vi.fn(async () => json(payload)),
    });

    const positive = await read(suiteV2AvailabilityFixture.positivePages[0]);
    const zero = await read(suiteV2AvailabilityFixture.zero);
    const beforeRemoval = await read(suiteV2AvailabilityFixture.removed.before);
    const afterRemoval = await read(suiteV2AvailabilityFixture.removed.after);

    expect(positive?.exactMatches[0]).toMatchObject({ listingId: "listing-exact-1", quantityAvailable: 2 });
    expect(positive?.similarMatches[0]).toMatchObject({ listingId: "listing-similar-1", quantityAvailable: 1 });
    expect(positive?.exactPageInfo).toMatchObject({ totalLeadCount: 3, totalDancerCount: 6 });
    expect(zero).toMatchObject({ exactMatches: [], similarMatches: [] });
    expect(zero?.exactPageInfo.totalDancerCount).toBe(0);
    expect(beforeRemoval?.exactMatches[0]).toMatchObject({ listingId: "listing-removed", quantityAvailable: 2 });
    expect(afterRemoval).toMatchObject({ exactMatches: [], similarMatches: [] });
    expect(afterRemoval?.exactPageInfo).toMatchObject({ totalLeadCount: 0, totalDancerCount: 0 });
  });

  it("preserves Studio ambiguity and a stable-submission replay outcome", async () => {
    const resolveRequest = studioResolveRequest();
    const ambiguityFetcher = vi.fn(async (input: string, init?: RequestInit) => {
      expect(input).toBe(studioConfig().apiUrl);
      expect(init?.method).toBe("POST");
      return json(suiteV2StudioFixture.ambiguity);
    });
    const replayFetcher = vi.fn(async (input: string, init?: RequestInit) => {
      expect(input).toBe(studioConfig().apiUrl);
      expect(init?.method).toBe("POST");
      return json(suiteV2StudioFixture.replay);
    });
    const ambiguity = await submitShowcaseStudioIntake(resolveRequest, {
      config: studioConfig(),
      fetcher: ambiguityFetcher,
    });
    const replay = await submitShowcaseStudioIntake(resolveRequest, {
      config: studioConfig(),
      fetcher: replayFetcher,
    });

    const ambiguityBody = JSON.parse(String(ambiguityFetcher.mock.calls[0]?.[1]?.body));
    const replayBody = JSON.parse(String(replayFetcher.mock.calls[0]?.[1]?.body));
    expect(ambiguityBody).toMatchObject({ action: "resolve", finderSubmissionId: suiteV2FixtureIds.submission });
    expect(replayBody).toMatchObject({ action: "resolve", finderSubmissionId: suiteV2FixtureIds.submission });
    expect(replayBody.photoEvidence).toEqual(ambiguityBody.photoEvidence);

    expect(ambiguity).toMatchObject({
      ok: true,
      status: "needs_variant_confirmation",
      mutationReplayed: false,
      variantCandidates: [
        {
          designId: suiteV2FixtureIds.ruby,
          itemNumber: "SYN-100",
          mainStone: "Ruby",
          description: "Sanitized Ruby Studio fixture.",
        },
        {
          designId: suiteV2FixtureIds.quartz,
          itemNumber: "SYN-100",
          mainStone: "Rose Quartz",
          description: "Sanitized Rose Quartz Studio fixture.",
        },
      ],
    });
    expect(replay).toMatchObject({
      ok: true,
      status: "accepted",
      mutationReplayed: true,
      suiteDesignId: suiteV2FixtureIds.ruby,
    });
  });
});

function makeFixtureContractFetcher(
  options: { cycleThirdPages?: boolean; repeatThirdPageIdentities?: boolean } = {},
) {
  return vi.fn(async (input: string, init?: RequestInit) => {
    const url = new URL(input);
    if (url.pathname.endsWith("/catalog/batch")) {
      expect(init?.method).toBe("POST");
      return json(suiteV2CatalogFixture.batch);
    }
    if (url.pathname.endsWith("/catalog/facets")) return json(suiteV2CatalogFixture.facets);
    if (url.pathname.endsWith("/catalog")) {
      const cursor = url.searchParams.get("cursor");
      if (cursor === "catalog-page-2") return json(suiteV2CatalogFixture.pages[1]);
      if (cursor === "catalog-page-3") {
        const fixture = suiteV2CatalogFixture.pages[2];
        return json({
          ...fixture,
          items: options.repeatThirdPageIdentities ? [suiteV2CatalogFixture.pages[0].items[0]] : fixture.items,
          pageInfo: options.cycleThirdPages
            ? { ...fixture.pageInfo, hasMore: true, nextCursor: "catalog-page-2" }
            : fixture.pageInfo,
        });
      }
      return json(suiteV2CatalogFixture.pages[0]);
    }
    if (url.pathname.endsWith("/availability")) {
      const cursor = url.searchParams.get("exactCursor");
      if (cursor === "exact-page-2") return json(suiteV2AvailabilityFixture.positivePages[1]);
      if (cursor === "exact-page-3") {
        const fixture = suiteV2AvailabilityFixture.positivePages[2];
        const repeatedMatch = {
          ...fixture.exactMatches[0],
          listingId: "listing-exact-1",
        };
        return json({
          ...fixture,
          exactMatches: options.repeatThirdPageIdentities ? [repeatedMatch] : fixture.exactMatches,
          exactPageInfo: options.cycleThirdPages
            ? { ...fixture.exactPageInfo, hasMore: true, nextCursor: "exact-page-2" }
            : fixture.exactPageInfo,
        });
      }
      return json(suiteV2AvailabilityFixture.positivePages[0]);
    }
    if (url.pathname.endsWith("/live-shows")) return json({ shows: [] });
    if (url.pathname.endsWith("/reps")) return json({ reps: [] });
    return new Response("missing", { status: 404 });
  });
}

function studioResolveRequest(): Extract<ShowcaseStudioIntakeRequest, { action: "resolve" }> {
  return {
    finderSubmissionId: suiteV2FixtureIds.submission,
    action: "resolve",
    labelDetails: { itemNumber: "SYN-100", mainStone: "Ruby", material: "Rose gold" },
    photoEvidence: [
      {
        finderSubmissionId: suiteV2FixtureIds.submission,
        finderAssetId: "30000000-0000-4000-8000-000000000001",
        claimedKind: "label",
      },
      {
        finderSubmissionId: suiteV2FixtureIds.submission,
        finderAssetId: "30000000-0000-4000-8000-000000000002",
        claimedKind: "jewelry",
      },
    ],
  };
}

function studioConfig() {
  return { apiUrl: `${baseUrl}/api/internal/finder/jewelry-intake/v2`, bearerToken: "synthetic-token" };
}

function json(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
