export function getLocalRepBoardHref(boardUrl: string): string {
  if (!isSparkleSuiteFixtureUrl(boardUrl)) {
    return boardUrl;
  }

  const listingSlug = getLastUrlSegment(boardUrl);

  return listingSlug ? `/rep-boards?listing=${encodeURIComponent(listingSlug)}` : "/rep-boards";
}

export function getLocalRepHref(siteUrl: string): string {
  if (!isSparkleSuiteFixtureUrl(siteUrl)) {
    return siteUrl;
  }

  const repSlug = getLastUrlSegment(siteUrl);

  return repSlug ? `/rep-boards?rep=${encodeURIComponent(repSlug)}` : "/rep-boards";
}

export function getSparkleSuiteRepBoardHref(boardPath: string, sparkleSuiteBaseUrl: string): string {
  return getSparkleSuiteHref(boardPath, sparkleSuiteBaseUrl);
}

export function getSparkleSuiteRepHref(sitePath: string, sparkleSuiteBaseUrl: string): string {
  return getSparkleSuiteHref(sitePath, sparkleSuiteBaseUrl);
}

function getLastUrlSegment(value: string): string | undefined {
  return value.split("/").filter(Boolean).at(-1);
}

function getSparkleSuiteHref(pathOrHref: string, sparkleSuiteBaseUrl: string): string {
  const trimmedPathOrHref = pathOrHref.trim();

  if (isAbsoluteHttpHref(trimmedPathOrHref)) {
    return trimmedPathOrHref;
  }

  const baseUrl = sparkleSuiteBaseUrl.trim().replace(/\/+$/, "");
  const path = trimmedPathOrHref.startsWith("/") ? trimmedPathOrHref : `/${trimmedPathOrHref}`;

  return `${baseUrl}${path}`;
}

function isAbsoluteHttpHref(value: string): boolean {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isSparkleSuiteFixtureUrl(value: string): boolean {
  try {
    return new URL(value).hostname === "sparklesuite.example";
  } catch {
    return false;
  }
}
