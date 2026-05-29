import { describe, expect, it } from "vitest";
import {
  canUseSilverCollectionActions,
  canUseNicNacFindRequests,
  canUseSilverProfileActions,
  getSparkleFinderEntitlements,
} from "../../lib/sparkle-finder/entitlements";
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
