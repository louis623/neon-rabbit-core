import { createClient as createSupabaseServiceClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { sparkleFinderJewelryItems } from "../fixtures/sparkle-finder-fixtures";
import type { BombPartyLabel, JewelryItem, JewelryType } from "./types";

type SparkleSuiteJewelryType = "RG" | "NK" | "ER" | "ST" | "BR";

type CollectionRelation = {
  name: string | null;
};

export type CanonicalJewelryDesignRow = {
  id: string;
  item_number: string;
  design_name: string;
  material: string | null;
  main_stone: string | null;
  canonical_photo_url: string | null;
  special_features: string | null;
  type_prefix: SparkleSuiteJewelryType;
  collection: CollectionRelation | CollectionRelation[] | null;
};

type TradeListingRow = {
  id: string;
  design_id: string;
};

type CatalogClientFactory = () => Promise<Pick<SupabaseClient, "from">>;

type CatalogReadOptions = {
  createSupabaseClient?: CatalogClientFactory;
  isConfigured?: () => boolean;
  useFixtureFallback?: boolean;
};

const catalogSelect =
  "id,item_number,design_name,material,main_stone,canonical_photo_url,special_features,type_prefix,collection:collections(name)";

export async function getCatalogJewelryItems(options: CatalogReadOptions = {}): Promise<JewelryItem[]> {
  const configured = options.isConfigured?.() ?? isCanonicalCatalogConfigured();

  if (!configured) {
    return options.useFixtureFallback === false ? [] : getFixtureJewelryItems();
  }

  try {
    const supabase = await createCatalogClient(options);
    const { data, error } = await supabase
      .from("jewelry_designs")
      .select(catalogSelect)
      .order("created_at", { ascending: false });

    if (error || !Array.isArray(data)) {
      return options.useFixtureFallback === false ? [] : getFixtureJewelryItems();
    }

    const items = mapCanonicalJewelryDesignRows(data as unknown as CanonicalJewelryDesignRow[]);

    return withKnownRepListingIds(supabase, items, options.useFixtureFallback === false);
  } catch {
    return options.useFixtureFallback === false ? [] : getFixtureJewelryItems();
  }
}

export async function getCatalogJewelryItemById(
  itemId: string,
  options: CatalogReadOptions = {},
): Promise<JewelryItem | undefined> {
  const configured = options.isConfigured?.() ?? isCanonicalCatalogConfigured();

  if (!configured) {
    return options.useFixtureFallback === false ? undefined : getFixtureJewelryItems().find((item) => item.id === itemId);
  }

  try {
    const supabase = await createCatalogClient(options);
    const { data, error } = await supabase
      .from("jewelry_designs")
      .select(catalogSelect)
      .eq("id", itemId)
      .maybeSingle();

    if (error || !data) {
      return options.useFixtureFallback === false ? undefined : getFixtureJewelryItems().find((item) => item.id === itemId);
    }

    const [item] = mapCanonicalJewelryDesignRows([data as unknown as CanonicalJewelryDesignRow]);

    return item ? (await withKnownRepListingIds(supabase, [item], options.useFixtureFallback === false))[0] : undefined;
  } catch {
    return options.useFixtureFallback === false ? undefined : getFixtureJewelryItems().find((item) => item.id === itemId);
  }
}

export function mapCanonicalJewelryDesignRows(rows: readonly CanonicalJewelryDesignRow[]): JewelryItem[] {
  return rows.map(mapCanonicalJewelryDesignRow);
}

export function mapCanonicalJewelryDesignRow(row: CanonicalJewelryDesignRow): JewelryItem {
  const collection = readCollectionRelation(row.collection);
  const collectionName = collection?.name?.trim() || "Unassigned Collection";

  return {
    id: row.id,
    name: row.design_name.trim() || row.item_number,
    collectionName,
    jewelryType: mapSparkleSuiteJewelryType(row.type_prefix),
    imageUrl: row.canonical_photo_url?.trim() ?? "",
    bpLabel: deriveBombPartyLabel(row),
    itemNumber: row.item_number,
    knownRepListingIds: [],
  };
}

export function mapSparkleSuiteJewelryType(typePrefix: SparkleSuiteJewelryType): JewelryType {
  const types: Record<SparkleSuiteJewelryType, JewelryType> = {
    BR: "bracelet",
    ER: "earrings",
    NK: "necklace",
    RG: "ring",
    ST: "other",
  };

  return types[typePrefix];
}

export function isCanonicalCatalogConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || isSupabaseConfigured()),
  );
}

async function createCatalogClient(options: CatalogReadOptions): Promise<Pick<SupabaseClient, "from">> {
  if (options.createSupabaseClient) {
    return options.createSupabaseClient();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (supabaseUrl && serviceRoleKey) {
    return createSupabaseServiceClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  return createServerSupabaseClient();
}

async function withKnownRepListingIds(
  supabase: Pick<SupabaseClient, "from">,
  items: JewelryItem[],
  shouldFailClosed: boolean,
): Promise<JewelryItem[]> {
  if (items.length === 0) {
    return [];
  }

  const itemIds = items.map((item) => item.id);

  try {
    const { data, error } = await supabase
      .from("trade_listings")
      .select("id,design_id")
      .eq("status", "available")
      .in("design_id", itemIds);

    if (error || !Array.isArray(data)) {
      return shouldFailClosed ? items : items;
    }

    const listingIdsByDesignId = new Map<string, string[]>();

    for (const listing of data as unknown as TradeListingRow[]) {
      const listingIds = listingIdsByDesignId.get(listing.design_id) ?? [];
      listingIds.push(listing.id);
      listingIdsByDesignId.set(listing.design_id, listingIds);
    }

    return items.map((item) => ({
      ...item,
      knownRepListingIds: listingIdsByDesignId.get(item.id) ?? [],
    }));
  } catch {
    return items;
  }
}

function deriveBombPartyLabel(row: CanonicalJewelryDesignRow): BombPartyLabel {
  const searchableText = [row.design_name, row.material, row.main_stone, row.special_features]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();

  if (searchableText.includes("unicorn")) {
    return "unicorn";
  }

  if (searchableText.includes("diamond")) {
    return "diamond";
  }

  return "standard";
}

function readCollectionRelation(
  collection: CanonicalJewelryDesignRow["collection"],
): CollectionRelation | undefined {
  if (Array.isArray(collection)) {
    return collection[0];
  }

  return collection ?? undefined;
}

function getFixtureJewelryItems(): JewelryItem[] {
  return sparkleFinderJewelryItems.map((item) => ({ ...item }));
}
