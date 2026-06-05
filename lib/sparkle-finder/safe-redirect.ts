const sparkleFinderDefaultNextPath = "/dashboard";

export function safeSparkleFinderNextPath(next: string | null): string {
  if (!next) {
    return sparkleFinderDefaultNextPath;
  }

  let decodedNext = next;

  try {
    decodedNext = decodeURIComponent(next);
  } catch {
    return sparkleFinderDefaultNextPath;
  }

  if (
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.includes("\\") ||
    decodedNext.startsWith("//") ||
    decodedNext.includes("\\") ||
    /^\/[a-z][a-z0-9+.-]*:/i.test(decodedNext)
  ) {
    return sparkleFinderDefaultNextPath;
  }

  return next;
}
