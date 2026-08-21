import { describe, expect, it, vi } from "vitest";
import {
  getCatalogJewelryItemById,
  getCatalogFacetOptions,
  getCatalogJewelryItems,
  getFinderAvailabilityForJewelryItem,
  getFinderLiveShows,
  getFinderRepDirectoryData,
  getSparkleSuiteFinderPublicBaseUrl,
  mapSparkleSuiteFinderCatalogItem,
  mapSparkleSuiteFinderJewelryType,
  type SparkleSuiteFinderCatalogItem,
  type SparkleSuiteFinderRepDirectoryItem,
} from "../../lib/sparkle-finder/catalog-service";

describe("Sparkle Finder public API catalog service", () => {
  it("maps Sparkle Suite Finder API catalog items into Finder library records", () => {
    const item = mapSparkleSuiteFinderCatalogItem(
      apiCatalogItem({
        designName: "Starlight Diamond Ring",
        jewelryType: "ring",
        searchTags: ["rose gold", "diamond"],
      }),
    );

    expect(item).toEqual({
      id: "design-123",
      name: "Starlight Diamond Ring",
      collectionName: "Midnight Garden",
      collectionYear: 2026,
      jewelryType: "ring",
      material: "Rose gold",
      mainStone: "Pink stone",
      bpMsrp: 19.95,
      imageUrl: "https://cdn.example.test/design-123.jpg",
      bpLabel: "diamond",
      itemNumber: "RG1234",
      searchTags: ["rose gold", "diamond"],
      availableListingCount: 2,
      knownRepListingIds: [],
    });
  });

  it("keeps Sparkle Suite stack items as a first-class Finder type", () => {
    expect(mapSparkleSuiteFinderJewelryType("stack")).toBe("stack");
    expect(mapSparkleSuiteFinderJewelryType("bracelet")).toBe("bracelet");
    expect(mapSparkleSuiteFinderJewelryType("earrings")).toBe("earrings");
    expect(mapSparkleSuiteFinderJewelryType("necklace")).toBe("necklace");
    expect(mapSparkleSuiteFinderJewelryType("ring")).toBe("ring");
  });

  it("reads catalog items from the Sparkle Suite public Finder API", async () => {
    const fetchCatalog = vi.fn(async () => jsonResponse({ items: [apiCatalogItem({ designId: "design-api" })] }));

    const items = await getCatalogJewelryItems({
      apiBaseUrl: "https://suite.example",
      fetcher: fetchCatalog,
      useFixtureFallback: false,
    });

    expect(fetchCatalog).toHaveBeenCalledWith("https://suite.example/api/public/finder/catalog?limit=50", {
      cache: "no-store",
    });
    expect(items).toEqual([
      expect.objectContaining({
        id: "design-api",
        itemNumber: "RG1234",
        material: "Rose gold",
        mainStone: "Pink stone",
        bpMsrp: 19.95,
        collectionYear: 2026,
        searchTags: ["rose gold"],
        availableListingCount: 2,
      }),
    ]);
  });

  it("passes structured catalog browse filters to the Sparkle Suite public Finder API", async () => {
    const fetchCatalog = vi.fn(async () => jsonResponse({ items: [] }));

    await getCatalogJewelryItems({
      apiBaseUrl: "https://suite.example",
      fetcher: fetchCatalog,
      useFixtureFallback: false,
      query: "opal",
      type: "ring",
      collection: "Midnight Garden",
      material: "Rose gold",
      mainStone: "Pink stone",
      label: "diamond",
      collectionYear: 2026,
      limit: 12,
    });

    expect(fetchCatalog).toHaveBeenCalledWith(
      "https://suite.example/api/public/finder/catalog?limit=12&query=opal&type=ring&collection=Midnight+Garden&material=Rose+gold&stone=Pink+stone&label=diamond&year=2026",
      {
        cache: "no-store",
      },
    );
  });

  it("reads dynamic catalog facets from the Sparkle Suite public Finder API", async () => {
    const fetchFacets = vi.fn(async () =>
      jsonResponse({
        facets: {
          collections: [{ value: "Midnight Garden", count: 2 }],
          materials: [{ value: "Rose gold", count: 2 }],
          stones: [{ value: "Pearl", count: 1 }],
          types: [{ value: "ring", count: 2 }],
          labels: [{ value: "diamond", count: 1 }],
          years: [{ value: "2026", count: 2 }],
        },
      }),
    );

    const facets = await getCatalogFacetOptions({
      apiBaseUrl: "https://suite.example",
      fetcher: fetchFacets,
      useFixtureFallback: false,
      query: "opal",
      type: "ring",
      collection: "Midnight Garden",
      material: "Rose gold",
      mainStone: "Pearl",
      label: "diamond",
      collectionYear: 2026,
    });

    expect(fetchFacets).toHaveBeenCalledWith(
      "https://suite.example/api/public/finder/catalog/facets?query=opal&type=ring&collection=Midnight+Garden&material=Rose+gold&stone=Pearl&label=diamond&year=2026",
      { cache: "no-store" },
    );
    expect(facets.stones).toEqual([{ value: "Pearl", count: 1 }]);
    expect(facets.materials).toEqual([{ value: "Rose gold", count: 2 }]);
  });

  it("derives fixture facet options without showing unused stone filters", async () => {
    const facets = await getCatalogFacetOptions({
      apiBaseUrl: "",
    });

    expect(facets.collections.length).toBeGreaterThan(0);
    expect(facets.stones).toEqual([]);
    expect(JSON.stringify(facets)).not.toContain("Pearl");
  });

  it("can disable fixture fallback when a live API read fails", async () => {
    const fetchCatalog = vi.fn(async () => new Response("not found", { status: 404 }));

    const items = await getCatalogJewelryItems({
      apiBaseUrl: "https://suite.example",
      fetcher: fetchCatalog,
      useFixtureFallback: false,
    });

    expect(items).toEqual([]);
  });

  it("fetches a single catalog item by Sparkle Suite designId", async () => {
    const fetchDetail = vi.fn(async () => jsonResponse({ item: apiCatalogItem({ designId: "design-single" }) }));

    const item = await getCatalogJewelryItemById("design-single", {
      apiBaseUrl: "https://suite.example/",
      fetcher: fetchDetail,
      useFixtureFallback: false,
    });

    expect(fetchDetail).toHaveBeenCalledWith("https://suite.example/api/public/finder/catalog/design-single", {
      cache: "no-store",
    });
    expect(item).toEqual(
      expect.objectContaining({
        id: "design-single",
        collectionYear: 2026,
        availableListingCount: 2,
      }),
    );
  });

  it("can disable fixture fallback for missing detail records", async () => {
    const fetchDetail = vi.fn(async () => new Response("not found", { status: 404 }));

    const item = await getCatalogJewelryItemById("missing-design", {
      apiBaseUrl: "https://suite.example",
      fetcher: fetchDetail,
      useFixtureFallback: false,
    });

    expect(item).toBeUndefined();
  });

  it("reads exact and similar availability matches from the Sparkle Suite public Finder API", async () => {
    const fetchAvailability = vi.fn(async () =>
      jsonResponse({
        requestedItem: apiCatalogItem({ designId: "design-123" }),
        exactMatches: [
          apiAvailabilityMatch({
            listingId: "listing-exact",
            designId: "design-123",
            designName: "Starlight Diamond Ring",
          }),
        ],
        similarMatches: [
          apiAvailabilityMatch({
            listingId: "listing-similar",
            designId: "design-similar",
            designName: "Starlight Sister Ring",
          }),
        ],
      }),
    );

    const availability = await getFinderAvailabilityForJewelryItem("design-123", {
      apiBaseUrl: "https://suite.example",
      fetcher: fetchAvailability,
      useFixtureFallback: false,
    });

    expect(fetchAvailability).toHaveBeenCalledWith(
      "https://suite.example/api/public/finder/availability?designId=design-123&limit=24",
      { cache: "no-store" },
    );
    expect(availability?.exactMatches[0]).toMatchObject({
      listingId: "listing-exact",
      showName: "Demo Glow Show",
      repFirstName: "Demo",
      customerSiteUrl: "https://suite.example/demo-show?c=rep-demo",
      item: {
        id: "design-123",
      },
      nextShow: {
        showId: "show-demo",
        showName: "Demo Glow Show",
      },
    });
    expect(availability?.similarMatches[0]).toMatchObject({
      listingId: "listing-similar",
      item: {
        id: "design-similar",
      },
    });
  });

  it("skips malformed availability matches without a next show", async () => {
    const fetchAvailability = vi.fn(async () =>
      jsonResponse({
        requestedItem: apiCatalogItem({ designId: "design-123" }),
        exactMatches: [
          {
            ...apiAvailabilityMatch({
              listingId: "listing-missing-show",
              designId: "design-123",
              designName: "Starlight Diamond Ring",
            }),
            nextShow: null,
          },
        ],
        similarMatches: [],
      }),
    );

    const availability = await getFinderAvailabilityForJewelryItem("design-123", {
      apiBaseUrl: "https://suite.example",
      fetcher: fetchAvailability,
      useFixtureFallback: false,
    });

    expect(availability?.exactMatches).toEqual([]);
  });

  it("reads live shows from the Sparkle Suite public Finder API", async () => {
    const fetchLiveShows = vi.fn(async () =>
      jsonResponse({
        shows: [
          {
            showId: "show-demo",
            showName: "Demo Glow Show",
            repFirstName: "Demo",
            startsAt: "2026-06-06T20:00:00.000Z",
            status: "scheduled",
            customerSiteUrl: "https://suite.example/demo-show?c=rep-demo",
          },
        ],
      }),
    );

    const shows = await getFinderLiveShows({
      apiBaseUrl: "https://suite.example",
      fetcher: fetchLiveShows,
      useFixtureFallback: false,
    });

    expect(fetchLiveShows).toHaveBeenCalledWith("https://suite.example/api/public/finder/live-shows?limit=50", {
      cache: "no-store",
    });
    expect(shows).toEqual([
      {
        showId: "show-demo",
        showName: "Demo Glow Show",
        repFirstName: "Demo",
        startsAt: "2026-06-06T20:00:00.000Z",
        status: "scheduled",
        customerSiteUrl: "https://suite.example/demo-show?c=rep-demo",
      },
    ]);
  });

  it("can disable fixture fallback when live shows are unavailable", async () => {
    const fetchLiveShows = vi.fn(async () => new Response("not found", { status: 404 }));

    const shows = await getFinderLiveShows({
      apiBaseUrl: "https://suite.example",
      fetcher: fetchLiveShows,
      useFixtureFallback: false,
    });

    expect(shows).toEqual([]);
  });

  it("reads rep directory data from the Sparkle Suite public Finder API", async () => {
    const fetchReps = vi.fn(async () =>
      jsonResponse({
        reps: [
          apiRepDirectoryItem({
            repId: "rep-suite-demo",
            displayName: "Demo Draper",
            businessName: "Demo Sparkle Studio",
            state: "OH",
            customerSiteUrl: "https://suite.example/reps/demo",
            repBoardUrl: "https://suite.example/reps/demo/board",
          }),
        ],
      }),
    );

    const data = await getFinderRepDirectoryData({
      apiBaseUrl: "https://suite.example",
      fetcher: fetchReps,
      useFixtureFallback: false,
    });

    expect(fetchReps).toHaveBeenCalledWith("https://suite.example/api/public/finder/reps?limit=200", {
      cache: "no-store",
    });
    expect(data.reps).toEqual([
      expect.objectContaining({
        id: "rep-suite-demo",
        businessName: "Demo Sparkle Studio",
        displayName: "Demo Draper",
        state: "OH",
        siteUrl: "https://suite.example/reps/demo",
        nextLiveShowId: "show-demo",
      }),
    ]);
    expect(data.liveShows).toEqual([
      expect.objectContaining({
        id: "show-demo",
        repId: "rep-suite-demo",
        title: "Demo Glow Show",
        status: "scheduled",
        showUrl: "https://suite.example/demo-show?c=rep-demo",
      }),
    ]);
    expect(data.boardListings).toEqual([
      expect.objectContaining({
        id: "rep-suite-demo-board",
        repId: "rep-suite-demo",
        status: "available",
        boardUrl: "https://suite.example/reps/demo/board",
      }),
    ]);
    expect(data.status).toBe("ready");
  });

  it("sends Rep Directory searches upstream and deduplicates repeated rep ids", async () => {
    const repeated = apiRepDirectoryItem({ repId: "rep-repeat", displayName: "Repeat Rep" });
    const fetchReps = vi.fn(async () => jsonResponse({ reps: [repeated, repeated] }));

    const data = await getFinderRepDirectoryData({
      apiBaseUrl: "https://suite.example",
      fetcher: fetchReps,
      query: "Repeat Rep",
      useFixtureFallback: false,
    });

    expect(fetchReps).toHaveBeenCalledWith(
      "https://suite.example/api/public/finder/reps?limit=200&query=Repeat+Rep",
      { cache: "no-store" },
    );
    expect(data.reps.map((rep) => rep.id)).toEqual(["rep-repeat"]);
  });

  it("can disable fixture fallback when rep directory data is unavailable", async () => {
    const fetchReps = vi.fn(async () => new Response("not found", { status: 404 }));

    const data = await getFinderRepDirectoryData({
      apiBaseUrl: "https://suite.example",
      fetcher: fetchReps,
      useFixtureFallback: false,
    });

    expect(data).toEqual({
      boardListings: [],
      liveShows: [],
      reps: [],
      status: "unavailable",
    });
  });

  it("distinguishes a working empty rep feed from an unavailable feed", async () => {
    const data = await getFinderRepDirectoryData({
      apiBaseUrl: "https://suite.example",
      fetcher: vi.fn(async () => jsonResponse({ reps: [] })),
      useFixtureFallback: false,
    });

    expect(data).toEqual({
      boardListings: [],
      liveShows: [],
      reps: [],
      status: "empty",
    });
  });

  it("treats a missing reps array as an unavailable contract", async () => {
    const data = await getFinderRepDirectoryData({
      apiBaseUrl: "https://suite.example",
      fetcher: vi.fn(async () => jsonResponse({ items: [] })),
      useFixtureFallback: false,
    });

    expect(data.status).toBe("unavailable");
  });

  it("treats a nonempty all-malformed rep feed as unavailable", async () => {
    const data = await getFinderRepDirectoryData({
      apiBaseUrl: "https://suite.example",
      fetcher: vi.fn(async () => jsonResponse({ reps: [null, {}, { repId: "rep-without-name" }] })),
      useFixtureFallback: false,
    });

    expect(data.status).toBe("unavailable");
    expect(data.reps).toEqual([]);
  });

  it("skips malformed reps, drops unsafe links, and preserves a valid rep without a valid show", async () => {
    const data = await getFinderRepDirectoryData({
      apiBaseUrl: "https://suite.example",
      fetcher: vi.fn(async () =>
        jsonResponse({
          reps: [
            null,
            { repId: "", displayName: "Missing ID" },
            apiRepDirectoryItem({
              repId: "rep-safe",
              avatarUrl: "http://cdn.example.test/avatar.jpg",
              customerSiteUrl: "javascript:alert(1)",
              repBoardUrl: "https://evil.example/board",
              nextShow: {
                id: "bad-show",
                title: "Bad Date",
                startsAt: "not-a-date",
                status: "scheduled",
                customerShowUrl: "https://suite.example/shows/bad",
              },
            }),
          ],
        }),
      ),
      useFixtureFallback: false,
    });

    expect(data.status).toBe("ready");
    expect(data.reps).toEqual([
      expect.objectContaining({ id: "rep-safe", avatarUrl: "", siteUrl: "", nextLiveShowId: "" }),
    ]);
    expect(data.boardListings).toEqual([]);
    expect(data.liveShows).toEqual([]);
  });

  it("keeps reps visible when only a board link is available", async () => {
    const fetchReps = vi.fn(async () =>
      jsonResponse({
        reps: [
          apiRepDirectoryItem({
            repId: "rep-board-only",
            customerSiteUrl: null,
            repBoardUrl: "https://suite.example/reps/board-only/board",
            nextShow: null,
          }),
        ],
      }),
    );

    const data = await getFinderRepDirectoryData({
      apiBaseUrl: "https://suite.example",
      fetcher: fetchReps,
      useFixtureFallback: false,
    });

    expect(data.reps).toEqual([
      expect.objectContaining({
        id: "rep-board-only",
        siteUrl: "",
      }),
    ]);
    expect(data.boardListings).toEqual([
      expect.objectContaining({
        repId: "rep-board-only",
        boardUrl: "https://suite.example/reps/board-only/board",
      }),
    ]);
  });

  it("maps the Reps directory next-show payload shape", async () => {
    const fetchReps = vi.fn(async () =>
      jsonResponse({
        reps: [
          apiRepDirectoryItem({
            repId: "rep-directory-show",
            nextShow: {
              id: "directory-show",
              title: "Directory Glow Show",
              startsAt: "2026-06-07T20:00:00.000Z",
              status: "live",
              customerShowUrl: "https://suite.example/shows/directory-glow",
            },
          }),
        ],
      }),
    );

    const data = await getFinderRepDirectoryData({
      apiBaseUrl: "https://suite.example",
      fetcher: fetchReps,
      useFixtureFallback: false,
    });

    expect(data.reps[0]).toEqual(
      expect.objectContaining({
        id: "rep-directory-show",
        nextLiveShowId: "directory-show",
      }),
    );
    expect(data.liveShows).toEqual([
      expect.objectContaining({
        id: "directory-show",
        repId: "rep-directory-show",
        showUrl: "https://suite.example/shows/directory-glow",
        status: "live",
        title: "Directory Glow Show",
      }),
    ]);
  });

  it("falls back to fixture items when the API is not configured", async () => {
    const items = await getCatalogJewelryItems({
      apiBaseUrl: "",
    });

    expect(items[0]).toMatchObject({
      id: "jewel-rainbow-crown-ring",
      name: "Rainbow Crown Ring",
    });
  });

  it("normalizes the Sparkle Suite Finder API base URL for customer-facing links", () => {
    expect(getSparkleSuiteFinderPublicBaseUrl({ apiBaseUrl: "https://suite.example/" })).toBe("https://suite.example");
    expect(getSparkleSuiteFinderPublicBaseUrl({ apiBaseUrl: "https://suite.example///" })).toBe(
      "https://suite.example",
    );
  });
});

function apiCatalogItem(overrides: Partial<SparkleSuiteFinderCatalogItem> = {}): SparkleSuiteFinderCatalogItem {
  return {
    designId: "design-123",
    itemNumber: "RG1234",
    designName: "Starlight Ring",
    collectionName: "Midnight Garden",
    collectionYear: 2026,
    jewelryType: "ring",
    material: "Rose gold",
    mainStone: "Pink stone",
    bpMsrp: 19.95,
    canonicalPhotoUrl: "https://cdn.example.test/design-123.jpg",
    searchTags: ["rose gold"],
    availableListingCount: 2,
    ...overrides,
  };
}

function apiAvailabilityMatch({
  listingId,
  designId,
  designName,
}: {
  listingId: string;
  designId: string;
  designName: string;
}) {
  return {
    listingId,
    listedAt: "2026-06-06T12:00:00.000Z",
    photoUrl: "https://cdn.example.test/listing.jpg",
    photoSource: "canonical",
    item: apiCatalogItem({ designId, designName }),
    showName: "Demo Glow Show",
    repFirstName: "Demo",
    customerSiteUrl: "https://suite.example/demo-show?c=rep-demo",
    nextShow: {
      showId: "show-demo",
      showName: "Demo Glow Show",
      repFirstName: "Demo",
      startsAt: "2026-06-06T20:00:00.000Z",
      status: "scheduled",
      customerSiteUrl: "https://suite.example/demo-show?c=rep-demo",
    },
  };
}

function apiRepDirectoryItem(
  overrides: Partial<SparkleSuiteFinderRepDirectoryItem> = {},
): SparkleSuiteFinderRepDirectoryItem {
  return {
    repId: "rep-demo",
    displayName: "Demo Draper",
    businessName: "Demo Sparkle Studio",
    avatarUrl: "https://cdn.example.test/reps/demo.jpg",
    state: "OH",
    customerSiteUrl: "https://suite.example/reps/demo",
    repBoardUrl: "https://suite.example/reps/demo/board",
    nextShow: {
      showId: "show-demo",
      showName: "Demo Glow Show",
      repFirstName: "Demo",
      startsAt: "2026-06-06T20:00:00.000Z",
      status: "scheduled",
      customerSiteUrl: "https://suite.example/demo-show?c=rep-demo",
    },
    ...overrides,
  };
}

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });
}
