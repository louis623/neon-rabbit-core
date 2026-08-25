import type { ShowcaseStudioVariantCandidate } from "./showcase-studio-workflow-types";

export type { ShowcaseStudioVariantCandidate } from "./showcase-studio-workflow-types";

export type ShowcaseStudioLabelDetails = {
  bpLabel?: string;
  collectionName?: string;
  collectionYear?: number;
  designName?: string;
  itemNumber: string;
  jewelryType?: string;
  mainStone?: string;
  material?: string;
};

export type ShowcaseStudioPhotoEvidence = {
  finderSubmissionId: string;
  finderAssetId: string;
  claimedKind: "label" | "jewelry";
  temporaryReadUrl?: string;
};

type ShowcaseStudioRequestBase = { finderSubmissionId: string };

export type ShowcaseStudioIntakeRequest =
  | (ShowcaseStudioRequestBase & {
      action: "resolve";
      labelDetails: ShowcaseStudioLabelDetails;
      customerNote?: string;
      photoEvidence: [ShowcaseStudioPhotoEvidence, ShowcaseStudioPhotoEvidence];
    })
  | (ShowcaseStudioRequestBase & { action: "confirm"; selectedDesignId: string })
  | (ShowcaseStudioRequestBase & { action: "resume" });

export type ShowcaseStudioCatalogDraft = ShowcaseStudioLabelDetails;

export type ShowcaseStudioConfig = { apiUrl: string; bearerToken: string };

type ShowcaseStudioFailureStatus =
  | "invalid_details"
  | "invalid_selection"
  | "photo_rejected"
  | "storage_failed"
  | "database_failed"
  | "temporary_failure"
  | "conflicting_replay"
  | "unavailable";

export type ShowcaseStudioResult =
  | {
      ok: true;
      status: "needs_variant_confirmation";
      retryable: false;
      mutationReplayed: boolean;
      message: string;
      variantCandidates: ShowcaseStudioVariantCandidate[];
    }
  | {
      ok: true;
      status: "accepted" | "published";
      retryable: false;
      mutationReplayed: boolean;
      message: string;
      suiteDesignId: string;
      resolvedDesign: ShowcaseStudioVariantCandidate;
    }
  | {
      ok: true;
      status: "publish_queued";
      retryable: false;
      mutationReplayed: boolean;
      message: string;
      catalogDraft: ShowcaseStudioCatalogDraft;
    }
  | {
      ok: false;
      status: ShowcaseStudioFailureStatus;
      retryable: boolean;
      errorCode: string;
      customerMessage: string;
      message: string;
      photoFeedback?: string[];
      lightBoxHelpHref?: string;
    };

type ShowcaseStudioFetch = (
  input: string,
  init: {
    body: string;
    cache: "no-store";
    headers: Record<string, string>;
    method: "POST";
  },
) => Promise<Response>;

type SubmitShowcaseStudioIntakeOptions = {
  config?: ShowcaseStudioConfig;
  fetcher?: ShowcaseStudioFetch;
};

const lightBoxHelpHref = "/photo-setup";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const jewelryTypes = new Set(["ring", "necklace", "earrings", "stack", "bracelet"]);
const exactSuccessStatuses = new Set(["accepted", "published"]);
const failureStatuses = new Set([
  "invalid_details",
  "invalid_selection",
  "photo_rejected",
  "storage_failed",
  "database_failed",
  "temporary_failure",
  "conflicting_replay",
]);

export function getShowcaseStudioConfig(env: NodeJS.ProcessEnv = process.env): ShowcaseStudioConfig {
  const configuredUrl = String(env.SPARKLE_SUITE_FINDER_INTAKE_API_URL ?? "").trim();
  return {
    apiUrl: upgradeStudioV2Url(configuredUrl),
    bearerToken: String(env.SPARKLE_FINDER_TO_SUITE_INTAKE_TOKEN ?? "").trim(),
  };
}

export async function submitShowcaseStudioIntake(
  request: ShowcaseStudioIntakeRequest,
  options: SubmitShowcaseStudioIntakeOptions = {},
): Promise<ShowcaseStudioResult> {
  const payload = createSuiteIntakePayload(request);
  if (!payload) {
    return localFailure(
      "invalid_details",
      false,
      "invalid_finder_request",
      "Showcase Studio needs valid submission details before this step can continue.",
    );
  }

  const config = options.config ?? getShowcaseStudioConfig();
  const apiUrl = upgradeStudioV2Url(config.apiUrl);
  if (!apiUrl || !config.bearerToken) {
    return localFailure(
      "unavailable",
      true,
      "bridge_not_configured",
      "Showcase Studio publishing is not connected yet.",
    );
  }

  const fetcher = options.fetcher ?? fetch;
  let response: Response;
  try {
    response = await fetcher(apiUrl, {
      body: JSON.stringify(payload),
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${config.bearerToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  } catch {
    return localFailure(
      "temporary_failure",
      true,
      "bridge_unreachable",
      "Showcase Studio could not reach Sparkle Suite right now. Please try again.",
    );
  }

  const body = await safeReadJson(response);
  if (body.read) {
    const parsed = mapSuiteIntakeResponse(body.value, request);
    if (parsed) {
      return !response.ok && parsed.ok ? invalidSuiteResponse() : parsed;
    }
  }

  return response.ok
    ? invalidSuiteResponse()
    : localFailure(
        "unavailable",
        response.status >= 500 || response.status === 408 || response.status === 429,
        "suite_http_error",
        "Showcase Studio could not complete this step right now.",
      );
}

function createSuiteIntakePayload(request: ShowcaseStudioIntakeRequest): Record<string, unknown> | null {
  const finderSubmissionId = cleanUuid(request.finderSubmissionId);
  if (!finderSubmissionId) return null;

  const common = { schemaVersion: 2, sourceProduct: "sparkle_finder", finderSubmissionId } as const;
  if (request.action === "confirm") {
    const selectedDesignId = cleanUuid(request.selectedDesignId);
    return selectedDesignId ? { ...common, action: "confirm", selectedDesignId } : null;
  }
  if (request.action === "resume") return { ...common, action: "resume" };

  const labelDetails = cleanResolveLabelDetails(request.labelDetails);
  const photoEvidence = cleanPhotoEvidence(request.photoEvidence, finderSubmissionId);
  const customerNote = request.customerNote?.trim();
  if (!labelDetails || !photoEvidence || (customerNote && customerNote.length > 500)) return null;

  return {
    ...common,
    action: "resolve",
    labelDetails,
    ...(customerNote ? { customerNote } : {}),
    photoEvidence,
  };
}

function mapSuiteIntakeResponse(
  body: unknown,
  request: ShowcaseStudioIntakeRequest,
): ShowcaseStudioResult | null {
  const record = readRecord(body);
  if (record.schemaVersion !== 2 || typeof record.ok !== "boolean" || typeof record.status !== "string") {
    return null;
  }
  return record.ok ? mapSuiteSuccess(record, request) : mapSuiteFailure(record);
}

function mapSuiteSuccess(
  record: Record<string, unknown>,
  request: ShowcaseStudioIntakeRequest,
): Extract<ShowcaseStudioResult, { ok: true }> | null {
  if (record.retryable !== false || typeof record.mutationReplayed !== "boolean") return null;

  if (record.status === "needs_variant_confirmation") {
    if (request.action === "confirm") return null;
    const candidates = parseVariantCandidates(record.variantCandidates);
    if (!candidates) return null;
    return {
      ok: true,
      status: "needs_variant_confirmation",
      retryable: false,
      mutationReplayed: record.mutationReplayed,
      message: "Nic-Nac found more than one exact catalog variant. Choose the matching design to continue.",
      variantCandidates: candidates,
    };
  }

  if (exactSuccessStatuses.has(String(record.status))) {
    const status = record.status as "accepted" | "published";
    const suiteDesignId = cleanUuid(record.suiteDesignId);
    const resolvedDesign = parseVariantCandidate(record.resolvedDesign);
    if (
      !suiteDesignId
      || !resolvedDesign
      || suiteDesignId !== resolvedDesign.designId
      || !exactResultAgreesWithRequest(resolvedDesign, suiteDesignId, request)
    ) return null;
    return {
      ok: true,
      status,
      retryable: false,
      mutationReplayed: record.mutationReplayed,
      message: defaultMessageForSuccess(status, record.mutationReplayed),
      suiteDesignId,
      resolvedDesign,
    };
  }

  if (record.status === "publish_queued") {
    if (request.action === "confirm") return null;
    const catalogDraft = parseCatalogDraft(record.catalogDraft);
    if (!catalogDraft || !catalogDraftAgreesWithRequest(catalogDraft, request)) return null;
    return {
      ok: true,
      status: "publish_queued",
      retryable: false,
      mutationReplayed: record.mutationReplayed,
      message: defaultMessageForSuccess("publish_queued", record.mutationReplayed),
      catalogDraft,
    };
  }
  return null;
}

function mapSuiteFailure(record: Record<string, unknown>): Extract<ShowcaseStudioResult, { ok: false }> | null {
  if (!failureStatuses.has(String(record.status)) || typeof record.retryable !== "boolean") return null;

  const status = record.status as Exclude<ShowcaseStudioFailureStatus, "unavailable">;
  const errorCode = cleanRequiredText(record.errorCode, 160);
  const customerMessage = cleanRequiredText(record.customerMessage, 500);
  if (!errorCode || !customerMessage) return null;

  const photoFeedback = status === "photo_rejected" ? parsePhotoFeedback(record.photoFeedback) : undefined;
  if (status === "photo_rejected" && record.photoFeedback !== undefined && !photoFeedback) return null;

  return {
    ok: false,
    status,
    retryable: record.retryable,
    errorCode,
    customerMessage,
    message: customerMessage,
    ...(status === "photo_rejected" ? { photoFeedback: photoFeedback ?? [], lightBoxHelpHref } : {}),
  };
}

function parseVariantCandidates(value: unknown): ShowcaseStudioVariantCandidate[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 50) return null;
  const candidates = value.map(parseVariantCandidate);
  if (candidates.some((candidate) => !candidate)) return null;
  const parsed = candidates as ShowcaseStudioVariantCandidate[];
  return new Set(parsed.map((candidate) => candidate.designId)).size === parsed.length ? parsed : null;
}

function parseVariantCandidate(value: unknown): ShowcaseStudioVariantCandidate | null {
  const record = readRecord(value);
  const designId = cleanUuid(record.designId);
  const itemNumber = cleanRequiredText(record.itemNumber, 80);
  const designName = cleanRequiredText(record.designName, 160);
  const jewelryType = cleanRequiredText(record.jewelryType, 40);
  const material = cleanNullableText(record.material, 120);
  const mainStone = cleanNullableText(record.mainStone, 120);
  const collectionName = cleanNullableText(record.collectionName, 120);
  const collectionYear = cleanNullableInteger(record.collectionYear);
  const canonicalPhotoUrl = cleanNullableUrl(record.canonicalPhotoUrl);
  const description = cleanNullableText(record.description, 1_000);
  if (
    !designId || !itemNumber || !designName || !jewelryType || !jewelryTypes.has(jewelryType)
    || material === undefined || mainStone === undefined || collectionName === undefined
    || collectionYear === undefined || canonicalPhotoUrl === undefined || description === undefined
  ) return null;

  return {
    designId,
    itemNumber,
    designName,
    material,
    mainStone,
    jewelryType,
    collectionName,
    collectionYear,
    canonicalPhotoUrl,
    description,
  };
}

function parseCatalogDraft(value: unknown): ShowcaseStudioCatalogDraft | null {
  const record = readRecord(value);
  const itemNumber = cleanRequiredText(record.itemNumber, 80);
  if (!itemNumber) return null;
  const collectionYear = record.collectionYear === undefined
    ? undefined
    : cleanOptionalInteger(record.collectionYear, 1900, 2100);
  if (record.collectionYear !== undefined && collectionYear === undefined) return null;

  const draft: ShowcaseStudioCatalogDraft = { itemNumber };
  for (const [key, maxLength] of [
    ["bpLabel", 40], ["collectionName", 120], ["designName", 160], ["jewelryType", 40],
    ["mainStone", 120], ["material", 120],
  ] as const) {
    if (record[key] !== undefined) {
      const text = cleanRequiredText(record[key], maxLength);
      if (!text) return null;
      draft[key] = text;
    }
  }
  if (collectionYear !== undefined) draft.collectionYear = collectionYear;
  return draft;
}

function cleanResolveLabelDetails(value: unknown): ShowcaseStudioLabelDetails | null {
  const details = parseCatalogDraft(value);
  return details && itemNumberLooksSafe(details.itemNumber) ? details : null;
}

function cleanPhotoEvidence(
  value: ShowcaseStudioPhotoEvidence[],
  finderSubmissionId: string,
): ShowcaseStudioPhotoEvidence[] | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const parsed = value.map((entry) => {
    const finderAssetId = cleanUuid(entry.finderAssetId);
    const submissionId = cleanUuid(entry.finderSubmissionId);
    const temporaryReadUrl = entry.temporaryReadUrl === undefined
      ? undefined
      : cleanUrl(entry.temporaryReadUrl, 2_000);
    if (
      !finderAssetId || submissionId !== finderSubmissionId
      || (entry.claimedKind !== "label" && entry.claimedKind !== "jewelry")
      || (entry.temporaryReadUrl !== undefined && !temporaryReadUrl)
    ) return null;
    return {
      finderSubmissionId: submissionId,
      finderAssetId,
      claimedKind: entry.claimedKind,
      ...(temporaryReadUrl ? { temporaryReadUrl } : {}),
    };
  });
  if (parsed.some((entry) => !entry)) return null;
  const evidence = parsed as ShowcaseStudioPhotoEvidence[];
  return new Set(evidence.map((entry) => entry.finderAssetId)).size === 2
    && new Set(evidence.map((entry) => entry.claimedKind)).size === 2
    ? evidence
    : null;
}

function exactResultAgreesWithRequest(
  candidate: ShowcaseStudioVariantCandidate,
  suiteDesignId: string,
  request: ShowcaseStudioIntakeRequest,
): boolean {
  if (request.action === "confirm") return cleanUuid(request.selectedDesignId) === suiteDesignId;
  if (request.action === "resume") return true;
  return candidateAgreesWithFacts(candidate, request.labelDetails);
}

function candidateAgreesWithFacts(
  candidate: ShowcaseStudioVariantCandidate,
  facts: ShowcaseStudioLabelDetails,
): boolean {
  const stringFacts: Array<[string | null | undefined, string | undefined]> = [
    [candidate.itemNumber, facts.itemNumber], [candidate.designName, facts.designName],
    [candidate.collectionName, facts.collectionName], [candidate.jewelryType, facts.jewelryType],
    [candidate.mainStone, facts.mainStone], [candidate.material, facts.material],
  ];
  if (stringFacts.some(([actual, expected]) => expected && normalizedFact(actual) !== normalizedFact(expected))) {
    return false;
  }
  return facts.collectionYear === undefined || candidate.collectionYear === facts.collectionYear;
}

function catalogDraftAgreesWithRequest(
  draft: ShowcaseStudioCatalogDraft,
  request: ShowcaseStudioIntakeRequest,
): boolean {
  return request.action !== "resolve"
    || normalizedFact(draft.itemNumber) === normalizedFact(request.labelDetails.itemNumber);
}

function defaultMessageForSuccess(
  status: "accepted" | "publish_queued" | "published",
  mutationReplayed: boolean,
): string {
  const prefix = mutationReplayed ? "Showcase Studio restored the prior result. " : "";
  if (status === "published") return `${prefix}This exact design is published in the shared jewelry catalog.`;
  if (status === "publish_queued") return `${prefix}This missing piece is queued for catalog review.`;
  return `${prefix}Nic-Nac accepted the exact catalog design.`;
}

function invalidSuiteResponse(): ShowcaseStudioResult {
  return localFailure(
    "unavailable",
    true,
    "invalid_suite_response",
    "Showcase Studio received an invalid response from Sparkle Suite. Please try again.",
  );
}

function localFailure(
  status: ShowcaseStudioFailureStatus,
  retryable: boolean,
  errorCode: string,
  customerMessage: string,
): Extract<ShowcaseStudioResult, { ok: false }> {
  return { ok: false, status, retryable, errorCode, customerMessage, message: customerMessage };
}

async function safeReadJson(response: Response): Promise<{ read: true; value: unknown } | { read: false }> {
  try {
    return { read: true, value: await response.json() };
  } catch {
    return { read: false };
  }
}

function parsePhotoFeedback(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > 10) return null;
  const feedback = value.map((item) => cleanRequiredText(item, 500));
  return feedback.some((item) => !item) ? null : feedback as string[];
}

function upgradeStudioV2Url(value: string): string {
  const trimmed = value.trim().replace(/\/$/, "");
  return trimmed.endsWith("/api/internal/finder/jewelry-intake") ? `${trimmed}/v2` : trimmed;
}

function cleanUuid(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return uuidPattern.test(text) ? text : null;
}

function cleanRequiredText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text && text.length <= maxLength ? text : null;
}

function cleanNullableText(value: unknown, maxLength: number): string | null | undefined {
  return value === null ? null : cleanRequiredText(value, maxLength) ?? undefined;
}

function cleanNullableInteger(value: unknown): number | null | undefined {
  return value === null ? null : Number.isSafeInteger(value) ? value as number : undefined;
}

function cleanOptionalInteger(value: unknown, min: number, max: number): number | undefined {
  return Number.isSafeInteger(value) && Number(value) >= min && Number(value) <= max ? Number(value) : undefined;
}

function cleanNullableUrl(value: unknown): string | null | undefined {
  return value === null ? null : cleanUrl(value, 2_000) ?? undefined;
}

function cleanUrl(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text || text.length > maxLength) return null;
  try {
    const url = new URL(text);
    return url.protocol === "https:" || url.protocol === "http:" ? text : null;
  } catch {
    return null;
  }
}

function itemNumberLooksSafe(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9 -]{0,79}$/.test(value);
}

function normalizedFact(value: string | null | undefined): string {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}
