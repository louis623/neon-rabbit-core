import {
  getJewelryItems,
  getLiveShows,
  getRepBoardListings,
  getReps,
} from "./service";
import type {
  BombPartyLabel,
  JewelryItem,
  JewelryItemWithNextShow,
  JewelryType,
} from "./types";

export function searchJewelryItemsByText(
  items: readonly JewelryItem[] | undefined,
  query: string,
): JewelryItem[] {
  const trimmedQuery = query.trim().toLocaleLowerCase();

  if (!trimmedQuery) {
    return [...(items ?? getJewelryItems())];
  }

  return (items ?? getJewelryItems()).filter((item) => {
    const searchableText = [
      item.name,
      item.collectionName,
      item.jewelryType,
      item.bpLabel,
      item.itemNumber,
      item.collectionYear ? String(item.collectionYear) : "",
      ...(item.searchTags ?? []),
    ]
      .join(" ")
      .toLocaleLowerCase();

    return searchableText.includes(trimmedQuery);
  });
}

export function filterJewelryItemsByCollection(
  collectionName: string,
  items: readonly JewelryItem[] = getJewelryItems(),
): JewelryItem[] {
  const normalizedCollection = collectionName.trim().toLocaleLowerCase();

  return items.filter((item) => item.collectionName.toLocaleLowerCase() === normalizedCollection);
}

export function filterJewelryItemsByJewelryType(
  items: readonly JewelryItem[],
  jewelryType: JewelryType,
): JewelryItem[] {
  return items.filter((item) => item.jewelryType === jewelryType);
}

export function filterJewelryItemsByBombPartyLabel(
  items: readonly JewelryItem[],
  label: BombPartyLabel,
): JewelryItem[] {
  return items.filter((item) => item.bpLabel === label);
}

export function withNextShowContext(items: readonly JewelryItem[]): JewelryItemWithNextShow[] {
  const listings = getRepBoardListings();
  const reps = getReps();
  const liveShows = getLiveShows();

  return items.map((item) => {
    const listing = listings.find(
      (candidate) => candidate.status === "available" && candidate.jewelryItemId === item.id,
    );
    const rep = listing ? reps.find((candidate) => candidate.id === listing.repId) : undefined;
    const nextLiveShow = rep ? liveShows.find((show) => show.id === rep.nextLiveShowId) : undefined;

    return {
      ...item,
      rep,
      nextLiveShow,
    };
  });
}
