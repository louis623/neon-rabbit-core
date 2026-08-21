type CatalogResponse = {
  items?: Array<{
    designId?: string;
    designName?: string;
    availableListingCount?: number;
  }>;
};

type AvailabilityResponse = {
  exactMatches?: unknown[];
  similarMatches?: unknown[];
};

type LiveShowsResponse = {
  shows?: unknown[];
};

type RepsResponse = {
  reps?: unknown[];
};

const baseUrl = (
  process.env.SPARKLE_SUITE_FINDER_API_BASE_URL ??
  process.env.NEXT_PUBLIC_SPARKLE_SUITE_FINDER_API_BASE_URL ??
  "https://www.yoursparklesuite.com"
).replace(/\/+$/, "");

async function main() {
  const failures: string[] = [];
  const catalog = await readJson<CatalogResponse>(`${baseUrl}/api/public/finder/catalog?limit=2`, failures);
  const firstItem = catalog?.items?.[0];

  if (!firstItem?.designId) {
    failures.push("Catalog did not return a first item with designId.");
  }

  let availabilityMatches: unknown[] = [];

  if (firstItem?.designId) {
    const availability = await readJson<AvailabilityResponse>(
      `${baseUrl}/api/public/finder/availability?designId=${encodeURIComponent(firstItem.designId)}&limit=5`,
      failures,
    );
    availabilityMatches = [...(availability?.exactMatches ?? []), ...(availability?.similarMatches ?? [])];

    for (const [index, match] of availabilityMatches.entries()) {
      assertAvailabilityMatch(match, `availability match ${index + 1}`, failures);
    }
  }

  const liveShows = await readJson<LiveShowsResponse>(`${baseUrl}/api/public/finder/live-shows?limit=5`, failures);

  if (!Array.isArray(liveShows?.shows)) {
    failures.push("Live-shows endpoint did not return a shows array.");
  } else {
    for (const [index, show] of liveShows.shows.entries()) {
      assertFinderShow(show, `live-shows item ${index + 1}`, failures);
    }
  }

  const reps = await readJson<RepsResponse>(`${baseUrl}/api/public/finder/reps?limit=200`, failures);

  if (!Array.isArray(reps?.reps)) {
    failures.push("Reps endpoint did not return a reps array.");
  } else {
    for (const [index, rep] of reps.reps.entries()) {
      assertFinderRep(rep, `reps item ${index + 1}`, failures);
    }
  }

  if (failures.length > 0) {
    console.error("Sparkle Suite Finder API contract check failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  const catalogItems = catalog?.items ?? [];
  const liveShowItems = liveShows?.shows ?? [];
  const repItems = reps?.reps ?? [];

  console.log(`OK ${baseUrl}`);
  console.log(`CATALOG_ITEMS=${catalogItems.length}`);
  console.log(`FIRST_ID=${firstItem?.designId ?? ""}`);
  console.log(`FIRST_NAME=${firstItem?.designName ?? ""}`);
  console.log(`AVAILABILITY_MATCHES=${availabilityMatches.length}`);
  console.log(`LIVE_SHOWS=${liveShowItems.length}`);
  console.log(`REPS=${repItems.length}`);
}

async function readJson<T>(url: string, failures: string[]): Promise<T | null> {
  let response: Response;

  try {
    response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
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
    return (await response.json()) as T;
  } catch {
    failures.push(`${url} returned invalid JSON.`);
    return null;
  }
}

function assertAvailabilityMatch(value: unknown, label: string, failures: string[]) {
  if (!value || typeof value !== "object") {
    failures.push(`${label} is not an object.`);
    return;
  }

  const record = value as Record<string, unknown>;

  for (const field of ["listingId", "showName", "repFirstName", "customerSiteUrl"]) {
    if (typeof record[field] !== "string" || record[field] === "") {
      failures.push(`${label} is missing ${field}.`);
    }
  }

  assertFinderShow(record.nextShow, `${label} nextShow`, failures);
}

function assertFinderShow(value: unknown, label: string, failures: string[]) {
  if (!value || typeof value !== "object") {
    failures.push(`${label} is not an object.`);
    return;
  }

  const record = value as Record<string, unknown>;

  for (const field of ["showId", "showName", "repFirstName", "startsAt", "customerSiteUrl"]) {
    if (typeof record[field] !== "string" || record[field] === "") {
      failures.push(`${label} is missing ${field}.`);
    }
  }

  if (record.status !== "live" && record.status !== "scheduled") {
    failures.push(`${label} has invalid status.`);
  }
}

function assertFinderRep(value: unknown, label: string, failures: string[]) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    failures.push(`${label} is not an object.`);
    return;
  }

  const record = value as Record<string, unknown>;

  for (const field of ["repId", "displayName"]) {
    if (typeof record[field] !== "string" || record[field].trim() === "") {
      failures.push(`${label} is missing ${field}.`);
    }
  }

  for (const field of ["businessName", "avatarUrl", "state", "customerSiteUrl", "repBoardUrl"]) {
    if (record[field] !== null && record[field] !== undefined && typeof record[field] !== "string") {
      failures.push(`${label} has invalid ${field}.`);
    }
  }


  assertOptionalHttpsUrl(record.avatarUrl, `${label} avatarUrl`, failures);
  assertOptionalSuiteUrl(record.customerSiteUrl, `${label} customerSiteUrl`, failures);
  assertOptionalSuiteUrl(record.repBoardUrl, `${label} repBoardUrl`, failures);

  if (record.nextShow !== null && record.nextShow !== undefined) {
    assertRepDirectoryShow(record.nextShow, `${label} nextShow`, failures);
  }
}

function assertRepDirectoryShow(value: unknown, label: string, failures: string[]) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    failures.push(`${label} is not an object.`);
    return;
  }

  const record = value as Record<string, unknown>;
  const showId = record.showId ?? record.id;
  const title = record.showName ?? record.title;

  if (typeof showId !== "string" || showId.trim() === "") failures.push(`${label} is missing showId.`);
  if (typeof title !== "string" || title.trim() === "") failures.push(`${label} is missing title.`);
  if (typeof record.startsAt !== "string" || Number.isNaN(Date.parse(record.startsAt))) {
    failures.push(`${label} has invalid startsAt.`);
  }
  if (record.status !== "live" && record.status !== "scheduled") failures.push(`${label} has invalid status.`);

  assertOptionalSuiteUrl(
    record.customerSiteUrl ?? record.customerShowUrl,
    `${label} customerShowUrl`,
    failures,
  );
}

function assertOptionalHttpsUrl(value: unknown, label: string, failures: string[]) {
  if (value === null || value === undefined || value === "") return;

  try {
    const url = new URL(String(value));
    if (url.protocol !== "https:" || url.username || url.password || url.port) {
      failures.push(`${label} is not a safe HTTPS URL.`);
    }
  } catch {
    failures.push(`${label} is not a valid URL.`);
  }
}

function assertOptionalSuiteUrl(value: unknown, label: string, failures: string[]) {
  if (value === null || value === undefined || value === "") return;

  assertOptionalHttpsUrl(value, label, failures);

  try {
    const candidate = new URL(String(value));
    const suite = new URL(baseUrl);
    const allowedHosts = new Set([
      suite.hostname.toLowerCase(),
      suite.hostname.toLowerCase().startsWith("www.")
        ? suite.hostname.toLowerCase().slice(4)
        : `www.${suite.hostname.toLowerCase()}`,
    ]);

    if (!allowedHosts.has(candidate.hostname.toLowerCase())) {
      failures.push(`${label} is not hosted by Sparkle Suite.`);
    }
  } catch {
    // The general URL validator records the actionable error.
  }
}

function fail(message: string): never {
  console.error(`Sparkle Suite Finder API contract check failed: ${message}`);
  process.exit(1);
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
