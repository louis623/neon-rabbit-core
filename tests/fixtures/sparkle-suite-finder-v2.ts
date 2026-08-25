const suiteBaseUrl = "https://suite.example";

export const suiteV2FixtureIds = {
  submission: "10000000-0000-4000-8000-000000000001",
  ruby: "20000000-0000-4000-8000-000000000001",
  quartz: "20000000-0000-4000-8000-000000000002",
  emerald: "20000000-0000-4000-8000-000000000003",
  sapphire: "20000000-0000-4000-8000-000000000004",
} as const;

export const suiteV2CatalogFixture = {
  pages: [
    catalogPage(
      [catalogItem(suiteV2FixtureIds.ruby, "Ruby"), catalogItem(suiteV2FixtureIds.quartz, "Rose Quartz")],
      true,
      "catalog-page-2",
    ),
    catalogPage([catalogItem(suiteV2FixtureIds.emerald, "Emerald", "SYN-200")], true, "catalog-page-3"),
    catalogPage([catalogItem(suiteV2FixtureIds.sapphire, "Sapphire", "SYN-300")], false, null),
  ],
  batch: {
    schemaVersion: 2,
    items: [catalogItem(suiteV2FixtureIds.ruby, "Ruby")],
    missingDesignIds: ["00000000-0000-4000-8000-000000000000"],
  },
  facets: {
    schemaVersion: 2,
    facets: Object.fromEntries(
      ["collections", "materials", "stones", "types", "labels", "years"].map((key) => [
        key,
        [{ value: key === "labels" ? "standard" : `synthetic-${key}`, count: 4 }],
      ]),
    ),
  },
} as const;

const positiveRequestedItem = catalogItem(suiteV2FixtureIds.ruby, "Ruby", "SYN-100", {
  availableLeadCount: 3,
  availableListingCount: 3,
  availableDancerCount: 6,
});
const zeroRequestedItem = catalogItem(suiteV2FixtureIds.ruby, "Ruby");
const removedRequestedItem = catalogItem(suiteV2FixtureIds.ruby, "Ruby", "SYN-100", {
  availableLeadCount: 1,
  availableListingCount: 1,
  availableDancerCount: 2,
});

export const suiteV2AvailabilityFixture = {
  positivePages: [
    availabilityResponse(
      positiveRequestedItem,
      [availabilityMatch("listing-exact-1", positiveRequestedItem, 2)],
      [availabilityMatch("listing-similar-1", catalogItem(suiteV2FixtureIds.emerald, "Emerald", "SYN-200"), 1)],
      pageInfo(3, 6, true, "exact-page-2"),
      pageInfo(1, 1, false, null),
    ),
    availabilityResponse(
      positiveRequestedItem,
      [availabilityMatch("listing-exact-2", positiveRequestedItem, 1)],
      [],
      pageInfo(3, 6, true, "exact-page-3"),
      pageInfo(0, 0, false, null),
    ),
    availabilityResponse(
      positiveRequestedItem,
      [availabilityMatch("listing-exact-3", positiveRequestedItem, 3)],
      [],
      pageInfo(3, 6, false, null),
      pageInfo(0, 0, false, null),
    ),
  ],
  zero: availabilityResponse(zeroRequestedItem, [], [], pageInfo(0, 0, false, null), pageInfo(0, 0, false, null)),
  removed: {
    before: availabilityResponse(
      removedRequestedItem,
      [availabilityMatch("listing-removed", removedRequestedItem, 2)],
      [],
      pageInfo(1, 2, false, null),
      pageInfo(0, 0, false, null),
    ),
    after: availabilityResponse(zeroRequestedItem, [], [], pageInfo(0, 0, false, null), pageInfo(0, 0, false, null)),
  },
} as const;

const studioRuby = studioCandidate(suiteV2FixtureIds.ruby, "Ruby");
const studioQuartz = studioCandidate(suiteV2FixtureIds.quartz, "Rose Quartz");

export const suiteV2StudioFixture = {
  ambiguity: {
    schemaVersion: 2,
    ok: true,
    status: "needs_variant_confirmation",
    retryable: false,
    mutationReplayed: false,
    variantCandidates: [studioRuby, studioQuartz],
  },
  replay: {
    schemaVersion: 2,
    ok: true,
    status: "accepted",
    retryable: false,
    mutationReplayed: true,
    suiteDesignId: suiteV2FixtureIds.ruby,
    resolvedDesign: studioRuby,
  },
} as const;

function catalogPage(items: unknown[], hasMore: boolean, nextCursor: string | null) {
  return { schemaVersion: 2, items, pageInfo: { totalCount: 4, hasMore, nextCursor } };
}

function catalogItem(
  designId: string,
  mainStone: string,
  itemNumber = "SYN-100",
  counts: { availableLeadCount: number; availableListingCount: number; availableDancerCount: number } = {
    availableLeadCount: 0,
    availableListingCount: 0,
    availableDancerCount: 0,
  },
) {
  return {
    designId,
    itemNumber,
    designName: `${mainStone} synthetic ring`,
    collectionName: "Synthetic collection",
    collectionYear: 2026,
    jewelryType: "ring",
    material: "Rose gold",
    mainStone,
    bpMsrp: null,
    canonicalPhotoUrl: null,
    searchTags: [mainStone.toLowerCase()],
    description: `Sanitized ${mainStone} contract fixture.`,
    ...counts,
  };
}

function availabilityMatch(listingId: string, item: ReturnType<typeof catalogItem>, quantityAvailable: number) {
  return {
    listingId,
    listedAt: "2026-08-25T12:00:00.000Z",
    photoUrl: null,
    photoSource: "canonical",
    quantityAvailable,
    item,
    rep: {
      repId: "synthetic-rep",
      showName: "Synthetic Sparkle",
      repFirstName: "Demo",
      customerSiteUrl: `${suiteBaseUrl}/synthetic-rep`,
    },
    nextShow: {
      showId: "synthetic-show",
      repId: "synthetic-rep",
      startsAt: "2026-08-26T12:00:00.000Z",
      title: "Synthetic Sparkle",
      status: "scheduled",
    },
  };
}

function availabilityResponse(
  requestedItem: ReturnType<typeof catalogItem>,
  exactMatches: unknown[],
  similarMatches: unknown[],
  exactPageInfo: ReturnType<typeof pageInfo>,
  similarPageInfo: ReturnType<typeof pageInfo>,
) {
  return { schemaVersion: 2, requestedItem, exactMatches, similarMatches, exactPageInfo, similarPageInfo };
}

function pageInfo(totalLeadCount: number, totalDancerCount: number, hasMore: boolean, nextCursor: string | null) {
  return { totalLeadCount, totalDancerCount, hasMore, nextCursor };
}

function studioCandidate(designId: string, mainStone: string) {
  return {
    designId,
    itemNumber: "SYN-100",
    designName: `${mainStone} synthetic ring`,
    collectionName: "Synthetic collection",
    collectionYear: 2026,
    jewelryType: "ring",
    material: "Rose gold",
    mainStone,
    canonicalPhotoUrl: null,
    description: `Sanitized ${mainStone} Studio fixture.`,
  };
}
