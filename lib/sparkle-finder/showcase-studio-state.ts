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

const intakeBucket = "sparkle-finder-private";
const maxStudioImageBytes = 10 * 1024 * 1024;

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
