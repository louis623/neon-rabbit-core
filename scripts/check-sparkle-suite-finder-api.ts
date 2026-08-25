import { pathToFileURL } from "node:url";

export type ContractMode = "diagnostic" | "strict";
export type Capability = "supported" | "unsupported";

export type ContractReport = {
  ok: boolean;
  mode: ContractMode;
  baseUrl: string;
  failures: string[];
  capabilities: {
    catalogPagination: Capability;
    catalogBatch: Capability;
    catalogFacets: Capability;
    availabilityQuantity: Capability;
    availabilityPagination: Capability;
  };
  catalogSchemaVersion: 2 | "legacy" | "unknown";
  catalogItems: number;
  catalogPagesRead: number;
  availabilityMatches: number;
  availabilityLeads: number | null;
  availabilityDancers: number | null;
  availabilityPositiveInventory: boolean;
  liveShows: number;
  reps: number;
};

export type ContractCheckOptions = {
  baseUrl?: string;
  fetcher?: (input: string, init?: RequestInit) => Promise<Response>;
  mode?: ContractMode;
  timeoutMs?: number;
};

type PageInfo = { hasMore: boolean; nextCursor: string | null };
type AvailabilityPageInfo = PageInfo & {
  totalLeadCount: number;
  totalDancerCount: number;
};
type CatalogAudit = {
  isV2: boolean;
  items: Record<string, unknown>[];
  totalCount: number | null;
  pageInfo: PageInfo | null;
};
type AvailabilityAudit = {
  isV2: boolean;
  exactMatches: Record<string, unknown>[];
  similarMatches: Record<string, unknown>[];
  exactPageInfo: AvailabilityPageInfo | null;
  similarPageInfo: AvailabilityPageInfo | null;
  dancerCount: number;
  hasPositiveInventory: boolean;
};

const defaultBaseUrl = (
  process.env.SPARKLE_SUITE_FINDER_API_BASE_URL ??
  process.env.NEXT_PUBLIC_SPARKLE_SUITE_FINDER_API_BASE_URL ??
  "https://www.yoursparklesuite.com"
).replace(/\/+$/, "");
const missingDesignIdProbe = "00000000-0000-4000-8000-000000000000";
const diagnosticPaginationPageLimit = 2;
const strictPaginationPageLimit = 5;

export async function runSparkleSuiteFinderContractCheck(
  options: ContractCheckOptions = {},
): Promise<ContractReport> {
  const baseUrl = (options.baseUrl ?? defaultBaseUrl).replace(/\/+$/, "");
  const fetcher = options.fetcher ?? fetch;
  const mode = options.mode ?? "diagnostic";
  const timeoutMs = options.timeoutMs ?? 10_000;
  const failures: string[] = [];
  const request = (url: string, init?: RequestInit) =>
    readJson(url, { fetcher, timeoutMs, init }, failures);

  let catalogSchemaVersion: ContractReport["catalogSchemaVersion"] = "unknown";
  let catalogPagination: Capability = "unsupported";
  let catalogBatch: Capability = "unsupported";
  let catalogFacets: Capability = "unsupported";
  let availabilityQuantity: Capability = "unsupported";
  let availabilityPagination: Capability = "unsupported";
  let catalogItems = 0;
  let catalogPagesRead = 0;
  let availabilityMatches = 0;
  let availabilityLeads: number | null = null;
  let availabilityDancers: number | null = null;
  let availabilityPositiveInventory = false;

  const catalogPageOne = auditCatalogPage(
    await request(`${baseUrl}/api/public/finder/catalog?limit=2`),
    "catalog page 1",
    null,
    failures,
  );
  if (catalogPageOne) {
    catalogSchemaVersion = catalogPageOne.isV2 ? 2 : "legacy";
    catalogPagination = catalogPageOne.isV2 ? "supported" : "unsupported";
    catalogItems = catalogPageOne.items.length;
    catalogPagesRead = 1;
  }
  if (mode === "strict" && catalogPagination === "unsupported") {
    failures.push("Catalog pagination is unsupported; strict mode requires schemaVersion 2 and pageInfo.");
  }

  const firstDesignId = readString(catalogPageOne?.items[0]?.designId);
  if (!firstDesignId) failures.push("Catalog did not return a first item with designId.");

  if (catalogPageOne?.isV2) {
    const catalogPageLimit = mode === "strict" ? strictPaginationPageLimit : diagnosticPaginationPageLimit;
    const seenDesignIds = rememberPageIdentities(catalogPageOne.items, "designId", 1);
    const seenCursors = new Set<string>();
    let pageInfo = catalogPageOne.pageInfo;

    for (let pageNumber = 2; pageNumber <= catalogPageLimit && pageInfo?.hasMore && pageInfo.nextCursor; pageNumber += 1) {
      const cursor = pageInfo.nextCursor;
      if (seenCursors.has(cursor)) {
        failures.push("catalog pagination repeated a prior cursor.");
        break;
      }
      seenCursors.add(cursor);

      const label = `catalog page ${pageNumber}`;
      const page = auditCatalogPage(
        await request(`${baseUrl}/api/public/finder/catalog?limit=2&cursor=${encodeURIComponent(cursor)}`),
        label,
        cursor,
        failures,
      );
      if (!page) break;

      catalogPagesRead += 1;
      catalogItems += page.items.length;
      assertNoEarlierPageRepeats(page.items, "designId", label, pageNumber, seenDesignIds, failures);
      if (catalogPageOne.totalCount !== page.totalCount) {
        failures.push(`${label} changed totalCount from page 1.`);
      }
      pageInfo = page.pageInfo;
    }

    if (pageInfo && !pageInfo.hasMore && catalogPageOne.totalCount !== null && catalogItems !== catalogPageOne.totalCount) {
      failures.push("Catalog terminal pages do not contain totalCount exact design identities.");
    }
  }

  if (catalogPageOne?.isV2 && firstDesignId) {
    const requestedIds = [firstDesignId, missingDesignIdProbe];
    const batch = await request(`${baseUrl}/api/public/finder/catalog/batch`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ designIds: requestedIds }),
    });
    catalogBatch = auditCatalogBatch(batch, requestedIds, failures) ? "supported" : "unsupported";
  }
  if (mode === "strict" && catalogBatch === "unsupported") {
    failures.push("Exact catalog batch hydration is unsupported or invalid.");
  }

  if (catalogPageOne?.isV2) {
    const facets = await request(`${baseUrl}/api/public/finder/catalog/facets`);
    catalogFacets = auditCatalogFacets(facets, catalogPageOne.totalCount, failures)
      ? "supported"
      : "unsupported";
  }
  if (mode === "strict" && catalogFacets === "unsupported") {
    failures.push("Exact catalog facets are unsupported or invalid.");
  }

  if (firstDesignId) {
    const pageOne = auditAvailability(
      await request(`${baseUrl}/api/public/finder/availability?designId=${encodeURIComponent(firstDesignId)}&limit=5`),
      {
        label: "availability page 1",
        baseUrl,
        requestedDesignId: firstDesignId,
        exactCursor: null,
        similarCursor: null,
      },
      failures,
    );
    if (pageOne) {
      availabilityMatches = pageOne.exactMatches.length + pageOne.similarMatches.length;
      availabilityLeads = pageOne.isV2 && pageOne.exactPageInfo && pageOne.similarPageInfo
        ? pageOne.exactPageInfo.totalLeadCount + pageOne.similarPageInfo.totalLeadCount
        : null;
      availabilityDancers = pageOne.isV2 && pageOne.exactPageInfo && pageOne.similarPageInfo
        ? pageOne.exactPageInfo.totalDancerCount + pageOne.similarPageInfo.totalDancerCount
        : null;
      availabilityPositiveInventory = availabilityDancers !== null
        ? availabilityDancers > 0
        : pageOne.hasPositiveInventory;
      availabilityQuantity = pageOne.isV2 ? "supported" : "unsupported";
      availabilityPagination = pageOne.isV2 ? "supported" : "unsupported";
      if (pageOne.isV2) {
        await auditAvailabilityPages({
          baseUrl,
          bucket: "exact",
          firstDesignId,
          pageOne,
          request,
          failures,
          pageLimit: mode === "strict" ? strictPaginationPageLimit : diagnosticPaginationPageLimit,
        });
        await auditAvailabilityPages({
          baseUrl,
          bucket: "similar",
          firstDesignId,
          pageOne,
          request,
          failures,
          pageLimit: mode === "strict" ? strictPaginationPageLimit : diagnosticPaginationPageLimit,
        });
      }
    }
  }
  if (mode === "strict" && availabilityQuantity === "unsupported") {
    failures.push("Availability quantity is unsupported; strict mode requires positive integer net quantities.");
  }
  if (mode === "strict" && availabilityPagination === "unsupported") {
    failures.push("Availability pagination is unsupported; strict mode requires exact and similar bucket pageInfo.");
  }

  const liveShowsPayload = await request(`${baseUrl}/api/public/finder/live-shows?limit=5`);
  const shows = readArrayField(liveShowsPayload, "shows", "Live-shows endpoint", failures);
  shows.forEach((show, index) => assertFinderShow(show, `live-shows item ${index + 1}`, false, failures));

  const repsPayload = await request(`${baseUrl}/api/public/finder/reps?limit=200`);
  const reps = readArrayField(repsPayload, "reps", "Reps endpoint", failures);
  reps.forEach((rep, index) => assertFinderRep(rep, `reps item ${index + 1}`, baseUrl, failures));

  return {
    ok: failures.length === 0,
    mode,
    baseUrl,
    failures,
    capabilities: { catalogPagination, catalogBatch, catalogFacets, availabilityQuantity, availabilityPagination },
    catalogSchemaVersion,
    catalogItems,
    catalogPagesRead,
    availabilityMatches,
    availabilityLeads,
    availabilityDancers,
    availabilityPositiveInventory,
    liveShows: shows.length,
    reps: reps.length,
  };
}

export function formatSparkleSuiteFinderContractReport(report: ContractReport): string[] {
  return [
    `${report.ok ? "OK" : "FAILED"} ${report.baseUrl}`,
    `MODE=${report.mode}`,
    `CATALOG_SCHEMA_VERSION=${report.catalogSchemaVersion}`,
    `CATALOG_PAGINATION=${report.capabilities.catalogPagination}`,
    `CATALOG_BATCH=${report.capabilities.catalogBatch}`,
    `CATALOG_FACETS=${report.capabilities.catalogFacets}`,
    `AVAILABILITY_QUANTITY=${report.capabilities.availabilityQuantity}`,
    `AVAILABILITY_PAGINATION=${report.capabilities.availabilityPagination}`,
    `CATALOG_ITEMS=${report.catalogItems}`,
    `CATALOG_PAGES_READ=${report.catalogPagesRead}`,
    `AVAILABILITY_MATCHES=${report.availabilityMatches}`,
    `AVAILABILITY_LEADS=${report.availabilityLeads ?? "unsupported"}`,
    `AVAILABILITY_DANCERS=${report.availabilityDancers ?? "unsupported"}`,
    `AVAILABILITY_POSITIVE_INVENTORY=${report.availabilityPositiveInventory}`,
    `LIVE_SHOWS=${report.liveShows}`,
    `REPS=${report.reps}`,
    ...report.failures.map((failure) => `FAILURE=${failure}`),
  ];
}

function auditCatalogPage(
  payload: unknown,
  label: string,
  requestedCursor: string | null,
  failures: string[],
): CatalogAudit | null {
  const record = asRecord(payload);
  if (!record) {
    failures.push(`${label} is not an object.`);
    return null;
  }
  if (!Array.isArray(record.items)) {
    failures.push(`${label} did not return an items array.`);
    return null;
  }

  const isV2 = record.schemaVersion === 2;
  if (record.schemaVersion !== undefined && !isV2) {
    failures.push(`${label} has unsupported schemaVersion ${String(record.schemaVersion)}.`);
  }
  const items = record.items.flatMap((item, index) => {
    const candidate = assertCatalogItem(item, `${label} item ${index + 1}`, isV2, failures);
    return candidate ? [candidate] : [];
  });
  assertUnique(items, "designId", label, failures);
  if (!isV2) return { isV2: false, items, totalCount: null, pageInfo: null };

  const pageInfoRecord = asRecord(record.pageInfo);
  if (!pageInfoRecord) {
    failures.push(`${label} is missing pageInfo.`);
    return { isV2: true, items, totalCount: null, pageInfo: null };
  }
  const totalCount = isNonnegativeInteger(pageInfoRecord.totalCount) ? pageInfoRecord.totalCount : null;
  if (totalCount === null) {
    failures.push(`${label} pageInfo has invalid totalCount.`);
  } else if (totalCount < items.length) {
    failures.push(`${label} totalCount is smaller than the current item count.`);
  }
  return {
    isV2: true,
    items,
    totalCount,
    pageInfo: assertCursorPageInfo(pageInfoRecord, `${label} pageInfo`, requestedCursor, failures),
  };
}

function assertCatalogItem(
  value: unknown,
  label: string,
  requireAvailabilityCounts: boolean,
  failures: string[],
  requireDescription = requireAvailabilityCounts,
): Record<string, unknown> | null {
  const record = asRecord(value);
  if (!record) {
    failures.push(`${label} is not an object.`);
    return null;
  }
  for (const field of ["designId", "itemNumber", "designName"]) {
    if (!readString(record[field])) failures.push(`${label} is missing ${field}.`);
  }
  if (!isNonnegativeInteger(record.availableListingCount)) {
    failures.push(`${label} has invalid availableListingCount.`);
  }
  if (requireAvailabilityCounts && !isNonnegativeInteger(record.availableLeadCount)) {
    failures.push(`${label} has invalid availableLeadCount.`);
  }
  if (requireAvailabilityCounts && !isNonnegativeInteger(record.availableDancerCount)) {
    failures.push(`${label} has invalid availableDancerCount.`);
  }
  if (
    requireAvailabilityCounts
    && isNonnegativeInteger(record.availableListingCount)
    && isNonnegativeInteger(record.availableLeadCount)
    && record.availableListingCount !== record.availableLeadCount
  ) {
    failures.push(`${label} availableListingCount no longer matches availableLeadCount.`);
  }
  if (
    requireAvailabilityCounts
    && isNonnegativeInteger(record.availableLeadCount)
    && isNonnegativeInteger(record.availableDancerCount)
    && record.availableDancerCount < record.availableLeadCount
  ) {
    failures.push(`${label} availableDancerCount is smaller than availableLeadCount.`);
  }
  if (requireDescription && !("description" in record)) failures.push(`${label} is missing description.`);
  if (requireDescription && record.description !== null && typeof record.description !== "string") {
    failures.push(`${label} has invalid description.`);
  }
  return record;
}

function auditCatalogBatch(payload: unknown, requestedIds: string[], failures: string[]): boolean {
  const before = failures.length;
  const record = asRecord(payload);
  if (!record || record.schemaVersion !== 2) {
    failures.push("Catalog batch response is missing schemaVersion 2.");
    return false;
  }
  if (!Array.isArray(record.items) || !Array.isArray(record.missingDesignIds)) {
    failures.push("Catalog batch response must include items and missingDesignIds arrays.");
    return false;
  }
  const items = record.items.flatMap((item, index) => {
    const candidate = assertCatalogItem(item, `catalog batch item ${index + 1}`, true, failures);
    return candidate ? [candidate] : [];
  });
  assertUnique(items, "designId", "catalog batch", failures);
  const requested = new Set(requestedIds);
  const returned = new Set(items.map((item) => readString(item.designId)).filter(Boolean));
  const missingList = record.missingDesignIds.map(readString).filter(Boolean);
  const missing = new Set(missingList);
  for (const id of returned) if (!requested.has(id)) failures.push(`catalog batch returned unrequested designId ${id}.`);
  for (const id of missing) if (!requested.has(id)) failures.push(`catalog batch reported unrequested missingDesignId ${id}.`);
  for (const id of requested) {
    if (Number(returned.has(id)) + Number(missing.has(id)) !== 1) {
      failures.push(`catalog batch did not resolve requested designId ${id} exactly once.`);
    }
  }
  if (!returned.has(requestedIds[0])) failures.push("Catalog batch did not return the known catalog designId.");
  if (!missing.has(missingDesignIdProbe)) failures.push("Catalog batch did not report the missing designId probe.");
  if (missing.size !== missingList.length) failures.push("Catalog batch repeated a missingDesignId.");
  return failures.length === before;
}

function auditCatalogFacets(payload: unknown, totalCount: number | null, failures: string[]): boolean {
  const before = failures.length;
  const record = asRecord(payload);
  const facets = asRecord(record?.facets);

  if (!record || record.schemaVersion !== 2 || !facets) {
    failures.push("Catalog facets response must include schemaVersion 2 and a facets object.");
    return false;
  }

  for (const key of ["collections", "materials", "stones", "types", "labels", "years"]) {
    const values = facets[key];
    if (!Array.isArray(values)) {
      failures.push(`Catalog facets response is missing ${key}.`);
      continue;
    }

    const seen = new Set<string>();
    let countTotal = 0;
    for (const [index, value] of values.entries()) {
      const option = asRecord(value);
      const facetValue = readString(option?.value);
      const count = option?.count;

      if (!facetValue || !isPositiveInteger(count)) {
        failures.push(`Catalog ${key} facet ${index + 1} is invalid.`);
        continue;
      }
      if (seen.has(facetValue)) failures.push(`Catalog ${key} facets repeat ${facetValue}.`);
      seen.add(facetValue);
      countTotal += count;
    }

    if (totalCount !== null && countTotal > totalCount) {
      failures.push(`Catalog ${key} facet counts exceed totalCount.`);
    }
    if (totalCount !== null && (key === "types" || key === "labels") && countTotal !== totalCount) {
      failures.push(`Catalog ${key} facet counts do not cover totalCount exactly.`);
    }
  }

  return failures.length === before;
}

function auditAvailability(
  payload: unknown,
  options: {
    label: string;
    baseUrl: string;
    requestedDesignId: string;
    exactCursor: string | null;
    similarCursor: string | null;
  },
  failures: string[],
): AvailabilityAudit | null {
  const record = asRecord(payload);
  if (!record) {
    failures.push(`${options.label} is not an object.`);
    return null;
  }
  const isV2 = record.schemaVersion === 2;
  const requestedItem = isV2
    ? assertCatalogItem(record.requestedItem, `${options.label} requestedItem`, true, failures, false)
    : asRecord(record.requestedItem);
  if (readString(requestedItem?.designId) !== options.requestedDesignId) {
    failures.push(`${options.label} requestedItem does not preserve the requested designId.`);
  }
  if (!Array.isArray(record.exactMatches) || !Array.isArray(record.similarMatches)) {
    failures.push(`${options.label} must include exactMatches and similarMatches arrays.`);
    return null;
  }

  if (record.schemaVersion !== undefined && !isV2) {
    failures.push(`${options.label} has unsupported schemaVersion ${String(record.schemaVersion)}.`);
  }
  let dancerCount = 0;
  let hasPositiveInventory = false;
  const readMatches = (values: unknown[], bucket: "exact" | "similar") =>
    values.flatMap((match, index) => {
      const candidate = assertAvailabilityMatch(
        match,
        `${options.label} ${bucket} match ${index + 1}`,
        isV2,
        bucket === "exact" ? options.requestedDesignId : null,
        options.baseUrl,
        failures,
      );
      if (candidate && isPositiveInteger(candidate.quantityAvailable)) {
        dancerCount += candidate.quantityAvailable;
        hasPositiveInventory = true;
      }
      return candidate ? [candidate] : [];
    });
  const exactMatches = readMatches(record.exactMatches, "exact");
  const similarMatches = readMatches(record.similarMatches, "similar");
  assertUnique(exactMatches, "listingId", `${options.label} exact matches`, failures);
  assertUnique(similarMatches, "listingId", `${options.label} similar matches`, failures);
  assertUnique([...exactMatches, ...similarMatches], "listingId", `${options.label} availability matches`, failures);
  if (similarMatches.some((match) => readString(asRecord(match.item)?.designId) === options.requestedDesignId)) {
    failures.push(`${options.label} similar matches repeat the requested designId.`);
  }
  if (!isV2) {
    return {
      isV2: false,
      exactMatches,
      similarMatches,
      exactPageInfo: null,
      similarPageInfo: null,
      dancerCount: 0,
      hasPositiveInventory: false,
    };
  }

  return {
    isV2: true,
    exactMatches,
    similarMatches,
    exactPageInfo: assertAvailabilityPageInfo(
      record.exactPageInfo,
      `${options.label} exactPageInfo`,
      options.exactCursor,
      exactMatches,
      failures,
    ),
    similarPageInfo: assertAvailabilityPageInfo(
      record.similarPageInfo,
      `${options.label} similarPageInfo`,
      options.similarCursor,
      similarMatches,
      failures,
    ),
    dancerCount,
    hasPositiveInventory,
  };
}

function assertAvailabilityMatch(
  value: unknown,
  label: string,
  requireQuantity: boolean,
  exactDesignId: string | null,
  baseUrl: string,
  failures: string[],
): Record<string, unknown> | null {
  const record = asRecord(value);
  if (!record) {
    failures.push(`${label} is not an object.`);
    return null;
  }
  if (!readString(record.listingId)) failures.push(`${label} is missing listingId.`);
  const itemDesignId = readString(asRecord(record.item)?.designId);
  if (requireQuantity) {
    assertCatalogItem(record.item, `${label} item`, true, failures, false);
  }
  if (!itemDesignId) failures.push(`${label} is missing item.designId.`);
  if (exactDesignId && itemDesignId !== exactDesignId) failures.push(`${label} does not preserve exact requested designId.`);
  const rep = asRecord(record.rep);
  for (const field of ["repId", "showName", "repFirstName", "customerSiteUrl"]) {
    if (!readString(rep?.[field])) failures.push(`${label} is missing rep.${field}.`);
  }
  const repId = readString(rep?.repId);
  assertOptionalSuiteUrl(rep?.customerSiteUrl, `${label} rep.customerSiteUrl`, baseUrl, failures);
  assertFinderShow(record.nextShow, `${label} nextShow`, true, failures);
  const nextShow = asRecord(record.nextShow);
  if (repId && readString(nextShow?.repId) !== repId) {
    failures.push(`${label} nextShow.repId does not match rep.repId.`);
  }
  if (record.photoSource !== "listing" && record.photoSource !== "canonical" && record.photoSource !== "missing") {
    failures.push(`${label} has invalid photoSource.`);
  }
  if (record.photoSource === "missing" && record.photoUrl !== null) {
    failures.push(`${label} has a photoUrl while photoSource is missing.`);
  }
  if (requireQuantity && !isPositiveInteger(record.quantityAvailable)) {
    failures.push(`${label} quantityAvailable must be a positive integer.`);
  }
  return record;
}

function assertAvailabilityPageInfo(
  value: unknown,
  label: string,
  requestedCursor: string | null,
  matches: Record<string, unknown>[],
  failures: string[],
): AvailabilityPageInfo | null {
  const record = asRecord(value);
  if (!record) {
    failures.push(`${label} is missing.`);
    return null;
  }
  const leadCount = isNonnegativeInteger(record.totalLeadCount) ? record.totalLeadCount : null;
  const dancerCount = isNonnegativeInteger(record.totalDancerCount) ? record.totalDancerCount : null;
  if (leadCount === null) failures.push(`${label} has invalid totalLeadCount.`);
  if (dancerCount === null) failures.push(`${label} has invalid totalDancerCount.`);
  if (leadCount !== null && leadCount < matches.length) failures.push(`${label} totalLeadCount is smaller than the current match count.`);
  if (leadCount !== null && dancerCount !== null && dancerCount < leadCount) {
    failures.push(`${label} totalDancerCount is smaller than totalLeadCount.`);
  }
  const currentDancers = matches.reduce(
    (total, match) => total + (isPositiveInteger(match.quantityAvailable) ? match.quantityAvailable : 0),
    0,
  );
  if (dancerCount !== null && dancerCount < currentDancers) {
    failures.push(`${label} totalDancerCount is smaller than current page quantity.`);
  }
  const cursor = assertCursorPageInfo(record, label, requestedCursor, failures);
  if (!cursor || leadCount === null || dancerCount === null) return null;
  if (cursor.hasMore && matches.length === 0) {
    failures.push(`${label} cannot have an empty current page when hasMore is true.`);
  }
  if (cursor.hasMore && leadCount <= matches.length) {
    failures.push(`${label} totalLeadCount must exceed the current match count when hasMore is true.`);
  }
  if (!requestedCursor && !cursor.hasMore && leadCount !== matches.length) {
    failures.push(`${label} totalLeadCount must equal the first terminal page match count.`);
  }
  if (!requestedCursor && !cursor.hasMore && dancerCount !== currentDancers) {
    failures.push(`${label} totalDancerCount must equal the first terminal page quantity.`);
  }
  return { ...cursor, totalLeadCount: leadCount, totalDancerCount: dancerCount };
}

async function auditAvailabilityPages(options: {
  baseUrl: string;
  bucket: "exact" | "similar";
  firstDesignId: string;
  pageOne: AvailabilityAudit;
  request: (url: string, init?: RequestInit) => Promise<unknown>;
  failures: string[];
  pageLimit: number;
}) {
  let pageInfo = options.bucket === "exact" ? options.pageOne.exactPageInfo : options.pageOne.similarPageInfo;
  if (!pageInfo) return;
  const cursorKey = options.bucket === "exact" ? "exactCursor" : "similarCursor";
  const first = options.bucket === "exact" ? options.pageOne.exactMatches : options.pageOne.similarMatches;
  const seenListingIds = rememberPageIdentities(first, "listingId", 1);
  const seenCursors = new Set<string>();
  const expectedLeadCount = pageInfo.totalLeadCount;
  const expectedDancerCount = pageInfo.totalDancerCount;
  let accumulatedDancerCount = countAvailableDancers(first);

  for (let pageNumber = 2; pageNumber <= options.pageLimit && pageInfo.hasMore && pageInfo.nextCursor; pageNumber += 1) {
    const cursor = pageInfo.nextCursor;
    if (seenCursors.has(cursor)) {
      options.failures.push(`availability ${options.bucket} pagination repeated a prior cursor.`);
      break;
    }
    seenCursors.add(cursor);

    const label = `availability ${options.bucket} page ${pageNumber}`;
    const page = auditAvailability(
      await options.request(
        `${options.baseUrl}/api/public/finder/availability?designId=${encodeURIComponent(options.firstDesignId)}&limit=5&${cursorKey}=${encodeURIComponent(cursor)}`,
      ),
      {
        label,
        baseUrl: options.baseUrl,
        requestedDesignId: options.firstDesignId,
        exactCursor: options.bucket === "exact" ? cursor : null,
        similarCursor: options.bucket === "similar" ? cursor : null,
      },
      options.failures,
    );
    if (!page) break;

    const matches = options.bucket === "exact" ? page.exactMatches : page.similarMatches;
    assertNoEarlierPageRepeats(matches, "listingId", label, pageNumber, seenListingIds, options.failures);
    accumulatedDancerCount += countAvailableDancers(matches);

    const nextPageInfo = options.bucket === "exact" ? page.exactPageInfo : page.similarPageInfo;
    if (!nextPageInfo) break;
    if (
      nextPageInfo.totalLeadCount !== expectedLeadCount
      || nextPageInfo.totalDancerCount !== expectedDancerCount
    ) {
      options.failures.push(`${label} changed complete-result totals from page 1.`);
    }
    pageInfo = nextPageInfo;
  }

  if (!pageInfo.hasMore) {
    if (seenListingIds.size !== expectedLeadCount) {
      options.failures.push(`availability ${options.bucket} terminal pages do not contain totalLeadCount exact listing identities.`);
    }
    if (accumulatedDancerCount !== expectedDancerCount) {
      options.failures.push(`availability ${options.bucket} terminal pages do not sum to totalDancerCount.`);
    }
  }
}

function assertCursorPageInfo(
  record: Record<string, unknown>,
  label: string,
  requestedCursor: string | null,
  failures: string[],
): PageInfo | null {
  if (typeof record.hasMore !== "boolean") {
    failures.push(`${label} has invalid hasMore.`);
    return null;
  }
  if (record.hasMore) {
    const cursor = readString(record.nextCursor);
    if (!cursor) {
      failures.push(`${label} requires a nonempty nextCursor when hasMore is true.`);
      return null;
    }
    if (requestedCursor && cursor === requestedCursor) failures.push(`${label} repeated the requested cursor.`);
    return { hasMore: true, nextCursor: cursor };
  }
  if (record.nextCursor !== null) failures.push(`${label} requires nextCursor null when hasMore is false.`);
  return { hasMore: false, nextCursor: null };
}

function assertFinderShow(value: unknown, label: string, nestedAvailability: boolean, failures: string[]) {
  const record = asRecord(value);
  if (!record) {
    failures.push(`${label} is not an object.`);
    return;
  }
  const fields = nestedAvailability
    ? ["showId", "repId", "startsAt"]
    : ["showId", "showName", "repFirstName", "startsAt", "customerSiteUrl"];
  for (const field of fields) if (!readString(record[field])) failures.push(`${label} is missing ${field}.`);
  if (!readString(record.startsAt) || Number.isNaN(Date.parse(String(record.startsAt)))) {
    failures.push(`${label} has invalid startsAt.`);
  }
  if (record.status !== "live" && record.status !== "scheduled") failures.push(`${label} has invalid status.`);
}

function assertFinderRep(value: unknown, label: string, baseUrl: string, failures: string[]) {
  const record = asRecord(value);
  if (!record) {
    failures.push(`${label} is not an object.`);
    return;
  }
  for (const field of ["repId", "displayName"]) if (!readString(record[field])) failures.push(`${label} is missing ${field}.`);
  for (const field of ["businessName", "avatarUrl", "state", "customerSiteUrl", "repBoardUrl"]) {
    if (record[field] !== null && record[field] !== undefined && typeof record[field] !== "string") {
      failures.push(`${label} has invalid ${field}.`);
    }
  }
  assertOptionalHttpsUrl(record.avatarUrl, `${label} avatarUrl`, failures);
  assertOptionalSuiteUrl(record.customerSiteUrl, `${label} customerSiteUrl`, baseUrl, failures);
  assertOptionalSuiteUrl(record.repBoardUrl, `${label} repBoardUrl`, baseUrl, failures);
  if (record.nextShow !== null && record.nextShow !== undefined) {
    const show = asRecord(record.nextShow);
    if (!show) failures.push(`${label} nextShow is not an object.`);
    else {
      if (!readString(show.showId ?? show.id)) failures.push(`${label} nextShow is missing showId.`);
      if (!readString(show.showName ?? show.title)) failures.push(`${label} nextShow is missing title.`);
      if (!readString(show.startsAt) || Number.isNaN(Date.parse(String(show.startsAt)))) failures.push(`${label} nextShow has invalid startsAt.`);
      if (show.status !== "live" && show.status !== "scheduled") failures.push(`${label} nextShow has invalid status.`);
      assertOptionalSuiteUrl(show.customerSiteUrl ?? show.customerShowUrl, `${label} nextShow customerShowUrl`, baseUrl, failures);
    }
  }
}

function assertOptionalHttpsUrl(value: unknown, label: string, failures: string[]) {
  if (value === null || value === undefined || value === "") return;
  try {
    const url = new URL(String(value));
    if (url.protocol !== "https:" || url.username || url.password || url.port) failures.push(`${label} is not a safe HTTPS URL.`);
  } catch {
    failures.push(`${label} is not a valid URL.`);
  }
}

function assertOptionalSuiteUrl(value: unknown, label: string, baseUrl: string, failures: string[]) {
  if (value === null || value === undefined || value === "") return;
  assertOptionalHttpsUrl(value, label, failures);
  try {
    const candidate = new URL(String(value));
    const suiteHost = new URL(baseUrl).hostname.toLowerCase();
    const allowed = new Set([suiteHost, suiteHost.startsWith("www.") ? suiteHost.slice(4) : `www.${suiteHost}`]);
    if (!allowed.has(candidate.hostname.toLowerCase())) failures.push(`${label} is not hosted by Sparkle Suite.`);
  } catch {
    // The general URL validator records the error.
  }
}

function readArrayField(payload: unknown, field: string, label: string, failures: string[]): unknown[] {
  const record = asRecord(payload);
  if (!record || !Array.isArray(record[field])) {
    failures.push(`${label} did not return a ${field} array.`);
    return [];
  }
  return record[field] as unknown[];
}

async function readJson(
  url: string,
  options: {
    fetcher: (input: string, init?: RequestInit) => Promise<Response>;
    timeoutMs: number;
    init?: RequestInit;
  },
  failures: string[],
): Promise<unknown> {
  let response: Response;
  try {
    response = await options.fetcher(url, {
      ...options.init,
      cache: "no-store",
      signal: options.init?.signal ?? AbortSignal.timeout(options.timeoutMs),
    });
  } catch (error) {
    failures.push(`${url} could not be reached: ${error instanceof Error ? error.message : String(error)}.`);
    return null;
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok) {
    failures.push(`${url} returned ${response.status}.`);
    return null;
  }
  if (!contentType.includes("application/json")) {
    failures.push(`${url} returned ${contentType || "no content type"} instead of application/json.`);
    return null;
  }
  try {
    return await response.json();
  } catch {
    failures.push(`${url} returned invalid JSON.`);
    return null;
  }
}

function assertUnique(rows: Record<string, unknown>[], field: string, label: string, failures: string[]) {
  const seen = new Set<string>();
  for (const row of rows) {
    const id = readString(row[field]);
    if (!id) continue;
    if (seen.has(id)) failures.push(`${label} repeats ${field} ${id}.`);
    seen.add(id);
  }
}

function rememberPageIdentities(
  rows: Record<string, unknown>[],
  field: string,
  pageNumber: number,
): Map<string, number> {
  const identities = new Map<string, number>();
  for (const row of rows) {
    const id = readString(row[field]);
    if (id) identities.set(id, pageNumber);
  }
  return identities;
}

function assertNoEarlierPageRepeats(
  rows: Record<string, unknown>[],
  field: string,
  label: string,
  pageNumber: number,
  seenPages: Map<string, number>,
  failures: string[],
) {
  for (const row of rows) {
    const id = readString(row[field]);
    if (!id) continue;
    const seenPage = seenPages.get(id);
    if (seenPage !== undefined) failures.push(`${label} repeats ${field} ${id} from page ${seenPage}.`);
    else seenPages.set(id, pageNumber);
  }
}

function countAvailableDancers(rows: Record<string, unknown>[]): number {
  return rows.reduce(
    (total, row) => total + (isPositiveInteger(row.quantityAvailable) ? row.quantityAvailable : 0),
    0,
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isNonnegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

async function runFromCli() {
  const strict = process.argv.includes("--strict") || process.env.SPARKLE_FINDER_REQUIRE_SUITE_V2 === "true";
  const report = await runSparkleSuiteFinderContractCheck({ mode: strict ? "strict" : "diagnostic" });
  for (const line of formatSparkleSuiteFinderContractReport(report)) {
    (report.ok ? console.log : console.error)(line);
  }
  if (!report.ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void runFromCli();
}
