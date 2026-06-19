"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSparkleFinderAccount } from "@/lib/sparkle-finder/account-service";
import {
  canDeleteComment,
  canEditComment,
  canFollowShowcase,
  createShowcaseActionError,
  createShowcaseActionSuccess,
  normalizeCommentBody,
  normalizeReportDetails,
  normalizeReportReason,
  type ShowcaseActionResult,
} from "@/lib/sparkle-finder/showcase-actions";
import { createClient } from "@/lib/supabase/server";
import type { ShowcaseCommentTargetType, ShowcaseReportTargetType } from "@/lib/sparkle-finder/showcase-types";

export type CommentActionState = ShowcaseActionResult;
export type ReportActionState = ShowcaseActionResult;

type ShowcaseActionClient = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null }; error: unknown }>;
  };
  rpc?: (functionName: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }>;
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => ShowcaseSelectBuilder;
    };
    insert: (values: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }>;
    upsert?: (
      values: Record<string, unknown>,
      options?: Record<string, unknown>,
    ) => PromiseLike<{ data: unknown; error: unknown }>;
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: string) => PromiseLike<{ data: unknown; error: unknown }> & {
        eq: (column: string, value: string) => PromiseLike<{ data: unknown; error: unknown }>;
      };
    };
    delete: () => {
      eq: (column: string, value: string) => PromiseLike<{ data: unknown; error: unknown }> & {
        eq: (column: string, value: string) => PromiseLike<{ data: unknown; error: unknown }>;
      };
    };
  };
};

type ShowcaseSelectBuilder = {
  eq: (column: string, value: string) => ShowcaseSelectBuilder;
  maybeSingle: () => PromiseLike<{ data: unknown; error: unknown }>;
};

export async function followShowcaseAction(formData: FormData): Promise<void> {
  const verified = await getVerifiedShowcaseClient();

  if (!verified.ok) {
    return;
  }

  const showcaseUserId = String(formData.get("showcaseUserId") ?? "").trim();
  const handle = String(formData.get("handle") ?? "").trim();

  if (
    !canFollowShowcase(verified.userId, showcaseUserId) ||
    !(await isPublicShowcase(verified.client, showcaseUserId)) ||
    (await isBlockedShowcaseRelationship(verified.client, verified.userId, showcaseUserId))
  ) {
    return;
  }

  const followValues = {
    follower_user_id: verified.userId,
    showcase_user_id: showcaseUserId,
  };
  const followTable = verified.client.from("sparkle_finder_showcase_follows");

  if (followTable.upsert) {
    await followTable.upsert(followValues, { onConflict: "follower_user_id,showcase_user_id" });
  } else {
    await followTable.insert(followValues);
  }

  revalidateShowcase(handle);
}

export async function unfollowShowcaseAction(formData: FormData): Promise<void> {
  const verified = await getVerifiedShowcaseClient();

  if (!verified.ok) {
    return;
  }

  const showcaseUserId = String(formData.get("showcaseUserId") ?? "").trim();
  const handle = String(formData.get("handle") ?? "").trim();

  if (!showcaseUserId) {
    return;
  }

  await verified.client
    .from("sparkle_finder_showcase_follows")
    .delete()
    .eq("follower_user_id", verified.userId)
    .eq("showcase_user_id", showcaseUserId);
  revalidateShowcase(handle);
}

export async function createShowcaseCommentAction(
  _previousState: CommentActionState,
  formData: FormData,
): Promise<CommentActionState> {
  const verified = await getVerifiedShowcaseClient();

  if (!verified.ok) {
    return createShowcaseActionError("auth_required", "Sign in to comment on this Sparkle Showcase.");
  }

  const body = normalizeCommentBody(formData.get("body"));

  if (!body) {
    return createShowcaseActionError("invalid_input", "Write a comment before posting.");
  }

  const targetType = parseCommentTargetType(formData.get("targetType"));
  const targetId = String(formData.get("targetId") ?? "").trim();
  const showcaseUserId = String(formData.get("showcaseUserId") ?? "").trim();
  const handle = String(formData.get("handle") ?? "").trim();

  if (!targetId || !showcaseUserId) {
    return createShowcaseActionError("invalid_input");
  }

  if (!(await isPublicCommentTarget(verified.client, showcaseUserId, targetType, targetId))) {
    return createShowcaseActionError("not_found", "This Sparkle Showcase conversation is not available.");
  }

  if (await isBlockedShowcaseRelationship(verified.client, verified.userId, showcaseUserId)) {
    return createShowcaseActionError("not_allowed", "This Sparkle Showcase conversation is not available.");
  }

  const result = await verified.client.from("sparkle_finder_showcase_comments").insert({
    showcase_user_id: showcaseUserId,
    author_user_id: verified.userId,
    target_type: targetType,
    target_id: targetId,
    body,
  });

  if (result.error) {
    return createShowcaseActionError("save_failed", "Comment could not be posted.");
  }

  revalidateShowcase(handle, targetType === "piece" ? targetId : undefined);

  return createShowcaseActionSuccess("Comment posted.");
}

export async function editShowcaseCommentAction(
  _previousState: CommentActionState,
  formData: FormData,
): Promise<CommentActionState> {
  const verified = await getVerifiedShowcaseClient();

  if (!verified.ok) {
    return createShowcaseActionError("auth_required", "Sign in to edit this comment.");
  }

  const commentId = String(formData.get("commentId") ?? "").trim();
  const body = normalizeCommentBody(formData.get("body"));
  const handle = String(formData.get("handle") ?? "").trim();

  if (!commentId || !body) {
    return createShowcaseActionError("not_allowed", "You can only edit your own comments.");
  }

  const comment = await getCommentForAction(verified.client, commentId);

  if (!comment || !canEditComment(verified.userId, comment.authorUserId)) {
    return createShowcaseActionError("not_allowed", "You can only edit your own comments.");
  }

  const result = verified.client.rpc
    ? await verified.client.rpc("sparkle_finder_edit_showcase_comment", {
        comment_id: commentId,
        new_body: body,
      })
    : await verified.client
        .from("sparkle_finder_showcase_comments")
        .update({ body })
        .eq("id", commentId)
        .eq("author_user_id", verified.userId);

  if (result.error) {
    return createShowcaseActionError("save_failed", "Comment could not be updated.");
  }

  revalidateShowcase(handle, comment.targetType === "piece" ? comment.targetId : undefined);

  return createShowcaseActionSuccess("Comment updated.");
}

export async function deleteShowcaseCommentAction(formData: FormData): Promise<void> {
  const verified = await getVerifiedShowcaseClient();

  if (!verified.ok) {
    return;
  }

  const commentId = String(formData.get("commentId") ?? "").trim();
  const handle = String(formData.get("handle") ?? "").trim();

  if (!commentId) {
    return;
  }

  const comment = await getCommentForAction(verified.client, commentId);

  if (!comment || !canDeleteComment(verified.userId, comment.authorUserId, comment.showcaseUserId)) {
    return;
  }

  if (verified.client.rpc) {
    await verified.client.rpc("sparkle_finder_delete_showcase_comment", { comment_id: commentId });
  } else {
    await verified.client
      .from("sparkle_finder_showcase_comments")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", commentId);
  }

  revalidateShowcase(handle, comment.targetType === "piece" ? comment.targetId : undefined);
}

export async function reportShowcaseTargetAction(
  _previousState: ReportActionState,
  formData: FormData,
): Promise<ReportActionState> {
  const verified = await getVerifiedShowcaseClient();

  if (!verified.ok) {
    return createShowcaseActionError("auth_required", "Sign in to report a concern.");
  }

  const targetType = parseReportTargetType(formData.get("targetType"));
  const targetId = String(formData.get("targetId") ?? "").trim();
  const showcaseUserId = String(formData.get("showcaseUserId") ?? "").trim();
  const handle = String(formData.get("handle") ?? "").trim();

  if (!targetId || !showcaseUserId) {
    return createShowcaseActionError("invalid_input");
  }

  if (!(await isReportableTarget(verified.client, showcaseUserId, targetType, targetId))) {
    return createShowcaseActionError("not_found", "This Sparkle Showcase item is not available to report.");
  }

  if (await isBlockedShowcaseRelationship(verified.client, verified.userId, showcaseUserId)) {
    return createShowcaseActionError("not_allowed", "This Sparkle Showcase item is not available to report.");
  }

  const result = await verified.client.from("sparkle_finder_showcase_reports").insert({
    reporter_user_id: verified.userId,
    showcase_user_id: showcaseUserId,
    target_type: targetType,
    target_id: targetId,
    reason: normalizeReportReason(formData.get("reason")),
    details: normalizeReportDetails(formData.get("details")),
  });

  if (result.error) {
    return createShowcaseActionError("save_failed", "Report could not be sent.");
  }

  revalidateShowcase(handle);

  return createShowcaseActionSuccess("Report sent for review.");
}

type CommentActionRecord = {
  authorUserId: string;
  showcaseUserId: string;
  targetId: string;
  targetType: ShowcaseCommentTargetType;
};

async function getVerifiedShowcaseClient(): Promise<
  | {
      ok: true;
      client: ShowcaseActionClient;
      userId: string;
    }
  | {
      ok: false;
    }
> {
  let client: ShowcaseActionClient;

  try {
    client = (await createClient()) as unknown as ShowcaseActionClient;
  } catch {
    return { ok: false };
  }

  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    return { ok: false };
  }

  const accountState = await getCurrentSparkleFinderAccount({
    isSupabaseConfigured: () => true,
    createSupabaseClient: async () => client,
  });

  if (accountState.status !== "authenticated" || accountState.customer.id !== data.user.id) {
    return { ok: false };
  }

  return {
    ok: true,
    client,
    userId: data.user.id,
  };
}

function parseCommentTargetType(value: FormDataEntryValue | null): ShowcaseCommentTargetType {
  return value === "piece" ? "piece" : "showcase";
}

function parseReportTargetType(value: FormDataEntryValue | null): ShowcaseReportTargetType {
  if (value === "piece" || value === "comment") {
    return value;
  }

  return "showcase";
}

async function isPublicShowcase(client: ShowcaseActionClient, showcaseUserId: string): Promise<boolean> {
  if (!showcaseUserId) {
    return false;
  }

  const result = await client
    .from("sparkle_finder_profiles")
    .select("user_id,profile_visibility,showcase_visibility")
    .eq("user_id", showcaseUserId)
    .maybeSingle();
  const row = asRecord(result.data);

  return (
    !result.error &&
    row?.user_id === showcaseUserId &&
    row.profile_visibility === "sparkle_finder" &&
    row.showcase_visibility === "public"
  );
}

async function isBlockedShowcaseRelationship(
  client: ShowcaseActionClient,
  viewerUserId: string,
  showcaseUserId: string,
): Promise<boolean> {
  if (!viewerUserId || !showcaseUserId || viewerUserId === showcaseUserId) {
    return false;
  }

  return (
    (await hasCollectorBlock(client, viewerUserId, showcaseUserId)) ||
    (await hasCollectorBlock(client, showcaseUserId, viewerUserId))
  );
}

async function hasCollectorBlock(
  client: ShowcaseActionClient,
  blockerUserId: string,
  blockedUserId: string,
): Promise<boolean> {
  try {
    const result = await client
      .from("sparkle_finder_collector_blocks")
      .select("id")
      .eq("blocker_user_id", blockerUserId)
      .eq("blocked_user_id", blockedUserId)
      .maybeSingle();

    return Boolean(!result.error && result.data);
  } catch {
    return true;
  }
}

async function isPublicCommentTarget(
  client: ShowcaseActionClient,
  showcaseUserId: string,
  targetType: ShowcaseCommentTargetType,
  targetId: string,
): Promise<boolean> {
  if (!(await isPublicShowcase(client, showcaseUserId))) {
    return false;
  }

  if (targetType === "showcase") {
    return targetId === showcaseUserId;
  }

  return isPublicShowcasePiece(client, showcaseUserId, targetId);
}

async function isReportableTarget(
  client: ShowcaseActionClient,
  showcaseUserId: string,
  targetType: ShowcaseReportTargetType,
  targetId: string,
): Promise<boolean> {
  if (targetType === "comment") {
    const comment = await getCommentForAction(client, targetId);

    return Boolean(comment && comment.showcaseUserId === showcaseUserId);
  }

  return isPublicCommentTarget(client, showcaseUserId, targetType, targetId);
}

async function isPublicShowcasePiece(
  client: ShowcaseActionClient,
  showcaseUserId: string,
  collectionItemId: string,
): Promise<boolean> {
  const result = await client
    .from("sparkle_finder_collection_items")
    .select("id,user_id,visibility")
    .eq("id", collectionItemId)
    .maybeSingle();
  const row = asRecord(result.data);

  return !result.error && row?.id === collectionItemId && row.user_id === showcaseUserId && row.visibility === "public";
}

async function getCommentForAction(
  client: ShowcaseActionClient,
  commentId: string,
): Promise<CommentActionRecord | null> {
  const result = await client
    .from("sparkle_finder_showcase_comments")
    .select("id,showcase_user_id,author_user_id,target_type,target_id,deleted_at")
    .eq("id", commentId)
    .maybeSingle();
  const row = asRecord(result.data);

  if (
    result.error ||
    !row ||
    row.id !== commentId ||
    row.deleted_at ||
    typeof row.showcase_user_id !== "string" ||
    typeof row.author_user_id !== "string" ||
    typeof row.target_id !== "string" ||
    (row.target_type !== "showcase" && row.target_type !== "piece")
  ) {
    return null;
  }

  return {
    authorUserId: row.author_user_id,
    showcaseUserId: row.showcase_user_id,
    targetId: row.target_id,
    targetType: row.target_type,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function revalidateShowcase(handle: string, pieceId?: string): void {
  if (!handle) {
    return;
  }

  revalidatePath(`/showcase/${handle}`);

  if (pieceId) {
    revalidatePath(`/showcase/${handle}/pieces/${pieceId}`);
  }
}
