import { getCustomerById } from "./service";
import type { CustomerAccount, CustomerTier } from "./types";

export type SparkleFinderAuthMode = "anonymous" | "free" | "silver";

export type AnonymousSparkleFinderAccountState = {
  status: "anonymous";
  tier: "anonymous";
  displayName: "Guest";
  email: null;
  customer: null;
};

export type AuthenticatedSparkleFinderAccountState = {
  status: "authenticated";
  tier: CustomerTier;
  displayName: string;
  email: string;
  customer: CustomerAccount;
};

export type SparkleFinderAccountState =
  | AnonymousSparkleFinderAccountState
  | AuthenticatedSparkleFinderAccountState;

export type SupabaseAuthBoundary =
  | {
      adapter: "supabase";
      isConfigured: false;
      getAccountState: () => AnonymousSparkleFinderAccountState;
    }
  | {
      adapter: "supabase";
      isConfigured: true;
      getAccountState: () => Promise<SparkleFinderAccountState>;
    };

export const sparkleFinderAuthCookieName = "sparkle_finder_auth_mode";

const localDevCustomerIds: Record<Exclude<SparkleFinderAuthMode, "anonymous">, string> = {
  free: "customer-free-marlena",
  silver: "customer-silver-sparkle-mama",
};

const anonymousAccountState: AnonymousSparkleFinderAccountState = {
  status: "anonymous",
  tier: "anonymous",
  displayName: "Guest",
  email: null,
  customer: null,
};

export function getLocalDevAuthState(mode: SparkleFinderAuthMode = "anonymous"): SparkleFinderAccountState {
  if (mode === "anonymous") {
    return { ...anonymousAccountState };
  }

  const customer = getCustomerById(localDevCustomerIds[mode]);

  if (!customer) {
    return { ...anonymousAccountState };
  }

  return {
    status: "authenticated",
    tier: customer.tier,
    displayName: customer.displayName,
    email: customer.email,
    customer,
  };
}

export function parseSparkleFinderAuthMode(value: string | undefined): SparkleFinderAuthMode {
  if (value === "free" || value === "silver") {
    return value;
  }

  return "anonymous";
}

export function isSparkleFinderSignedIn(accountState: SparkleFinderAccountState): boolean {
  return accountState.status === "authenticated";
}

export function isLocalPreviewAuthEnabled(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.SPARKLE_FINDER_ENABLE_PREVIEW_AUTH === "true";
}

export function createNoCredentialSupabaseAuthBoundary(): SupabaseAuthBoundary {
  return {
    adapter: "supabase",
    isConfigured: false,
    getAccountState: () => ({ ...anonymousAccountState }),
  };
}
