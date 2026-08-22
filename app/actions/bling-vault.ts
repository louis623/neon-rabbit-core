"use server";

import { getCatalogJewelryItems } from "@/lib/sparkle-finder/catalog-service";
import {
  filterHomepageBlingVaultItems,
  type BlingVaultFilter,
  type HomepageBlingVaultItem,
} from "@/lib/sparkle-finder/homepage-bling-vault";
import { createClient } from "@/lib/supabase/server";
import type { CollectionAcquisitionSource, CollectionItem } from "@/lib/sparkle-finder/types";

export type BlingVaultPage = {
  items: HomepageBlingVaultItem[];
  total: number;
};

const maxPageSize = 16;

export async function loadBlingVaultPage(
  filter: BlingVaultFilter,
  offset: number,
  requestedLimit = 12,
): Promise<BlingVaultPage> {
  const safeFilter = isBlingVaultFilter(filter) ? filter : "all";
  const safeOffset = Number.isInteger(offset) ? Math.max(0, Math.min(offset, 10_000)) : 0;
  const limit = Number.isInteger(requestedLimit) ? Math.max(1, Math.min(requestedLimit, maxPageSize)) : 12;

  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) return { items: [], total: 0 };

    const [{ data, error }, catalog] = await Promise.all([
      supabase
        .from("sparkle_finder_collection_items")
        .select("id,user_id,jewelry_item_id,state,acquisition_source,acquisition_context,acquisition_marked_at,personal_photo_url")
        .eq("user_id", authData.user.id),
      getCatalogJewelryItems({ useFixtureFallback: false }),
    ]);

    if (error || !Array.isArray(data)) return { items: [], total: 0 };

    const catalogById = new Map(catalog.map((item) => [item.id, item]));
    const items = data.flatMap((row) => {
      const item = mapCollectionItem(row, authData.user!.id);
      const jewelryItem = item ? catalogById.get(item.jewelryItemId) : undefined;
      return item && jewelryItem ? [{ ...item, jewelryItem }] : [];
    });
    const filtered = filterHomepageBlingVaultItems(items, safeFilter);

    return { items: filtered.slice(safeOffset, safeOffset + limit), total: filtered.length };
  } catch {
    return { items: [], total: 0 };
  }
}

function mapCollectionItem(row: unknown, userId: string): (CollectionItem & { personalPhotoUrl?: string | null }) | null {
  if (!row || typeof row !== "object") return null;
  const record = row as Record<string, unknown>;
  const id = readString(record.id);
  const jewelryItemId = readString(record.jewelry_item_id);
  const state = readState(record.state);
  if (!id || record.user_id !== userId || !jewelryItemId || !state) return null;

  return {
    id,
    customerId: userId,
    jewelryItemId,
    state,
    note: "",
    isHighlighted: false,
    acquisitionSource: readAcquisitionSource(record.acquisition_source),
    acquisitionContext: readContext(record.acquisition_context),
    acquisitionMarkedAt: readString(record.acquisition_marked_at) || null,
    personalPhotoUrl: readString(record.personal_photo_url) || null,
  };
}

function isBlingVaultFilter(value: string): value is BlingVaultFilter {
  return value === "all" || value === "owned" || value === "wishlist" || value === "diamonds" || value === "unicorns" || value === "finder";
}

function readState(value: unknown): CollectionItem["state"] | null {
  return value === "owned" || value === "wishlist" || value === "private_note_only" ? value : null;
}

function readAcquisitionSource(value: unknown): CollectionAcquisitionSource {
  return value === "manual" || value === "wishlist" || value === "sparkle_finder_lead" || value === "nic_nac_request" || value === "unknown" ? value : "unknown";
}

function readContext(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
