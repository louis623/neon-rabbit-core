import type { CurrentSparkleFinderAccountState } from "./account-service";

export type ShowcaseStudioSubmissionInput = {
  customerNote: string;
  itemNumber: string;
  jewelryFrontPhoto: File;
  originalLabelPhoto: File;
};

export type ShowcaseStudioSubmissionFailureReason =
  | "file_too_large"
  | "invalid_file_type"
  | "jewelry_photo_required"
  | "original_label_required"
  | "save_failed"
  | "silver_required";

export type ShowcaseStudioSubmissionResult =
  | {
      ok: true;
      status: "submitted";
      submissionId: string;
    }
  | {
      ok: false;
      reason: ShowcaseStudioSubmissionFailureReason;
    };

type ShowcaseStudioSubmissionOptions = {
  idFactory?: () => string;
  now?: () => Date;
};

type SupabaseInsertResult = PromiseLike<{ data: unknown; error: unknown }>;
type SupabaseReadResult = PromiseLike<{ data: unknown; error: unknown }>;

export type ShowcaseStudioUploadRole = "original_label" | "jewelry_front";

export type ShowcaseStudioUploadRoleStatus = {
  role: ShowcaseStudioUploadRole;
  label: string;
  present: boolean;
  qualityStatus: "pending" | "accepted" | "rejected" | null;
  feedback: string[];
};

export type ShowcaseStudioPersistedIntakeStatus =
  | "draft"
  | "submitted"
  | "needs_label"
  | "needs_confirmation"
  | "needs_jewelry_photo"
  | "photo_rejected"
  | "accepted"
  | "publish_queued"
  | "published"
  | "rejected"
  | "publish_failed";

export type ShowcaseStudioLatestSubmissionStatus = {
  status: ShowcaseStudioPersistedIntakeStatus;
  itemNumber: string | null;
  designName: string | null;
  jewelryType: string | null;
  collectionName: string | null;
  collectionYear: number | null;
  mainStone: string | null;
  material: string | null;
  bpLabel: string | null;
  customerNoteSnippet: string | null;
  photoFeedback: string[];
  submittedAt: string | null;
  acceptedAt: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
};

export type ShowcaseStudioIntakeStatusReadResult = {
  status: "connected" | "unavailable";
  dataSource: "persisted";
  hasSubmittedIntake: boolean;
  requiredUploadRoles: ShowcaseStudioUploadRoleStatus[];
  missingUploadRoles: ShowcaseStudioUploadRole[];
  studioUploadHref: "/silver#showcase-studio";
  canContinueFromChat: false;
  nextAction: "open_studio_upload_flow" | "report_existing_status";
  latestSubmission: ShowcaseStudioLatestSubmissionStatus | null;
  guidance: string;
};

export type SupabaseShowcaseStudioClient = {
  from: (table: string) => {
    insert: (values: unknown) => SupabaseInsertResult;
  };
  storage: {
    from: (bucket: string) => {
      upload: (
        path: string,
        file: File,
        options: {
          contentType: string;
          upsert: false;
        },
      ) => PromiseLike<{ data: unknown; error: unknown }>;
    };
  };
};

export type SupabaseShowcaseStudioReadClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => SupabaseReadResult;
    };
  };
};

const intakeBucket = "sparkle-finder-private";
const maxStudioImageBytes = 10 * 1024 * 1024;
const studioUploadHref = "/silver#showcase-studio" as const;
const studioSubmissionColumns =
  "id,user_id,status,item_number,design_name,jewelry_type,collection_name,collection_year,main_stone,material,bp_label,customer_note,photo_feedback,submitted_at,accepted_at,published_at,created_at,updated_at";
const studioAssetColumns =
  "id,submission_id,user_id,asset_kind,content_type,byte_size,nic_nac_quality_status,nic_nac_quality_feedback,created_at";
const requiredUploadRoleDefinitions: Array<{
  role: ShowcaseStudioUploadRole;
  label: string;
}> = [
  {
    role: "original_label",
    label: "original Bomb Party label/details photo",
  },
  {
    role: "jewelry_front",
    label: "clear customer-facing jewelry photo",
  },
];

export async function persistShowcaseStudioSubmissionForAccount(
  supabase: SupabaseShowcaseStudioClient,
  accountState: CurrentSparkleFinderAccountState,
  input: ShowcaseStudioSubmissionInput,
  options: ShowcaseStudioSubmissionOptions = {},
): Promise<ShowcaseStudioSubmissionResult> {
  if (!canSaveSilverState(accountState)) {
    return { ok: false, reason: "silver_required" };
  }

  const originalLabelValidation = validateStudioImage(input.originalLabelPhoto, "original_label_required");

  if (!originalLabelValidation.ok) {
    return { ok: false, reason: originalLabelValidation.reason };
  }

  const jewelryPhotoValidation = validateStudioImage(input.jewelryFrontPhoto, "jewelry_photo_required");

  if (!jewelryPhotoValidation.ok) {
    return { ok: false, reason: jewelryPhotoValidation.reason };
  }

  const submissionId = options.idFactory?.() ?? globalThis.crypto.randomUUID();
  const submittedAt = (options.now?.() ?? new Date()).toISOString();
  const originalLabelPath = buildIntakeAssetPath(
    accountState.customer.id,
    submissionId,
    "original-label",
    input.originalLabelPhoto.name,
  );
  const jewelryPhotoPath = buildIntakeAssetPath(
    accountState.customer.id,
    submissionId,
    "jewelry-front",
    input.jewelryFrontPhoto.name,
  );

  const submissionResult = await supabase.from("sparkle_finder_nic_nac_intake_submissions").insert({
    id: submissionId,
    user_id: accountState.customer.id,
    status: "submitted",
    item_number: cleanText(input.itemNumber, 80),
    customer_note: cleanText(input.customerNote, 500),
    submitted_at: submittedAt,
  });

  if (submissionResult.error) {
    return { ok: false, reason: "save_failed" };
  }

  const storage = supabase.storage.from(intakeBucket);
  const originalLabelUpload = await storage.upload(originalLabelPath, input.originalLabelPhoto, {
    contentType: input.originalLabelPhoto.type,
    upsert: false,
  });

  if (originalLabelUpload.error) {
    return { ok: false, reason: "save_failed" };
  }

  const jewelryPhotoUpload = await storage.upload(jewelryPhotoPath, input.jewelryFrontPhoto, {
    contentType: input.jewelryFrontPhoto.type,
    upsert: false,
  });

  if (jewelryPhotoUpload.error) {
    return { ok: false, reason: "save_failed" };
  }

  const assetResult = await supabase.from("sparkle_finder_nic_nac_intake_assets").insert([
    {
      submission_id: submissionId,
      user_id: accountState.customer.id,
      asset_kind: "original_label",
      storage_bucket: intakeBucket,
      storage_path: originalLabelPath,
      content_type: input.originalLabelPhoto.type,
      byte_size: input.originalLabelPhoto.size,
    },
    {
      submission_id: submissionId,
      user_id: accountState.customer.id,
      asset_kind: "jewelry_front",
      storage_bucket: intakeBucket,
      storage_path: jewelryPhotoPath,
      content_type: input.jewelryFrontPhoto.type,
      byte_size: input.jewelryFrontPhoto.size,
    },
  ]);

  if (assetResult.error) {
    return { ok: false, reason: "save_failed" };
  }

  return {
    ok: true,
    status: "submitted",
    submissionId,
  };
}

export async function readShowcaseStudioIntakeStatusForUser(
  supabase: SupabaseShowcaseStudioReadClient,
  userId: string,
): Promise<ShowcaseStudioIntakeStatusReadResult> {
  const trimmedUserId = userId.trim();

  if (!trimmedUserId) {
    return createUnavailableStudioStatus();
  }

  try {
    const submissionsResult = await supabase
      .from("sparkle_finder_nic_nac_intake_submissions")
      .select(studioSubmissionColumns)
      .eq("user_id", trimmedUserId);

    if (submissionsResult.error || !Array.isArray(submissionsResult.data)) {
      return createUnavailableStudioStatus();
    }

    const latestSubmissionRow = pickLatestSubmission(
      submissionsResult.data.flatMap((row) => {
        const record = asRecord(row);

        return record && readString(record.user_id) === trimmedUserId ? [record] : [];
      }),
    );

    if (!latestSubmissionRow) {
      return createConnectedStudioStatus(null, []);
    }

    const assetsResult = await supabase
      .from("sparkle_finder_nic_nac_intake_assets")
      .select(studioAssetColumns)
      .eq("user_id", trimmedUserId);

    if (assetsResult.error || !Array.isArray(assetsResult.data)) {
      return createUnavailableStudioStatus();
    }

    const latestSubmissionId = readString(latestSubmissionRow.id);
    const assetRows = assetsResult.data.flatMap((row) => {
      const record = asRecord(row);

      return record &&
        readString(record.user_id) === trimmedUserId &&
        readString(record.submission_id) === latestSubmissionId
        ? [record]
        : [];
    });

    return createConnectedStudioStatus(latestSubmissionRow, assetRows);
  } catch {
    return createUnavailableStudioStatus();
  }
}

function validateStudioImage(
  file: File,
  missingReason: "jewelry_photo_required" | "original_label_required",
): { ok: true } | { ok: false; reason: ShowcaseStudioSubmissionFailureReason } {
  if (!file || file.size <= 0) {
    return { ok: false, reason: missingReason };
  }

  if (!file.type.startsWith("image/")) {
    return { ok: false, reason: "invalid_file_type" };
  }

  if (file.size > maxStudioImageBytes) {
    return { ok: false, reason: "file_too_large" };
  }

  return { ok: true };
}

function createConnectedStudioStatus(
  latestSubmissionRow: Record<string, unknown> | null,
  assetRows: Array<Record<string, unknown>>,
): ShowcaseStudioIntakeStatusReadResult {
  const requiredUploadRoles = buildUploadRoleStatuses(assetRows);
  const missingUploadRoles = requiredUploadRoles.flatMap((roleStatus) =>
    roleStatus.present ? [] : [roleStatus.role],
  );
  const latestSubmission = latestSubmissionRow ? mapLatestSubmission(latestSubmissionRow) : null;
  const nextAction = shouldOpenStudioUploadFlow(latestSubmission, missingUploadRoles)
    ? "open_studio_upload_flow"
    : "report_existing_status";

  return {
    status: "connected",
    dataSource: "persisted",
    hasSubmittedIntake: Boolean(latestSubmission && latestSubmission.status !== "draft"),
    requiredUploadRoles,
    missingUploadRoles,
    studioUploadHref,
    canContinueFromChat: false,
    nextAction,
    latestSubmission,
    guidance: buildStudioStatusGuidance(latestSubmission, missingUploadRoles, nextAction),
  };
}

function createUnavailableStudioStatus(): ShowcaseStudioIntakeStatusReadResult {
  return {
    status: "unavailable",
    dataSource: "persisted",
    hasSubmittedIntake: false,
    requiredUploadRoles: buildUploadRoleStatuses([]),
    missingUploadRoles: ["original_label", "jewelry_front"],
    studioUploadHref,
    canContinueFromChat: false,
    nextAction: "open_studio_upload_flow",
    latestSubmission: null,
    guidance: "Studio intake state could not be read right now. Offer to retry before claiming upload or review status.",
  };
}

function buildUploadRoleStatuses(assetRows: Array<Record<string, unknown>>): ShowcaseStudioUploadRoleStatus[] {
  return requiredUploadRoleDefinitions.map((definition) => {
    const assetRow = assetRows.find((row) => normalizeUploadRole(row.asset_kind) === definition.role);

    return {
      role: definition.role,
      label: definition.label,
      present: Boolean(assetRow),
      qualityStatus: assetRow ? normalizeQualityStatus(assetRow.nic_nac_quality_status) : null,
      feedback: assetRow ? readStringArray(assetRow.nic_nac_quality_feedback) : [],
    };
  });
}

function pickLatestSubmission(rows: Array<Record<string, unknown>>): Record<string, unknown> | null {
  return [...rows].sort((left, right) => compareSubmissionRecency(right, left))[0] ?? null;
}

function compareSubmissionRecency(left: Record<string, unknown>, right: Record<string, unknown>): number {
  return readComparableTime(left) - readComparableTime(right);
}

function readComparableTime(row: Record<string, unknown>): number {
  return Date.parse(
    readString(row.submitted_at) ||
      readString(row.updated_at) ||
      readString(row.created_at),
  ) || 0;
}

function mapLatestSubmission(row: Record<string, unknown>): ShowcaseStudioLatestSubmissionStatus {
  return {
    status: normalizeSubmissionStatus(row.status),
    itemNumber: readNullableString(row.item_number),
    designName: readNullableString(row.design_name),
    jewelryType: readNullableString(row.jewelry_type),
    collectionName: readNullableString(row.collection_name),
    collectionYear: readNullableNumber(row.collection_year),
    mainStone: readNullableString(row.main_stone),
    material: readNullableString(row.material),
    bpLabel: readNullableString(row.bp_label),
    customerNoteSnippet: readNullableString(row.customer_note, 180),
    photoFeedback: readStringArray(row.photo_feedback),
    submittedAt: readNullableString(row.submitted_at),
    acceptedAt: readNullableString(row.accepted_at),
    publishedAt: readNullableString(row.published_at),
    updatedAt: readNullableString(row.updated_at),
  };
}

function shouldOpenStudioUploadFlow(
  latestSubmission: ShowcaseStudioLatestSubmissionStatus | null,
  missingUploadRoles: ShowcaseStudioUploadRole[],
): boolean {
  return !latestSubmission ||
    missingUploadRoles.length > 0 ||
    latestSubmission.status === "draft" ||
    latestSubmission.status === "needs_label" ||
    latestSubmission.status === "needs_jewelry_photo" ||
    latestSubmission.status === "photo_rejected" ||
    latestSubmission.status === "publish_failed";
}

function buildStudioStatusGuidance(
  latestSubmission: ShowcaseStudioLatestSubmissionStatus | null,
  missingUploadRoles: ShowcaseStudioUploadRole[],
  nextAction: ShowcaseStudioIntakeStatusReadResult["nextAction"],
): string {
  if (nextAction === "report_existing_status") {
    return "Use app-owned Studio state only. Report this existing Studio intake status; do not claim a new upload or submission from chat.";
  }

  const missingRoles = missingUploadRoles.join(", ");

  if (!latestSubmission) {
    return `No app-owned Studio intake is saved yet. Nic-Nac cannot receive uploads from chat in this UI. Send the customer to the Studio upload flow for: ${missingRoles}.`;
  }

  if (!missingRoles) {
    return "A Studio intake exists, but the current review status needs a Studio upload-flow follow-up. Do not accept replacement files from chat.";
  }

  return `A Studio intake exists, but Nic-Nac cannot receive missing files from chat in this UI. Send the customer to the Studio upload flow for: ${missingRoles}.`;
}

function normalizeUploadRole(value: unknown): ShowcaseStudioUploadRole | null {
  return value === "original_label" || value === "jewelry_front" ? value : null;
}

function normalizeQualityStatus(value: unknown): ShowcaseStudioUploadRoleStatus["qualityStatus"] {
  return value === "accepted" || value === "rejected" || value === "pending" ? value : "pending";
}

function normalizeSubmissionStatus(value: unknown): ShowcaseStudioPersistedIntakeStatus {
  if (
    value === "draft" ||
    value === "submitted" ||
    value === "needs_label" ||
    value === "needs_confirmation" ||
    value === "needs_jewelry_photo" ||
    value === "photo_rejected" ||
    value === "accepted" ||
    value === "publish_queued" ||
    value === "published" ||
    value === "rejected" ||
    value === "publish_failed"
  ) {
    return value;
  }

  return "draft";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readNullableString(value: unknown, maxLength = 120): string | null {
  const cleaned = readString(value).slice(0, maxLength);

  return cleaned || null;
}

function readNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const number = typeof value === "number" ? value : Number(value);

  return Number.isFinite(number) ? number : null;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.flatMap((item) => {
        const text = readString(item).slice(0, 180);

        return text ? [text] : [];
      })
    : [];
}

function buildIntakeAssetPath(userId: string, submissionId: string, folder: string, fileName: string): string {
  return `${safePathSegment(userId)}/studio/${safePathSegment(submissionId)}/${folder}/${safeFileName(fileName)}`;
}

function canSaveSilverState(
  accountState: CurrentSparkleFinderAccountState,
): accountState is CurrentSparkleFinderAccountState & { status: "authenticated" } {
  return accountState.status === "authenticated" && accountState.membership?.hasSilverAccess === true;
}

function safeFileName(fileName: string): string {
  const cleaned = fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/\.+/g, ".")
    .replace(/^[._-]+|[._-]+$/g, "");

  return cleaned || "studio-photo";
}

function safePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-");
}

function cleanText(value: string | undefined, maxLength: number): string {
  return String(value ?? "")
    .trim()
    .slice(0, maxLength);
}
