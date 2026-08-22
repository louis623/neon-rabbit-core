const sparkleFinderCanonicalHost = "yoursparklefinder.com";

export function getSparkleFinderCanonicalRedirect(
  requestUrl: URL,
  vercelEnvironment: string | undefined = process.env.VERCEL_ENV,
): URL | null {
  if (vercelEnvironment !== "production") {
    return null;
  }

  const hostname = requestUrl.hostname.toLowerCase();
  const isAlternateProductionHost = hostname === `www.${sparkleFinderCanonicalHost}` ||
    hostname.endsWith(".vercel.app");

  if (!isAlternateProductionHost) {
    return null;
  }

  const canonicalUrl = new URL(requestUrl);
  canonicalUrl.protocol = "https:";
  canonicalUrl.hostname = sparkleFinderCanonicalHost;
  canonicalUrl.port = "";
  return canonicalUrl;
}
