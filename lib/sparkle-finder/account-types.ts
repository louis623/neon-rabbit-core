export type SparkleFinderAccessState = "silver_trial" | "silver_paid" | "silver_rep_included" | "free";

export type SparkleFinderSilverSource = "trial" | "paid" | "rep_included" | "none";

export type SparkleFinderMembershipRecord = {
  accountId: string;
  personId: string;
  accessState: SparkleFinderAccessState;
  silverSource: SparkleFinderSilverSource;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  silverStartedAt: string | null;
  silverEndsAt: string | null;
};

export type SparkleFinderCommunicationConsent = {
  accountEmailRequired: true;
  accountSmsAllowed: boolean;
  promotionalEmailOptIn: boolean;
  promotionalSmsOptIn: boolean;
  accountSmsConsentedAt: string | null;
  promotionalEmailConsentedAt: string | null;
  promotionalSmsConsentedAt: string | null;
  privacyAcknowledgedAt: string | null;
};
