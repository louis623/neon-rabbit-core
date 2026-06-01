import { describe, expect, it } from "vitest";
import {
  getSparkleFinderAccountEntitlements,
  canUseSilverCollectionActions,
  canUseNicNacFindRequests,
  canUseSilverProfileActions,
  getSparkleFinderEntitlements,
} from "../../lib/sparkle-finder/entitlements";
import { getLocalDevAuthState } from "../../lib/sparkle-finder/auth";
import {
  addJewelryItemToCustomerCollection,
  persistCollectionItemForAccount,
  persistSilverProfileForAccount,
  updateSilverProfilePreview,
} from "../../lib/sparkle-finder/customer-state";
import type { CurrentSparkleFinderAccountState } from "../../lib/sparkle-finder/account-service";
import type { SparkleFinderAccessState } from "../../lib/sparkle-finder/account-types";
import type { CollectionItem, CustomerAccount, SilverProfile } from "../../lib/sparkle-finder/types";

const freeCustomer: CustomerAccount = {
  id: "customer-free-test",
  displayName: "Free Collector",
  email: "free@example.test",
  state: "NC",
  tier: "free",
};

const silverCustomer: CustomerAccount = {
  id: "customer-silver-test",
  displayName: "Silver Collector",
  email: "silver@example.test",
  state: "TX",
  tier: "silver",
};

describe("Sparkle Finder entitlements", () => {
  it("represents anonymous local-dev visitors without customer entitlements", () => {
    const accountState = getLocalDevAuthState("anonymous");
    const entitlements = getSparkleFinderAccountEntitlements(accountState);

    expect(accountState).toMatchObject({
      status: "anonymous",
      tier: "anonymous",
      customer: null,
    });
    expect(entitlements).toMatchObject({
      tier: "anonymous",
      canBrowseLibrary: false,
      canUseSilverProfileActions: false,
      canUseSilverCollectionActions: false,
      canUseNicNacFindRequests: false,
    });
  });

  it("represents Free local-dev customers with browse access only", () => {
    const accountState = getLocalDevAuthState("free");
    const entitlements = getSparkleFinderAccountEntitlements(accountState);

    expect(accountState).toMatchObject({
      status: "authenticated",
      tier: "free",
      customer: {
        id: "customer-free-marlena",
      },
    });
    expect(entitlements).toMatchObject({
      tier: "free",
      canBrowseLibrary: true,
      canUseSilverProfileActions: false,
      canUseSilverCollectionActions: false,
      canUseNicNacFindRequests: false,
    });
  });

  it("uses anonymous as the default local-dev account state", () => {
    const accountState = getLocalDevAuthState();
    const entitlements = getSparkleFinderAccountEntitlements(accountState);

    expect(accountState).toMatchObject({
      status: "anonymous",
      tier: "anonymous",
      customer: null,
    });
    expect(entitlements).toMatchObject({
      tier: "anonymous",
      canBrowseLibrary: false,
      canUseSilverProfileActions: false,
      canUseSilverCollectionActions: false,
      canUseNicNacFindRequests: false,
    });
  });

  it("represents Silver local-dev customers with full preview access", () => {
    const accountState = getLocalDevAuthState("silver");
    const entitlements = getSparkleFinderAccountEntitlements(accountState);

    expect(accountState).toMatchObject({
      status: "authenticated",
      tier: "silver",
      customer: {
        id: "customer-silver-sparkle-mama",
      },
    });
    expect(entitlements).toMatchObject({
      tier: "silver",
      canBrowseLibrary: true,
      canUseSilverProfileActions: true,
      canUseSilverCollectionActions: true,
      canUseNicNacFindRequests: true,
    });
  });

  it("keeps Silver-only profile and collection actions unavailable for Free users", () => {
    const entitlements = getSparkleFinderEntitlements(freeCustomer);

    expect(entitlements).toMatchObject({
      tier: "free",
      canBrowseLibrary: true,
      canUseSilverProfileActions: false,
      canUseSilverCollectionActions: false,
      canUseNicNacFindRequests: false,
    });
    expect(canUseSilverProfileActions(freeCustomer)).toBe(false);
    expect(canUseSilverCollectionActions(freeCustomer)).toBe(false);
    expect(canUseNicNacFindRequests(freeCustomer)).toBe(false);
  });

  it("allows Silver users to use profile, collection, and Nic-Nac find actions", () => {
    const entitlements = getSparkleFinderEntitlements(silverCustomer);

    expect(entitlements).toMatchObject({
      tier: "silver",
      canBrowseLibrary: true,
      canUseSilverProfileActions: true,
      canUseSilverCollectionActions: true,
      canUseNicNacFindRequests: true,
    });
    expect(canUseSilverProfileActions(silverCustomer)).toBe(true);
    expect(canUseSilverCollectionActions(silverCustomer)).toBe(true);
    expect(canUseNicNacFindRequests(silverCustomer)).toBe(true);
  });

  it("denies Free local-dev profile and collection state saves", () => {
    const freeAccount = getLocalDevAuthState("free");
    const profile: SilverProfile = {
      customerId: "customer-free-marlena",
      photoUrl: "",
      tiktokHandle: "",
      bio: "",
      visibility: "private",
    };
    const collection: CollectionItem[] = [];

    const profileResult = updateSilverProfilePreview(freeAccount, profile, {
      bio: "Collects soft pink rings.",
      tiktokHandle: "@free_preview",
      visibility: "sparkle_finder",
    });
    const collectionResult = addJewelryItemToCustomerCollection(freeAccount, collection, {
      jewelryItemId: "jewel-rainbow-crown-ring",
      state: "owned",
      note: "Local preview note.",
      isHighlighted: true,
    });

    expect(profileResult).toMatchObject({
      ok: false,
      reason: "silver_required",
      profile,
    });
    expect(collectionResult).toMatchObject({
      ok: false,
      reason: "silver_required",
      collectionItems: collection,
    });
  });

  it("allows Silver local-dev profile and collection state saves", () => {
    const silverAccount = getLocalDevAuthState("silver");
    const profile: SilverProfile = {
      customerId: "customer-silver-sparkle-mama",
      photoUrl: "/fixtures/customers/sparkle-mama.jpg",
      tiktokHandle: "@sparklemama_tx",
      bio: "Collects warm golds.",
      visibility: "private",
    };
    const collection: CollectionItem[] = [
      {
        id: "collection-owned-rainbow",
        customerId: "customer-silver-sparkle-mama",
        jewelryItemId: "jewel-rainbow-crown-ring",
        state: "owned",
        note: "Favorite centerpiece ring.",
        isHighlighted: false,
      },
    ];

    const profileResult = updateSilverProfilePreview(silverAccount, profile, {
      bio: "Collects warm golds, hearts, and statement rings.",
      tiktokHandle: "@sparklemama_tx",
      visibility: "sparkle_finder",
    });
    const ownedResult = addJewelryItemToCustomerCollection(silverAccount, collection, {
      jewelryItemId: "jewel-rainbow-crown-ring",
      state: "owned",
      note: "Favorite centerpiece ring.",
      isHighlighted: true,
    });
    const wishlistResult = addJewelryItemToCustomerCollection(silverAccount, ownedResult.collectionItems, {
      jewelryItemId: "jewel-lilac-orbit-ring",
      state: "wishlist",
      note: "Watch for the softer purple stone.",
      isHighlighted: false,
    });
    const privateNoteResult = addJewelryItemToCustomerCollection(silverAccount, wishlistResult.collectionItems, {
      jewelryItemId: "jewel-golden-heart-necklace",
      state: "private_note_only",
      note: "Looks good with layered chains.",
      isHighlighted: false,
    });

    expect(profileResult).toMatchObject({
      ok: true,
      profile: {
        customerId: "customer-silver-sparkle-mama",
        bio: "Collects warm golds, hearts, and statement rings.",
        tiktokHandle: "@sparklemama_tx",
        visibility: "sparkle_finder",
      },
    });
    expect(ownedResult.collectionItems).toContainEqual(
      expect.objectContaining({
        id: "collection-owned-rainbow",
        state: "owned",
        isHighlighted: true,
      }),
    );
    expect(wishlistResult.collectionItems).toContainEqual(
      expect.objectContaining({
        jewelryItemId: "jewel-lilac-orbit-ring",
        state: "wishlist",
        isHighlighted: false,
      }),
    );
    expect(privateNoteResult.collectionItems).toContainEqual(
      expect.objectContaining({
        jewelryItemId: "jewel-golden-heart-necklace",
        state: "private_note_only",
        note: "Looks good with layered chains.",
      }),
    );
  });

  it.each([
    ["silver_trial", "trial Silver"],
    ["silver_paid", "paid Silver"],
    ["silver_rep_included", "rep-included Silver"],
  ] satisfies Array<[SparkleFinderAccessState, string]>)(
    "allows %s accounts to persist Silver profile and collection state",
    async (accessState, _label) => {
      const accountState = currentAccountState(accessState);
      const client = createFakePersistenceClient({
        profile: { user_id: accountState.customer.id },
        collectionItem: null,
      });

      const profileResult = await persistSilverProfileForAccount(client, accountState, {
        bio: "Keeps a tidy signed-in collection.",
        tiktokHandle: "@casey_silver",
        visibility: "sparkle_finder",
      });
      const ownedResult = await persistCollectionItemForAccount(client, accountState, {
        jewelryItemId: "jewel-rainbow-crown-ring",
        state: "owned",
        note: "Confirmed in my collection.",
        isHighlighted: true,
      });
      const wishlistResult = await persistCollectionItemForAccount(client, accountState, {
        jewelryItemId: "jewel-lilac-orbit-ring",
        state: "wishlist",
        note: "Watching for this one.",
        isHighlighted: false,
      });
      const privateNoteResult = await persistCollectionItemForAccount(client, accountState, {
        jewelryItemId: "jewel-golden-heart-necklace",
        state: "private_note_only",
        note: "Pairs with layered chains.",
        isHighlighted: false,
      });

      expect(profileResult).toEqual({ ok: true });
      expect(ownedResult).toEqual({ ok: true });
      expect(wishlistResult).toEqual({ ok: true });
      expect(privateNoteResult).toEqual({ ok: true });
      expect(client.operations).toContainEqual({
        table: "sparkle_finder_profiles",
        type: "update",
        values: {
          tiktok_handle: "@casey_silver",
          bio: "Keeps a tidy signed-in collection.",
          profile_visibility: "sparkle_finder",
        },
        filters: [
          ["user_id", "user-123"],
        ],
      });
      expect(client.operations).toContainEqual({
        table: "sparkle_finder_collection_items",
        type: "insert",
        values: {
          user_id: "user-123",
          jewelry_item_id: "jewel-rainbow-crown-ring",
          state: "owned",
          note: "Confirmed in my collection.",
          is_highlighted: true,
        },
      });
      expect(client.operations).toContainEqual({
        table: "sparkle_finder_collection_items",
        type: "insert",
        values: {
          user_id: "user-123",
          jewelry_item_id: "jewel-lilac-orbit-ring",
          state: "wishlist",
          note: "Watching for this one.",
          is_highlighted: false,
        },
      });
      expect(client.operations).toContainEqual({
        table: "sparkle_finder_collection_items",
        type: "insert",
        values: {
          user_id: "user-123",
          jewelry_item_id: "jewel-golden-heart-necklace",
          state: "private_note_only",
          note: "Pairs with layered chains.",
          is_highlighted: false,
        },
      });
    },
  );

  it("updates an existing persisted collection item by authenticated user and jewelry item", async () => {
    const accountState = currentAccountState("silver_paid");
    const client = createFakePersistenceClient({
      collectionItem: { id: "collection-existing", user_id: "user-123" },
    });

    const result = await persistCollectionItemForAccount(client, accountState, {
      jewelryItemId: "jewel-rainbow-crown-ring",
      state: "owned",
      note: "Now highlighted.",
      isHighlighted: true,
    });

    expect(result).toEqual({ ok: true });
    expect(client.operations).toContainEqual({
      table: "sparkle_finder_collection_items",
      type: "update",
      values: {
        state: "owned",
        note: "Now highlighted.",
        is_highlighted: true,
      },
      filters: [
        ["user_id", "user-123"],
        ["id", "collection-existing"],
      ],
    });
  });

  it("inserts a missing persisted profile with required account-owned basics", async () => {
    const accountState = currentAccountState("silver_paid");
    const client = createFakePersistenceClient({ profile: null });

    const result = await persistSilverProfileForAccount(client, accountState, {
      bio: "Fresh profile row.",
      tiktokHandle: "@casey_new",
      visibility: "private",
    });

    expect(result).toEqual({ ok: true });
    expect(client.operations).toContainEqual({
      table: "sparkle_finder_profiles",
      type: "insert",
      values: {
        user_id: "user-123",
        display_name: "Casey Collector",
        email: "casey@example.test",
        state: "PA",
        tiktok_handle: "@casey_new",
        bio: "Fresh profile row.",
        profile_visibility: "private",
      },
    });
  });

  it("denies persisted Silver profile and collection writes for Free accounts", async () => {
    const accountState = currentAccountState("free");
    const client = createFakePersistenceClient({});

    const profileResult = await persistSilverProfileForAccount(client, accountState, {
      bio: "Should not save.",
      tiktokHandle: "@free_user",
      visibility: "sparkle_finder",
    });
    const collectionResult = await persistCollectionItemForAccount(client, accountState, {
      jewelryItemId: "jewel-rainbow-crown-ring",
      state: "owned",
      note: "Should not save.",
      isHighlighted: true,
    });

    expect(profileResult).toEqual({ ok: false, reason: "silver_required" });
    expect(collectionResult).toEqual({ ok: false, reason: "silver_required" });
    expect(client.operations).toEqual([]);
  });
});

function currentAccountState(accessState: SparkleFinderAccessState): CurrentSparkleFinderAccountState & { status: "authenticated" } {
  const hasSilverAccess = accessState !== "free";
  const tier = hasSilverAccess ? "silver" : "free";

  return {
    status: "authenticated",
    tier,
    displayName: "Casey Collector",
    email: "casey@example.test",
    customer: {
      id: "user-123",
      displayName: "Casey Collector",
      email: "casey@example.test",
      state: "PA",
      tier,
    },
    membership: {
      accountId: "user-123",
      personId: "user-123",
      accessState,
      silverSource: accessState === "silver_rep_included" ? "sparkle_suite_rep" : accessState === "silver_paid" ? "stripe" : accessState === "silver_trial" ? "trial" : "none",
      trialStartedAt: accessState === "silver_trial" ? "2026-05-01T12:00:00.000Z" : null,
      trialEndsAt: accessState === "silver_trial" ? "2026-06-15T12:00:00.000Z" : null,
      silverStartedAt: hasSilverAccess ? "2026-05-01T12:00:00.000Z" : null,
      silverEndsAt: null,
      effectiveState: accessState,
      hasSilverAccess,
      isTrialActive: accessState === "silver_trial",
      isTrialExpired: false,
    },
    communicationConsent: {
      accountEmailRequired: true,
      accountSmsAllowed: false,
      accountSmsConsentedAt: null,
      promotionalEmailOptIn: false,
      promotionalSmsOptIn: false,
      promotionalEmailConsentedAt: null,
      promotionalSmsConsentedAt: null,
      privacyAcknowledgedAt: "2026-05-01T12:00:00.000Z",
    },
  };
}

function createFakePersistenceClient({
  profile = null,
  collectionItem = null,
}: {
  profile?: { user_id: string } | null;
  collectionItem?: { id: string; user_id: string } | null;
}) {
  const operations: Array<{
    table: string;
    type: "insert" | "update";
    values: Record<string, unknown>;
    filters?: Array<[string, string]>;
  }> = [];

  return {
    operations,
    from(table: string) {
      const selectRows: Record<string, unknown> = {
        sparkle_finder_profiles: profile,
        sparkle_finder_collection_items: collectionItem,
      };

      return {
        select: () => createFilterBuilder(async () => ({ data: selectRows[table] ?? null, error: null })),
        update: (values: Record<string, unknown>) =>
          createFilterBuilder(async (filters) => {
            operations.push({ table, type: "update", values, filters });
            return { data: null, error: null };
          }),
        insert: async (values: Record<string, unknown>) => {
          operations.push({ table, type: "insert", values });
          return { data: null, error: null };
        },
      };
    },
  };
}

function createFilterBuilder(
  execute: (filters: Array<[string, string]>) => Promise<{ data: unknown; error: unknown }>,
) {
  const filters: Array<[string, string]> = [];
  const builder = {
    eq(column: string, value: string) {
      filters.push([column, value]);
      return builder;
    },
    maybeSingle() {
      return execute(filters);
    },
    then<TResult1 = { data: unknown; error: unknown }, TResult2 = never>(
      onfulfilled?: ((value: { data: unknown; error: unknown }) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ) {
      return execute(filters).then(onfulfilled, onrejected);
    },
  };

  return builder;
}
