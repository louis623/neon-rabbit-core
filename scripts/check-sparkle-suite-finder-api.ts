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

  if (failures.length > 0) {
    console.error("Sparkle Suite Finder API contract check failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  const catalogItems = catalog?.items ?? [];
  const liveShowItems = liveShows?.shows ?? [];

  console.log(`OK ${baseUrl}`);
  console.log(`CATALOG_ITEMS=${catalogItems.length}`);
  console.log(`FIRST_ID=${firstItem?.designId ?? ""}`);
  console.log(`FIRST_NAME=${firstItem?.designName ?? ""}`);
  console.log(`AVAILABILITY_MATCHES=${availabilityMatches.length}`);
  console.log(`LIVE_SHOWS=${liveShowItems.length}`);
}

async function readJson<T>(url: string, failures: string[]): Promise<T | null> {
  const response = await fetch(url, { cache: "no-store" });
  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok) {
    failures.push(`${url} returned ${response.status}.`);
    return null;
  }

  if (!contentType.includes("application/json")) {
    failures.push(`${url} returned ${contentType || "no content type"} instead of application/json.`);
    return null;
  }

  return (await response.json()) as T;
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

function fail(message: string): never {
  console.error(`Sparkle Suite Finder API contract check failed: ${message}`);
  process.exit(1);
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
