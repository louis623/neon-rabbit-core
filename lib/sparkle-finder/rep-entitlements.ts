import { sparkleFinderRepEntitlements } from "@/lib/fixtures/sparkle-finder-fixtures";
import type { SparkleSuiteRepIdentity } from "./types";

export type SparkleSuiteRepSubscriptionStatus = "active" | "inactive";

export type SparkleSuiteRepEntitlement = {
  sparkleSuiteRepId: string;
  businessName: string;
  subscriptionStatus: SparkleSuiteRepSubscriptionStatus;
  publicDiscoveryEnabled: boolean;
};

export function getSparkleSuiteRepEntitlement(
  sparkleSuiteRepId: string | null | undefined,
): SparkleSuiteRepEntitlement | null {
  if (!sparkleSuiteRepId) {
    return null;
  }

  return sparkleFinderRepEntitlements.find((rep) => rep.sparkleSuiteRepId === sparkleSuiteRepId) ?? null;
}

export function hasRepIncludedSilver(repEntitlement: SparkleSuiteRepEntitlement | null | undefined): boolean {
  return repEntitlement?.subscriptionStatus === "active" && repEntitlement.publicDiscoveryEnabled;
}

export function getRepIdentity(
  repEntitlement: SparkleSuiteRepEntitlement | null | undefined,
): SparkleSuiteRepIdentity | undefined {
  if (!repEntitlement?.publicDiscoveryEnabled) {
    return undefined;
  }

  return {
    sparkleSuiteRepId: repEntitlement.sparkleSuiteRepId,
    businessName: repEntitlement.businessName,
    publicDiscoveryEnabled: repEntitlement.publicDiscoveryEnabled,
  };
}
