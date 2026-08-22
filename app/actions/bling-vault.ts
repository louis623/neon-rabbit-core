"use server";

import { getCatalogJewelryItemsResult } from "@/lib/sparkle-finder/catalog-service";
import {
  filterHomepageBlingVaultItems,
  type BlingVaultFilter,
  type HomepageBlingVaultItem,
} from "@/lib/sparkle-finder/homepage-bling-vault";
import { createClient } from "@/lib/supabase/server";
import type { CollectionAcquisitionSource, CollectionItem } from "@/lib/sparkle-finder/types";

export type BlingVaultPageResult =
  | {
      status: "success";
      items: HomepageBlingVaultItem[];
      total: number;
    }
  | {
      status: "error";
      message: string;
    };

const maxPageSize = 16;

export async function loadBlingVaultPage(
  filter: BlingVaultFilter,
  offset: number,
  requestedLimit = 12,
): Promise<BlingVaultPageResult> {
  const safeFilter = isBlingVaultFilter(filter) ? filter : "all";
  const safeOffset = Number.isInteger(offset) ? Math.max(0, Math.min(offset, 10_000)) : 0;
  const limit = Number.isInteger(requestedLimit) ? Math.max(1, Math.min(requestedLimit, maxPageSize)) : 12;

  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return {
        status: "error",
        message: "Please sign in again to load your Bling Vault.",
      };
    }

    const [{ data, error }, catalogResult] = await Promise.all([
      supabase
        .from("sparkle_finder_collection_items")
        .select("id,user_id,jewelry_item_id,state,acquisition_source,acquisition_context,acquisition_marked_at,personal_photo_url")
        .eq("user_id", authData.user.id),
      getCatalogJewelryItemsResult({ useFixtureFallback: false }),
    ]);

    if (error || !Array.isArray(data)) {
      return {
        status: "error",
        message: "We couldn't load your Bling Vault. Please try again.",
      };
    }

    if (catalogResult.status === "error") {
      return {
        status: "error",
        message: "Your Bling Vault couldn't reach the jewelry catalog. Please try again.",
      };
    }

    const catalogById = new Map(catalogResult.items.map((item) => [item.id, item]));
    const items = data.flatMap((row) => {
      const item = mapCollectionItem(row, authData.user!.id);
      const jewelryItem = item ? catalogById.get(item.jewelryItemId) : undefined;
      return item && jewelryItem ? [{ ...item, jewelryItem }] : [];
    });
    const filtered = filterHomepageBlingVaultItems(items, safeFilter);

    return {
      status: "success",
      items: filtered.slice(safeOffset, safeOffset + limit),
      total: filtered.length,
    };
  } catch {
    return {
      status: "error",
      message: "We couldn't load your Bling Vault. Please try again.",
    };
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
