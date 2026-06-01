import { isSupabaseConfigured as defaultIsSupabaseConfigured } from "@/lib/supabase/client";
import { createClient as defaultCreateSupabaseClient } from "@/lib/supabase/server";
import {
  getLocalDevAuthState,
  isLocalPreviewAuthEnabled,
  type SparkleFinderAccountState,
  type SparkleFinderAuthMode,
} from "./auth";
import {
  createDefaultCommunicationConsent,
  getSilverAccessState,
} from "./membership";
import type {
  SparkleFinderAccessState,
  SparkleFinderCommunicationConsent,
  SparkleFinderMembershipRecord,
  SparkleFinderSilverSource,
} from "./account-types";
import type { CustomerAccount, SilverProfile } from "./types";

type SparkleFinderUser = {
  id: string;
  email?: string | null;
};

type SparkleFinderProfileRow = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  state: string | null;
  tiktok_handle?: string | null;
  bio?: string | null;
  profile_visibility?: SilverProfile["visibility"] | null;
  is_rep?: boolean | null;
  sparkle_suite_rep_id?: string | null;
};

type SparkleFinderMembershipRow = {
  user_id: string;
  access_state: SparkleFinderAccessState | null;
  silver_source: SparkleFinderSilverSource | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  silver_started_at: string | null;
  silver_ends_at: string | null;
};

type SparkleFinderConsentRow = {
  account_email_required: boolean | null;
  account_sms_allowed: boolean | null;
  promotional_email_opt_in: boolean | null;
  promotional_sms_opt_in: boolean | null;
  promotional_email_consented_at: string | null;
  promotional_sms_consented_at: string | null;
  privacy_acknowledged_at: string | null;
};

export type SparkleFinderMembershipDetails = SparkleFinderMembershipRecord & {
  effectiveState: SparkleFinderAccessState;
  hasSilverAccess: boolean;
  isTrialActive: boolean;
  isTrialExpired: boolean;
};

export type CurrentSparkleFinderAccountState = SparkleFinderAccountState & {
  membership?: SparkleFinderMembershipDetails;
  communicationConsent: SparkleFinderCommunicationConsent;
  silverProfile?: SilverProfile;
  isLocalPreview?: boolean;
};

type AccountRowsInput = {
  user: SparkleFinderUser;
  profile: SparkleFinderProfileRow | null;
  membership: SparkleFinderMembershipRow | null;
  consent: SparkleFinderConsentRow | null;
  now?: string | Date;
};

type AccountServiceDependencies = {
  isSupabaseConfigured?: () => boolean;
  createSupabaseClient?: () => Promise<unknown>;
  localPreviewAuthMode?: SparkleFinderAuthMode;
};

type SupabaseAccountClient = {
  auth: {
    getUser: () => Promise<{ data: { user: SparkleFinderUser | null }; error: unknown }>;
  };
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => PromiseLike<{ data: unknown; error: unknown }>;
      };
    };
  };
};

const anonymousAccountState: CurrentSparkleFinderAccountState = {
  status: "anonymous",
  tier: "anonymous",
  displayName: "Guest",
  email: null,
  customer: null,
  communicationConsent: createDefaultCommunicationConsent(),
};

export async function getCurrentSparkleFinderAccount({
  isSupabaseConfigured = defaultIsSupabaseConfigured,
  createSupabaseClient = defaultCreateSupabaseClient,
  localPreviewAuthMode,
}: AccountServiceDependencies = {}): Promise<CurrentSparkleFinderAccountState> {
  if (!isSupabaseConfigured()) {
    return getLocalPreviewAccountState(localPreviewAuthMode) ?? { ...anonymousAccountState };
  }

  let supabase: SupabaseAccountClient;

  try {
    supabase = (await createSupabaseClient()) as SupabaseAccountClient;
  } catch {
    return { ...anonymousAccountState };
  }

  let user: SparkleFinderUser | null;

  try {
    const authResult = await supabase.auth.getUser();
    user = authResult.error ? null : authResult.data.user;
  } catch {
    user = null;
  }

  if (!user) {
    return { ...anonymousAccountState };
  }

  const [profile, membership, consent] = await Promise.all([
    fetchMaybeSingle<SparkleFinderProfileRow>(supabase, "sparkle_finder_profiles", user.id),
    fetchMaybeSingle<SparkleFinderMembershipRow>(supabase, "sparkle_finder_memberships", user.id),
    fetchMaybeSingle<SparkleFinderConsentRow>(supabase, "sparkle_finder_communication_consents", user.id),
  ]);

  return mapSparkleFinderAccountRows({
    user,
    profile,
    membership,
    consent,
  });
}

export function mapSparkleFinderAccountRows({
  user,
  profile,
  membership,
  consent,
  now,
}: AccountRowsInput): CurrentSparkleFinderAccountState {
  const displayName = firstPresent(profile?.display_name, user.email?.split("@")[0], "Sparkle Finder");
  const email = firstPresent(profile?.email, user.email, "");
  const accessState = membership?.access_state ?? "free";
  const silverAccess = getSilverAccessState({
    accessState,
    trialEndsAt: membership?.trial_ends_at,
    silverEndsAt: membership?.silver_ends_at,
    now,
  });
  const tier = silverAccess.hasSilverAccess ? "silver" : "free";
  const customer: CustomerAccount = {
    id: user.id,
    displayName,
    email,
    state: profile?.state ?? "",
    tier,
  };

  return {
    status: "authenticated",
    tier,
    displayName,
    email,
    customer,
    membership: {
      accountId: user.id,
      personId: user.id,
      accessState,
      silverSource: membership?.silver_source ?? "none",
      trialStartedAt: membership?.trial_started_at ?? null,
      trialEndsAt: membership?.trial_ends_at ?? null,
      silverStartedAt: membership?.silver_started_at ?? null,
      silverEndsAt: membership?.silver_ends_at ?? null,
      effectiveState: silverAccess.effectiveState,
      hasSilverAccess: silverAccess.hasSilverAccess,
      isTrialActive: silverAccess.isTrialActive,
      isTrialExpired: silverAccess.isTrialExpired,
    },
    communicationConsent: consent
      ? {
          accountEmailRequired: true,
          accountSmsAllowed: consent.account_sms_allowed ?? false,
          promotionalEmailOptIn: consent.promotional_email_opt_in ?? false,
          promotionalSmsOptIn: consent.promotional_sms_opt_in ?? false,
          accountSmsConsentedAt: null,
          promotionalEmailConsentedAt: consent.promotional_email_consented_at,
          promotionalSmsConsentedAt: consent.promotional_sms_consented_at,
          privacyAcknowledgedAt: consent.privacy_acknowledged_at,
        }
      : createDefaultCommunicationConsent(),
    silverProfile: {
      customerId: user.id,
      photoUrl: "",
      tiktokHandle: profile?.tiktok_handle ?? "",
      bio: profile?.bio ?? "",
      visibility: profile?.profile_visibility ?? "private",
    },
  };
}

export function getSparkleFinderNavStatusLabel(accountState: SparkleFinderAccountState): string {
  if (accountState.status === "anonymous") {
    return "Guest";
  }

  const membership = "membership" in accountState
    ? (accountState.membership as SparkleFinderMembershipDetails | undefined)
    : undefined;

  if (membership?.effectiveState === "silver_trial") {
    return "Trial Silver";
  }

  if (membership?.effectiveState === "silver_rep_included") {
    return "Rep Silver";
  }

  return accountState.tier === "silver" ? "Silver" : "Free";
}

async function fetchMaybeSingle<T>(
  supabase: SupabaseAccountClient,
  table: string,
  userId: string,
): Promise<T | null> {
  try {
    const { data, error } = await supabase.from(table).select("*").eq("user_id", userId).maybeSingle();

    return error ? null : (data as T | null);
  } catch {
    return null;
  }
}

function getLocalPreviewAccountState(
  mode: SparkleFinderAuthMode | undefined,
): CurrentSparkleFinderAccountState | null {
  if (!mode || mode === "anonymous" || !isLocalPreviewAuthEnabled()) {
    return null;
  }

  return {
    ...getLocalDevAuthState(mode),
    communicationConsent: createDefaultCommunicationConsent(),
    isLocalPreview: true,
  };
}

function firstPresent(...values: Array<string | null | undefined>): string {
  return values.find((value) => value?.trim())?.trim() ?? "";
}
