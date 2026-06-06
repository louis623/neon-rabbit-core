import { sparkleFinderJewelryItems } from "../fixtures/sparkle-finder-fixtures";
import type { BombPartyLabel, JewelryItem, JewelryType } from "./types";

export type SparkleSuiteFinderJewelryType = "ring" | "necklace" | "earrings" | "stack" | "bracelet";

export type SparkleSuiteFinderCatalogItem = {
  designId: string;
  itemNumber: string;
  designName: string;
  collectionName: string | null;
  collectionYear: number | null;
  jewelryType: SparkleSuiteFinderJewelryType;
  material: string | null;
  mainStone: string | null;
  bpMsrp: number | null;
  canonicalPhotoUrl: string | null;
  searchTags: string[];
  availableListingCount: number;
};

export type SparkleSuiteFinderPublicRep = {
  repId: string;
  displayName: string;
  businessName: string;
  profilePhotoUrl: string | null;
  customerSitePath: string;
  tradeBoardPath: string;
};

export type SparkleSuiteFinderPublicShow = {
  showId: string;
  repId: string;
  platform: string;
  startsAt: string;
  durationMinutes: number;
  title: string | null;
  description: string | null;
  status: "scheduled" | "live";
};

export type FinderAvailabilityMatch = {
  listingId: string;
  listedAt: string | null;
  photoUrl: string | null;
  item: JewelryItem;
  rep: SparkleSuiteFinderPublicRep;
  nextShow: SparkleSuiteFinderPublicShow | null;
};

export type FinderAvailabilityResult = {
  requestedItem: JewelryItem | null;
  exactMatches: FinderAvailabilityMatch[];
  similarMatches: FinderAvailabilityMatch[];
};

type CatalogReadOptions = {
  apiBaseUrl?: string;
  fetcher?: (input: string, init?: RequestInit) => Promise<Response>;
  limit?: number;
  query?: string;
  useFixtureFallback?: boolean;
};

type CatalogListResponse = {
  items?: SparkleSuiteFinderCatalogItem[];
};

type CatalogDetailResponse = {
  item?: SparkleSuiteFinderCatalogItem;
};

type AvailabilityResponse = {
  requestedItem?: SparkleSuiteFinderCatalogItem | null;
  exactMatches?: SparkleSuiteFinderAvailabilityMatch[];
  similarMatches?: SparkleSuiteFinderAvailabilityMatch[];
};

type SparkleSuiteFinderAvailabilityMatch = {
  listingId: string;
  listedAt: string | null;
  photoUrl: string | null;
  item: SparkleSuiteFinderCatalogItem;
  rep: SparkleSuiteFinderPublicRep;
  nextShow: SparkleSuiteFinderPublicShow | null;
};

const defaultSparkleSuiteFinderApiBaseUrl = "https://www.yoursparklesuite.com";
const defaultCatalogLimit = 50;
const defaultAvailabilityLimit = 24;

export async function getCatalogJewelryItems(options: CatalogReadOptions = {}): Promise<JewelryItem[]> {
  const apiBaseUrl = getSparkleSuiteFinderApiBaseUrl(options);

  if (!apiBaseUrl) {
    return fallbackItems(options);
  }

  const params = new URLSearchParams({ limit: String(options.limit ?? defaultCatalogLimit) });
  const query = options.query?.trim();

  if (query) {
    params.set("query", query);
  }

  try {
    const payload = await fetchJson<CatalogListResponse>(
      `${apiBaseUrl}/api/public/finder/catalog?${params.toString()}`,
      options,
    );
    const items = Array.isArray(payload.items) ? payload.items : [];

    return items.map(mapSparkleSuiteFinderCatalogItem);
  } catch {
    return fallbackItems(options);
  }
}

export async function getCatalogJewelryItemById(
  itemId: string,
  options: CatalogReadOptions = {},
): Promise<JewelryItem | undefined> {
  const trimmedItemId = itemId.trim();

  if (!trimmedItemId) {
    return undefined;
  }

  const apiBaseUrl = getSparkleSuiteFinderApiBaseUrl(options);

  if (!apiBaseUrl) {
    return fallbackItemById(trimmedItemId, options);
  }

  try {
    const payload = await fetchJson<CatalogDetailResponse>(
      `${apiBaseUrl}/api/public/finder/catalog/${encodeURIComponent(trimmedItemId)}`,
      options,
    );

    return payload.item ? mapSparkleSuiteFinderCatalogItem(payload.item) : fallbackItemById(trimmedItemId, options);
  } catch {
    return fallbackItemById(trimmedItemId, options);
  }
}

export async function getFinderAvailabilityForJewelryItem(
  itemId: string,
  options: CatalogReadOptions = {},
): Promise<FinderAvailabilityResult | undefined> {
  const trimmedItemId = itemId.trim();

  if (!trimmedItemId) {
    return undefined;
  }

  const apiBaseUrl = getSparkleSuiteFinderApiBaseUrl(options);

  if (!apiBaseUrl) {
    return undefined;
  }

  const params = new URLSearchParams({
    designId: trimmedItemId,
    limit: String(options.limit ?? defaultAvailabilityLimit),
  });

  try {
    const payload = await fetchJson<AvailabilityResponse>(
      `${apiBaseUrl}/api/public/finder/availability?${params.toString()}`,
      options,
    );

    return {
      requestedItem: payload.requestedItem ? mapSparkleSuiteFinderCatalogItem(payload.requestedItem) : null,
      exactMatches: mapAvailabilityMatches(payload.exactMatches),
      similarMatches: mapAvailabilityMatches(payload.similarMatches),
    };
  } catch {
    return undefined;
  }
}

export function mapSparkleSuiteFinderCatalogItem(item: SparkleSuiteFinderCatalogItem): JewelryItem {
  return {
    id: item.designId,
    name: item.designName.trim() || item.itemNumber,
    collectionName: item.collectionName?.trim() || "Unassigned Collection",
    collectionYear: item.collectionYear,
    jewelryType: mapSparkleSuiteFinderJewelryType(item.jewelryType),
    imageUrl: item.canonicalPhotoUrl?.trim() ?? "",
    bpLabel: deriveBombPartyLabel(item),
    itemNumber: item.itemNumber,
    searchTags: Array.isArray(item.searchTags) ? [...item.searchTags] : [],
    availableListingCount: item.availableListingCount,
    knownRepListingIds: [],
  };
}

export function mapSparkleSuiteFinderJewelryType(jewelryType: SparkleSuiteFinderJewelryType): JewelryType {
  const types: Record<SparkleSuiteFinderJewelryType, JewelryType> = {
    bracelet: "bracelet",
    earrings: "earrings",
    necklace: "necklace",
    ring: "ring",
    stack: "other",
  };

  return types[jewelryType];
}

export function getSparkleSuiteFinderPublicBaseUrl(options: Pick<CatalogReadOptions, "apiBaseUrl"> = {}): string {
  return getSparkleSuiteFinderApiBaseUrl(options);
}

function mapAvailabilityMatches(matches: SparkleSuiteFinderAvailabilityMatch[] | undefined): FinderAvailabilityMatch[] {
  return (matches ?? []).map((match) => ({
    listingId: match.listingId,
    listedAt: match.listedAt,
    photoUrl: match.photoUrl,
    item: mapSparkleSuiteFinderCatalogItem(match.item),
    rep: match.rep,
    nextShow: match.nextShow,
  }));
}

async function fetchJson<T>(url: string, options: CatalogReadOptions): Promise<T> {
  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Sparkle Suite Finder API returned ${response.status}`);
  }

  return (await response.json()) as T;
}

function getSparkleSuiteFinderApiBaseUrl(options: Pick<CatalogReadOptions, "apiBaseUrl"> = {}): string {
  const configured =
    options.apiBaseUrl ??
    process.env.SPARKLE_SUITE_FINDER_API_BASE_URL ??
    process.env.NEXT_PUBLIC_SPARKLE_SUITE_FINDER_API_BASE_URL ??
    defaultSparkleSuiteFinderApiBaseUrl;

  return configured.trim().replace(/\/+$/, "");
}

function deriveBombPartyLabel(item: SparkleSuiteFinderCatalogItem): BombPartyLabel {
  const searchableText = [
    item.designName,
    item.material,
    item.mainStone,
    item.collectionName,
    ...(Array.isArray(item.searchTags) ? item.searchTags : []),
  ]
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

function fallbackItems(options: CatalogReadOptions): JewelryItem[] {
  return options.useFixtureFallback === false ? [] : getFixtureJewelryItems();
}

function fallbackItemById(itemId: string, options: CatalogReadOptions): JewelryItem | undefined {
  return options.useFixtureFallback === false ? undefined : getFixtureJewelryItems().find((item) => item.id === itemId);
}

function getFixtureJewelryItems(): JewelryItem[] {
  return sparkleFinderJewelryItems.map((item) => ({ ...item }));
}
