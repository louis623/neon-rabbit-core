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

  const values = {
    display_name: cleanText(input.displayName, 80) || cleanText(accountState.customer.displayName, 80),
    tiktok_handle: cleanText(input.tiktokHandle, 80),
    bio: cleanText(input.bio, 500),
    photo_url: cleanText(input.photoUrl, profilePhotoMaxCharacters),
    profile_visibility: input.visibility === "sparkle_finder" ? "sparkle_finder" : "private",
  };

  const existingProfile = await safeMaybeSingle(
    supabase.from("sparkle_finder_profiles").select("user_id").eq("user_id", accountState.customer.id),
  );

  const result = existingProfile.data
    ? await supabase.from("sparkle_finder_profiles").update(values).eq("user_id", accountState.customer.id)
    : await supabase.from("sparkle_finder_profiles").insert({
        user_id: accountState.customer.id,
        email: cleanText(accountState.customer.email, 254),
        state: cleanText(accountState.customer.state, 40),
        ...values,
      });

  if (result.error) {
    return { ok: false, reason: "save_failed" };
  }

  const savedProfile = await safeMaybeSingle(
    supabase
      .from("sparkle_finder_profiles")
      .select("user_id,display_name,tiktok_handle,bio,photo_url,profile_visibility")
      .eq("user_id", accountState.customer.id),
  );

  if (savedProfile.error || !matchesSavedProfile(savedProfile.data, accountState.customer.id, values)) {
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

  return (
    row.user_id === userId &&
    row.display_name === values.display_name &&
    row.tiktok_handle === values.tiktok_handle &&
    row.bio === values.bio &&
    row.photo_url === values.photo_url &&
    row.profile_visibility === values.profile_visibility
  );
}
