"use server";

import { getCatalogJewelryItemsByIdsResult } from "@/lib/sparkle-finder/catalog-service";
import {
  filterHomepageBlingVaultItems,
  type BlingVaultFilter,
  type HomepageBlingVaultItem,
} from "@/lib/sparkle-finder/homepage-bling-vault";
import { createClient } from "@/lib/supabase/server";
import type { CollectionAcquisitionSource, CollectionItem, JewelryItem } from "@/lib/sparkle-finder/types";

export type BlingVaultPageResult =
  | {
      status: "success";
      items: HomepageBlingVaultItem[];
      total: number;
    }
  | {
      status: "error";
      message: string;
      missingDesignIds?: string[];
    };

const maxPageSize = 16;
const catalogBatchSize = 50;
const catalogBatchConcurrency = 4;
const ownerCollectionPageSize = 200;
const ownerCollectionMaxPages = 10;
const ownerCollectionMaxRows = ownerCollectionPageSize * ownerCollectionMaxPages;

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

    const collectionRowsResult = await loadOrderedOwnerCollectionRows(supabase, authData.user.id);
    if (collectionRowsResult.status === "error") {
      return {
        status: "error",
        message: collectionRowsResult.reason === "page_limit"
          ? `Your Bling Vault has more than ${ownerCollectionMaxRows.toLocaleString("en-US")} saved pieces and can't be loaded safely yet. No partial collection was shown.`
          : "We couldn't load your Bling Vault. Please try again.",
      };
    }

    const collectionItems = collectionRowsResult.rows.map((row) => mapCollectionItem(row, authData.user!.id));
    if (collectionItems.some((item) => item === null)) {
      return {
        status: "error",
        message: "Some saved pieces couldn't be read safely. Please try again.",
      };
    }

    const hydratedCatalog = await loadCatalogItemsByDesignIds(
      collectionItems.flatMap((item) => (item ? [item.jewelryItemId] : [])),
    );
    if (hydratedCatalog.status === "error") {
      return {
        status: "error",
        message: "Your Bling Vault couldn't reach the jewelry catalog. Please try again.",
      };
    }

    if (hydratedCatalog.missingDesignIds.length > 0) {
      return {
        status: "error",
        message: "Some saved pieces are no longer available in the jewelry catalog. Nothing was substituted.",
        missingDesignIds: hydratedCatalog.missingDesignIds,
      };
    }

    const catalogById = new Map(hydratedCatalog.items.map((item) => [normalizeExactDesignId(item.id), item]));
    const items = collectionItems.flatMap((item) => {
      const jewelryItem = item ? catalogById.get(normalizeExactDesignId(item.jewelryItemId)) : undefined;
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

type CatalogHydrationResult =
  | {
      status: "success";
      items: JewelryItem[];
      missingDesignIds: string[];
    }
  | { status: "error" };

async function loadCatalogItemsByDesignIds(designIds: string[]): Promise<CatalogHydrationResult> {
  const uniqueDesignIds = [...new Map(
    designIds
      .map((designId) => designId.trim())
      .filter(Boolean)
      .map((designId) => [designId, designId]),
  ).values()];
  if (uniqueDesignIds.length === 0) {
    return { status: "success", items: [], missingDesignIds: [] };
  }

  const batches: string[][] = [];
  for (let index = 0; index < uniqueDesignIds.length; index += catalogBatchSize) {
    batches.push(uniqueDesignIds.slice(index, index + catalogBatchSize));
  }

  const results: Array<Extract<Awaited<ReturnType<typeof getCatalogJewelryItemsByIdsResult>>, { status: "success" }>> = [];
  for (let index = 0; index < batches.length; index += catalogBatchConcurrency) {
    const batchResults = await Promise.all(
      batches
        .slice(index, index + catalogBatchConcurrency)
        .map((batch) => getCatalogJewelryItemsByIdsResult(batch)),
    );
    for (const result of batchResults) {
      if (result.status === "error") {
        return { status: "error" };
      }
      results.push(result);
    }
  }

  const items = results.flatMap((result) => result.items);
  const returnedIds = new Set(items.map((item) => normalizeExactDesignId(item.id)));
  const requestedIds = new Set(uniqueDesignIds);
  if (items.some((item) => !requestedIds.has(normalizeExactDesignId(item.id)))) {
    return { status: "error" };
  }

  const reportedMissingIds = results.flatMap((result) => result.missingDesignIds);
  const missingDesignIds = [...new Set([
    ...reportedMissingIds
      .map(normalizeExactDesignId)
      .filter((designId) => requestedIds.has(designId)),
    ...uniqueDesignIds.filter((designId) => !returnedIds.has(designId)),
  ])];

  return { status: "success", items, missingDesignIds };
}

type OwnerCollectionRowsResult =
  | { status: "success"; rows: unknown[] }
  | { status: "error"; reason: "unavailable" | "page_limit" };

async function loadOrderedOwnerCollectionRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<OwnerCollectionRowsResult> {
  const rows: unknown[] = [];

  for (let page = 0; page <= ownerCollectionMaxPages; page += 1) {
    const from = page * ownerCollectionPageSize;
    const { data, error } = await supabase
      .from("sparkle_finder_collection_items")
      .select("id,user_id,jewelry_item_id,state,acquisition_source,acquisition_context,acquisition_marked_at,personal_photo_url")
      .eq("user_id", userId)
      .order("id", { ascending: true })
      .range(from, from + ownerCollectionPageSize - 1);

    if (error || !Array.isArray(data)) {
      return { status: "error", reason: "unavailable" };
    }
    if (page === ownerCollectionMaxPages) {
      return data.length > 0
        ? { status: "error", reason: "page_limit" }
        : { status: "success", rows };
    }

    rows.push(...data);
    if (data.length < ownerCollectionPageSize) {
      return { status: "success", rows };
    }
  }

  return { status: "error", reason: "page_limit" };
}

function normalizeExactDesignId(designId: string): string {
  return designId.trim();
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
