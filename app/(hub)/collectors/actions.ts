"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSparkleFinderAccount, type CurrentSparkleFinderAccountState } from "@/lib/sparkle-finder/account-service";
import {
  canBlockCollector,
  canFollowCollector,
  normalizeSocialReportDetails,
  normalizeSocialReportReason,
} from "@/lib/sparkle-finder/collector-social-actions";
import { createClient } from "@/lib/supabase/server";

export type CollectorSocialActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

type CollectorActionClient = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null }; error: unknown }>;
  };
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          maybeSingle?: () => PromiseLike<{ data: unknown; error: unknown }>;
        } & PromiseLike<{ data: unknown; error: unknown }>;
        maybeSingle?: () => PromiseLike<{ data: unknown; error: unknown }>;
      } & PromiseLike<{ data: unknown; error: unknown }>;
    };
    insert: (values: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }>;
    upsert?: (
      values: Record<string, unknown>,
      options?: Record<string, unknown>,
    ) => PromiseLike<{ data: unknown; error: unknown }>;
    delete: () => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => PromiseLike<{ data: unknown; error: unknown }>;
      };
    };
  };
};

type CollectorActionResult = { data: unknown; error: unknown };

export async function followCollectorAction(formData: FormData): Promise<void> {
  const verified = await getVerifiedCollectorClient();

  if (!verified.ok) {
    return;
  }

  const targetUserId = cleanFormText(formData.get("targetUserId"));
  const handle = cleanFormText(formData.get("handle"));
  const isTargetPublic = await isPublicCollector(verified.client, targetUserId);
  const isBlockedRelationship = await isCollectorBlockedRelationship(verified.client, verified.userId, targetUserId);
  const permission = canFollowCollector({
    viewerUserId: verified.userId,
    targetUserId,
    isTargetPublic,
    isBlockedRelationship,
  });

  if (!permission.allowed) {
    return;
  }

  const values = {
    follower_user_id: verified.userId,
    followed_user_id: targetUserId,
  };
  const result = await upsertOrInsertCollectorRow(
    verified.client,
    "sparkle_finder_collector_follows",
    values,
    { onConflict: "follower_user_id,followed_user_id" },
  );

  if (result && !result.error) {
    revalidateCollectorPaths(handle);
  }
}

export async function unfollowCollectorAction(formData: FormData): Promise<void> {
  const verified = await getVerifiedCollectorClient();

  if (!verified.ok) {
    return;
  }

  const targetUserId = cleanFormText(formData.get("targetUserId"));

  if (!targetUserId) {
    return;
  }

  await verified.client
    .from("sparkle_finder_collector_follows")
    .delete()
    .eq("follower_user_id", verified.userId)
    .eq("followed_user_id", targetUserId);
  revalidateCollectorPaths(cleanFormText(formData.get("handle")));
}

export async function blockCollectorAction(
  _previousState: CollectorSocialActionState,
  formData: FormData,
): Promise<CollectorSocialActionState> {
  const verified = await getVerifiedCollectorClient();

  if (!verified.ok) {
    return verified.state;
  }

  const targetUserId = cleanFormText(formData.get("targetUserId"));

  if (!canBlockCollector({ viewerUserId: verified.userId, targetUserId })) {
    return {
      status: "error",
      message: "This collector cannot be blocked.",
    };
  }

  const values = {
    blocker_user_id: verified.userId,
    blocked_user_id: targetUserId,
    reason: cleanFormText(formData.get("reason")).slice(0, 500),
  };
  const result = await upsertOrInsertCollectorRow(
    verified.client,
    "sparkle_finder_collector_blocks",
    values,
    { onConflict: "blocker_user_id,blocked_user_id" },
  );

  if (!result || result.error) {
    return {
      status: "error",
      message: "Collector could not be blocked right now.",
    };
  }

  await removeCollectorFollow(verified.client, verified.userId, targetUserId);
  await removeCollectorFollow(verified.client, targetUserId, verified.userId);
  await removeShowcaseFollow(verified.client, verified.userId, targetUserId);
  await removeShowcaseFollow(verified.client, targetUserId, verified.userId);
  revalidateCollectorPaths(cleanFormText(formData.get("handle")));

  return {
    status: "success",
    message: "Collector blocked.",
  };
}

export async function reportCollectorAction(
  _previousState: CollectorSocialActionState,
  formData: FormData,
): Promise<CollectorSocialActionState> {
  const verified = await getVerifiedCollectorClient();

  if (!verified.ok) {
    return verified.state;
  }

  const targetUserId = cleanFormText(formData.get("targetUserId"));

  if (!targetUserId || targetUserId === verified.userId) {
    return {
      status: "error",
      message: "This collector cannot be reported.",
    };
  }

  const isTargetPublic = await isPublicCollector(verified.client, targetUserId);
  const isBlockedRelationship = await isCollectorBlockedRelationship(verified.client, verified.userId, targetUserId);

  if (!isTargetPublic || isBlockedRelationship) {
    return {
      status: "error",
      message: "This collector cannot be reported.",
    };
  }

  const result = await insertCollectorRow(verified.client, "sparkle_finder_social_reports", {
    reporter_user_id: verified.userId,
    target_type: "collector_profile",
    target_id: targetUserId,
    reason: normalizeSocialReportReason(formData.get("reason")),
    details: normalizeSocialReportDetails(formData.get("details")),
  });

  if (!result || result.error) {
    return {
      status: "error",
      message: "Report could not be sent right now.",
    };
  }

  revalidateCollectorPaths(cleanFormText(formData.get("handle")));

  return {
    status: "success",
    message: "Report sent for review.",
  };
}

async function getVerifiedCollectorClient(): Promise<
  | {
      ok: true;
      client: CollectorActionClient;
      accountState: CurrentSparkleFinderAccountState & { status: "authenticated" };
      userId: string;
    }
  | {
      ok: false;
      state: CollectorSocialActionState;
    }
> {
  let client: unknown;

  try {
    client = await createClient();
  } catch {
    return createCollectorActionFailure("Collector actions are unavailable right now.");
  }

  if (!isCollectorActionClient(client)) {
    return createCollectorActionFailure("Collector actions are unavailable right now.");
  }

  let authResult: unknown;

  try {
    authResult = await client.auth.getUser();
  } catch {
    return createCollectorActionFailure("Collector actions are unavailable right now.");
  }

  const authRecord = asRecord(authResult);

  if (!authRecord || !("data" in authRecord)) {
    return createCollectorActionFailure("Collector actions are unavailable right now.");
  }

  const data = asRecord(authRecord.data);

  if (!data || !("user" in data)) {
    return createCollectorActionFailure("Collector actions are unavailable right now.");
  }

  const user = asRecord(data?.user);
  const userId = typeof user?.id === "string" ? user.id : "";

  if (authRecord.error || !userId) {
    return createCollectorActionFailure("Sign in to use collector controls.");
  }

  let accountState: CurrentSparkleFinderAccountState;

  try {
    accountState = await getCurrentSparkleFinderAccount({
      isSupabaseConfigured: () => true,
      createSupabaseClient: async () => client,
    });
  } catch {
    return createCollectorActionFailure("Collector actions are unavailable right now.");
  }

  if (accountState.status !== "authenticated" || accountState.customer.id !== userId) {
    return createCollectorActionFailure("Sign in to use collector controls.");
  }

  return {
    ok: true,
    client,
    accountState,
    userId,
  };
}

function createCollectorActionFailure(message: string): { ok: false; state: CollectorSocialActionState } {
  return {
    ok: false,
    state: {
      status: "error",
      message,
    },
  };
}

async function isPublicCollector(client: CollectorActionClient, targetUserId: string): Promise<boolean> {
  if (!targetUserId) {
    return false;
  }

  const result = await selectMaybeSingleCollectorRow(
    client,
    "sparkle_finder_profiles",
    "user_id,profile_visibility,showcase_visibility",
    [{ column: "user_id", value: targetUserId }],
  );
  const row = asRecord(result?.data);

  return (
    !result?.error &&
    row?.user_id === targetUserId &&
    row.profile_visibility === "sparkle_finder" &&
    row.showcase_visibility === "public"
  );
}

async function isCollectorBlockedRelationship(
  client: CollectorActionClient,
  viewerUserId: string,
  targetUserId: string,
): Promise<boolean> {
  if (!targetUserId || viewerUserId === targetUserId) {
    return false;
  }

  const blockedByViewer = await hasCollectorBlock(client, viewerUserId, targetUserId);

  if (blockedByViewer) {
    return true;
  }

  return hasCollectorBlock(client, targetUserId, viewerUserId);
}

async function hasCollectorBlock(
  client: CollectorActionClient,
  blockerUserId: string,
  blockedUserId: string,
): Promise<boolean> {
  const result = await selectMaybeSingleCollectorRow(client, "sparkle_finder_collector_blocks", "id", [
    { column: "blocker_user_id", value: blockerUserId },
    { column: "blocked_user_id", value: blockedUserId },
  ]);

  return Boolean(!result?.error && result?.data);
}

async function removeCollectorFollow(client: CollectorActionClient, followerUserId: string, followedUserId: string): Promise<void> {
  if (!followerUserId || !followedUserId) {
    return;
  }

  await deleteCollectorRows(client, "sparkle_finder_collector_follows", [
    { column: "follower_user_id", value: followerUserId },
    { column: "followed_user_id", value: followedUserId },
  ]);
}

async function removeShowcaseFollow(client: CollectorActionClient, followerUserId: string, showcaseUserId: string): Promise<void> {
  if (!followerUserId || !showcaseUserId) {
    return;
  }

  await deleteCollectorRows(client, "sparkle_finder_showcase_follows", [
    { column: "follower_user_id", value: followerUserId },
    { column: "showcase_user_id", value: showcaseUserId },
  ]);
}

function revalidateCollectorPaths(handle: string): void {
  revalidatePath("/collectors");

  if (handle) {
    revalidatePath(`/showcase/${handle}`);
  }
}

function cleanFormText(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function isCollectorActionClient(value: unknown): value is CollectorActionClient {
  const client = asRecord(value);
  const auth = asRecord(client?.auth);

  return Boolean(client && auth && typeof auth.getUser === "function" && typeof client.from === "function");
}

async function selectMaybeSingleCollectorRow(
  client: CollectorActionClient,
  table: string,
  columns: string,
  filters: Array<{ column: string; value: string }>,
): Promise<CollectorActionResult | null> {
  try {
    const tableApi = getCollectorTableApi(client, table);
    const select = tableApi && typeof tableApi.select === "function" ? tableApi.select : null;

    if (!select) {
      return null;
    }

    const builder = applyCollectorFilters(select.call(tableApi, columns), filters);
    const maybeSingle = builder && typeof builder.maybeSingle === "function" ? builder.maybeSingle : null;

    if (!maybeSingle) {
      return null;
    }

    return await maybeSingle.call(builder);
  } catch {
    return null;
  }
}

async function upsertOrInsertCollectorRow(
  client: CollectorActionClient,
  table: string,
  values: Record<string, unknown>,
  options: Record<string, unknown>,
): Promise<CollectorActionResult | null> {
  const tableApi = getCollectorTableApi(client, table);

  try {
    if (tableApi && typeof tableApi.upsert === "function") {
      return await tableApi.upsert(values, options);
    }

    if (tableApi && typeof tableApi.insert === "function") {
      return await tableApi.insert(values);
    }
  } catch {
    return null;
  }

  return null;
}

async function insertCollectorRow(
  client: CollectorActionClient,
  table: string,
  values: Record<string, unknown>,
): Promise<CollectorActionResult | null> {
  const tableApi = getCollectorTableApi(client, table);

  try {
    if (tableApi && typeof tableApi.insert === "function") {
      return await tableApi.insert(values);
    }
  } catch {
    return null;
  }

  return null;
}

async function deleteCollectorRows(
  client: CollectorActionClient,
  table: string,
  filters: Array<{ column: string; value: string }>,
): Promise<void> {
  try {
    const tableApi = getCollectorTableApi(client, table);
    const deleteRows = tableApi && typeof tableApi.delete === "function" ? tableApi.delete : null;

    if (!deleteRows) {
      return;
    }

    const result = applyCollectorFilters(deleteRows.call(tableApi), filters);

    if (isPromiseLike(result)) {
      await result;
    }
  } catch {}
}

function getCollectorTableApi(client: CollectorActionClient, table: string): Record<string, unknown> | null {
  try {
    return asRecord(client.from(table));
  } catch {
    return null;
  }
}

function applyCollectorFilters(
  initialBuilder: unknown,
  filters: Array<{ column: string; value: string }>,
): Record<string, unknown> | null {
  let builder: unknown = initialBuilder;

  for (const filter of filters) {
    const builderRecord = asRecord(builder);
    const eq = builderRecord && typeof builderRecord.eq === "function" ? builderRecord.eq : null;

    if (!builderRecord || !eq) {
      return null;
    }

    builder = eq.call(builderRecord, filter.column, filter.value);
  }

  return asRecord(builder);
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return Boolean(value && typeof (value as { then?: unknown }).then === "function");
}
