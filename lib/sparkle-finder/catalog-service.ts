import {
  sparkleFinderJewelryItems,
  sparkleFinderLiveShows,
  sparkleFinderRepBoardListings,
  sparkleFinderReps,
} from "../fixtures/sparkle-finder-fixtures";
import type { BombPartyLabel, JewelryItem, JewelryType, LiveShow, RepBoardListing, RepSummary } from "./types";

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

export type SparkleSuiteFinderLeadShow = {
  showId: string;
  showName: string;
  repFirstName: string;
  startsAt: string;
  status: "scheduled" | "live";
  customerSiteUrl: string;
};

export type SparkleSuiteFinderRepDirectoryShow =
  | SparkleSuiteFinderLeadShow
  | {
      id: string;
      title: string;
      startsAt: string;
      status: "scheduled" | "live";
      customerShowUrl: string | null;
      durationMinutes?: number | null;
    };

export type SparkleSuiteFinderRepDirectoryItem = {
  repId: string;
  displayName: string;
  businessName: string | null;
  avatarUrl: string | null;
  state: string | null;
  customerSiteUrl: string | null;
  repBoardUrl: string | null;
  nextShow: SparkleSuiteFinderRepDirectoryShow | null;
};

export type FinderAvailabilityMatch = {
  listingId: string;
  listedAt: string | null;
  photoUrl: string | null;
  item: JewelryItem;
  showName: string;
  repFirstName: string;
  customerSiteUrl: string;
  nextShow: SparkleSuiteFinderLeadShow;
};

export type FinderAvailabilityResult = {
  requestedItem: JewelryItem | null;
  exactMatches: FinderAvailabilityMatch[];
  similarMatches: FinderAvailabilityMatch[];
};

export type FinderLiveShow = SparkleSuiteFinderLeadShow;
export type FinderRepDirectoryData = {
  reps: RepSummary[];
  liveShows: LiveShow[];
  boardListings: RepBoardListing[];
  status: FinderRepDirectoryStatus;
};
export type FinderRepDirectoryStatus = "ready" | "empty" | "unavailable";
export type CatalogFacetKey = "collections" | "materials" | "stones" | "types" | "labels" | "years";

export type CatalogFacetOption = {
  value: string;
  count: number;
};

export type CatalogFacetOptions = Record<CatalogFacetKey, CatalogFacetOption[]>;

export type CatalogItemsReadResult =
  | { status: "success"; items: JewelryItem[] }
  | { status: "error" };

export type CatalogItemReadResult =
  | { status: "success"; item?: JewelryItem }
  | { status: "error" };

type CatalogReadOptions = {
  apiBaseUrl?: string;
  fetcher?: (input: string, init?: RequestInit) => Promise<Response>;
  collection?: string;
  collectionYear?: number;
  label?: BombPartyLabel | "all";
  limit?: number;
  mainStone?: string;
  material?: string;
  query?: string;
  type?: JewelryType | "all";
  useFixtureFallback?: boolean;
};

type CatalogListResponse = {
  items?: SparkleSuiteFinderCatalogItem[];
};

type CatalogFacetsResponse = {
  facets?: Partial<CatalogFacetOptions>;
};

type CatalogDetailResponse = {
  item?: SparkleSuiteFinderCatalogItem;
};

type AvailabilityResponse = {
  requestedItem?: SparkleSuiteFinderCatalogItem | null;
  exactMatches?: SparkleSuiteFinderAvailabilityMatch[];
  similarMatches?: SparkleSuiteFinderAvailabilityMatch[];
};

type LiveShowsResponse = {
  shows?: SparkleSuiteFinderLeadShow[];
};

type RepDirectoryResponse = {
  reps?: unknown;
};

type SparkleSuiteFinderAvailabilityMatch = {
  listingId: string;
  listedAt: string | null;
  photoUrl: string | null;
  item: SparkleSuiteFinderCatalogItem;
  showName: string;
  repFirstName: string;
  customerSiteUrl: string;
  nextShow: SparkleSuiteFinderLeadShow | null;
};

const defaultSparkleSuiteFinderApiBaseUrl = "https://www.yoursparklesuite.com";
const defaultCatalogLimit = 50;
const defaultAvailabilityLimit = 24;
const defaultLiveShowsLimit = 50;
const defaultRepDirectoryLimit = 200;

export async function getCatalogJewelryItems(options: CatalogReadOptions = {}): Promise<JewelryItem[]> {
  const result = await getCatalogJewelryItemsResult(options);
  return result.status === "success" ? result.items : fallbackItems(options);
}

export async function getCatalogJewelryItemsResult(options: CatalogReadOptions = {}): Promise<CatalogItemsReadResult> {
  const apiBaseUrl = getSparkleSuiteFinderApiBaseUrl(options);

  if (!apiBaseUrl) {
    return options.useFixtureFallback === false
      ? { status: "error" }
      : { status: "success", items: fallbackItems(options) };
  }

  const params = buildCatalogParams(options, { includeLimit: true });

  try {
    const payload = await fetchJson<CatalogListResponse>(
      `${apiBaseUrl}/api/public/finder/catalog?${params.toString()}`,
      options,
    );
    const items = Array.isArray(payload.items) ? payload.items : [];

    return { status: "success", items: items.map(mapSparkleSuiteFinderCatalogItem) };
  } catch {
    return options.useFixtureFallback === false
      ? { status: "error" }
      : { status: "success", items: fallbackItems(options) };
  }
}

export async function getCatalogFacetOptions(options: CatalogReadOptions = {}): Promise<CatalogFacetOptions> {
  const apiBaseUrl = getSparkleSuiteFinderApiBaseUrl(options);

  if (!apiBaseUrl) {
    return deriveCatalogFacetOptions(getFixtureJewelryItems());
  }

  const params = buildCatalogParams(options, { includeLimit: false });
  const queryString = params.toString();
  const url = `${apiBaseUrl}/api/public/finder/catalog/facets${queryString ? `?${queryString}` : ""}`;

  try {
    const payload = await fetchJson<CatalogFacetsResponse>(url, options);
    return normalizeCatalogFacetOptions(payload.facets);
  } catch {
    return options.useFixtureFallback === false ? emptyCatalogFacetOptions() : deriveCatalogFacetOptions(getFixtureJewelryItems());
  }
}

export async function getCatalogJewelryItemById(
  itemId: string,
  options: CatalogReadOptions = {},
): Promise<JewelryItem | undefined> {
  const result = await getCatalogJewelryItemByIdResult(itemId, options);
  return result.status === "success" ? result.item : fallbackItemById(itemId.trim(), options);
}

export async function getCatalogJewelryItemByIdResult(
  itemId: string,
  options: CatalogReadOptions = {},
): Promise<CatalogItemReadResult> {
  const trimmedItemId = itemId.trim();

  if (!trimmedItemId) {
    return { status: "success", item: undefined };
  }

  const apiBaseUrl = getSparkleSuiteFinderApiBaseUrl(options);

  if (!apiBaseUrl) {
    return options.useFixtureFallback === false
      ? { status: "error" }
      : { status: "success", item: fallbackItemById(trimmedItemId, options) };
  }

  try {
    const payload = await fetchJson<CatalogDetailResponse>(
      `${apiBaseUrl}/api/public/finder/catalog/${encodeURIComponent(trimmedItemId)}`,
      options,
    );

    return {
      status: "success",
      item: payload.item
        ? mapSparkleSuiteFinderCatalogItem(payload.item)
        : fallbackItemById(trimmedItemId, options),
    };
  } catch (error) {
    if (isCatalogApiNotFound(error)) {
      return {
        status: "success",
        item: fallbackItemById(trimmedItemId, options),
      };
    }

    return options.useFixtureFallback === false
      ? { status: "error" }
      : { status: "success", item: fallbackItemById(trimmedItemId, options) };
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

export async function getFinderLiveShows(options: CatalogReadOptions = {}): Promise<FinderLiveShow[]> {
  const apiBaseUrl = getSparkleSuiteFinderApiBaseUrl(options);

  if (!apiBaseUrl) {
    return fallbackLiveShows(options);
  }

  const params = new URLSearchParams({ limit: String(options.limit ?? defaultLiveShowsLimit) });

  try {
    const payload = await fetchJson<LiveShowsResponse>(
      `${apiBaseUrl}/api/public/finder/live-shows?${params.toString()}`,
      options,
    );

    return mapLiveShows(payload.shows);
  } catch {
    return fallbackLiveShows(options);
  }
}

export async function getFinderRepDirectoryData(options: CatalogReadOptions = {}): Promise<FinderRepDirectoryData> {
  const apiBaseUrl = getSparkleSuiteFinderApiBaseUrl(options);

  if (!apiBaseUrl) {
    return fallbackRepDirectoryData(options);
  }

  const params = new URLSearchParams({ limit: String(options.limit ?? defaultRepDirectoryLimit) });
  appendCatalogFilterParam(params, "query", options.query);

  try {
    const payload = await fetchJson<RepDirectoryResponse>(
      `${apiBaseUrl}/api/public/finder/reps?${params.toString()}`,
      options,
    );

    if (!Array.isArray(payload.reps)) {
      throw new Error("Sparkle Suite Finder Reps API returned an invalid payload");
    }

    return mapRepDirectoryItems(payload.reps, apiBaseUrl);
  } catch {
    return fallbackRepDirectoryData(options);
  }
}

export function mapSparkleSuiteFinderCatalogItem(item: SparkleSuiteFinderCatalogItem): JewelryItem {
  return {
    id: item.designId,
    name: item.designName.trim() || item.itemNumber,
    collectionName: item.collectionName?.trim() || "Unassigned Collection",
    collectionYear: item.collectionYear,
    jewelryType: mapSparkleSuiteFinderJewelryType(item.jewelryType),
    material: item.material,
    mainStone: item.mainStone,
    bpMsrp: item.bpMsrp,
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
    stack: "stack",
  };

  return types[jewelryType];
}

export function getSparkleSuiteFinderPublicBaseUrl(options: Pick<CatalogReadOptions, "apiBaseUrl"> = {}): string {
  return getSparkleSuiteFinderApiBaseUrl(options);
}

export function shouldUseCatalogFixtureFallback(env: Record<string, string | undefined> = process.env): boolean {
  return env.NODE_ENV !== "production" || env.SPARKLE_FINDER_ENABLE_PREVIEW_AUTH === "true";
}

function mapAvailabilityMatches(matches: SparkleSuiteFinderAvailabilityMatch[] | undefined): FinderAvailabilityMatch[] {
  return (matches ?? []).flatMap((match) => {
    if (!match.nextShow || !match.customerSiteUrl || !match.showName || !match.repFirstName) {
      return [];
    }

    return [
      {
        listingId: match.listingId,
        listedAt: match.listedAt,
        photoUrl: match.photoUrl,
        item: mapSparkleSuiteFinderCatalogItem(match.item),
        showName: match.showName,
        repFirstName: match.repFirstName,
        customerSiteUrl: match.customerSiteUrl,
        nextShow: match.nextShow,
      },
    ];
  });
}

function mapLiveShows(shows: SparkleSuiteFinderLeadShow[] | undefined): FinderLiveShow[] {
  return (shows ?? []).filter((show) => Boolean(show.showId && show.showName && show.repFirstName && show.startsAt && show.customerSiteUrl));
}

function mapRepDirectoryItems(items: unknown[], apiBaseUrl: string): FinderRepDirectoryData {
  const seenRepIds = new Set<string>();
  const directoryItems = items.flatMap((item) => {
    const normalized = normalizeRepDirectoryItem(item, apiBaseUrl);

    if (!normalized || seenRepIds.has(normalized.repId)) {
      return [];
    }

    seenRepIds.add(normalized.repId);
    return [normalized];
  });

  return {
    reps: directoryItems.map(mapRepDirectoryRep),
    liveShows: directoryItems.flatMap(mapRepDirectoryLiveShow),
    boardListings: directoryItems.flatMap(mapRepDirectoryBoardListing),
    status: directoryItems.length > 0 ? "ready" : items.length === 0 ? "empty" : "unavailable",
  };
}

function normalizeRepDirectoryItem(value: unknown, apiBaseUrl: string): SparkleSuiteFinderRepDirectoryItem | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const repId = readRequiredString(record.repId);
  const displayName = readRequiredString(record.displayName);

  if (!repId || !displayName) {
    return null;
  }

  return {
    repId,
    displayName,
    businessName: readOptionalString(record.businessName),
    avatarUrl: readHttpsUrl(record.avatarUrl),
    state: readOptionalString(record.state),
    customerSiteUrl: readSuitePublicUrl(record.customerSiteUrl, apiBaseUrl),
    repBoardUrl: readSuitePublicUrl(record.repBoardUrl, apiBaseUrl),
    nextShow: normalizeRepDirectoryShow(record.nextShow, apiBaseUrl),
  };
}

function normalizeRepDirectoryShow(
  value: unknown,
  apiBaseUrl: string,
): SparkleSuiteFinderRepDirectoryShow | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = readRequiredString(record.showId) || readRequiredString(record.id);
  const title = readRequiredString(record.showName) || readRequiredString(record.title);
  const startsAt = readRequiredString(record.startsAt);
  const status = record.status === "live" || record.status === "scheduled" ? record.status : null;
  const customerShowUrl = readSuitePublicUrl(record.customerSiteUrl ?? record.customerShowUrl, apiBaseUrl);

  if (!id || !title || !startsAt || Number.isNaN(Date.parse(startsAt)) || !status) {
    return null;
  }

  return {
    id,
    title,
    startsAt,
    status,
    customerShowUrl,
    durationMinutes:
      typeof record.durationMinutes === "number" && Number.isFinite(record.durationMinutes)
        ? Math.max(0, Math.floor(record.durationMinutes))
        : null,
  };
}

function readRequiredString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(value: unknown): string | null {
  const trimmed = readRequiredString(value);
  return trimmed || null;
}

function readHttpsUrl(value: unknown): string | null {
  const trimmed = readRequiredString(value);

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" && !url.username && !url.password && !url.port ? url.toString() : null;
  } catch {
    return null;
  }
}

function readSuitePublicUrl(value: unknown, apiBaseUrl: string): string | null {
  const safeUrl = readHttpsUrl(value);

  if (!safeUrl) {
    return null;
  }

  try {
    const candidate = new URL(safeUrl);
    const suiteBase = new URL(apiBaseUrl);
    const allowedHosts = new Set([
      suiteBase.hostname.toLowerCase(),
      getAlternateWwwHostname(suiteBase.hostname),
      "yoursparklesuite.com",
      "www.yoursparklesuite.com",
    ]);

    return allowedHosts.has(candidate.hostname.toLowerCase()) ? candidate.toString() : null;
  } catch {
    return null;
  }
}

function getAlternateWwwHostname(hostname: string): string {
  const normalized = hostname.toLowerCase();
  return normalized.startsWith("www.") ? normalized.slice(4) : `www.${normalized}`;
}

function mapRepDirectoryRep(item: SparkleSuiteFinderRepDirectoryItem): RepSummary {
  return {
    id: item.repId,
    avatarUrl: item.avatarUrl?.trim() ?? "",
    businessName: item.businessName?.trim() || item.displayName,
    displayName: item.displayName,
    nextLiveShowId: getRepDirectoryShowId(item.nextShow),
    siteUrl: item.customerSiteUrl?.trim() ?? "",
    state: item.state?.trim() ?? "",
  };
}

function mapRepDirectoryLiveShow(item: SparkleSuiteFinderRepDirectoryItem): LiveShow[] {
  const show = item.nextShow;

  if (!show) {
    return [];
  }

  const showId = getRepDirectoryShowId(show);
  const title = getRepDirectoryShowTitle(show);
  const startsAt = getRepDirectoryShowStartsAt(show);
  const showUrl = getRepDirectoryShowUrl(show, item.customerSiteUrl);

  if (!showId || !title || !startsAt) {
    return [];
  }

  return [
    {
      id: showId,
      durationMinutes: "durationMinutes" in show && typeof show.durationMinutes === "number" ? show.durationMinutes : 120,
      repId: item.repId,
      showUrl,
      startsAt,
      status: show.status,
      title,
    },
  ];
}

function mapRepDirectoryBoardListing(item: SparkleSuiteFinderRepDirectoryItem): RepBoardListing[] {
  const boardUrl = item.repBoardUrl?.trim();

  if (!boardUrl) {
    return [];
  }

  return [
    {
      id: `${item.repId}-board`,
      boardUrl,
      jewelryItemId: "",
      listedAt: getRepDirectoryShowStartsAt(item.nextShow),
      repId: item.repId,
      status: "available",
    },
  ];
}

function getRepDirectoryShowId(show: SparkleSuiteFinderRepDirectoryShow | null): string {
  if (!show) {
    return "";
  }

  return "showId" in show ? show.showId : show.id;
}

function getRepDirectoryShowTitle(show: SparkleSuiteFinderRepDirectoryShow | null): string {
  if (!show) {
    return "";
  }

  return "showName" in show ? show.showName : show.title;
}

function getRepDirectoryShowStartsAt(show: SparkleSuiteFinderRepDirectoryShow | null): string {
  return show?.startsAt ?? "";
}

function getRepDirectoryShowUrl(show: SparkleSuiteFinderRepDirectoryShow, repSiteUrl: string | null): string {
  const showUrl = "customerSiteUrl" in show ? show.customerSiteUrl : show.customerShowUrl;

  return showUrl?.trim() || repSiteUrl?.trim() || "";
}

async function fetchJson<T>(url: string, options: CatalogReadOptions): Promise<T> {
  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(url, { cache: "no-store" });

  if (!response.ok) {
    throw new CatalogApiError(response.status);
  }

  return (await response.json()) as T;
}

class CatalogApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Sparkle Suite Finder API returned ${status}`);
    this.name = "CatalogApiError";
    this.status = status;
  }
}

function isCatalogApiNotFound(error: unknown): boolean {
  return error instanceof CatalogApiError && error.status === 404;
}

function getSparkleSuiteFinderApiBaseUrl(options: Pick<CatalogReadOptions, "apiBaseUrl"> = {}): string {
  const configured =
    options.apiBaseUrl ??
    process.env.SPARKLE_SUITE_FINDER_API_BASE_URL ??
    process.env.NEXT_PUBLIC_SPARKLE_SUITE_FINDER_API_BASE_URL ??
    defaultSparkleSuiteFinderApiBaseUrl;

  return configured.trim().replace(/\/+$/, "");
}

function buildCatalogParams(options: CatalogReadOptions, { includeLimit }: { includeLimit: boolean }): URLSearchParams {
  const params = new URLSearchParams();

  if (includeLimit) {
    params.set("limit", String(options.limit ?? defaultCatalogLimit));
  }

  appendCatalogFilterParam(params, "query", options.query);
  appendCatalogFilterParam(params, "type", options.type);
  appendCatalogFilterParam(params, "collection", options.collection);
  appendCatalogFilterParam(params, "material", options.material);
  appendCatalogFilterParam(params, "stone", options.mainStone);
  appendCatalogFilterParam(params, "label", options.label);
  if (typeof options.collectionYear === "number") {
    params.set("year", String(options.collectionYear));
  }

  return params;
}

function appendCatalogFilterParam(params: URLSearchParams, key: string, value: string | null | undefined): void {
  const trimmed = value?.trim();

  if (trimmed && trimmed !== "all") {
    params.set(key, trimmed);
  }
}

function normalizeCatalogFacetOptions(facets: Partial<CatalogFacetOptions> | undefined): CatalogFacetOptions {
  const empty = emptyCatalogFacetOptions();

  return {
    collections: normalizeFacetList(facets?.collections ?? empty.collections),
    materials: normalizeFacetList(facets?.materials ?? empty.materials),
    stones: normalizeFacetList(facets?.stones ?? empty.stones),
    types: normalizeFacetList(facets?.types ?? empty.types),
    labels: normalizeFacetList(facets?.labels ?? empty.labels),
    years: normalizeFacetList(facets?.years ?? empty.years),
  };
}

function normalizeFacetList(options: CatalogFacetOption[]): CatalogFacetOption[] {
  return options.flatMap((option) => {
    const value = option.value?.trim();
    const count = Number.isFinite(option.count) ? Math.max(0, option.count) : 0;

    return value && count > 0 ? [{ value, count }] : [];
  });
}

function deriveCatalogFacetOptions(items: JewelryItem[]): CatalogFacetOptions {
  return {
    collections: countFacetValues(items.map((item) => item.collectionName)),
    materials: countFacetValues(items.map((item) => item.material ?? "")),
    stones: countFacetValues(items.map((item) => item.mainStone ?? "")),
    types: countFacetValues(items.map((item) => item.jewelryType)),
    labels: countFacetValues(items.map((item) => item.bpLabel)),
    years: countFacetValues(items.map((item) => (item.collectionYear ? String(item.collectionYear) : ""))),
  };
}

function countFacetValues(values: string[]): CatalogFacetOption[] {
  const counts = new Map<string, number>();

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => left.value.localeCompare(right.value));
}

function emptyCatalogFacetOptions(): CatalogFacetOptions {
  return {
    collections: [],
    materials: [],
    stones: [],
    types: [],
    labels: [],
    years: [],
  };
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

function fallbackLiveShows(options: CatalogReadOptions): FinderLiveShow[] {
  if (options.useFixtureFallback === false) {
    return [];
  }

  return sparkleFinderLiveShows.flatMap((show) => {
    const rep = sparkleFinderReps.find((candidate) => candidate.id === show.repId);

    if (!rep) {
      return [];
    }

    return [
      {
        showId: show.id,
        showName: show.title,
        repFirstName: rep.displayName.split(" ").filter(Boolean)[0] ?? rep.displayName,
        startsAt: show.startsAt,
        status: show.status === "live" ? "live" : "scheduled",
        customerSiteUrl: rep.siteUrl,
      },
    ];
  });
}

function fallbackRepDirectoryData(options: CatalogReadOptions): FinderRepDirectoryData {
  if (options.useFixtureFallback === false) {
    return {
      boardListings: [],
      liveShows: [],
      reps: [],
      status: "unavailable",
    };
  }

  return {
    boardListings: sparkleFinderRepBoardListings.map((listing) => ({ ...listing })),
    liveShows: sparkleFinderLiveShows.map((show) => ({ ...show })),
    reps: sparkleFinderReps.map((rep) => ({ ...rep })),
    status: sparkleFinderReps.length > 0 ? "ready" : "empty",
  };
}
