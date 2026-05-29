import {
  sparkleFinderJewelryItems,
  sparkleFinderLiveShows,
  sparkleFinderRepBoardListings,
  sparkleFinderReps,
} from "../fixtures/sparkle-finder-fixtures";
import type {
  BombPartyLabel,
  JewelryItem,
  LiveShow,
  RepBoardListing,
  RepBoardMatch,
  RepSummary,
} from "./types";

export function getReps(): RepSummary[] {
  return cloneRecords(sparkleFinderReps);
}

export function getLiveShows(): LiveShow[] {
  return cloneRecords(sparkleFinderLiveShows);
}

export function getRepBoardListings(): RepBoardListing[] {
  return cloneRecords(sparkleFinderRepBoardListings);
}

export function getJewelryItems(): JewelryItem[] {
  return cloneRecords(sparkleFinderJewelryItems);
}

export function getJewelryItemById(itemId: string): JewelryItem | undefined {
  return cloneRecord(sparkleFinderJewelryItems.find((item) => item.id === itemId));
}

export function getDiamondAndUnicornItems(): JewelryItem[] {
  return cloneRecords(
    sparkleFinderJewelryItems.filter((item) => item.bpLabel === "diamond" || item.bpLabel === "unicorn"),
  );
}

export function getJewelryItemsByBombPartyLabel(label: BombPartyLabel): JewelryItem[] {
  return cloneRecords(sparkleFinderJewelryItems.filter((item) => item.bpLabel === label));
}

export function matchJewelryItemToRepBoardListings(jewelryItemId: string): RepBoardMatch[] {
  const requestedItem = getJewelryItemById(jewelryItemId);

  if (!requestedItem) {
    return [];
  }

  const availableListings = sparkleFinderRepBoardListings.filter((listing) => listing.status === "available");
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

  return [
    ...exactMatches.flatMap((listing) => createRepBoardMatch(requestedItem.id, listing, "exact_item", "exact")),
    ...sameCollectionTypeMatches.flatMap((listing) =>
      createRepBoardMatch(requestedItem.id, listing, "same_collection_type", "similar"),
    ),
  ];
}

function createRepBoardMatch(
  requestedJewelryItemId: string,
  listing: RepBoardListing,
  matchType: RepBoardMatch["matchType"],
  confidenceLabel: string,
): RepBoardMatch[] {
  const rep = sparkleFinderReps.find((candidate) => candidate.id === listing.repId);
  const liveShow = rep ? sparkleFinderLiveShows.find((show) => show.id === rep.nextLiveShowId) : undefined;

  if (!rep || !liveShow) {
    return [];
  }

  return [
    {
      requestId: `fixture-request-${requestedJewelryItemId}`,
      repId: listing.repId,
      listingId: listing.id,
      liveShowId: liveShow.id,
      matchType,
      confidenceLabel,
      jewelryItemId: requestedJewelryItemId,
      matchedJewelryItemId: listing.jewelryItemId,
      boardUrl: listing.boardUrl,
    },
  ];
}

function cloneRecords<T extends object>(records: readonly T[]): T[] {
  return records.map((record) => ({ ...record }));
}

function cloneRecord<T extends object>(record: T | undefined): T | undefined {
  return record ? { ...record } : undefined;
}
