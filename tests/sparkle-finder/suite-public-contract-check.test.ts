import { describe, expect, it, vi } from "vitest";
import {
  formatSparkleSuiteFinderContractReport,
  runSparkleSuiteFinderContractCheck,
} from "../../scripts/check-sparkle-suite-finder-api";

const baseUrl = "https://suite.example";
const missingProbe = "00000000-0000-4000-8000-000000000000";

describe("Sparkle Suite public Finder contract checker", () => {
  it("accepts a complete strict v2 contract and checks second pages", async () => {
    const fetcher = makeStrictFetcher();

    const report = await runSparkleSuiteFinderContractCheck({ baseUrl, fetcher, mode: "strict" });

    expect(report.failures).toEqual([]);
    expect(report).toMatchObject({
      ok: true,
      catalogSchemaVersion: 2,
      catalogItems: 3,
      catalogPagesRead: 2,
      availabilityMatches: 2,
      availabilityLeads: 4,
      availabilityDancers: 7,
      availabilityPositiveInventory: true,
      capabilities: {
        catalogPagination: "supported",
        catalogBatch: "supported",
        availabilityQuantity: "supported",
        availabilityPagination: "supported",
      },
    });
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining("cursor=catalog-next"),
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(fetcher).toHaveBeenCalledWith(
      `${baseUrl}/api/public/finder/catalog/batch`,
      expect.objectContaining({ method: "POST", cache: "no-store" }),
    );
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining("exactCursor=exact-next"),
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining("similarCursor=similar-next"),
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("understands current nested legacy availability and reports unsupported capabilities", async () => {
    const fetcher = vi.fn(async (input: string) => {
      const url = new URL(input);
      if (url.pathname.endsWith("/catalog")) {
        return json({ items: [catalogItem("design-legacy", false)] });
      }
      if (url.pathname.endsWith("/availability")) {
        return json({
          requestedItem: { designId: "design-legacy" },
          exactMatches: [availabilityMatch("listing-legacy", "design-legacy")],
          similarMatches: [],
        });
      }
      if (url.pathname.endsWith("/live-shows")) return json({ shows: [] });
      if (url.pathname.endsWith("/reps")) return json({ reps: [] });
      return new Response("missing", { status: 404 });
    });

    const report = await runSparkleSuiteFinderContractCheck({ baseUrl, fetcher, mode: "diagnostic" });

    expect(report).toMatchObject({
      ok: true,
      catalogSchemaVersion: "legacy",
      availabilityMatches: 1,
      availabilityLeads: null,
      availabilityDancers: null,
      availabilityPositiveInventory: false,
      capabilities: {
        catalogPagination: "unsupported",
        catalogBatch: "unsupported",
        availabilityQuantity: "unsupported",
        availabilityPagination: "unsupported",
      },
    });
    expect(report.failures).toEqual([]);
    expect(formatSparkleSuiteFinderContractReport(report)).toContain("CATALOG_PAGINATION=unsupported");
    expect(formatSparkleSuiteFinderContractReport(report)).toContain("AVAILABILITY_QUANTITY=unsupported");
    expect(fetcher.mock.calls.some(([url]) => String(url).endsWith("/catalog/batch"))).toBe(false);
  });

  it("fails malformed v2 page metadata, exact identity, and quantity", async () => {
    const fetcher = makeStrictFetcher({ malformedV2: true });

    const report = await runSparkleSuiteFinderContractCheck({ baseUrl, fetcher, mode: "strict" });

    expect(report.ok).toBe(false);
    expect(report.failures).toEqual(
      expect.arrayContaining([
        "catalog page 1 pageInfo has invalid totalCount.",
        "catalog page 1 pageInfo requires a nonempty nextCursor when hasMore is true.",
        "availability page 1 exact match 1 does not preserve exact requested designId.",
        "availability page 1 exact match 1 quantityAvailable must be a positive integer.",
      ]),
    );
  });

  it("fails repeated catalog cursors and design IDs across pages", async () => {
    const fetcher = makeStrictFetcher({ repeatCatalogPage: true });

    const report = await runSparkleSuiteFinderContractCheck({ baseUrl, fetcher, mode: "strict" });

    expect(report.ok).toBe(false);
    expect(report.failures).toContain("catalog page 2 pageInfo repeated the requested cursor.");
    expect(report.failures).toContain("catalog page 2 repeats designId design-a from page 1.");
  });

  it("fails repeated listing IDs across availability pages", async () => {
    const fetcher = makeStrictFetcher({ repeatAvailabilityPage: true });

    const report = await runSparkleSuiteFinderContractCheck({ baseUrl, fetcher, mode: "strict" });

    expect(report.ok).toBe(false);
    expect(report.failures).toContain(
      "availability exact page 2 repeats listingId listing-exact-1 from page 1.",
    );
    expect(report.failures).toContain(
      "availability similar page 2 repeats listingId listing-similar-1 from page 1.",
    );
  });

  it("allows a valid strict contract with zero positive public inventory", async () => {
    const fetcher = makeStrictFetcher({ zeroInventory: true });

    const report = await runSparkleSuiteFinderContractCheck({ baseUrl, fetcher, mode: "strict" });

    expect(report.failures).toEqual([]);
    expect(report).toMatchObject({
      ok: true,
      availabilityMatches: 0,
      availabilityLeads: 0,
      availabilityDancers: 0,
      availabilityPositiveInventory: false,
      capabilities: {
        availabilityQuantity: "supported",
        availabilityPagination: "supported",
      },
    });
  });
});

function makeStrictFetcher(
  options: {
    malformedV2?: boolean;
    repeatCatalogPage?: boolean;
    repeatAvailabilityPage?: boolean;
    zeroInventory?: boolean;
  } = {},
) {
  return vi.fn(async (input: string, init?: RequestInit) => {
    const url = new URL(input);

    if (url.pathname.endsWith("/catalog/batch")) {
      expect(init?.method).toBe("POST");
      return json({
        schemaVersion: 2,
        items: [catalogItem("design-a")],
        missingDesignIds: [missingProbe],
      });
    }

    if (url.pathname.endsWith("/catalog")) {
      if (url.searchParams.has("cursor")) {
        return json({
          schemaVersion: 2,
          items: [catalogItem(options.repeatCatalogPage ? "design-a" : "design-c")],
          pageInfo: {
            totalCount: 3,
            hasMore: options.repeatCatalogPage === true,
            nextCursor: options.repeatCatalogPage ? "catalog-next" : null,
          },
        });
      }
      return json({
        schemaVersion: 2,
        items: [catalogItem("design-a"), catalogItem("design-b")],
        pageInfo: options.malformedV2
          ? { totalCount: -1, hasMore: true, nextCursor: null }
          : { totalCount: 3, hasMore: true, nextCursor: "catalog-next" },
      });
    }

    if (url.pathname.endsWith("/availability")) {
      if (options.zeroInventory) {
        return json(availabilityResponse([], [], zeroPageInfo(), zeroPageInfo()));
      }

      if (url.searchParams.has("exactCursor")) {
        const listingId = options.repeatAvailabilityPage ? "listing-exact-1" : "listing-exact-2";
        return json(
          availabilityResponse(
            [availabilityMatch(listingId, "design-a", 1)],
            [],
            { totalLeadCount: 2, totalDancerCount: 3, hasMore: false, nextCursor: null },
            zeroPageInfo(),
          ),
        );
      }

      if (url.searchParams.has("similarCursor")) {
        const listingId = options.repeatAvailabilityPage ? "listing-similar-1" : "listing-similar-2";
        return json(
          availabilityResponse(
            [],
            [availabilityMatch(listingId, "design-similar-2", 1)],
            zeroPageInfo(),
            { totalLeadCount: 2, totalDancerCount: 4, hasMore: false, nextCursor: null },
          ),
        );
      }

      const exact = availabilityMatch(
        "listing-exact-1",
        options.malformedV2 ? "wrong-design" : "design-a",
        options.malformedV2 ? 0 : 2,
      );
      return json(
        availabilityResponse(
          [exact],
          [availabilityMatch("listing-similar-1", "design-similar-1", 3)],
          { totalLeadCount: 2, totalDancerCount: 3, hasMore: true, nextCursor: "exact-next" },
          { totalLeadCount: 2, totalDancerCount: 4, hasMore: true, nextCursor: "similar-next" },
        ),
      );
    }

    if (url.pathname.endsWith("/live-shows")) return json({ shows: [] });
    if (url.pathname.endsWith("/reps")) return json({ reps: [] });
    return new Response("missing", { status: 404 });
  });
}

function catalogItem(designId: string, v2 = true) {
  return {
    designId,
    itemNumber: designId === "design-a" ? "RBP5902" : `ER-${designId}`,
    designName: `Design ${designId}`,
    description: v2 ? `Description ${designId}` : undefined,
    availableListingCount: 0,
  };
}

function availabilityMatch(listingId: string, designId: string, quantityAvailable?: number) {
  return {
    listingId,
    listedAt: "2026-08-25T12:00:00.000Z",
    photoUrl: null,
    photoSource: "canonical",
    ...(quantityAvailable === undefined ? {} : { quantityAvailable }),
    item: { designId },
    rep: {
      repId: "rep-1",
      showName: "Demo Sparkle",
      repFirstName: "Demo",
      customerSiteUrl: `${baseUrl}/demo`,
    },
    nextShow: {
      showId: "show-1",
      repId: "rep-1",
      startsAt: "2026-08-26T12:00:00.000Z",
      title: "Demo Sparkle",
      status: "scheduled",
    },
  };
}

function availabilityResponse(
  exactMatches: unknown[],
  similarMatches: unknown[],
  exactPageInfo: ReturnType<typeof zeroPageInfo>,
  similarPageInfo: ReturnType<typeof zeroPageInfo>,
) {
  return {
    schemaVersion: 2,
    requestedItem: { designId: "design-a" },
    exactMatches,
    similarMatches,
    exactPageInfo,
    similarPageInfo,
  };
}

function zeroPageInfo(): {
  totalLeadCount: number;
  totalDancerCount: number;
  hasMore: boolean;
  nextCursor: string | null;
} {
  return { totalLeadCount: 0, totalDancerCount: 0, hasMore: false, nextCursor: null };
}

function json(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
