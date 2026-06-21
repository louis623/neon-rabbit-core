import type { CollectionItem, JewelryItem } from "./types";

export type HomepageBlingVaultItem = CollectionItem & {
  jewelryItem: JewelryItem;
};

export type HomepageBlingVaultModel = {
  heroItem?: HomepageBlingVaultItem;
  wishlistItems: HomepageBlingVaultItem[];
  mosaicItems: HomepageBlingVaultItem[];
  counts: {
    highlighted: number;
    owned: number;
    saved: number;
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
  const featuredIds = new Set([
    heroItem?.id,
    ...wishlistItems.slice(0, wishlistPreviewCount).map((item) => item.id),
  ]);

  return {
    counts: {
      highlighted: items.filter((item) => item.isHighlighted).length,
      owned: items.filter((item) => item.state === "owned").length,
      saved: items.length,
      wishlist: wishlistItems.length,
    },
    heroItem,
    mosaicItems: items.filter((item) => !featuredIds.has(item.id)),
    wishlistItems,
  };
}
