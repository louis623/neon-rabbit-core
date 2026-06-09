export function getSparkleFinderOAuthRedirectTo(nextPath: string, browserOrigin?: string): string {
  const origin = getConfiguredSparkleFinderSiteOrigin() ?? normalizeOrigin(browserOrigin) ?? "";

  return `${origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}`;
}

function getConfiguredSparkleFinderSiteOrigin(): string | null {
  return normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL);
}

function normalizeOrigin(value: string | undefined): string | null {
  const candidate = value?.trim();

  if (!candidate) {
    return null;
  }

  try {
    const parsedUrl = new URL(candidate);

    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      return null;
    }

    return parsedUrl.origin;
  } catch {
    return null;
  }
}
