import type { SparkleFinderAccountState } from "./auth";
import type { CurrentSparkleFinderAccountState } from "./account-service";
import type { CollectionItem, SilverProfile } from "./types";
import type { SparkleShowcaseItemStatus, SparkleShowcaseVisibility } from "./showcase-types";

export type CustomerStateDeniedReason = "silver_required" | "account_mismatch" | "save_failed";

export type SilverProfileUpdateInput = Partial<
  Pick<SilverProfile, "bio" | "photoUrl" | "tiktokHandle" | "visibility">
> & {
  displayName?: string;
};

export type SilverProfileUpdateResult =
  | {
      ok: true;
      profile: SilverProfile;
    }
  | {
      ok: false;
      reason: CustomerStateDeniedReason;
      profile: SilverProfile;
    };

export type CollectionItemUpsertInput = Pick<
  CollectionItem,
  "isHighlighted" | "jewelryItemId" | "note" | "state"
>;

export type ShowcasePieceUpdateInput = {
  isRarestReveal: boolean;
  jewelryItemId: string;
  note: string;
  revealStory: string;
  showcaseStatus: SparkleShowcaseItemStatus;
  visibility: SparkleShowcaseVisibility;
};

export type CollectionItemUpsertResult =
  | {
      ok: true;
      collectionItems: CollectionItem[];
    }
  | {
      ok: false;
      reason: CustomerStateDeniedReason;
      collectionItems: CollectionItem[];
    };

export type PersistedCustomerStateResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: CustomerStateDeniedReason;
    };

type SupabasePersistenceResult = PromiseLike<{ data: unknown; error: unknown }>;

type SupabasePersistenceFilterBuilder = PromiseLike<{ data: unknown; error: unknown }> & {
  eq: (column: string, value: string) => SupabasePersistenceFilterBuilder;
  maybeSingle?: () => SupabasePersistenceResult;
};

const profilePhotoMaxCharacters = 700_000;

export type SupabaseCustomerStateClient = {
  from: (table: string) => {
    select: (columns: string) => SupabasePersistenceFilterBuilder;
    update: (values: Record<string, unknown>) => SupabasePersistenceFilterBuilder;
    insert: (values: Record<string, unknown>) => SupabasePersistenceResult;
    upsert: (
      values: Record<string, unknown>,
      options: { onConflict: string },
    ) => SupabasePersistenceResult;
  };
};

export function updateSilverProfilePreview(
  accountState: SparkleFinderAccountState,
  profile: SilverProfile,
  input: SilverProfileUpdateInput,
): SilverProfileUpdateResult {
  if (!canSaveSilverState(accountState)) {
    return {
      ok: false,
      reason: "silver_required",
      profile,
    };
  }

  const { displayName: omittedDisplayName, ...profileInput } = input;
  void omittedDisplayName;

  return {
    ok: true,
    profile: {
      ...profile,
      ...profileInput,
      customerId: accountState.customer.id,
    },
  };
}

export async function persistSilverProfileForAccount(
  supabase: SupabaseCustomerStateClient,
  accountState: CurrentSparkleFinderAccountState,
  input: SilverProfileUpdateInput,
): Promise<PersistedCustomerStateResult> {
  if (!canSaveSilverState(accountState)) {
    return { ok: false, reason: "silver_required" };
  }

  const values: Record<string, string> = {
    display_name: cleanText(input.displayName, 80) || cleanText(accountState.customer.displayName, 80),
    tiktok_handle: cleanText(input.tiktokHandle, 80),
    bio: cleanText(input.bio, 500),
    profile_visibility: input.visibility === "sparkle_finder" ? "sparkle_finder" : "private",
  };

  if (input.photoUrl !== undefined) {
    values.photo_url = cleanText(input.photoUrl, profilePhotoMaxCharacters);
  }

  const existingProfile = await safeMaybeSingle(
    supabase.from("sparkle_finder_profiles").select("user_id").eq("user_id", accountState.customer.id),
  );

  if (existingProfile.error) {
    logProfileSaveFailure("select_existing_profile", existingProfile.error);
  }

  let result: { data: unknown; error: unknown };

  if (existingProfile.data) {
    result = await supabase.from("sparkle_finder_profiles").update(values).eq("user_id", accountState.customer.id);
  } else {
    const insertResult = await supabase.from("sparkle_finder_profiles").insert({
      user_id: accountState.customer.id,
      display_name: values.display_name,
      email: cleanText(accountState.customer.email, 254),
      state: cleanText(accountState.customer.state, 40),
      tiktok_handle: values.tiktok_handle,
      bio: values.bio,
      profile_visibility: values.profile_visibility,
    });

    result = insertResult.error
      ? insertResult
      : await supabase.from("sparkle_finder_profiles").update(values).eq("user_id", accountState.customer.id);
  }

  if (result.error) {
    logProfileSaveFailure(existingProfile.data ? "update_profile" : "insert_profile", result.error, {
      valueKeys: Object.keys(values),
    });
    return { ok: false, reason: "save_failed" };
  }

  const savedProfile = await safeMaybeSingle(
    supabase
      .from("sparkle_finder_profiles")
      .select(["user_id", ...Object.keys(values)].join(","))
      .eq("user_id", accountState.customer.id),
  );

  if (savedProfile.error) {
    logProfileSaveFailure("select_saved_profile", savedProfile.error);
    return { ok: false, reason: "save_failed" };
  }

  if (!matchesSavedProfile(savedProfile.data, accountState.customer.id, values)) {
    logProfileSaveFailure("verify_saved_profile", null, {
      expectedKeys: Object.keys(values),
      savedKeys: savedProfile.data && typeof savedProfile.data === "object" ? Object.keys(savedProfile.data) : [],
    });
    return { ok: false, reason: "save_failed" };
  }

  return { ok: true };
}

export async function persistCollectionItemForAccount(
  supabase: SupabaseCustomerStateClient,
  accountState: CurrentSparkleFinderAccountState,
  input: CollectionItemUpsertInput,
): Promise<PersistedCustomerStateResult> {
  if (!canSaveSilverState(accountState)) {
    return { ok: false, reason: "silver_required" };
  }

  const values = {
    user_id: accountState.customer.id,
    jewelry_item_id: input.jewelryItemId,
    state: input.state,
    note: cleanText(input.note, 500),
    is_highlighted: input.isHighlighted,
  };
  const result = await supabase.from("sparkle_finder_collection_items").upsert(values, {
    onConflict: "user_id,jewelry_item_id",
  });

  return result.error ? { ok: false, reason: "save_failed" } : { ok: true };
}

export async function persistShowcasePieceForAccount(
  supabase: SupabaseCustomerStateClient,
  accountState: CurrentSparkleFinderAccountState,
  input: ShowcasePieceUpdateInput,
): Promise<PersistedCustomerStateResult> {
  if (!canSaveSilverState(accountState)) {
    return { ok: false, reason: "silver_required" };
  }

  const values = {
    user_id: accountState.customer.id,
    jewelry_item_id: input.jewelryItemId,
    state: mapShowcaseStatusToLegacyCollectionState(input.showcaseStatus),
    note: cleanText(input.note, 500),
    is_highlighted: input.isRarestReveal,
    visibility: input.visibility,
    showcase_status: input.showcaseStatus,
    reveal_story: cleanText(input.revealStory, 700),
    is_rarest_reveal: input.isRarestReveal,
  };
  const result = await supabase.from("sparkle_finder_collection_items").upsert(values, {
    onConflict: "user_id,jewelry_item_id",
  });

  return result.error ? { ok: false, reason: "save_failed" } : { ok: true };
}

export function addJewelryItemToCustomerCollection(
  accountState: SparkleFinderAccountState,
  collectionItems: CollectionItem[],
  input: CollectionItemUpsertInput,
): CollectionItemUpsertResult {
  if (!canSaveSilverState(accountState)) {
    return {
      ok: false,
      reason: "silver_required",
      collectionItems,
    };
  }

  const existingItem = collectionItems.find((item) => item.jewelryItemId === input.jewelryItemId);
  const updatedItem: CollectionItem = {
    id: existingItem?.id ?? createLocalCollectionItemId(input.jewelryItemId),
    customerId: accountState.customer.id,
    jewelryItemId: input.jewelryItemId,
    state: input.state,
    note: input.note,
    isHighlighted: input.isHighlighted,
  };

  return {
    ok: true,
    collectionItems: existingItem
      ? collectionItems.map((item) => (item.id === existingItem.id ? updatedItem : item))
      : [...collectionItems, updatedItem],
  };
}

function canSaveSilverState(
  accountState: SparkleFinderAccountState | CurrentSparkleFinderAccountState,
): accountState is (SparkleFinderAccountState | CurrentSparkleFinderAccountState) & { status: "authenticated" } {
  if (accountState.status !== "authenticated") {
    return false;
  }

  const membership =
    "membership" in accountState
      ? (accountState.membership as CurrentSparkleFinderAccountState["membership"] | undefined)
      : undefined;

  return membership ? membership.hasSilverAccess : accountState.tier === "silver";
}

function createLocalCollectionItemId(jewelryItemId: string): string {
  return `collection-local-${jewelryItemId}`;
}

function mapShowcaseStatusToLegacyCollectionState(status: SparkleShowcaseItemStatus): CollectionItem["state"] {
  if (status === "private_note_only") {
    return "private_note_only";
  }

  return status === "owned" ? "owned" : "wishlist";
}

async function safeMaybeSingle(builder: SupabasePersistenceFilterBuilder): Promise<{ data: unknown; error: unknown }> {
  if (!builder.maybeSingle) {
    return { data: null, error: null };
  }

  try {
    return await builder.maybeSingle();
  } catch (error) {
    return { data: null, error };
  }
}

function cleanText(value: string | undefined, maxLength: number): string {
  return String(value ?? "")
    .trim()
    .slice(0, maxLength);
}

function matchesSavedProfile(data: unknown, userId: string, values: Record<string, string>): boolean {
  if (!data || typeof data !== "object") {
    return false;
  }

  const row = data as Record<string, unknown>;

  return row.user_id === userId && Object.entries(values).every(([key, value]) => row[key] === value);
}

function logProfileSaveFailure(stage: string, error: unknown, context: Record<string, unknown> = {}) {
  console.error(
    "[sparkle-finder] silver profile save failed",
    JSON.stringify({
      stage,
      error: summarizePersistenceError(error),
      ...context,
    }),
  );
}

function summarizePersistenceError(error: unknown): Record<string, unknown> | null {
  if (!error || typeof error !== "object") {
    return error ? { message: String(error) } : null;
  }

  const record = error as Record<string, unknown>;

  return {
    code: record.code,
    details: record.details,
    hint: record.hint,
    message: record.message,
    name: record.name,
  };
}
