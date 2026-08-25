import type {
  SparkleFinderAccessState,
  SparkleFinderCommunicationConsent,
} from "./account-types";

type SilverAccessStateInput = {
  accessState: SparkleFinderAccessState;
  trialEndsAt?: string | null;
  silverEndsAt?: string | null;
  now?: string | Date;
};

type SilverAccessStateResult = {
  effectiveState: SparkleFinderAccessState;
  hasSilverAccess: boolean;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  trialEndsAt?: string;
};

function toTime(value: string | Date): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

export function getSilverAccessState(input: SilverAccessStateInput): SilverAccessStateResult {
  const nowTime = toTime(input.now ?? new Date());

  if (input.accessState === "silver_trial") {
    if (!input.trialEndsAt) {
      return {
        effectiveState: "free",
        hasSilverAccess: false,
        isTrialActive: false,
        isTrialExpired: true,
      };
    }

    const isTrialActive = nowTime <= toTime(input.trialEndsAt);

    return {
      effectiveState: isTrialActive ? "silver_trial" : "free",
      hasSilverAccess: isTrialActive,
      isTrialActive,
      isTrialExpired: !isTrialActive,
      trialEndsAt: input.trialEndsAt,
    };
  }

  if (input.accessState === "silver_paid") {
    const isPaidActive = !input.silverEndsAt || nowTime <= toTime(input.silverEndsAt);

    return {
      effectiveState: isPaidActive ? "silver_paid" : "free",
      hasSilverAccess: isPaidActive,
      isTrialActive: false,
      isTrialExpired: false,
      trialEndsAt: input.trialEndsAt ?? undefined,
    };
  }

  if (input.accessState === "silver_rep_included") {
    return {
      effectiveState: "silver_rep_included",
      hasSilverAccess: true,
      isTrialActive: false,
      isTrialExpired: false,
      trialEndsAt: input.trialEndsAt ?? undefined,
    };
  }

  return {
    effectiveState: "free",
    hasSilverAccess: false,
    isTrialActive: false,
    isTrialExpired: false,
    trialEndsAt: input.trialEndsAt ?? undefined,
  };
}

export function createDefaultCommunicationConsent(
  privacyAcknowledgedAt: string | null = null,
): SparkleFinderCommunicationConsent {
  return {
    accountEmailRequired: true,
    accountSmsAllowed: false,
    promotionalEmailOptIn: false,
    promotionalSmsOptIn: false,
    accountSmsConsentedAt: null,
    promotionalEmailConsentedAt: null,
    promotionalSmsConsentedAt: null,
    privacyAcknowledgedAt,
  };
}
