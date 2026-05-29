import type { SparkleFinderAccountState } from "./auth";
import type { CollectionItem, SilverProfile } from "./types";

export type CustomerStateDeniedReason = "silver_required";

export type SilverProfileUpdateInput = Partial<
  Pick<SilverProfile, "bio" | "photoUrl" | "tiktokHandle" | "visibility">
>;

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

  return {
    ok: true,
    profile: {
      ...profile,
      ...input,
      customerId: accountState.customer.id,
    },
  };
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
  accountState: SparkleFinderAccountState,
): accountState is SparkleFinderAccountState & { status: "authenticated" } {
  return accountState.status === "authenticated" && accountState.tier === "silver";
}

function createLocalCollectionItemId(jewelryItemId: string): string {
  return `collection-local-${jewelryItemId}`;
}
