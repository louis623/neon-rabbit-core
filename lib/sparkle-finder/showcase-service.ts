import {
  sparkleFinderCollectionItems,
  sparkleFinderCustomers,
  sparkleFinderShowcaseCollections,
  sparkleFinderShowcaseComments,
  sparkleFinderSilverProfiles,
} from "../fixtures/sparkle-finder-fixtures";
import { createSupabaseServiceRoleClient } from "../supabase/service-role";
import { getCatalogJewelryItemById } from "./catalog-service";
import { getJewelryItemById, matchJewelryItemToRepBoardListings } from "./service";
import type { CollectionItem, JewelryItem } from "./types";
import type {
  RevealSpotlight,
  ShowcaseCollectionWithPieces,
  ShowcaseComment,
  SparkleShowcase,
  SparkleShowcaseItemStatus,
  SparkleShowcasePiece,
  SparkleShowcaseVisibility,
} from "./showcase-types";

type ReadResult = { data: unknown; error: unknown };
type ReadBuilder = PromiseLike<ReadResult> & {
  eq: (column: string, value: string | boolean) => ReadBuilder;
  maybeSingle: () => PromiseLike<ReadResult>;
};

export type SupabaseShowcaseReadClient = {
  from: (table: string) => { select: (columns: string) => ReadBuilder };
};

export type PublicShowcaseReadOptions = {
  allowFixtureFallback?: boolean;
  catalogItemById?: (itemId: string) => Promise<JewelryItem | undefined>;
  supabase?: SupabaseShowcaseReadClient | null;
  viewerUserId?: string | null;
};

const profileColumns = [
  "user_id", "display_name", "state", "tiktok_handle", "bio", "photo_url",
  "profile_visibility", "showcase_handle", "showcase_tagline", "showcase_visibility",
].join(",");
const pieceColumns = [
  "id", "user_id", "jewelry_item_id", "state", "is_highlighted", "visibility",
  "showcase_status", "reveal_story", "personal_photo_url", "is_rarest_reveal",
].join(",");

const fixtureShowcaseHandles: Record<string, string> = {
  "sparkle-mama": "customer-silver-sparkle-mama",
};
const fixtureShowcasePieceOverrides: Record<string, {
  visibility?: SparkleShowcaseVisibility;
  showcaseStatus?: SparkleShowcaseItemStatus;
  revealStory?: string;
  personalPhotoUrl?: string | null;
  isRarestReveal?: boolean;
}> = {
  "collection-owned-rainbow": { visibility: "public", showcaseStatus: "owned", revealStory: "My jaw dropped when this Diamond came out of the fizz.", isRarestReveal: true },
  "collection-owned-starlit": { visibility: "private", showcaseStatus: "owned", revealStory: "Private note for owner planning only.", isRarestReveal: false },
  "collection-wishlist-lilac": { visibility: "public", showcaseStatus: "wishlist", revealStory: "Still watching for this Unicorn because the soft purple is everything.", isRarestReveal: true },
  "collection-owned-heart": { visibility: "public", showcaseStatus: "owned", revealStory: "A sweet gold piece that feels like an everyday favorite.", isRarestReveal: true },
  "collection-wishlist-aurora": { visibility: "public", showcaseStatus: "iso", revealStory: "Looking for the pink Aurora drops for my dream earring stack.", isRarestReveal: true },
  "collection-highlight-rose": { visibility: "public", showcaseStatus: "owned", revealStory: "The bracelet stack I keep reaching for.", isRarestReveal: false },
};

/**
 * Server-only persisted Showcase read. The service-role client is constrained by
 * explicit field allowlists and repeated visibility checks. Fixture fallback is
 * disabled automatically in production.
 */
export async function getPublicSparkleShowcaseByHandle(
  handle: string,
  options: PublicShowcaseReadOptions = {},
): Promise<SparkleShowcase | undefined> {
  const normalizedHandle = normalizePathPart(handle);
  if (!normalizedHandle) return undefined;

  const supabase = options.supabase === undefined
    ? createSupabaseServiceRoleClient() as unknown as SupabaseShowcaseReadClient | null
    : options.supabase;
  if (supabase) {
    const persisted = await readPersistedShowcase(
      supabase,
      normalizedHandle,
      options.viewerUserId ?? null,
      options.catalogItemById ?? readPersistedCatalogItem,
    );
    if (persisted) return persisted;
  }

  const allowFixtureFallback = options.allowFixtureFallback ?? (
    process.env.NODE_ENV !== "production" || process.env.SPARKLE_FINDER_ENABLE_SHOWCASE_FIXTURES === "true"
  );
  return allowFixtureFallback ? readFixtureShowcase(normalizedHandle, options.viewerUserId ?? null) : undefined;
}

export async function getShowcaseCollectionBySlug(
  handle: string,
  slug: string,
  options: PublicShowcaseReadOptions = {},
): Promise<ShowcaseCollectionWithPieces | undefined> {
  const showcase = await getPublicSparkleShowcaseByHandle(handle, options);
  return showcase?.showcaseCollections.find((collection) => collection.slug === normalizePathPart(slug));
}

export async function getRevealSpotlight(
  handle: string,
  jewelryItemId: string,
  options: PublicShowcaseReadOptions = {},
): Promise<RevealSpotlight | undefined> {
  const showcase = await getPublicSparkleShowcaseByHandle(handle, options);
  const piece = showcase?.pieces.find((candidate) => candidate.jewelryItemId === jewelryItemId);
  if (!showcase || !piece) return undefined;
  return {
    showcase,
    piece,
    comments: showcaseAllComments.get(showcase)?.filter(
      (comment) => comment.targetType === "piece" && comment.targetId === piece.id,
    ) ?? [],
  };
}

export function getShowcasePieceRepLeads(piece: SparkleShowcasePiece) {
  return matchJewelryItemToRepBoardListings(piece.jewelryItemId);
}

/** Fixture-only helper used by local preview and fixture collector discovery. */
export function getPublicShowcasePiecesByCustomerId(customerId: string): SparkleShowcasePiece[] {
  return sparkleFinderCollectionItems.filter((item) => item.customerId === customerId).flatMap((item) => {
    const piece = mapFixturePiece(item);
    return piece && piece.visibility === "public" && piece.showcaseStatus !== "private_note_only" ? [piece] : [];
  });
}

/** Fixture-only helper used by local preview tests. */
export function getVisibleShowcaseComments(
  showcaseCustomerId: string,
  targetType?: ShowcaseComment["targetType"],
  targetId?: string,
): ShowcaseComment[] {
  return sparkleFinderShowcaseComments.filter((comment) =>
    comment.showcaseCustomerId === showcaseCustomerId && !comment.deletedAt &&
    (!targetType || comment.targetType === targetType) && (!targetId || comment.targetId === targetId));
}

// Keeps piece comments available to the Reveal route without adding them to the
// profile-level comments array consumed by the Showcase page.
const showcaseAllComments = new WeakMap<SparkleShowcase, ShowcaseComment[]>();

async function readPersistedShowcase(
  supabase: SupabaseShowcaseReadClient,
  handle: string,
  viewerUserId: string | null,
  catalogItemById: (itemId: string) => Promise<JewelryItem | undefined>,
): Promise<SparkleShowcase | undefined> {
  const profileResult = await one(supabase, "sparkle_finder_profiles", profileColumns, [
    ["showcase_handle", handle], ["profile_visibility", "sparkle_finder"], ["showcase_visibility", "public"],
  ]);
  const profile = mapProfile(profileResult.data, handle);
  if (profileResult.error || !profile) return undefined;

  const blockRows = await readBlocks(supabase, profile.userId);
  // A block lookup failure fails closed because the admin client bypasses RLS.
  if (!blockRows || isViewerBlocked(blockRows, profile.userId, viewerUserId)) return undefined;

  const [pieceRows, collectionRows, commentRows, followerRows, followingRows] = await Promise.all([
    many(supabase, "sparkle_finder_collection_items", pieceColumns, [["user_id", profile.userId], ["visibility", "public"]]),
    many(supabase, "sparkle_finder_showcase_collections", "id,user_id,title,slug,description,visibility", [["user_id", profile.userId], ["visibility", "public"]]),
    many(supabase, "sparkle_finder_showcase_comments", "id,showcase_user_id,author_user_id,target_type,target_id,body,deleted_at,created_at,updated_at", [["showcase_user_id", profile.userId]]),
    many(supabase, "sparkle_finder_collector_follows", "follower_user_id,followed_user_id", [["followed_user_id", profile.userId]]),
    many(supabase, "sparkle_finder_collector_follows", "follower_user_id,followed_user_id", [["follower_user_id", profile.userId]]),
  ]);
  if (!pieceRows || !collectionRows || !commentRows || !followerRows || !followingRows) return undefined;

  const pieces = await mapPersistedPieces(pieceRows, profile.userId, catalogItemById);
  const pieceById = new Map(pieces.map((piece) => [piece.id, piece]));
  const collections = await mapCollections(supabase, collectionRows, profile.userId, pieceById);
  if (!collections) return undefined;

  const blockedIds = relatedBlockedIds(blockRows, profile.userId);
  const comments = await mapComments(supabase, commentRows, profile.userId, pieceById, blockedIds);
  const followers = followerRows.filter((row) => permittedFollow(row, profile.userId, "in", blockedIds));
  const following = followingRows.filter((row) => permittedFollow(row, profile.userId, "out", blockedIds));
  const showcase: SparkleShowcase = {
    profile: {
      customer: { id: profile.userId, displayName: profile.displayName, email: "", state: profile.state, tier: "silver" },
      profile: { customerId: profile.userId, photoUrl: profile.photoUrl ?? "", tiktokHandle: profile.tiktokHandle, bio: profile.bio, visibility: "sparkle_finder" },
      handle,
      tagline: profile.tagline,
      followerCount: followers.length,
      followingCount: following.length,
      isFollowedByViewer: Boolean(viewerUserId && followers.some((row) => row.follower_user_id === viewerUserId)),
    },
    pieces,
    rarestReveals: pieces.filter(isRarest),
    showcaseCollections: collections,
    comments: comments.filter((comment) => comment.targetType === "showcase" && comment.targetId === profile.userId),
  };
  showcaseAllComments.set(showcase, comments);
  return showcase;
}

type MappedProfile = {
  userId: string; displayName: string; state: string; tiktokHandle: string; bio: string;
  photoUrl: string | null; tagline: string;
};

function mapProfile(value: unknown, handle: string): MappedProfile | null {
  const row = record(value);
  if (!row || row.profile_visibility !== "sparkle_finder" || row.showcase_visibility !== "public" ||
      normalizePathPart(text(row.showcase_handle)) !== handle) return null;
  const userId = text(row.user_id);
  const displayName = text(row.display_name);
  if (!userId || !displayName) return null;
  return {
    userId, displayName, state: text(row.state), tiktokHandle: text(row.tiktok_handle), bio: text(row.bio),
    photoUrl: nullableText(row.photo_url), tagline: text(row.showcase_tagline),
  };
}

async function mapPersistedPieces(
  rows: Record<string, unknown>[],
  userId: string,
  catalogItemById: (itemId: string) => Promise<JewelryItem | undefined>,
): Promise<SparkleShowcasePiece[]> {
  const pieces: SparkleShowcasePiece[] = [];
  const batchSize = 8;

  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batch = await Promise.all(rows.slice(offset, offset + batchSize).map(async (row) => {
      const jewelryItemId = text(row.jewelry_item_id);

      if (!isPublicPersistedPieceRow(row, userId) || !jewelryItemId) return null;

      try {
        const jewelryItem = await catalogItemById(jewelryItemId);
        return jewelryItem ? mapPersistedPiece(row, userId, jewelryItem) : null;
      } catch {
        return null;
      }
    }));

    pieces.push(...batch.flatMap((piece) => piece ? [piece] : []));
  }

  return pieces;
}

function mapPersistedPiece(value: unknown, userId: string, jewelryItem: JewelryItem): SparkleShowcasePiece | null {
  const row = record(value);
  const id = text(row?.id);
  const jewelryItemId = text(row?.jewelry_item_id);
  const state = collectionState(row?.state);
  const showcaseStatus = showcaseStatusValue(row?.showcase_status);
  if (!row || !id || !jewelryItem || row.user_id !== userId || row.visibility !== "public" || !state ||
      !showcaseStatus || state === "private_note_only" || showcaseStatus === "private_note_only") return null;
  return {
    id, customerId: userId, jewelryItemId, state, note: "", isHighlighted: row.is_highlighted === true,
    jewelryItem, visibility: "public", showcaseStatus, revealStory: text(row.reveal_story),
    personalPhotoUrl: nullableText(row.personal_photo_url), isRarestReveal: row.is_rarest_reveal === true,
  };
}

function isPublicPersistedPieceRow(row: Record<string, unknown>, userId: string): boolean {
  return row.user_id === userId && row.visibility === "public" &&
    row.state !== "private_note_only" && row.showcase_status !== "private_note_only";
}

function readPersistedCatalogItem(itemId: string): Promise<JewelryItem | undefined> {
  return getCatalogJewelryItemById(itemId, { useFixtureFallback: false });
}

async function mapCollections(
  supabase: SupabaseShowcaseReadClient,
  rows: Record<string, unknown>[],
  userId: string,
  pieceById: Map<string, SparkleShowcasePiece>,
): Promise<ShowcaseCollectionWithPieces[] | null> {
  const output: ShowcaseCollectionWithPieces[] = [];
  for (const row of rows) {
    const id = text(row.id);
    const slug = normalizePathPart(text(row.slug));
    const title = text(row.title);
    if (!id || !slug || !title || row.user_id !== userId || row.visibility !== "public") continue;
    const joins = await many(supabase, "sparkle_finder_showcase_collection_items", "showcase_collection_id,collection_item_id", [["showcase_collection_id", id]]);
    if (!joins) return null;
    const pieces = joins.flatMap((join) => {
      if (join.showcase_collection_id !== id) return [];
      const piece = pieceById.get(text(join.collection_item_id));
      return piece ? [piece] : [];
    });
    if (!pieces.length) continue;
    output.push({
      id, customerId: userId, title, slug, description: text(row.description), visibility: "public",
      pieceIds: pieces.map((piece) => piece.id), pieces,
    });
  }
  return output;
}

async function mapComments(
  supabase: SupabaseShowcaseReadClient,
  rows: Record<string, unknown>[],
  userId: string,
  pieceById: Map<string, SparkleShowcasePiece>,
  blockedIds: Set<string>,
): Promise<ShowcaseComment[]> {
  const output: ShowcaseComment[] = [];
  const names = new Map<string, string>();
  for (const row of rows) {
    const id = text(row.id);
    const authorId = text(row.author_user_id);
    const targetId = text(row.target_id);
    const targetType = row.target_type === "showcase" || row.target_type === "piece" ? row.target_type : null;
    const body = text(row.body);
    const validTarget = targetType === "showcase" ? targetId === userId : targetType === "piece" && pieceById.has(targetId);
    if (!id || !authorId || !body || !targetType || !validTarget || row.showcase_user_id !== userId || row.deleted_at || blockedIds.has(authorId)) continue;
    let authorDisplayName = names.get(authorId);
    if (!authorDisplayName) {
      const author = await one(supabase, "sparkle_finder_profiles", "user_id,display_name,profile_visibility", [["user_id", authorId], ["profile_visibility", "sparkle_finder"]]);
      authorDisplayName = text(record(author.data)?.display_name) || "Sparkle Finder collector";
      names.set(authorId, authorDisplayName);
    }
    output.push({
      id, showcaseCustomerId: userId, authorCustomerId: authorId, authorDisplayName, targetType, targetId, body,
      createdAt: timestamp(row.created_at), updatedAt: timestamp(row.updated_at), deletedAt: null,
    });
  }
  return output;
}

async function readBlocks(client: SupabaseShowcaseReadClient, userId: string) {
  const [created, received] = await Promise.all([
    many(client, "sparkle_finder_collector_blocks", "blocker_user_id,blocked_user_id", [["blocker_user_id", userId]]),
    many(client, "sparkle_finder_collector_blocks", "blocker_user_id,blocked_user_id", [["blocked_user_id", userId]]),
  ]);
  return created && received ? [...created, ...received] : null;
}

function isViewerBlocked(rows: Record<string, unknown>[], userId: string, viewerId: string | null) {
  if (!viewerId || viewerId === userId) return false;
  return rows.some((row) =>
    (row.blocker_user_id === userId && row.blocked_user_id === viewerId) ||
    (row.blocker_user_id === viewerId && row.blocked_user_id === userId));
}

function relatedBlockedIds(rows: Record<string, unknown>[], userId: string) {
  const output = new Set<string>();
  for (const row of rows) {
    if (row.blocker_user_id === userId) output.add(text(row.blocked_user_id));
    if (row.blocked_user_id === userId) output.add(text(row.blocker_user_id));
  }
  output.delete("");
  return output;
}

function permittedFollow(row: Record<string, unknown>, userId: string, direction: "in" | "out", blocked: Set<string>) {
  const follower = text(row.follower_user_id);
  const followed = text(row.followed_user_id);
  const other = direction === "in" ? follower : followed;
  return Boolean(follower && followed && !blocked.has(other) && (direction === "in" ? followed === userId : follower === userId));
}

async function many(client: SupabaseShowcaseReadClient, table: string, columns: string, filters: Array<[string, string | boolean]>) {
  try {
    let query = client.from(table).select(columns);
    for (const [column, value] of filters) query = query.eq(column, value);
    const result = await query;
    if (result.error || !Array.isArray(result.data)) return null;
    return result.data.flatMap((value) => {
      const row = record(value);
      return row ? [row] : [];
    });
  } catch { return null; }
}

async function one(client: SupabaseShowcaseReadClient, table: string, columns: string, filters: Array<[string, string | boolean]>) {
  try {
    let query = client.from(table).select(columns);
    for (const [column, value] of filters) query = query.eq(column, value);
    return await query.maybeSingle();
  } catch (error) { return { data: null, error }; }
}

function readFixtureShowcase(handle: string, viewerUserId: string | null): SparkleShowcase | undefined {
  const customerId = fixtureShowcaseHandles[handle];
  const customer = sparkleFinderCustomers.find((candidate) => candidate.id === customerId);
  const profile = sparkleFinderSilverProfiles.find((candidate) => candidate.customerId === customerId);
  if (!customerId || !customer || !profile || profile.visibility !== "sparkle_finder") return undefined;
  const pieces = getPublicShowcasePiecesByCustomerId(customerId);
  const pieceById = new Map(pieces.map((piece) => [piece.id, piece]));
  const collections = sparkleFinderShowcaseCollections
    .filter((collection) => collection.customerId === customerId && collection.visibility === "public")
    .map((collection) => ({ ...collection, pieces: collection.pieceIds.flatMap((id) => pieceById.has(id) ? [pieceById.get(id)!] : []) }))
    .filter((collection) => collection.pieces.length);
  const allComments = getVisibleShowcaseComments(customerId);
  const showcase: SparkleShowcase = {
    profile: { customer, profile, handle, tagline: "Warm golds, hearts, unicorn hunts, and favorite reveals.", followerCount: 42, followingCount: 8, isFollowedByViewer: viewerUserId === "customer-silver-celeste" },
    pieces, rarestReveals: pieces.filter(isRarest), showcaseCollections: collections,
    comments: allComments.filter((comment) => comment.targetType === "showcase" && comment.targetId === customerId),
  };
  showcaseAllComments.set(showcase, allComments);
  return showcase;
}

function mapFixturePiece(item: CollectionItem): SparkleShowcasePiece | null {
  const jewelryItem = getJewelryItemById(item.jewelryItemId);
  if (!jewelryItem) return null;
  const override = fixtureShowcasePieceOverrides[item.id] ?? {};
  return { ...item, jewelryItem, visibility: override.visibility ?? "private", showcaseStatus: override.showcaseStatus ?? item.state,
    revealStory: override.revealStory ?? "", personalPhotoUrl: override.personalPhotoUrl ?? null,
    isRarestReveal: override.isRarestReveal ?? item.isHighlighted, note: "" };
}

function isRarest(piece: SparkleShowcasePiece) {
  return piece.isRarestReveal || piece.jewelryItem.bpLabel === "diamond" || piece.jewelryItem.bpLabel === "unicorn";
}
function normalizePathPart(value: string) {
  const normalized = value.trim().toLowerCase();
  return /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/.test(normalized) ? normalized : "";
}
function collectionState(value: unknown): CollectionItem["state"] | null {
  return value === "owned" || value === "wishlist" || value === "private_note_only" ? value : null;
}
function showcaseStatusValue(value: unknown): SparkleShowcaseItemStatus | null {
  return value === "owned" || value === "wishlist" || value === "iso" || value === "private_note_only" ? value : null;
}
function timestamp(value: unknown) { return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : new Date(0).toISOString(); }
function record(value: unknown): Record<string, unknown> | null { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; }
function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function nullableText(value: unknown) { return text(value) || null; }
