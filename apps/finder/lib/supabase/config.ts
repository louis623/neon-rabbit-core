const blockedSharedSupabaseProjectRefs = new Set(["bqhzfkgkjyuhlsozpylf"]);

export function getSparkleFinderSupabaseConfig(
  env: Record<string, string | undefined> = process.env,
): { url: string; publishableKey: string } | null {
  const url = getAllowedSparkleFinderSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL);
  const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) {
    return null;
  }

  return { url, publishableKey };
}

export function isSupabaseConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(getSparkleFinderSupabaseConfig(env));
}

export function getAllowedSparkleFinderSupabaseUrl(value: string | undefined): string | null {
  const candidate = value?.trim();

  if (!candidate) {
    return null;
  }

  try {
    const url = new URL(candidate);
    const hostname = url.hostname.toLowerCase();
    const projectRef = hostname.endsWith(".supabase.co") ? hostname.split(".")[0] : null;

    if (projectRef && blockedSharedSupabaseProjectRefs.has(projectRef)) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}
