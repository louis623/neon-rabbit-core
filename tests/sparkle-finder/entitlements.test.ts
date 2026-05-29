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
  updateSilverProfilePreview,
} from "../../lib/sparkle-finder/customer-state";
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
});
