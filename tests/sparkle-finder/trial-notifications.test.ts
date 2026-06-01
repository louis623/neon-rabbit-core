import { describe, expect, it } from "vitest";
import {
  getSilverTrialAccountNotice,
  getSilverTrialNotificationMilestone,
  silverTrialNotificationMilestones,
  type SilverTrialNotificationAdapter,
} from "../../lib/sparkle-finder/trial-notifications";

const trialEndsAt = "2026-06-10T12:00:00.000Z";

describe("Sparkle Finder Silver trial notifications", () => {
  it("defines email-only launch milestones for trial downgrade reminders", () => {
    expect(silverTrialNotificationMilestones).toEqual([
      { kind: "trial_expires_in_7_days", daysBeforeExpiration: 7, channel: "email" },
      { kind: "trial_expires_in_3_days", daysBeforeExpiration: 3, channel: "email" },
      { kind: "trial_expires_in_1_day", daysBeforeExpiration: 1, channel: "email" },
      { kind: "trial_expires_today", daysBeforeExpiration: 0, channel: "email" },
      { kind: "trial_downgraded_to_free", daysBeforeExpiration: null, channel: "email" },
    ]);
  });

  it.each([
    ["trial_expires_in_7_days", "2026-06-03T12:00:00.000Z"],
    ["trial_expires_in_3_days", "2026-06-07T12:00:00.000Z"],
    ["trial_expires_in_1_day", "2026-06-09T12:00:00.000Z"],
    ["trial_expires_today", "2026-06-10T08:00:00.000Z"],
    ["trial_downgraded_to_free", "2026-06-11T12:00:00.000Z"],
  ] as const)("computes the %s milestone", (kind, now) => {
    expect(
      getSilverTrialNotificationMilestone({
        trialEndsAt,
        now,
        effectiveState: kind === "trial_downgraded_to_free" ? "free" : "silver_trial",
      }),
    ).toMatchObject({ kind, channel: "email" });
  });

  it("does not warn paid or rep-included Silver accounts about trial downgrade", () => {
    expect(
      getSilverTrialNotificationMilestone({
        trialEndsAt,
        now: "2026-06-03T12:00:00.000Z",
        effectiveState: "silver_paid",
      }),
    ).toBeNull();
    expect(
      getSilverTrialNotificationMilestone({
        trialEndsAt,
        now: "2026-06-03T12:00:00.000Z",
        effectiveState: "silver_rep_included",
      }),
    ).toBeNull();
  });

  it("keeps actual sending behind an adapter contract", () => {
    const adapter: SilverTrialNotificationAdapter = {
      sendTrialNotification: async (message) => ({ accepted: [message.to] }),
    };

    expect(adapter.sendTrialNotification).toBeTypeOf("function");
  });

  it("returns a gentle account-page notice for upcoming trial expiration", () => {
    expect(
      getSilverTrialAccountNotice({
        trialEndsAt,
        now: "2026-06-07T12:00:00.000Z",
        effectiveState: "silver_trial",
      }),
    ).toEqual({
      tone: "upcoming",
      title: "Silver trial ends in 3 days",
      body: "Your Silver trial ends June 10, 2026. We will email account reminders before any Free downgrade.",
    });
  });
});
