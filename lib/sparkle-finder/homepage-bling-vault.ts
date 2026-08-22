import type { CollectionItem, JewelryItem } from "./types";

export type HomepageBlingVaultItem = CollectionItem & {
  jewelryItem: JewelryItem;
  personalPhotoUrl?: string | null;
};

export type BlingVaultFilter = "all" | "owned" | "wishlist" | "diamonds" | "unicorns" | "finder";

export type HomepageBlingVaultModel = {
  allItems: HomepageBlingVaultItem[];
  heroItem?: HomepageBlingVaultItem;
  heroItemId?: string;
  wishlistItems: HomepageBlingVaultItem[];
  mosaicItems: HomepageBlingVaultItem[];
  totalItemCount: number;
  counts: {
    diamonds: number;
    finderFinds: number;
    owned: number;
    unicorns: number;
    wishlist: number;
  };
};

const wishlistPreviewCount = 6;

export function buildHomepageBlingVaultModel(
  items: HomepageBlingVaultItem[],
  heroCollectionItemId?: string | null,
): HomepageBlingVaultModel {
  const selectedHeroItem = items.find(
    (item) => item.state === "owned" && item.id === heroCollectionItemId,
  );
  const heroItem = selectedHeroItem ?? items.find((item) => item.state === "owned");
  const wishlistItems = items.filter((item) => item.state === "wishlist");
  const ownedItems = items.filter((item) => item.state === "owned");
  const featuredIds = new Set([
    heroItem?.id,
    ...wishlistItems.slice(0, wishlistPreviewCount).map((item) => item.id),
  ]);

  return {
    allItems: items,
    counts: {
      diamonds: ownedItems.filter((item) => item.jewelryItem.bpLabel === "diamond").length,
      finderFinds: ownedItems.filter((item) => isFinderAssistedAcquisitionSource(item.acquisitionSource)).length,
      owned: ownedItems.length,
      unicorns: ownedItems.filter((item) => item.jewelryItem.bpLabel === "unicorn").length,
      wishlist: wishlistItems.length,
    },
    heroItem,
    heroItemId: selectedHeroItem?.id,
    mosaicItems: items.filter((item) => !featuredIds.has(item.id)),
    totalItemCount: items.length,
    wishlistItems,
  };
}

export function filterHomepageBlingVaultItems(
  items: HomepageBlingVaultItem[],
  filter: BlingVaultFilter,
): HomepageBlingVaultItem[] {
  if (filter === "owned") {
    return items.filter((item) => item.state === "owned");
  }

  if (filter === "wishlist") {
    return items.filter((item) => item.state === "wishlist");
  }

  if (filter === "diamonds" || filter === "unicorns") {
    return items.filter(
      (item) => item.state === "owned" && item.jewelryItem.bpLabel === filter.slice(0, -1),
    );
  }

  if (filter === "finder") {
    return items.filter(
      (item) => item.state === "owned" && isFinderAssistedCollectionItem(item),
    );
  }

  return items;
}

export function getHomepageBlingVaultImageUrl(item: HomepageBlingVaultItem): string {
  return item.personalPhotoUrl?.trim() || item.jewelryItem.imageUrl;
}

export function isFinderAssistedCollectionItem(item: HomepageBlingVaultItem): boolean {
  return isFinderAssistedAcquisitionSource(item.acquisitionSource);
}

function isFinderAssistedAcquisitionSource(source: HomepageBlingVaultItem["acquisitionSource"]): boolean {
  return source === "sparkle_finder_lead" || source === "nic_nac_request";
}
