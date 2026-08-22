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
import { normalizeRarestRevealSelection, qualifiesForRarestReveals } from "./showcase-rarity";
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

type ReadResult = { count?: number | null; data: unknown; error: unknown };
type ReadBuilder = PromiseLike<ReadResult> & {
  eq: (column: string, value: string | boolean) => ReadBuilder;
  in?: (column: string, values: string[]) => ReadBuilder;
  is?: (column: string, value: null) => ReadBuilder;
  limit?: (count: number) => ReadBuilder;
  lt?: (column: string, value: string) => ReadBuilder;
  maybeSingle: () => PromiseLike<ReadResult>;
  or?: (filters: string) => ReadBuilder;
  order?: (column: string, options?: { ascending?: boolean }) => ReadBuilder;
};

export type SupabaseShowcaseReadClient = {
  from: (table: string) => { select: (columns: string, options?: { count?: "exact"; head?: boolean }) => ReadBuilder };
  rpc?: (
    functionName: "sparkle_finder_get_public_showcase_social_summary",
    args: { showcase_owner_id: string; viewer_user_id: string | null },
  ) => PromiseLike<ReadResult>;
};

export type PublicShowcaseReadOptions = {
  allowFixtureFallback?: boolean;
  catalogItemById?: (itemId: string) => Promise<JewelryItem | undefined>;
  supabase?: SupabaseShowcaseReadClient | null;
  viewerUserId?: string | null;
};

export type PublicShowcaseTargetOptions = {
  collectionItemId?: string | null;
  showcaseUserId: string;
  supabase?: SupabaseShowcaseReadClient | null;
};

export type SparkleShowcaseRouteAccess = "public" | "owner_private_preview";

export type SparkleShowcaseRouteResult = {
  access: SparkleShowcaseRouteAccess;
  showcase: SparkleShowcase;
};

export type PublicShowcasePage<T> = {
  items: T[];
  nextCursor: string | null;
};

export const publicShowcaseReadLimits = {
  collections: 12,
  comments: 20,
  pieces: 24,
} as const;
const publicShowcaseCommentScanLimit = publicShowcaseReadLimits.comments * 4;
const publicPieceStateFilters: Array<[string, string[]]> = [
  ["state", ["owned", "wishlist"]],
  ["showcase_status", ["owned", "wishlist", "iso"]],
];

type ShowcaseReadScope =
  | { kind: "profile" }
  | { kind: "collection"; slug: string }
  | { jewelryItemId: string; kind: "piece" };

type ShowcasePageCursor = { id: string; value: string };

const profileColumns = [
  "user_id", "display_name", "state", "tiktok_handle", "bio", "photo_url",
  "profile_visibility", "showcase_handle", "showcase_tagline", "showcase_visibility",
].join(",");
const pieceColumns = [
  "id", "user_id", "jewelry_item_id", "state", "is_highlighted", "visibility",
  "showcase_status", "reveal_story", "personal_photo_url", "is_rarest_reveal", "updated_at",
].join(",");

const fixtureShowcaseHandles: Record<string, string> = {
  "celeste-stacks": "customer-silver-celeste",
  "ivy-curates": "customer-silver-ivy",
  "riley-reveals": "customer-silver-riley",
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
  "collection-wishlist-lilac": { visibility: "public", showcaseStatus: "wishlist", revealStory: "Still watching for this Unicorn because the soft purple is everything.", isRarestReveal: false },
  "collection-owned-heart": { visibility: "public", showcaseStatus: "owned", revealStory: "A sweet gold piece that feels like an everyday favorite.", isRarestReveal: true },
  "collection-wishlist-aurora": { visibility: "public", showcaseStatus: "iso", revealStory: "Looking for the pink Aurora drops for my dream earring stack.", isRarestReveal: false },
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

  const supabase = resolveShowcaseReadClient(options.supabase);
  if (supabase) {
    const persisted = await readPersistedShowcase(
      supabase,
      normalizedHandle,
      options.viewerUserId ?? null,
      options.catalogItemById ?? readPersistedCatalogItem,
      "public",
      { kind: "profile" },
    );
    if (persisted) return persisted;
  }

  const isExplicitLocalSmoke = process.env.SPARKLE_FINDER_LOCAL_SMOKE_FIXTURES === "true" &&
    process.env.VERCEL_ENV !== "production";
  const allowFixtureFallback = (process.env.NODE_ENV !== "production" || isExplicitLocalSmoke) &&
    (options.allowFixtureFallback ?? true);
  return allowFixtureFallback ? readFixtureShowcase(normalizedHandle, options.viewerUserId ?? null) : undefined;
}

export async function getPublicShowcasePiecePage(
  handle: string,
  options: PublicShowcaseReadOptions & { cursor?: string | null } = {},
): Promise<PublicShowcasePage<SparkleShowcasePiece> | undefined> {
  const normalizedHandle = normalizePathPart(handle);
  const cursor = decodeShowcaseCursor(options.cursor);
  if (!normalizedHandle || cursor === undefined) return undefined;
  const supabase = resolveShowcaseReadClient(options.supabase);
  if (!supabase) return undefined;
  const profile = await readPublicProfileBoundary(supabase, normalizedHandle, options.viewerUserId ?? null);
  if (!profile) return undefined;
  const rows = await boundedMany(
    supabase,
    "sparkle_finder_collection_items",
    pieceColumns,
    [["user_id", profile.userId], ["visibility", "public"]],
    {
      cursor: cursor ? { column: "updated_at", ...cursor } : undefined,
      inFilters: publicPieceStateFilters,
      limit: publicShowcaseReadLimits.pieces + 1,
      order: [["updated_at", false], ["id", false]],
    },
  );
  if (!rows) return undefined;
  const pageRows = rows.slice(0, publicShowcaseReadLimits.pieces);
  const items = await mapPersistedPieces(
    pageRows,
    profile.userId,
    options.catalogItemById ?? readPersistedCatalogItem,
  );
  const last = pageRows.at(-1);
  return {
    items,
    nextCursor: rows.length > publicShowcaseReadLimits.pieces && last
      ? encodeShowcaseCursor(text(last.updated_at), text(last.id))
      : null,
  };
}

export async function getPublicShowcaseCommentPage(
  handle: string,
  target: { id: string; type: "piece" | "showcase" },
  options: PublicShowcaseReadOptions & { cursor?: string | null } = {},
): Promise<PublicShowcasePage<ShowcaseComment> | undefined> {
  const normalizedHandle = normalizePathPart(handle);
  const cursor = decodeShowcaseCursor(options.cursor);
  if (!normalizedHandle || cursor === undefined) return undefined;
  const supabase = resolveShowcaseReadClient(options.supabase);
  if (!supabase) return undefined;
  const viewerUserId = options.viewerUserId ?? null;
  const profile = await readPublicProfileBoundary(supabase, normalizedHandle, viewerUserId);
  if (!profile) return undefined;
  const targetId = target.id.trim();
  if (target.type === "showcase" ? targetId !== profile.userId : !await isPublicPieceId(supabase, profile.userId, targetId)) {
    return undefined;
  }
  const rows = await boundedMany(
    supabase,
    "sparkle_finder_showcase_comments",
    "id,showcase_user_id,author_user_id,target_type,target_id,body,deleted_at,created_at,updated_at",
    [["showcase_user_id", profile.userId], ["target_type", target.type], ["target_id", targetId]],
    {
      cursor: cursor ? { column: "created_at", ...cursor } : undefined,
      limit: publicShowcaseCommentScanLimit + 1,
      nullFilters: ["deleted_at"],
      order: [["created_at", false], ["id", false]],
    },
  );
  if (!rows) return undefined;
  const blocked = await readBlockedCommentAuthorIds(
    supabase, profile.userId, viewerUserId, rows.map((row) => text(row.author_user_id)).filter(Boolean),
  );
  if (!blocked) return undefined;
  const pieceById = target.type === "piece" ? new Map([[targetId, {} as SparkleShowcasePiece]]) : new Map();
  const mapped = await mapComments(supabase, rows, profile.userId, pieceById, blocked);
  if (!mapped) return undefined;
  const items = mapped.slice(0, publicShowcaseReadLimits.comments);
  const lastReturnedId = items.at(-1)?.id;
  const lastScanned = lastReturnedId
    ? rows.find((row) => text(row.id) === lastReturnedId)
    : rows.at(Math.min(rows.length, publicShowcaseCommentScanLimit) - 1);
  const hasMore = Boolean(lastScanned && (rows.length > publicShowcaseCommentScanLimit || rows.findIndex((row) => row === lastScanned) < rows.length - 1));
  return {
    items,
    nextCursor: hasMore && lastScanned
      ? encodeShowcaseCursor(text(lastScanned.created_at), text(lastScanned.id))
      : null,
  };
}

/**
 * Route read that preserves the public boundary while allowing a signed-in
 * owner to preview the public-eligible contents of their real private Showcase.
 * Unknown handles and fixture-only private states never receive preview access.
 */
export async function getSparkleShowcaseForRoute(
  handle: string,
  options: PublicShowcaseReadOptions = {},
): Promise<SparkleShowcaseRouteResult | undefined> {
  const publicShowcase = await getPublicSparkleShowcaseByHandle(handle, options);
  if (publicShowcase) return { access: "public", showcase: publicShowcase };

  const normalizedHandle = normalizePathPart(handle);
  const viewerUserId = options.viewerUserId?.trim() ?? "";
  const supabase = resolveShowcaseReadClient(options.supabase);
  if (!normalizedHandle || !viewerUserId || !supabase) return undefined;

  const showcase = await readPersistedShowcase(
    supabase,
    normalizedHandle,
    viewerUserId,
    options.catalogItemById ?? readPersistedCatalogItem,
    "owner_private_preview",
    { kind: "profile" },
  );
  return showcase ? { access: "owner_private_preview", showcase } : undefined;
}

export async function getShowcaseCollectionForRoute(
  handle: string,
  slug: string,
  options: PublicShowcaseReadOptions = {},
): Promise<(SparkleShowcaseRouteResult & { collection: ShowcaseCollectionWithPieces }) | undefined> {
  const route = await getScopedShowcaseForRoute(handle, { kind: "collection", slug: normalizePathPart(slug) }, options);
  const collection = route?.showcase.showcaseCollections.find(
    (candidate) => candidate.slug === normalizePathPart(slug),
  );
  return route && collection ? { ...route, collection } : undefined;
}

export async function getRevealSpotlightForRoute(
  handle: string,
  jewelryItemId: string,
  options: PublicShowcaseReadOptions = {},
): Promise<{ access: SparkleShowcaseRouteAccess; spotlight: RevealSpotlight } | undefined> {
  const route = await getScopedShowcaseForRoute(handle, { jewelryItemId: jewelryItemId.trim(), kind: "piece" }, options);
  const piece = route?.showcase.pieces.find((candidate) => candidate.jewelryItemId === jewelryItemId.trim());
  if (!route || !piece) return undefined;
  return {
    access: route.access,
    spotlight: {
      showcase: route.showcase,
      piece,
      comments: route.access === "public"
        ? showcaseAllComments.get(route.showcase)?.filter(
          (comment) => comment.targetType === "piece" && comment.targetId === piece.id,
        ) ?? []
        : [],
    },
  };
}

async function getScopedShowcaseForRoute(
  handle: string,
  scope: ShowcaseReadScope,
  options: PublicShowcaseReadOptions,
): Promise<SparkleShowcaseRouteResult | undefined> {
  const normalizedHandle = normalizePathPart(handle);
  const viewerUserId = options.viewerUserId?.trim() ?? "";
  const supabase = resolveShowcaseReadClient(options.supabase);
  const catalogItemById = options.catalogItemById ?? readPersistedCatalogItem;

  if (normalizedHandle && supabase) {
    const publicShowcase = await readPersistedShowcase(
      supabase, normalizedHandle, viewerUserId || null, catalogItemById, "public", scope,
    );
    if (publicShowcase) return { access: "public", showcase: publicShowcase };

    if (viewerUserId) {
      const privateShowcase = await readPersistedShowcase(
        supabase, normalizedHandle, viewerUserId, catalogItemById, "owner_private_preview", scope,
      );
      if (privateShowcase) return { access: "owner_private_preview", showcase: privateShowcase };
    }
  }

  const fixture = await getSparkleShowcaseForRoute(handle, { ...options, supabase: null });
  return fixture;
}

/**
 * Server-only action guard for public Showcase targets. Authenticated clients
 * intentionally cannot read another collector's raw profile or collection row,
 * because those rows also contain owner-only columns such as email and notes.
 */
export async function isPublicSparkleShowcaseTarget({
  collectionItemId = null,
  showcaseUserId,
  supabase: suppliedClient,
}: PublicShowcaseTargetOptions): Promise<boolean> {
  let userId: string;
  let itemId: string;
  let supabase: SupabaseShowcaseReadClient | null;

  try {
    userId = showcaseUserId.trim();
    itemId = collectionItemId?.trim() ?? "";
    supabase = suppliedClient === undefined
      ? createSupabaseServiceRoleClient() as unknown as SupabaseShowcaseReadClient | null
      : suppliedClient;
  } catch {
    return false;
  }

  if (!userId || (collectionItemId !== null && collectionItemId !== undefined && !itemId) || !supabase) return false;

  const profileResult = await one(supabase, "sparkle_finder_profiles", "user_id,profile_visibility,showcase_visibility", [
    ["user_id", userId], ["profile_visibility", "sparkle_finder"], ["showcase_visibility", "public"],
  ]);
  const profile = record(profileResult.data);
  if (profileResult.error || profile?.user_id !== userId || profile.profile_visibility !== "sparkle_finder" || profile.showcase_visibility !== "public") {
    return false;
  }

  if (!itemId) return true;

  const itemResult = await one(
    supabase,
    "sparkle_finder_collection_items",
    "id,user_id,state,visibility,showcase_status",
    [["id", itemId], ["user_id", userId], ["visibility", "public"]],
  );
  const item = record(itemResult.data);

  return Boolean(
    !itemResult.error &&
    item?.id === itemId &&
    item.user_id === userId &&
    item.visibility === "public" &&
    (item.state === "owned" || item.state === "wishlist") &&
    (item.showcase_status === "owned" || item.showcase_status === "wishlist" || item.showcase_status === "iso")
  );
}

export async function getShowcaseCollectionBySlug(
  handle: string,
  slug: string,
  options: PublicShowcaseReadOptions = {},
): Promise<ShowcaseCollectionWithPieces | undefined> {
  const route = await getShowcaseCollectionForRoute(handle, slug, options);
  return route?.access === "public" ? route.collection : undefined;
}

export async function getRevealSpotlight(
  handle: string,
  jewelryItemId: string,
  options: PublicShowcaseReadOptions = {},
): Promise<RevealSpotlight | undefined> {
  const route = await getRevealSpotlightForRoute(handle, jewelryItemId, options);
  return route?.access === "public" ? route.spotlight : undefined;
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

async function readPublicProfileBoundary(
  supabase: SupabaseShowcaseReadClient,
  handle: string,
  viewerUserId: string | null,
): Promise<MappedProfile | null> {
  const result = await one(supabase, "sparkle_finder_profiles", profileColumns, [
    ["showcase_handle", handle], ["profile_visibility", "sparkle_finder"], ["showcase_visibility", "public"],
  ]);
  const profile = mapProfile(result.data, handle, "public", viewerUserId);
  if (result.error || !profile) return null;
  const blocked = await readDirectBlock(supabase, profile.userId, viewerUserId);
  return blocked === false ? profile : null;
}

async function isPublicPieceId(
  supabase: SupabaseShowcaseReadClient,
  ownerUserId: string,
  pieceId: string,
): Promise<boolean> {
  if (!pieceId) return false;
  const rows = await boundedMany(
    supabase,
    "sparkle_finder_collection_items",
    "id,user_id,state,visibility,showcase_status",
    [["id", pieceId], ["user_id", ownerUserId], ["visibility", "public"]],
    { inFilters: publicPieceStateFilters, limit: 1 },
  );
  return Boolean(rows?.[0] && isPublicPersistedPieceRow(rows[0], ownerUserId));
}

async function readPersistedShowcase(
  supabase: SupabaseShowcaseReadClient,
  handle: string,
  viewerUserId: string | null,
  catalogItemById: (itemId: string) => Promise<JewelryItem | undefined>,
  access: SparkleShowcaseRouteAccess,
  scope: ShowcaseReadScope,
): Promise<SparkleShowcase | undefined> {
  const profileFilters: Array<[string, string | boolean]> = access === "public"
    ? [["showcase_handle", handle], ["profile_visibility", "sparkle_finder"], ["showcase_visibility", "public"]]
    : [["showcase_handle", handle], ["user_id", viewerUserId ?? ""]];
  const profileResult = await one(supabase, "sparkle_finder_profiles", profileColumns, profileFilters);
  const profile = mapProfile(profileResult.data, handle, access, viewerUserId);
  if (profileResult.error || !profile) return undefined;

  if (access === "public") {
    const viewerBlock = await readDirectBlock(supabase, profile.userId, viewerUserId);
    // A direct block lookup failure fails closed because the admin client bypasses RLS.
    if (viewerBlock === null || viewerBlock) return undefined;
  }

  const collectionFilters: Array<[string, string | boolean]> = [["user_id", profile.userId], ["visibility", "public"]];
  if (scope.kind === "collection") collectionFilters.push(["slug", scope.slug]);
  const collectionLimit = scope.kind === "profile" ? publicShowcaseReadLimits.collections : 1;
  const collectionRowsPromise = scope.kind === "piece"
    ? Promise.resolve([] as Record<string, unknown>[])
    : boundedMany(
      supabase,
      "sparkle_finder_showcase_collections",
      "id,user_id,title,slug,description,visibility,created_at",
      collectionFilters,
      { limit: collectionLimit, order: [["created_at", false], ["id", false]] },
    );

  const directPiecePromise = scope.kind === "collection"
    ? Promise.resolve(null)
    : boundedMany(
      supabase,
      "sparkle_finder_collection_items",
      pieceColumns,
      [
        ["user_id", profile.userId],
        ["visibility", "public"],
        ...(scope.kind === "piece" ? [["jewelry_item_id", scope.jewelryItemId] as [string, string]] : []),
      ],
      {
        inFilters: publicPieceStateFilters,
        limit: scope.kind === "profile" ? publicShowcaseReadLimits.pieces : 1,
        order: [["updated_at", false], ["id", false]],
      },
    );

  const [initialPieceRows, collectionRows] = await Promise.all([directPiecePromise, collectionRowsPromise]);
  if (!collectionRows || (scope.kind !== "collection" && !initialPieceRows)) return undefined;
  if (scope.kind === "collection" && collectionRows.length === 0) return undefined;

  const collectionIds = collectionRows.map((row) => text(row.id)).filter(Boolean);
  const joinRows = collectionIds.length
    ? await boundedMany(
      supabase,
      "sparkle_finder_showcase_collection_items",
      "showcase_collection_id,collection_item_id",
      [],
      {
        inFilters: [["showcase_collection_id", collectionIds]],
        limit: scope.kind === "profile"
          ? publicShowcaseReadLimits.collections * publicShowcaseReadLimits.pieces
          : publicShowcaseReadLimits.pieces,
        order: [["showcase_collection_id", true], ["collection_item_id", true]],
      },
    )
    : [];
  if (!joinRows) return undefined;

  const collectionPieceIds = scope.kind === "collection"
    ? joinRows.map((row) => text(row.collection_item_id)).filter(Boolean)
    : [];
  const pieceRows = scope.kind === "collection"
    ? collectionPieceIds.length
      ? await boundedMany(
        supabase,
        "sparkle_finder_collection_items",
        pieceColumns,
        [["user_id", profile.userId], ["visibility", "public"]],
        {
          inFilters: [["id", collectionPieceIds], ...publicPieceStateFilters],
          limit: publicShowcaseReadLimits.pieces,
          order: [["updated_at", false], ["id", false]],
        },
      )
      : []
    : initialPieceRows;
  if (!pieceRows) return undefined;

  const pieces = await mapPersistedPieces(pieceRows, profile.userId, catalogItemById);
  if ((scope.kind === "piece" || scope.kind === "collection") && pieces.length === 0) return undefined;
  const pieceById = new Map(pieces.map((piece) => [piece.id, piece]));
  const collections = mapCollections(collectionRows, joinRows, profile.userId, pieceById);
  if (scope.kind === "collection" && collections.length === 0) return undefined;

  const commentFilters: Array<[string, string | boolean]> = [["showcase_user_id", profile.userId]];
  if (scope.kind === "profile") commentFilters.push(["target_type", "showcase"], ["target_id", profile.userId]);
  if (scope.kind === "piece") commentFilters.push(["target_type", "piece"], ["target_id", pieces[0].id]);
  const [commentRows, socialSummary] = access === "public"
    ? await Promise.all([
      scope.kind === "collection"
        ? Promise.resolve([] as Record<string, unknown>[])
        : boundedMany(
          supabase,
          "sparkle_finder_showcase_comments",
          "id,showcase_user_id,author_user_id,target_type,target_id,body,deleted_at,created_at,updated_at",
          commentFilters,
          { limit: publicShowcaseCommentScanLimit, nullFilters: ["deleted_at"], order: [["created_at", false], ["id", false]] },
        ),
      scope.kind === "profile"
        ? readSocialSummary(supabase, profile.userId, viewerUserId, pieces)
        : Promise.resolve(createFallbackSocialSummary(pieces)),
    ])
    : [[], createFallbackSocialSummary(pieces)];
  if (!commentRows || !socialSummary) return undefined;
  const blockedCommentAuthorIds = access === "public"
    ? await readBlockedCommentAuthorIds(
      supabase,
      profile.userId,
      viewerUserId,
      commentRows.map((row) => text(row.author_user_id)).filter(Boolean),
    )
    : new Set<string>();
  if (!blockedCommentAuthorIds) return undefined;
  const comments = access === "public"
    ? await mapComments(supabase, commentRows, profile.userId, pieceById, blockedCommentAuthorIds)
    : [];
  if (!comments) return undefined;
  const boundedComments = comments.slice(0, publicShowcaseReadLimits.comments);
  const heroPiece = scope.kind === "profile"
    ? await readHeroPiece(
      supabase,
      profile.userId,
      socialSummary.heroCollectionItemId,
      pieceById,
      catalogItemById,
    )
    : null;
  const showcase: SparkleShowcase = {
    profile: {
      customer: { id: profile.userId, displayName: profile.displayName, email: "", state: profile.state, tier: "silver" },
      profile: { customerId: profile.userId, photoUrl: profile.photoUrl ?? "", tiktokHandle: profile.tiktokHandle, bio: profile.bio, visibility: "sparkle_finder" },
      handle,
      tagline: profile.tagline,
      followerCount: socialSummary.followerCount,
      followingCount: socialSummary.followingCount,
      isFollowedByViewer: socialSummary.isFollowedByViewer,
    },
    pieces,
    rarestReveals: pieces.filter(isRarest),
    publicPieceCount: socialSummary.publicPieceCount,
    rarestRevealCount: socialSummary.rarestRevealCount,
    heroPiece,
    showcaseCollections: collections,
    comments: boundedComments.filter((comment) => comment.targetType === "showcase" && comment.targetId === profile.userId),
  };
  showcaseAllComments.set(showcase, boundedComments);
  return showcase;
}

type MappedProfile = {
  userId: string; displayName: string; state: string; tiktokHandle: string; bio: string;
  photoUrl: string | null; tagline: string;
};

function mapProfile(
  value: unknown,
  handle: string,
  access: SparkleShowcaseRouteAccess,
  viewerUserId: string | null,
): MappedProfile | null {
  const row = record(value);
  const isFullyPublic = row?.profile_visibility === "sparkle_finder" && row.showcase_visibility === "public";
  const publicProfile = access === "public" && isFullyPublic;
  const privateOwner = access === "owner_private_preview" && Boolean(viewerUserId) &&
    row?.user_id === viewerUserId && !isFullyPublic;
  if (!row || (!publicProfile && !privateOwner) || normalizePathPart(text(row.showcase_handle)) !== handle) return null;
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
  const catalogRequests = new Map<string, Promise<JewelryItem | undefined>>();
  const pieces = await Promise.all(rows.map(async (row) => {
      const jewelryItemId = text(row.jewelry_item_id);

      if (!isPublicPersistedPieceRow(row, userId) || !jewelryItemId) return null;

      try {
        let catalogRequest = catalogRequests.get(jewelryItemId);
        if (!catalogRequest) {
          catalogRequest = catalogItemById(jewelryItemId);
          catalogRequests.set(jewelryItemId, catalogRequest);
        }
        const jewelryItem = await catalogRequest;
        return jewelryItem ? mapPersistedPiece(row, userId, jewelryItem) : null;
      } catch {
        return null;
      }
  }));
  return pieces.flatMap((piece) => piece ? [piece] : []);
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
    personalPhotoUrl: nullableText(row.personal_photo_url),
    isRarestReveal: normalizeRarestRevealSelection(showcaseStatus, row.is_rarest_reveal === true && state === "owned"),
  };
}

function isPublicPersistedPieceRow(row: Record<string, unknown>, userId: string): boolean {
  return row.user_id === userId && row.visibility === "public" &&
    (row.state === "owned" || row.state === "wishlist") &&
    (row.showcase_status === "owned" || row.showcase_status === "wishlist" || row.showcase_status === "iso");
}

function readPersistedCatalogItem(itemId: string): Promise<JewelryItem | undefined> {
  return getCatalogJewelryItemById(itemId, { useFixtureFallback: false });
}

async function readHeroPiece(
  supabase: SupabaseShowcaseReadClient,
  ownerUserId: string,
  heroCollectionItemId: string | null,
  pagePieces: Map<string, SparkleShowcasePiece>,
  catalogItemById: (itemId: string) => Promise<JewelryItem | undefined>,
): Promise<SparkleShowcasePiece | null> {
  if (!heroCollectionItemId) return null;
  const pagePiece = pagePieces.get(heroCollectionItemId);
  if (pagePiece?.state === "owned" && pagePiece.showcaseStatus === "owned") return pagePiece;
  const rows = await boundedMany(
    supabase,
    "sparkle_finder_collection_items",
    pieceColumns,
    [["id", heroCollectionItemId], ["user_id", ownerUserId], ["visibility", "public"]],
    { inFilters: [["state", ["owned"]], ["showcase_status", ["owned"]]], limit: 1 },
  );
  const row = rows?.[0];
  const jewelryItemId = text(row?.jewelry_item_id);
  if (!row || !jewelryItemId) return null;
  try {
    const jewelryItem = await catalogItemById(jewelryItemId);
    return jewelryItem ? mapPersistedPiece(row, ownerUserId, jewelryItem) : null;
  } catch {
    return null;
  }
}

function mapCollections(
  rows: Record<string, unknown>[],
  joins: Record<string, unknown>[],
  userId: string,
  pieceById: Map<string, SparkleShowcasePiece>,
): ShowcaseCollectionWithPieces[] {
  const output: ShowcaseCollectionWithPieces[] = [];
  for (const row of rows) {
    const id = text(row.id);
    const slug = normalizePathPart(text(row.slug));
    const title = text(row.title);
    if (!id || !slug || !title || row.user_id !== userId || row.visibility !== "public") continue;
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
): Promise<ShowcaseComment[] | null> {
  const output: ShowcaseComment[] = [];
  const validRows = rows.filter((row) => {
    const authorId = text(row.author_user_id);
    const targetId = text(row.target_id);
    const targetType = row.target_type === "showcase" || row.target_type === "piece" ? row.target_type : null;
    const validTarget = targetType === "showcase" ? targetId === userId : targetType === "piece" && pieceById.has(targetId);
    return Boolean(text(row.id) && authorId && text(row.body) && targetType && validTarget && row.showcase_user_id === userId && !row.deleted_at && !blockedIds.has(authorId));
  });
  const authorIds = [...new Set(validRows.map((row) => text(row.author_user_id)).filter(Boolean))];
  const authorRows = authorIds.length
    ? await boundedMany(
      supabase,
      "sparkle_finder_profiles",
      "user_id,display_name,profile_visibility",
      [["profile_visibility", "sparkle_finder"]],
      { inFilters: [["user_id", authorIds]], limit: authorIds.length, order: [["user_id", true]] },
    )
    : [];
  if (!authorRows) return null;
  const names = new Map(authorRows.map((row) => [text(row.user_id), text(row.display_name)]));
  for (const row of validRows) {
    const id = text(row.id);
    const authorId = text(row.author_user_id);
    const targetId = text(row.target_id);
    const targetType = row.target_type === "showcase" || row.target_type === "piece" ? row.target_type : null;
    const body = text(row.body);
    if (!id || !authorId || !body || !targetType) continue;
    const authorDisplayName = names.get(authorId) || "Sparkle Finder collector";
    output.push({
      id, showcaseCustomerId: userId, authorCustomerId: authorId, authorDisplayName, targetType, targetId, body,
      createdAt: timestamp(row.created_at), updatedAt: timestamp(row.updated_at), deletedAt: null,
    });
  }
  return output;
}

async function readDirectBlock(
  client: SupabaseShowcaseReadClient,
  ownerUserId: string,
  viewerUserId: string | null,
): Promise<boolean | null> {
  if (!viewerUserId || viewerUserId === ownerUserId) return false;
  const [created, received] = await Promise.all([
    one(client, "sparkle_finder_collector_blocks", "id", [["blocker_user_id", ownerUserId], ["blocked_user_id", viewerUserId]]),
    one(client, "sparkle_finder_collector_blocks", "id", [["blocker_user_id", viewerUserId], ["blocked_user_id", ownerUserId]]),
  ]);
  if (created.error || received.error) return null;
  return Boolean(record(created.data) || record(received.data));
}

async function readBlockedCommentAuthorIds(
  client: SupabaseShowcaseReadClient,
  ownerUserId: string,
  viewerUserId: string | null,
  authorIds: string[],
): Promise<Set<string> | null> {
  const uniqueAuthors = [...new Set(authorIds)].filter((authorId) => authorId !== ownerUserId);
  if (uniqueAuthors.length === 0) return new Set();
  const pairs: Array<[string, string]> = [["blocker_user_id", ownerUserId], ["blocked_user_id", ownerUserId]];
  if (viewerUserId && viewerUserId !== ownerUserId) {
    pairs.push(["blocker_user_id", viewerUserId], ["blocked_user_id", viewerUserId]);
  }
  const reads = await Promise.all(pairs.map(([column, userId]) => boundedMany(
    client,
    "sparkle_finder_collector_blocks",
    "blocker_user_id,blocked_user_id",
    [[column, userId]],
    {
      inFilters: [[column === "blocker_user_id" ? "blocked_user_id" : "blocker_user_id", uniqueAuthors]],
      limit: uniqueAuthors.length,
    },
  )));
  if (reads.some((rows) => rows === null)) return null;
  const blocked = new Set<string>();
  for (let index = 0; index < reads.length; index += 1) {
    const [fixedColumn] = pairs[index];
    const authorColumn = fixedColumn === "blocker_user_id" ? "blocked_user_id" : "blocker_user_id";
    for (const row of reads[index] ?? []) {
      const authorId = text(row[authorColumn]);
      if (uniqueAuthors.includes(authorId)) blocked.add(authorId);
    }
  }
  return blocked;
}

type SocialSummary = {
  followerCount: number;
  followingCount: number;
  heroCollectionItemId: string | null;
  isFollowedByViewer: boolean;
  publicPieceCount: number;
  rarestRevealCount: number;
};

function createFallbackSocialSummary(pieces: SparkleShowcasePiece[]): SocialSummary {
  return {
    followerCount: 0,
    followingCount: 0,
    heroCollectionItemId: null,
    isFollowedByViewer: false,
    publicPieceCount: pieces.length,
    rarestRevealCount: pieces.filter(isRarest).length,
  };
}

async function readSocialSummary(
  client: SupabaseShowcaseReadClient,
  ownerUserId: string,
  viewerUserId: string | null,
  fallbackPieces: SparkleShowcasePiece[],
): Promise<SocialSummary | null> {
  if (client.rpc) {
    try {
      const result = await client.rpc("sparkle_finder_get_public_showcase_social_summary", {
        showcase_owner_id: ownerUserId,
        viewer_user_id: viewerUserId,
      });
      if (result.error || !Array.isArray(result.data)) return null;
      const row = record(result.data[0]);
      return row ? {
        followerCount: nonnegativeCount(row.follower_count),
        followingCount: nonnegativeCount(row.following_count),
        heroCollectionItemId: nullableText(row.hero_collection_item_id),
        isFollowedByViewer: row.is_followed_by_viewer === true,
        publicPieceCount: nonnegativeCount(row.public_piece_count),
        rarestRevealCount: nonnegativeCount(row.rarest_reveal_count),
      } : null;
    } catch {
      return null;
    }
  }

  // Test/local-client compatibility. Production service-role clients always use
  // the bounded SQL summary above so follower rows are never downloaded.
  const [followers, following, blocks] = await Promise.all([
    many(client, "sparkle_finder_collector_follows", "follower_user_id,followed_user_id", [["followed_user_id", ownerUserId]]),
    many(client, "sparkle_finder_collector_follows", "follower_user_id,followed_user_id", [["follower_user_id", ownerUserId]]),
    many(client, "sparkle_finder_collector_blocks", "blocker_user_id,blocked_user_id", []),
  ]);
  if (!followers || !following || !blocks) return null;
  const isBlocked = (left: string, right: string) => blocks.some((row) =>
    (row.blocker_user_id === left && row.blocked_user_id === right) ||
    (row.blocker_user_id === right && row.blocked_user_id === left));
  const visibleFollowers = followers.filter((row) => !isBlocked(text(row.follower_user_id), ownerUserId));
  const visibleFollowing = following.filter((row) => !isBlocked(ownerUserId, text(row.followed_user_id)));
  return {
    followerCount: visibleFollowers.length,
    followingCount: visibleFollowing.length,
    heroCollectionItemId: null,
    isFollowedByViewer: Boolean(viewerUserId && visibleFollowers.some((row) => row.follower_user_id === viewerUserId)),
    publicPieceCount: fallbackPieces.length,
    rarestRevealCount: fallbackPieces.filter(isRarest).length,
  };
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

type BoundedReadOptions = {
  cursor?: ShowcasePageCursor & { column: string };
  inFilters?: Array<[string, string[]]>;
  limit: number;
  nullFilters?: string[];
  order?: Array<[string, boolean]>;
};

async function boundedMany(
  client: SupabaseShowcaseReadClient,
  table: string,
  columns: string,
  filters: Array<[string, string | boolean]>,
  options: BoundedReadOptions,
): Promise<Record<string, unknown>[] | null> {
  try {
    let query = client.from(table).select(columns);
    for (const [column, value] of filters) query = query.eq(column, value);
    for (const [column, values] of options.inFilters ?? []) {
      if (query.in) query = query.in(column, values);
    }
    for (const column of options.nullFilters ?? []) {
      if (query.is) query = query.is(column, null);
    }
    const cursorAppliedByClient = !options.cursor || Boolean(query.or);
    if (options.cursor && query.or) {
      const { column, id, value } = options.cursor;
      query = query.or(`${column}.lt.${value},and(${column}.eq.${value},id.lt.${id})`);
    }
    for (const [column, ascending] of options.order ?? []) {
      if (query.order) query = query.order(column, { ascending });
    }
    if (query.limit && cursorAppliedByClient) query = query.limit(options.limit);
    const result = await query;
    if (result.error || !Array.isArray(result.data)) return null;
    const inFilters = options.inFilters ?? [];
    const rows = result.data.flatMap((value) => {
      const row = record(value);
      if (
        !row ||
        inFilters.some(([column, values]) => !values.includes(text(row[column]))) ||
        (options.nullFilters ?? []).some((column) => row[column] !== null && row[column] !== undefined) ||
        (options.cursor ? !isAfterDescendingCursor(row, options.cursor) : false)
      ) return [];
      return [row];
    });
    rows.sort((left, right) => compareRows(left, right, options.order ?? []));
    return rows.slice(0, Math.max(0, options.limit));
  } catch {
    return null;
  }
}

function isAfterDescendingCursor(
  row: Record<string, unknown>,
  cursor: ShowcasePageCursor & { column: string },
): boolean {
  const value = text(row[cursor.column]);
  const id = text(row.id);
  return value < cursor.value || (value === cursor.value && id < cursor.id);
}

function compareRows(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
  order: Array<[string, boolean]>,
): number {
  for (const [column, ascending] of order) {
    const leftValue = text(left[column]);
    const rightValue = text(right[column]);
    const comparison = leftValue.localeCompare(rightValue);
    if (comparison !== 0) return ascending ? comparison : -comparison;
  }
  return 0;
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
    profile: {
      customer,
      profile,
      handle,
      tagline: profile.bio || "A jewelry collection shared with Sparkle Finder.",
      followerCount: customerId === "customer-silver-sparkle-mama" ? 42 : 0,
      followingCount: customerId === "customer-silver-sparkle-mama" ? 8 : 0,
      isFollowedByViewer: customerId === "customer-silver-sparkle-mama" && viewerUserId === "customer-silver-celeste",
    },
    pieces,
    rarestReveals: pieces.filter(isRarest),
    publicPieceCount: pieces.length,
    rarestRevealCount: pieces.filter(isRarest).length,
    heroPiece: pieces.find((piece) => piece.state === "owned" && piece.showcaseStatus === "owned" && piece.isHighlighted) ?? null,
    showcaseCollections: collections,
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
    isRarestReveal: normalizeRarestRevealSelection(
      override.showcaseStatus ?? item.state,
      override.isRarestReveal ?? item.isHighlighted,
    ), note: "" };
}

function isRarest(piece: SparkleShowcasePiece) {
  return qualifiesForRarestReveals(piece);
}

function resolveShowcaseReadClient(
  suppliedClient: SupabaseShowcaseReadClient | null | undefined,
): SupabaseShowcaseReadClient | null {
  try {
    return suppliedClient === undefined
      ? createSupabaseServiceRoleClient() as unknown as SupabaseShowcaseReadClient | null
      : suppliedClient;
  } catch {
    return null;
  }
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
function nonnegativeCount(value: unknown) { return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0; }

function encodeShowcaseCursor(value: string, id: string): string {
  return Buffer.from(JSON.stringify({ id, value }), "utf8").toString("base64url");
}

function decodeShowcaseCursor(value: string | null | undefined): ShowcasePageCursor | null | undefined {
  if (!value) return null;
  try {
    if (value.length > 512) return undefined;
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Record<string, unknown>;
    const id = text(parsed.id);
    const cursorValue = text(parsed.value);
    if (!id || id.length > 100 || !/^[a-z0-9_-]+$/i.test(id) || !timestampOrEmpty(cursorValue)) return undefined;
    return { id, value: cursorValue };
  } catch {
    return undefined;
  }
}

function timestampOrEmpty(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    !Number.isNaN(Date.parse(value));
}
