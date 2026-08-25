import type { ShowcaseReportReason } from "./showcase-types";

export type ShowcaseActionDeniedReason =
  | "auth_required"
  | "invalid_input"
  | "not_allowed"
  | "not_found"
  | "save_failed"
  | "self_follow";

export type ShowcaseActionResult =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      reason: ShowcaseActionDeniedReason;
      message: string;
    };

const reportReasons = new Set<ShowcaseReportReason>([
  "spam",
  "harassment",
  "scam_or_impersonation",
  "inappropriate",
  "other",
]);

export function canFollowShowcase(viewerUserId: string | null | undefined, showcaseUserId: string): boolean {
  return Boolean(viewerUserId && viewerUserId !== showcaseUserId);
}

export function getFollowButtonLabel(isFollowing: boolean): "Follow" | "Following" {
  return isFollowing ? "Following" : "Follow";
}

export function canEditComment(viewerUserId: string | null | undefined, commentAuthorId: string): boolean {
  return Boolean(viewerUserId && viewerUserId === commentAuthorId);
}

export function canDeleteComment(
  viewerUserId: string | null | undefined,
  commentAuthorId: string,
  showcaseOwnerId: string,
): boolean {
  return Boolean(viewerUserId && (viewerUserId === commentAuthorId || viewerUserId === showcaseOwnerId));
}

export function normalizeCommentBody(value: unknown): string {
  return String(value ?? "")
    .trim()
    .slice(0, 500);
}

export function normalizeReportDetails(value: unknown): string {
  return String(value ?? "")
    .trim()
    .slice(0, 700);
}

export function normalizeReportReason(value: unknown): ShowcaseReportReason {
  return reportReasons.has(value as ShowcaseReportReason) ? (value as ShowcaseReportReason) : "other";
}

export function createShowcaseActionError(
  reason: ShowcaseActionDeniedReason,
  message = "This Sparkle Showcase update could not be saved.",
): ShowcaseActionResult {
  return {
    ok: false,
    reason,
    message,
  };
}

export function createShowcaseActionSuccess(message: string): ShowcaseActionResult {
  return {
    ok: true,
    message,
  };
}
