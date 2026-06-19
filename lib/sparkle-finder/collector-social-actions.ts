import type { SocialReportReason } from "./social-types";

export const SOCIAL_REPORT_DETAILS_MAX_LENGTH = 700;

type FollowBlockReason = "sign_in_required" | "self_follow" | "private_profile" | "blocked";

export function canFollowCollector(input: {
  viewerUserId: string | null;
  targetUserId: string;
  isTargetPublic: boolean;
  isBlockedRelationship: boolean;
  isAlreadyFollowing?: boolean;
}): { allowed: boolean; alreadyFollowing?: true; reason?: FollowBlockReason } {
  if (!input.viewerUserId) {
    return { allowed: false, reason: "sign_in_required" };
  }

  if (input.viewerUserId === input.targetUserId) {
    return { allowed: false, reason: "self_follow" };
  }

  if (!input.isTargetPublic) {
    return { allowed: false, reason: "private_profile" };
  }

  if (input.isBlockedRelationship) {
    return { allowed: false, reason: "blocked" };
  }

  if (input.isAlreadyFollowing) {
    return { allowed: true, alreadyFollowing: true };
  }

  return { allowed: true };
}

export function canBlockCollector(input: { viewerUserId: string | null; targetUserId: string }): boolean {
  return Boolean(input.viewerUserId && input.viewerUserId !== input.targetUserId);
}

export function normalizeSocialReportReason(value: unknown): SocialReportReason {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (isSocialReportReason(normalized)) {
    return normalized;
  }

  return "other";
}

export function normalizeSocialReportDetails(value: unknown): string {
  return String(value ?? "")
    .trim()
    .slice(0, SOCIAL_REPORT_DETAILS_MAX_LENGTH);
}

function isSocialReportReason(value: string): value is SocialReportReason {
  return (
    value === "spam" ||
    value === "harassment" ||
    value === "scam_or_impersonation" ||
    value === "inappropriate" ||
    value === "other"
  );
}
