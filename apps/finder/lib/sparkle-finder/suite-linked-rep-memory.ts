export type SuiteLinkedRepMemoryConfig = {
  apiUrl: string;
  bearerToken: string;
};

type SuiteLinkedRepMemoryInput = {
  finderUserId: string;
  suiteRepId: string;
  config?: SuiteLinkedRepMemoryConfig;
  fetcher?: (
    input: string,
    init: {
      body: string;
      cache: "no-store";
      headers: Record<string, string>;
      method: "POST";
      signal?: AbortSignal;
    },
  ) => Promise<Response>;
  timeoutMs?: number;
};

type SuiteLinkedRepMemoryResponse = {
  ok?: boolean;
  status?: string;
  suiteRepId?: string;
  memorySummaries?: unknown;
};

const defaultSparkleSuiteBaseUrl = "https://www.yoursparklesuite.com";
const maxLinkedRepMemorySummaries = 4;
const maxLinkedRepMemorySummaryChars = 300;
const defaultSuiteLinkedRepMemoryTimeoutMs = 1500;

export function getSuiteLinkedRepMemoryConfig(env: NodeJS.ProcessEnv = process.env): SuiteLinkedRepMemoryConfig {
  const baseUrl = String(
    env.SPARKLE_SUITE_FINDER_API_BASE_URL ??
      env.NEXT_PUBLIC_SPARKLE_SUITE_FINDER_API_BASE_URL ??
      defaultSparkleSuiteBaseUrl,
  )
    .trim()
    .replace(/\/+$/, "");

  return {
    apiUrl: baseUrl ? `${baseUrl}/api/internal/finder/rep-memory` : "",
    bearerToken: String(env.SPARKLE_FINDER_TO_SUITE_REP_MEMORY_TOKEN ?? "").trim(),
  };
}

export async function getSuiteLinkedRepMemorySummariesForFinder({
  finderUserId,
  suiteRepId,
  config = getSuiteLinkedRepMemoryConfig(),
  fetcher = fetch,
  timeoutMs = defaultSuiteLinkedRepMemoryTimeoutMs,
}: SuiteLinkedRepMemoryInput): Promise<string[]> {
  const cleanedFinderUserId = cleanText(finderUserId, 120);
  const cleanedSuiteRepId = cleanText(suiteRepId, 120);

  if (!cleanedFinderUserId || !cleanedSuiteRepId || !config.apiUrl || !config.bearerToken) {
    return [];
  }

  let response: Response;

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), Math.max(1, timeoutMs));

  try {
    response = await fetcher(config.apiUrl, {
      body: JSON.stringify({
        sourceProduct: "sparkle_finder",
        finderUserId: cleanedFinderUserId,
        suiteRepId: cleanedSuiteRepId,
      }),
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${config.bearerToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: abortController.signal,
    });
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    return [];
  }

  const body = await safeReadJson(response) as SuiteLinkedRepMemoryResponse;

  if (body.ok !== true || body.suiteRepId !== cleanedSuiteRepId || !Array.isArray(body.memorySummaries)) {
    return [];
  }

  return body.memorySummaries
    .flatMap((summary) => {
      const text = cleanText(readString(summary), maxLinkedRepMemorySummaryChars);

      if (!text || isUnsafeMemorySummary(text)) {
        return [];
      }

      return [text];
    })
    .slice(0, maxLinkedRepMemorySummaries);
}

async function safeReadJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function cleanText(value: string | undefined, maxLength: number): string {
  const compact = String(value ?? "").replace(/\s+/g, " ").trim();

  if (compact.length <= maxLength) {
    return compact;
  }

  const slice = compact.slice(0, Math.max(0, maxLength - 3)).trimEnd();
  const lastSpaceIndex = slice.lastIndexOf(" ");
  const truncated = lastSpaceIndex > 0 ? slice.slice(0, lastSpaceIndex) : slice;

  return `${truncated.trimEnd()}...`;
}

function isUnsafeMemorySummary(summary: string): boolean {
  const normalized = summary.toLowerCase();

  return [
    /\bpassword\b/,
    /\bcredit card\b/,
    /\bcard number\b/,
    /\bssn\b/,
    /\bsocial security\b/,
    /\bignore (all )?(previous|prior) instructions\b/,
    /\byou are now\b/,
    /\badmin mode\b/,
    /\bcall [a-z_]+/i,
    /\bdo not ask for confirmation\b/,
    /\bprint the contents?\b/,
    /\blist the trade board for rep\b/,
  ].some((pattern) => pattern.test(normalized));
}
