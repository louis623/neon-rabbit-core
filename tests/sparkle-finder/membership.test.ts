import { describe, expect, it } from "vitest";
import {
  createDefaultCommunicationConsent,
  getSilverAccessState,
} from "../../lib/sparkle-finder/membership";

describe("Sparkle Finder Silver membership", () => {
  it("grants Silver access for an active 45-day trial", () => {
    const result = getSilverAccessState({
      accessState: "silver_trial",
      trialEndsAt: "2026-07-15T12:00:00.000Z",
      now: "2026-05-31T12:00:00.000Z",
    });

    expect(result).toMatchObject({
      effectiveState: "silver_trial",
      hasSilverAccess: true,
      isTrialActive: true,
      isTrialExpired: false,
      trialEndsAt: "2026-07-15T12:00:00.000Z",
    });
  });

  it("downgrades an expired trial effectively to Free", () => {
    const result = getSilverAccessState({
      accessState: "silver_trial",
      trialEndsAt: "2026-05-30T12:00:00.000Z",
      now: "2026-05-31T12:00:00.000Z",
    });

    expect(result).toMatchObject({
      effectiveState: "free",
      hasSilverAccess: false,
      isTrialActive: false,
      isTrialExpired: true,
      trialEndsAt: "2026-05-30T12:00:00.000Z",
    });
  });

  it("grants Silver access for paid Silver membership", () => {
    const result = getSilverAccessState({
      accessState: "silver_paid",
      now: "2026-05-31T12:00:00.000Z",
    });

    expect(result).toMatchObject({
      effectiveState: "silver_paid",
      hasSilverAccess: true,
      isTrialActive: false,
      isTrialExpired: false,
    });
  });

  it("downgrades paid Silver with a past end date effectively to Free", () => {
    const result = getSilverAccessState({
      accessState: "silver_paid",
      silverEndsAt: "2026-05-30T12:00:00.000Z",
      now: "2026-05-31T12:00:00.000Z",
    });

    expect(result).toMatchObject({
      effectiveState: "free",
      hasSilverAccess: false,
      isTrialActive: false,
      isTrialExpired: false,
    });
  });

  it("grants Silver access for rep-included Silver membership", () => {
    const result = getSilverAccessState({
      accessState: "silver_rep_included",
      now: "2026-05-31T12:00:00.000Z",
    });

    expect(result).toMatchObject({
      effectiveState: "silver_rep_included",
      hasSilverAccess: true,
      isTrialActive: false,
      isTrialExpired: false,
    });
  });

  it("does not grant Silver access for Free membership", () => {
    const result = getSilverAccessState({
      accessState: "free",
      now: "2026-05-31T12:00:00.000Z",
    });

    expect(result).toMatchObject({
      effectiveState: "free",
      hasSilverAccess: false,
      isTrialActive: false,
      isTrialExpired: false,
    });
  });

  it("does not grant trial access when trialEndsAt is missing", () => {
    const result = getSilverAccessState({
      accessState: "silver_trial",
      now: "2026-05-31T12:00:00.000Z",
    });

    expect(result).toMatchObject({
      effectiveState: "free",
      hasSilverAccess: false,
      isTrialActive: false,
      isTrialExpired: true,
    });
  });

  it("keeps promotional SMS off by default and separates account/security flags from promo flags", () => {
    const consent = createDefaultCommunicationConsent("2026-05-31T12:00:00.000Z");

    expect(consent).toEqual({
      accountEmailRequired: true,
      accountSmsAllowed: false,
      promotionalEmailOptIn: false,
      promotionalSmsOptIn: false,
      accountSmsConsentedAt: null,
      promotionalEmailConsentedAt: null,
      promotionalSmsConsentedAt: null,
      privacyAcknowledgedAt: "2026-05-31T12:00:00.000Z",
    });
  });
});
