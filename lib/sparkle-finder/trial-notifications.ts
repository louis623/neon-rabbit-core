import type { SparkleFinderAccessState } from "./account-types";

export type SilverTrialNotificationKind =
  | "trial_expires_in_7_days"
  | "trial_expires_in_3_days"
  | "trial_expires_in_1_day"
  | "trial_expires_today"
  | "trial_downgraded_to_free";

export type SilverTrialNotificationChannel = "email";

export type SilverTrialNotificationMilestone = {
  kind: SilverTrialNotificationKind;
  daysBeforeExpiration: 7 | 3 | 1 | 0 | null;
  channel: SilverTrialNotificationChannel;
};

export type SilverTrialNotificationMessage = {
  to: string;
  kind: SilverTrialNotificationKind;
  trialEndsAt: string;
};

export type SilverTrialNotificationAdapter = {
  sendTrialNotification(message: SilverTrialNotificationMessage): Promise<{ accepted: string[] }>;
};

export type SilverTrialNotificationInput = {
  trialEndsAt: string | null;
  now: string | Date;
  effectiveState: SparkleFinderAccessState;
};

export type SilverTrialAccountNotice = {
  tone: "upcoming" | "expired";
  title: string;
  body: string;
};

export const silverTrialNotificationMilestones: SilverTrialNotificationMilestone[] = [
  { kind: "trial_expires_in_7_days", daysBeforeExpiration: 7, channel: "email" },
  { kind: "trial_expires_in_3_days", daysBeforeExpiration: 3, channel: "email" },
  { kind: "trial_expires_in_1_day", daysBeforeExpiration: 1, channel: "email" },
  { kind: "trial_expires_today", daysBeforeExpiration: 0, channel: "email" },
  { kind: "trial_downgraded_to_free", daysBeforeExpiration: null, channel: "email" },
];

export function getSilverTrialNotificationMilestone(
  input: SilverTrialNotificationInput,
): SilverTrialNotificationMilestone | null {
  if (!input.trialEndsAt || !isTrialReminderState(input.effectiveState)) {
    return null;
  }

  const trialEndsAt = new Date(input.trialEndsAt);
  const now = toDate(input.now);

  if (!isValidDate(trialEndsAt) || !isValidDate(now)) {
    return null;
  }

  if (input.effectiveState === "free") {
    return now.getTime() > trialEndsAt.getTime()
      ? getMilestoneByKind("trial_downgraded_to_free")
      : null;
  }

  const daysLeft = getUtcCalendarDaysUntil(trialEndsAt, now);

  if (daysLeft === 7) {
    return getMilestoneByKind("trial_expires_in_7_days");
  }
  if (daysLeft === 3) {
    return getMilestoneByKind("trial_expires_in_3_days");
  }
  if (daysLeft === 1) {
    return getMilestoneByKind("trial_expires_in_1_day");
  }
  if (daysLeft === 0 && now.getTime() <= trialEndsAt.getTime()) {
    return getMilestoneByKind("trial_expires_today");
  }

  return null;
}

export function getSilverTrialAccountNotice(input: SilverTrialNotificationInput): SilverTrialAccountNotice | null {
  if (!input.trialEndsAt || !isTrialReminderState(input.effectiveState)) {
    return null;
  }

  const trialEndsAt = new Date(input.trialEndsAt);
  const now = toDate(input.now);

  if (!isValidDate(trialEndsAt) || !isValidDate(now)) {
    return null;
  }

  if (input.effectiveState === "free" && now.getTime() > trialEndsAt.getTime()) {
    return {
      tone: "expired",
      title: "Silver trial ended",
      body: `Your Silver trial ended ${formatDate(input.trialEndsAt)}. Free access stays available, and you can restart Silver when you are ready.`,
    };
  }

  if (input.effectiveState !== "silver_trial") {
    return null;
  }

  const daysLeft = getUtcCalendarDaysUntil(trialEndsAt, now);

  if (daysLeft < 0 || daysLeft > 7) {
    return null;
  }

  const title =
    daysLeft === 0
      ? "Silver trial ends today"
      : `Silver trial ends in ${daysLeft === 1 ? "1 day" : `${daysLeft} days`}`;

  return {
    tone: "upcoming",
    title,
    body: `Your Silver trial ends ${formatDate(input.trialEndsAt)}. We will email account reminders before any Free downgrade.`,
  };
}

function getMilestoneByKind(kind: SilverTrialNotificationKind): SilverTrialNotificationMilestone {
  return silverTrialNotificationMilestones.find((milestone) => milestone.kind === kind)!;
}

function isTrialReminderState(state: SparkleFinderAccessState): boolean {
  return state === "silver_trial" || state === "free";
}

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

function isValidDate(value: Date): boolean {
  return Number.isFinite(value.getTime());
}

function getUtcCalendarDaysUntil(end: Date, now: Date): number {
  const endDay = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  const currentDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  return Math.round((endDay - currentDay) / 86_400_000);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
