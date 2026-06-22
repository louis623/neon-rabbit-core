export type SuiteRepClaimConfig = {
  apiUrl: string;
  bearerToken: string;
  timeoutMs: number;
};

export type SuiteRepClaimEntitlement = {
  isRep: true;
  silverRepIncluded: true;
  badge: "bp_rep";
};

export type SuiteRepClaimSuccess = {
  ok: true;
  status: "claimed";
  suiteRepId: string;
  displayName?: string;
  businessName: string;
  publicSiteSlug?: string;
  finderEntitlement: SuiteRepClaimEntitlement;
};

export type SuiteRepClaimFailureStatus =
  | "missing_secret_rep_id"
  | "not_configured"
  | "not_found"
  | "rejected"
  | "claim_failed";

export type SuiteRepClaimFailure = {
  ok: false;
  status: SuiteRepClaimFailureStatus;
  message: string;
};

export type SuiteRepClaimResult = SuiteRepClaimSuccess | SuiteRepClaimFailure;

export type SparkleFinderRepClaimClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => PromiseLike<{ data: unknown; error: unknown }>;
      };
    };
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: string) => PromiseLike<{ data: unknown; error: unknown }>;
    };
    insert: (values: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }>;
    upsert: (
      values: Record<string, unknown>,
      options?: Record<string, unknown>,
    ) => PromiseLike<{ data: unknown; error: unknown }>;
  };
};

type ClaimSparkleSuiteRepInput = {
  finderUserId: string;
  finderEmail?: string | null;
  displayName?: string | null;
  secretRepIdNumber: string;
  config?: SuiteRepClaimConfig | null;
  fetcher?: typeof fetch;
  nowIso?: string;
  serviceRoleClient: SparkleFinderRepClaimClient | null;
};

const defaultSuiteApiBaseUrl = "https://www.yoursparklesuite.com";
const defaultTimeoutMs = 8000;
const defaultNotConfiguredMessage = "Sparkle Suite rep claiming is not configured in this environment.";
const defaultNotFoundMessage = "That Secret Rep ID Number did not match an active Sparkle Suite rep.";

export function getSuiteRepClaimConfig(
  env: Record<string, string | undefined> = process.env,
): SuiteRepClaimConfig | null {
  const bearerToken = env.SPARKLE_FINDER_TO_SUITE_REP_CLAIM_TOKEN?.trim();

  if (!bearerToken) {
    return null;
  }

  const directApiUrl = env.SPARKLE_SUITE_FINDER_REP_CLAIM_API_URL?.trim();
  const apiUrl = directApiUrl || buildInternalSuiteApiUrl(
    env.SPARKLE_SUITE_FINDER_API_BASE_URL?.trim()
      || env.NEXT_PUBLIC_SPARKLE_SUITE_FINDER_API_BASE_URL?.trim()
      || defaultSuiteApiBaseUrl,
    "/api/internal/finder/rep-claim",
  );

  if (!apiUrl) {
    return null;
  }

  return {
    apiUrl,
    bearerToken,
    timeoutMs: parsePositiveInteger(env.SPARKLE_FINDER_TO_SUITE_REP_CLAIM_TIMEOUT_MS) ?? defaultTimeoutMs,
  };
}

export async function claimSparkleSuiteRepForFinderUser({
  finderUserId,
  finderEmail,
  displayName,
  secretRepIdNumber,
  config = getSuiteRepClaimConfig(),
  fetcher = fetch,
  nowIso = new Date().toISOString(),
  serviceRoleClient,
}: ClaimSparkleSuiteRepInput): Promise<SuiteRepClaimResult> {
  const cleanedFinderUserId = cleanText(finderUserId, 120);
  const cleanedSecretRepIdNumber = normalizeSecretRepIdNumber(secretRepIdNumber);

  if (!cleanedSecretRepIdNumber) {
    return {
      ok: false,
      status: "missing_secret_rep_id",
      message: "Enter the Secret Rep ID Number from Sparkle Suite.",
    };
  }

  if (!cleanedFinderUserId || !config || !serviceRoleClient) {
    return {
      ok: false,
      status: "not_configured",
      message: defaultNotConfiguredMessage,
    };
  }

  const suiteClaim = await requestSuiteRepClaim({
    config,
    fetcher,
    finderUserId: cleanedFinderUserId,
    secretRepIdNumber: cleanedSecretRepIdNumber,
  });

  if (!suiteClaim.ok) {
    return suiteClaim;
  }

  const persisted = await persistRepClaim({
    claim: suiteClaim,
    displayName,
    finderEmail,
    finderUserId: cleanedFinderUserId,
    nowIso,
    serviceRoleClient,
  });

  if (!persisted.ok) {
    return persisted;
  }

  return suiteClaim;
}

async function requestSuiteRepClaim({
  config,
  fetcher,
  finderUserId,
  secretRepIdNumber,
}: {
  config: SuiteRepClaimConfig;
  fetcher: typeof fetch;
  finderUserId: string;
  secretRepIdNumber: string;
}): Promise<SuiteRepClaimResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetcher(config.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.bearerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourceProduct: "sparkle_finder",
        finderUserId,
        secretRepIdNumber,
      }),
      signal: controller.signal,
    });
    const responseBody = await readJsonObject(response);

    if (!response.ok || responseBody?.ok !== true) {
      return {
        ok: false,
        status: responseBody?.status === "not_found" ? "not_found" : "rejected",
        message: cleanText(responseBody?.message, 240) || defaultNotFoundMessage,
      };
    }

    const suiteRepId = cleanText(responseBody.suiteRepId, 120);
    const businessName = cleanText(responseBody.businessName, 160);

    if (!suiteRepId || !businessName) {
      return {
        ok: false,
        status: "rejected",
        message: "Sparkle Suite did not return a complete rep claim.",
      };
    }

    return {
      ok: true,
      status: "claimed",
      suiteRepId,
      displayName: cleanText(responseBody.displayName, 120) || undefined,
      businessName,
      publicSiteSlug: cleanText(responseBody.publicSiteSlug, 120) || undefined,
      finderEntitlement: {
        isRep: true,
        silverRepIncluded: true,
        badge: "bp_rep",
      },
    };
  } catch {
    return {
      ok: false,
      status: "rejected",
      message: "Sparkle Finder could not verify that Secret Rep ID Number with Sparkle Suite.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function persistRepClaim({
  claim,
  displayName,
  finderEmail,
  finderUserId,
  nowIso,
  serviceRoleClient,
}: {
  claim: SuiteRepClaimSuccess;
  displayName?: string | null;
  finderEmail?: string | null;
  finderUserId: string;
  nowIso: string;
  serviceRoleClient: SparkleFinderRepClaimClient;
}): Promise<{ ok: true } | SuiteRepClaimFailure> {
  const profileClaimValues = {
    is_rep: true,
    sparkle_suite_rep_id: claim.suiteRepId,
    sparkle_suite_rep_business_name: claim.businessName,
    sparkle_suite_rep_public_site_slug: claim.publicSiteSlug ?? null,
    sparkle_suite_rep_claimed_at: nowIso,
  };

  const existingProfile = await serviceRoleClient
    .from("sparkle_finder_profiles")
    .select("user_id")
    .eq("user_id", finderUserId)
    .maybeSingle();

  if (existingProfile.error) {
    return claimWriteFailure();
  }

  const profileWrite = existingProfile.data
    ? await serviceRoleClient
        .from("sparkle_finder_profiles")
        .update(profileClaimValues)
        .eq("user_id", finderUserId)
    : await serviceRoleClient.from("sparkle_finder_profiles").insert({
        user_id: finderUserId,
        display_name: firstPresent(displayName, finderEmail?.split("@")[0], "Sparkle Finder Rep"),
        email: cleanText(finderEmail, 254),
        state: "",
        ...profileClaimValues,
      });

  if (profileWrite.error) {
    return claimWriteFailure();
  }

  const membershipWrite = await serviceRoleClient.from("sparkle_finder_memberships").upsert(
    {
      user_id: finderUserId,
      access_state: "silver_rep_included",
      silver_source: "sparkle_suite_rep",
      silver_started_at: nowIso,
      silver_ends_at: null,
    },
    { onConflict: "user_id" },
  );

  if (membershipWrite.error) {
    return claimWriteFailure();
  }

  return { ok: true };
}

function claimWriteFailure(): SuiteRepClaimFailure {
  return {
    ok: false,
    status: "claim_failed",
    message: "Sparkle Finder verified the rep number but could not save it to this account.",
  };
}

async function readJsonObject(response: Response): Promise<Record<string, unknown> | null> {
  try {
    const body = await response.json();

    return body && typeof body === "object" && !Array.isArray(body)
      ? body as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function buildInternalSuiteApiUrl(baseUrl: string, pathname: string): string | null {
  try {
    return new URL(pathname, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
  } catch {
    return null;
  }
}

function parsePositiveInteger(value: string | undefined): number | undefined {
  const parsed = Number.parseInt(value ?? "", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function normalizeSecretRepIdNumber(value: string): string {
  return cleanText(value, 80).toUpperCase();
}

function firstPresent(...values: Array<string | null | undefined>): string {
  return values.find((value) => value?.trim())?.trim() ?? "";
}

function cleanText(value: unknown, maxLength: number): string {
  return String(value ?? "")
    .trim()
    .slice(0, maxLength);
}
