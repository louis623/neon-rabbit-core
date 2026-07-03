import type { CollectionItem, JewelryItem } from "./types";

export type HomepageBlingVaultItem = CollectionItem & {
  jewelryItem: JewelryItem;
};

export type HomepageBlingVaultModel = {
  heroItem?: HomepageBlingVaultItem;
  wishlistItems: HomepageBlingVaultItem[];
  mosaicItems: HomepageBlingVaultItem[];
  counts: {
    diamonds: number;
    finderFinds: number;
    owned: number;
    unicorns: number;
    wishlist: number;
  };
};

const wishlistPreviewCount = 6;

export function buildHomepageBlingVaultModel(items: HomepageBlingVaultItem[]): HomepageBlingVaultModel {
  const heroItem =
    items.find((item) => item.state === "owned" && item.isHighlighted) ??
    items.find((item) => item.state === "owned") ??
    items[0];
  const wishlistItems = items.filter((item) => item.state === "wishlist");
  const ownedItems = items.filter((item) => item.state === "owned");
  const featuredIds = new Set([
    heroItem?.id,
    ...wishlistItems.slice(0, wishlistPreviewCount).map((item) => item.id),
  ]);

  return {
    counts: {
      diamonds: ownedItems.filter((item) => item.jewelryItem.bpLabel === "diamond").length,
      finderFinds: ownedItems.filter((item) => isFinderAssistedAcquisitionSource(item.acquisitionSource)).length,
      owned: ownedItems.length,
      unicorns: ownedItems.filter((item) => item.jewelryItem.bpLabel === "unicorn").length,
      wishlist: wishlistItems.length,
    },
    heroItem,
    mosaicItems: items.filter((item) => !featuredIds.has(item.id)),
    wishlistItems,
  };
}

function isFinderAssistedAcquisitionSource(source: HomepageBlingVaultItem["acquisitionSource"]): boolean {
  return source === "sparkle_finder_lead" || source === "nic_nac_request";
}
