import { getSparkleFinderAccountEntitlements } from "./entitlements";
import {
  getJewelryItemById,
  getLiveShowById,
  getRepBoardListings,
  getRepById,
} from "./service";
import type { SparkleFinderAccountState } from "./auth";
import type { JewelryItem, LiveShow, MatchType, RepBoardListing, RepSummary } from "./types";

export type NicNacFindDeniedReason = "silver_required" | "item_not_found";

export type NicNacFindMatch = {
  requestId: string;
  requestedItem: JewelryItem;
  matchedItem: JewelryItem;
  rep: RepSummary;
  listing: RepBoardListing;
  nextLiveShow: LiveShow;
  matchType: Exclude<MatchType, "near_match">;
  confidenceLabel: "Exact item lead" | "Same collection and type";
};

export type NicNacFindResult =
  | {
      ok: true;
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
): NicNacFindResult {
  const entitlements = getSparkleFinderAccountEntitlements(accountState);

  if (!entitlements.canUseNicNacFindRequests) {
    return {
      ok: false,
      reason: "silver_required",
      results: [],
    };
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
    requestId,
    requestedItem,
    results: [
      ...exactMatches.flatMap((listing) => createNicNacMatch(requestId, requestedItem, listing, "exact_item")),
      ...sameCollectionTypeMatches.flatMap((listing) =>
        createNicNacMatch(requestId, requestedItem, listing, "same_collection_type"),
      ),
    ],
    emptyState: "No fixture-backed rep board leads yet. Nic-Nac will stay within saved rep boards and next-show context.",
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
      confidenceLabel: matchType === "exact_item" ? "Exact item lead" : "Same collection and type",
    },
  ];
}
