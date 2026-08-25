import { getSparkleFinderAccountEntitlements } from "./entitlements";
import {
  getJewelryItemById,
  getLiveShowById,
  getRepBoardListings,
  getRepById,
} from "./service";
import type { SparkleFinderAccountState } from "./auth";
import type { FinderAvailabilityMatch, FinderAvailabilityResult } from "./catalog-service";
import type { JewelryItem, LiveShow, MatchType, RepBoardListing, RepSummary } from "./types";

export type NicNacFindDeniedReason = "silver_required" | "item_not_found";
export type NicNacDataSource = "api" | "fixture";

export type NicNacFindMatch = {
  requestId: string;
  requestedItem: JewelryItem;
  matchedItem: JewelryItem;
  rep: RepSummary;
  listing: RepBoardListing;
  nextLiveShow: LiveShow | null;
  matchType: Exclude<MatchType, "near_match">;
  confidenceLabel: "Exact dancer lead" | "Similar dancer lead";
};

export type NicNacFindResult =
  | {
      ok: true;
      dataSource: NicNacDataSource;
      requestId: string;
      requestedItem: JewelryItem;
      results: NicNacFindMatch[];
      emptyState: string;
    }
  | {
      ok: false;
      reason: NicNacFindDeniedReason;
      results: [];
    };

export function findNicNacMatchesForItem(
  accountState: SparkleFinderAccountState,
  jewelryItemId: string,
  availability?: FinderAvailabilityResult,
): NicNacFindResult {
  const entitlements = getSparkleFinderAccountEntitlements(accountState);

  if (!entitlements.canUseNicNacFindRequests) {
    return {
      ok: false,
      reason: "silver_required",
      results: [],
    };
  }

  if (availability) {
    return createApiBackedNicNacResult(jewelryItemId, availability);
  }

  const requestedItem = getJewelryItemById(jewelryItemId);

  if (!requestedItem) {
    return {
      ok: false,
      reason: "item_not_found",
      results: [],
    };
  }

  const requestId = `fixture-nic-nac-${requestedItem.id}`;
  const availableListings = getRepBoardListings().filter((listing) => listing.status === "available");
  const exactMatches = availableListings.filter((listing) => listing.jewelryItemId === requestedItem.id);
  const sameCollectionTypeMatches = availableListings.filter((listing) => {
    const listedItem = getJewelryItemById(listing.jewelryItemId);

    return (
      listedItem !== undefined &&
      listedItem.id !== requestedItem.id &&
      listedItem.collectionName === requestedItem.collectionName &&
      listedItem.jewelryType === requestedItem.jewelryType
    );
  });

  return {
    ok: true,
    dataSource: "fixture",
    requestId,
    requestedItem,
    results: [
      ...exactMatches.flatMap((listing) => createNicNacMatch(requestId, requestedItem, listing, "exact_item")),
      ...sameCollectionTypeMatches.flatMap((listing) =>
        createNicNacMatch(requestId, requestedItem, listing, "same_collection_type"),
      ),
    ],
    emptyState: "No preview Dance Floor leads yet. Nic-Nac will stay within saved Dance Floors and next-show context.",
  };
}

function createApiBackedNicNacResult(
  jewelryItemId: string,
  availability: FinderAvailabilityResult,
): NicNacFindResult {
  if (!availability.requestedItem) {
    return {
      ok: false,
      reason: "item_not_found",
      results: [],
    };
  }

  const requestId = `sparkle-suite-nic-nac-${jewelryItemId}`;

  return {
    ok: true,
    dataSource: "api",
    requestId,
    requestedItem: availability.requestedItem,
    results: [
      ...availability.exactMatches.map((match) => createApiNicNacMatch(requestId, availability.requestedItem!, match, "exact_item")),
      ...availability.similarMatches.map((match) =>
        createApiNicNacMatch(requestId, availability.requestedItem!, match, "same_collection_type"),
      ),
    ],
    emptyState: "No Sparkle Suite dancer leads yet. Nic-Nac will stay within shared catalog, Dance Floor, and next-show context.",
  };
}

function createApiNicNacMatch(
  requestId: string,
  requestedItem: JewelryItem,
  match: FinderAvailabilityMatch,
  matchType: NicNacFindMatch["matchType"],
): NicNacFindMatch {
  return {
    requestId,
    requestedItem,
    matchedItem: match.item,
    rep: {
      id: match.listingId,
      businessName: match.showName,
      displayName: match.repFirstName,
      avatarUrl: "",
      state: "",
      siteUrl: match.customerSiteUrl,
      nextLiveShowId: match.nextShow.showId,
    },
    listing: {
      id: match.listingId,
      repId: match.listingId,
      jewelryItemId: match.item.id,
      status: "available",
      listedAt: match.listedAt ?? "",
      boardUrl: match.customerSiteUrl,
    },
    nextLiveShow: {
      id: match.nextShow.showId,
      repId: match.listingId,
      startsAt: match.nextShow.startsAt,
      durationMinutes: 0,
      title: match.nextShow.showName,
      status: match.nextShow.status,
      showUrl: match.customerSiteUrl,
    },
    matchType,
    confidenceLabel: matchType === "exact_item" ? "Exact dancer lead" : "Similar dancer lead",
  };
}

function createNicNacMatch(
  requestId: string,
  requestedItem: JewelryItem,
  listing: RepBoardListing,
  matchType: NicNacFindMatch["matchType"],
): NicNacFindMatch[] {
  const matchedItem = getJewelryItemById(listing.jewelryItemId);
  const rep = getRepById(listing.repId);
  const nextLiveShow = rep ? getLiveShowById(rep.nextLiveShowId) : undefined;

  if (!matchedItem || !rep || !nextLiveShow) {
    return [];
  }

  return [
    {
      requestId,
      requestedItem,
      matchedItem,
      rep,
      listing,
      nextLiveShow,
      matchType,
      confidenceLabel: matchType === "exact_item" ? "Exact dancer lead" : "Similar dancer lead",
    },
  ];
}
