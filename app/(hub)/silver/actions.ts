"use server";

import { Buffer } from "node:buffer";
import { revalidatePath } from "next/cache";
import { getCurrentSparkleFinderAccount } from "@/lib/sparkle-finder/account-service";
import {
  persistCollectionItemForAccount,
  persistShowcasePieceForAccount,
  persistSilverProfileForAccount,
  type SupabaseCustomerStateClient,
} from "@/lib/sparkle-finder/customer-state";
import {
  persistShowcaseStudioSubmissionForAccount,
  type ShowcaseStudioSubmissionFailureReason,
  type SupabaseShowcaseStudioClient,
} from "@/lib/sparkle-finder/showcase-studio-state";
import { submitShowcaseStudioIntake } from "@/lib/sparkle-finder/showcase-studio";
import { getCatalogJewelryItemById } from "@/lib/sparkle-finder/catalog-service";
import { createClient } from "@/lib/supabase/server";
import type { CollectionItem } from "@/lib/sparkle-finder/types";
import type { SparkleShowcaseItemStatus, SparkleShowcaseVisibility } from "@/lib/sparkle-finder/showcase-types";

export type SilverSaveActionState = {
  status: "idle" | "saved" | "denied" | "error";
  message: string;
};

type SparkleFinderSilverServerClient = SupabaseCustomerStateClient & SupabaseShowcaseStudioClient & {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null }; error: unknown }>;
  };
};

export async function saveSilverProfileAction(
  _previousState: SilverSaveActionState,
  formData: FormData,
): Promise<SilverSaveActionState> {
  const verified = await getVerifiedSilverClient();

  if (!verified.ok) {
    return verified.state;
  }

  const result = await persistSilverProfileForAccount(verified.client, verified.accountState, {
    bio: String(formData.get("bio") ?? ""),
    photoUrl: String(formData.get("photoUrl") ?? ""),
    tiktokHandle: String(formData.get("tiktokHandle") ?? ""),
    visibility: formData.get("visibility") === "sparkle_finder" ? "sparkle_finder" : "private",
  });

  if (!result.ok) {
    return {
      status: result.reason === "silver_required" ? "denied" : "error",
      message: result.reason === "silver_required" ? "Silver access is required to save profile updates." : "Profile could not be saved.",
    };
  }

  revalidatePath("/silver");

  return {
    status: "saved",
    message: "Profile saved.",
  };
}

export async function saveSilverCollectionItemAction(
  _previousState: SilverSaveActionState,
  formData: FormData,
): Promise<SilverSaveActionState> {
  const verified = await getVerifiedSilverClient();

  if (!verified.ok) {
    return verified.state;
  }

  const state = parseCollectionState(formData.get("state"));
  const jewelryItemId = String(formData.get("jewelryItemId") ?? "").trim();

  if (!jewelryItemId) {
    return {
      status: "error",
      message: "Collection item could not be saved.",
    };
  }

  if (!(await getCatalogJewelryItemById(jewelryItemId, { useFixtureFallback: false }))) {
    return {
      status: "denied",
      message: "Collection item is not available in the Sparkle Finder library.",
    };
  }

  const result = await persistCollectionItemForAccount(verified.client, verified.accountState, {
    jewelryItemId,
    state,
    note: String(formData.get("note") ?? ""),
    isHighlighted: formData.get("isHighlighted") === "yes",
  });

  if (!result.ok) {
    return {
      status: result.reason === "silver_required" ? "denied" : "error",
      message:
        result.reason === "silver_required" ? "Silver access is required to save collection updates." : "Collection could not be saved.",
    };
  }

  revalidatePath("/silver");

  return {
    status: "saved",
    message: state === "wishlist" ? "Watchlist saved." : "Collection saved.",
  };
}

export async function saveShowcasePieceAction(
  _previousState: SilverSaveActionState,
  formData: FormData,
): Promise<SilverSaveActionState> {
  const verified = await getVerifiedSilverClient();

  if (!verified.ok) {
    return verified.state;
  }

  const jewelryItemId = String(formData.get("jewelryItemId") ?? "").trim();

  if (!jewelryItemId) {
    return {
      status: "error",
      message: "Sparkle Showcase piece could not be saved.",
    };
  }

  if (!(await getCatalogJewelryItemById(jewelryItemId, { useFixtureFallback: false }))) {
    return {
      status: "denied",
      message: "Sparkle Showcase piece is not available in the Sparkle Finder library.",
    };
  }

  const result = await persistShowcasePieceForAccount(verified.client, verified.accountState, {
    jewelryItemId,
    note: String(formData.get("note") ?? ""),
    showcaseStatus: parseShowcaseStatus(formData.get("showcaseStatus")),
    visibility: parseShowcaseVisibility(formData.get("visibility")),
    revealStory: String(formData.get("revealStory") ?? ""),
    isRarestReveal: formData.get("isRarestReveal") === "yes",
  });

  if (!result.ok) {
    return {
      status: result.reason === "silver_required" ? "denied" : "error",
      message:
        result.reason === "silver_required" ? "Silver access is required to save Sparkle Showcase updates." : "Sparkle Showcase piece could not be saved.",
    };
  }

  revalidatePath("/silver");

  return {
    status: "saved",
    message: "Sparkle Showcase piece saved.",
  };
}

export async function submitShowcaseStudioRequestAction(
  _previousState: SilverSaveActionState,
  formData: FormData,
): Promise<SilverSaveActionState> {
  const verified = await getVerifiedSilverClient();

  if (!verified.ok) {
    return verified.state;
  }

  const originalLabelPhoto = readUploadFile(formData.get("originalLabelPhoto"));
  const jewelryFrontPhoto = readUploadFile(formData.get("jewelryFrontPhoto"));
  const itemNumber = String(formData.get("itemNumber") ?? "");
  const customerNote = String(formData.get("customerNote") ?? "");

  const result = await persistShowcaseStudioSubmissionForAccount(verified.client, verified.accountState, {
    customerNote,
    itemNumber,
    jewelryFrontPhoto,
    originalLabelPhoto,
  });

  if (!result.ok) {
    return {
      status: result.reason === "silver_required" ? "denied" : "error",
      message: getShowcaseStudioFailureMessage(result.reason),
    };
  }

  const suiteIntakeResult = await submitShowcaseStudioIntake({
    finderSubmissionId: result.submissionId,
    originalLabelImageDataUrl: await fileToDataUrl(originalLabelPhoto),
    jewelryFrontImageDataUrl: await fileToDataUrl(jewelryFrontPhoto),
    labelDetails: {
      itemNumber,
    },
    customerNote,
  });

  revalidatePath("/silver");

  return {
    status: "saved",
    message: getShowcaseStudioBridgeMessage(suiteIntakeResult.message),
  };
}

async function getVerifiedSilverClient(): Promise<
  | {
      ok: true;
      client: SparkleFinderSilverServerClient;
      accountState: Awaited<ReturnType<typeof getCurrentSparkleFinderAccount>>;
    }
  | {
      ok: false;
      state: SilverSaveActionState;
    }
> {
  let client: SparkleFinderSilverServerClient;

  try {
    client = (await createClient()) as unknown as SparkleFinderSilverServerClient;
  } catch {
    return {
      ok: false,
      state: {
        status: "error",
        message: "Account saves are unavailable right now.",
      },
    };
  }

  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    return {
      ok: false,
      state: {
        status: "denied",
        message: "Sign in to save Silver updates.",
      },
    };
  }

  const accountState = await getCurrentSparkleFinderAccount({
    isSupabaseConfigured: () => true,
    createSupabaseClient: async () => client,
  });

  if (accountState.status !== "authenticated" || accountState.customer.id !== data.user.id) {
    return {
      ok: false,
      state: {
        status: "denied",
        message: "Sign in to save Silver updates.",
      },
    };
  }

  return {
    ok: true,
    client,
    accountState,
  };
}

function parseCollectionState(value: FormDataEntryValue | null): CollectionItem["state"] {
  if (value === "wishlist" || value === "private_note_only") {
    return value;
  }

  return "owned";
}

function parseShowcaseStatus(value: FormDataEntryValue | null): SparkleShowcaseItemStatus {
  if (value === "wishlist" || value === "iso" || value === "private_note_only") {
    return value;
  }

  return "owned";
}

function parseShowcaseVisibility(value: FormDataEntryValue | null): SparkleShowcaseVisibility {
  return value === "public" ? "public" : "private";
}

function readUploadFile(value: FormDataEntryValue | null): File {
  return value instanceof File ? value : new File([], "missing.jpg", { type: "image/jpeg" });
}

async function fileToDataUrl(file: File): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer());

  return `data:${file.type || "application/octet-stream"};base64,${bytes.toString("base64")}`;
}

function getShowcaseStudioBridgeMessage(message: string): string {
  if (!message || message === "Showcase Studio publishing is not connected yet.") {
    return "Showcase Studio request saved for Nic-Nac review.";
  }

  return `Showcase Studio request saved. ${message}`;
}

function getShowcaseStudioFailureMessage(reason: ShowcaseStudioSubmissionFailureReason): string {
  if (reason === "silver_required") {
    return "Silver access is required to submit Showcase Studio requests.";
  }

  if (reason === "original_label_required") {
    return "Original Bomb Party label photo is required.";
  }

  if (reason === "jewelry_photo_required") {
    return "Light-box jewelry photo is required.";
  }

  if (reason === "invalid_file_type") {
    return "Upload image files for the label and jewelry photo.";
  }

  if (reason === "file_too_large") {
    return "Studio images must be 10 MB or smaller.";
  }

  return "Showcase Studio request could not be saved.";
}
