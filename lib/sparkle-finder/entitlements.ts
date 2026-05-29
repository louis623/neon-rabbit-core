import type { CustomerAccount, CustomerTier } from "./types";
import type { SparkleFinderAccountState } from "./auth";

export type SparkleFinderEntitlements = {
  tier: CustomerTier | "anonymous";
  canBrowseLibrary: boolean;
  canUseSilverProfileActions: boolean;
  canUseSilverCollectionActions: boolean;
  canUseNicNacFindRequests: boolean;
};

export function getSparkleFinderEntitlements(customer: CustomerAccount): SparkleFinderEntitlements {
  const hasSilverAccess = customer.tier === "silver";

  return {
    tier: customer.tier,
    canBrowseLibrary: true,
    canUseSilverProfileActions: hasSilverAccess,
    canUseSilverCollectionActions: hasSilverAccess,
    canUseNicNacFindRequests: hasSilverAccess,
  };
}

export function getSparkleFinderAccountEntitlements(
  accountState: SparkleFinderAccountState,
): SparkleFinderEntitlements {
  if (accountState.status === "anonymous") {
    return {
      tier: "anonymous",
      canBrowseLibrary: false,
      canUseSilverProfileActions: false,
      canUseSilverCollectionActions: false,
      canUseNicNacFindRequests: false,
    };
  }

  return getSparkleFinderEntitlements(accountState.customer);
}

export function canUseSilverProfileActions(customer: CustomerAccount): boolean {
  return getSparkleFinderEntitlements(customer).canUseSilverProfileActions;
}

export function canUseSilverCollectionActions(customer: CustomerAccount): boolean {
  return getSparkleFinderEntitlements(customer).canUseSilverCollectionActions;
}

export function canUseNicNacFindRequests(customer: CustomerAccount): boolean {
  return getSparkleFinderEntitlements(customer).canUseNicNacFindRequests;
}
