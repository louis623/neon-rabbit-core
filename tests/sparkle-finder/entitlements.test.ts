import { describe, expect, it } from "vitest";
import {
  getSparkleFinderAccountEntitlements,
  canUseSilverCollectionActions,
  canUseNicNacFindRequests,
  canUseSilverProfileActions,
  getSparkleFinderEntitlements,
} from "../../lib/sparkle-finder/entitlements";
import { getLocalDevAuthState } from "../../lib/sparkle-finder/auth";
import type { CustomerAccount } from "../../lib/sparkle-finder/types";

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
});
