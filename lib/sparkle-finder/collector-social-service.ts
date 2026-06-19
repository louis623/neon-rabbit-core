import {
  sparkleFinderCollectorBlocks,
  sparkleFinderCollectorFollows,
  sparkleFinderCustomers,
  sparkleFinderSilverProfiles,
} from "../fixtures/sparkle-finder-fixtures";
import { getPublicShowcasePiecesByCustomerId } from "./showcase-service";
import type { PublicCollectorProfile } from "./social-types";

export type SupabaseCollectorSocialReadClient = {
  rpc: (
    functionName: "sparkle_finder_search_public_collectors",
    args: { search_query: string; result_limit: number },
  ) => PromiseLike<{ data: unknown; error: unknown }>;
};

const fixtureCollectorHandles: Record<string, string> = {
  "customer-silver-celeste": "celeste-stacks",
  "customer-silver-ivy": "ivy-curates",
  "customer-silver-jules": "jules-private-box",
  "customer-silver-riley": "riley-reveals",
  "customer-silver-sparkle-mama": "sparkle-mama",
};

export function searchPublicCollectorProfiles(input: {
  query: string;
  viewerUserId: string | null;
  limit?: number;
}): PublicCollectorProfile[] {
  const query = normalizeSearch(input.query);
  const limit = input.limit ?? 12;

  return sparkleFinderSilverProfiles
    .flatMap((profile) => {
      const publicProfile = mapPublicCollectorProfile(profile.customerId, input.viewerUserId);

      if (!publicProfile) {
        return [];
      }

      if (
        query &&
        !publicProfile.handle.includes(query) &&
        !publicProfile.displayName.toLowerCase().includes(query)
      ) {
        return [];
      }

      return [publicProfile];
    })
    .sort((left, right) => left.displayName.localeCompare(right.displayName))
    .slice(0, limit);
}

export async function searchPersistedPublicCollectorProfiles(input: {
  supabase: SupabaseCollectorSocialReadClient;
  query: string;
  limit?: number;
}): Promise<PublicCollectorProfile[] | null> {
  try {
    const result = await input.supabase.rpc("sparkle_finder_search_public_collectors", {
      search_query: normalizeSearch(input.query),
      result_limit: input.limit ?? 12,
    });

    if (result.error || !Array.isArray(result.data)) {
      return null;
    }

    return result.data.flatMap((row) => {
      const profile = mapPersistedPublicCollectorProfile(row);

      return profile ? [profile] : [];
    });
  } catch {
    return null;
  }
}

export function getPublicCollectorProfile(input: {
  handle: string;
  viewerUserId: string | null;
}): PublicCollectorProfile | undefined {
  const normalizedHandle = normalizeHandle(input.handle);
  const userId = Object.entries(fixtureCollectorHandles).find(([, handle]) => handle === normalizedHandle)?.[0];

  if (!userId) {
    return undefined;
  }

  return mapPublicCollectorProfile(userId, input.viewerUserId);
}

export function getCollectorFollowSummary(input: {
  userId: string;
  viewerUserId: string | null;
}): { followerCount: number; followingCount: number; isFollowedByViewer: boolean } {
  if (
    !isPublicCollectorUser(input.userId) ||
    isBlockedRelationship({ viewerUserId: input.viewerUserId, targetUserId: input.userId })
  ) {
    return {
      followerCount: 0,
      followingCount: 0,
      isFollowedByViewer: false,
    };
  }

  const visibleFollows = sparkleFinderCollectorFollows.filter(isVisibleCollectorFollow);

  return {
    followerCount: visibleFollows.filter((follow) => follow.followedUserId === input.userId).length,
    followingCount: visibleFollows.filter((follow) => follow.followerUserId === input.userId).length,
    isFollowedByViewer: Boolean(
      input.viewerUserId &&
        visibleFollows.some(
          (follow) => follow.followerUserId === input.viewerUserId && follow.followedUserId === input.userId,
        ),
    ),
  };
}

function mapPublicCollectorProfile(
  userId: string,
  viewerUserId: string | null,
): PublicCollectorProfile | undefined {
  const customer = sparkleFinderCustomers.find((candidate) => candidate.id === userId);
  const profile = sparkleFinderSilverProfiles.find((candidate) => candidate.customerId === userId);
  const handle = fixtureCollectorHandles[userId];

  if (!customer || !profile || !handle || profile.visibility !== "sparkle_finder") {
    return undefined;
  }

  if (isBlockedRelationship({ viewerUserId, targetUserId: userId })) {
    return undefined;
  }

  const followSummary = getCollectorFollowSummary({ userId, viewerUserId });

  return {
    userId,
    handle,
    displayName: customer.displayName,
    tagline: profile.bio,
    photoUrl: profile.photoUrl,
    showcaseUrl: `/showcase/${handle}`,
    publicPieceCount: getPublicShowcasePiecesByCustomerId(userId).length,
    isBlockedByViewer: isBlockedByViewer({ viewerUserId, targetUserId: userId }),
    ...followSummary,
  };
}

function mapPersistedPublicCollectorProfile(row: unknown): PublicCollectorProfile | null {
  const record = asRecord(row);
  const userId = readString(record?.user_id);
  const handle = normalizeHandle(readString(record?.showcase_handle));
  const displayName = readString(record?.display_name);

  if (!userId || !handle || !displayName) {
    return null;
  }

  return {
    userId,
    handle,
    displayName,
    tagline: readString(record?.showcase_tagline),
    photoUrl: readNullableString(record?.photo_url),
    showcaseUrl: `/showcase/${handle}`,
    followerCount: readCount(record?.follower_count),
    followingCount: readCount(record?.following_count),
    publicPieceCount: readCount(record?.public_piece_count),
    isFollowedByViewer: record?.is_followed_by_viewer === true,
    isBlockedByViewer: record?.is_blocked_by_viewer === true,
  };
}

function isBlockedRelationship(input: { viewerUserId: string | null; targetUserId: string }): boolean {
  if (!input.viewerUserId) {
    return false;
  }

  return isBlockedBetween(input.viewerUserId, input.targetUserId);
}

function isBlockedByViewer(input: { viewerUserId: string | null; targetUserId: string }): boolean {
  return Boolean(
    input.viewerUserId &&
      sparkleFinderCollectorBlocks.some(
        (block) => block.blockerUserId === input.viewerUserId && block.blockedUserId === input.targetUserId,
      ),
  );
}

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeHandle(value: string): string {
  return value.trim().toLowerCase();
}

function isVisibleCollectorFollow(follow: { followerUserId: string; followedUserId: string }): boolean {
  return isPublicCollectorUser(follow.followedUserId) && !isBlockedBetween(follow.followerUserId, follow.followedUserId);
}

function isPublicCollectorUser(userId: string): boolean {
  const customer = sparkleFinderCustomers.find((candidate) => candidate.id === userId);
  const profile = sparkleFinderSilverProfiles.find((candidate) => candidate.customerId === userId);

  return Boolean(customer && profile?.visibility === "sparkle_finder");
}

function isBlockedBetween(leftUserId: string, rightUserId: string): boolean {
  return sparkleFinderCollectorBlocks.some(
    (block) =>
      (block.blockerUserId === leftUserId && block.blockedUserId === rightUserId) ||
      (block.blockerUserId === rightUserId && block.blockedUserId === leftUserId),
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readNullableString(value: unknown): string | null {
  const text = readString(value);

  return text || null;
}

function readCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}
