import type { CustomerAccount, CustomerTier } from "./types";

export type SparkleFinderEntitlements = {
  tier: CustomerTier;
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

export function canUseSilverProfileActions(customer: CustomerAccount): boolean {
  return getSparkleFinderEntitlements(customer).canUseSilverProfileActions;
}

export function canUseSilverCollectionActions(customer: CustomerAccount): boolean {
  return getSparkleFinderEntitlements(customer).canUseSilverCollectionActions;
}

export function canUseNicNacFindRequests(customer: CustomerAccount): boolean {
  return getSparkleFinderEntitlements(customer).canUseNicNacFindRequests;
}
