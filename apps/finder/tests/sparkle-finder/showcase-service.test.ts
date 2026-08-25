import { describe, expect, it, vi } from "vitest";
import { getJewelryItemById } from "../../lib/sparkle-finder/service";
import {
  getPublicSparkleShowcaseByHandle,
  getPublicShowcaseCommentPage,
  getPublicShowcasePiecePage,
  getRevealSpotlight,
  getRevealSpotlightForRoute,
  getSparkleShowcaseForRoute,
  getShowcaseCollectionBySlug,
  getShowcaseCollectionForRoute,
  getShowcasePieceRepLeads,
  isPublicSparkleShowcaseTarget,
  publicShowcaseReadLimits,
  type SupabaseShowcaseReadClient,
} from "../../lib/sparkle-finder/showcase-service";

describe("Sparkle Showcase service", () => {
  it("loads a public Sparkle Showcase by handle with public pieces only", async () => {
    const showcase = await fixtureShowcase();

    expect(showcase?.profile.customer.displayName).toBe("Sparkle Mama");
    expect(showcase?.profile.handle).toBe("sparkle-mama");
    expect(showcase?.pieces.every((piece) => piece.visibility === "public")).toBe(true);
    expect(showcase?.pieces.some((piece) => piece.isRarestReveal)).toBe(true);
  });

  it("keeps private notes and private pieces out of public showcase reads", async () => {
    const showcase = await fixtureShowcase();

    expect(JSON.stringify(showcase)).not.toContain("Private note");
    expect(showcase?.pieces.find((piece) => piece.showcaseStatus === "private_note_only")).toBeUndefined();
    expect(showcase?.pieces.find((piece) => piece.jewelryItemId === "jewel-starlit-crown-ring")).toBeUndefined();
  });

  it("loads The Rarest of Reveals from Diamond, Unicorn, and customer-highlighted rare pieces", async () => {
    const showcase = await fixtureShowcase();
    const rarest = showcase?.rarestReveals ?? [];

    expect(rarest).toHaveLength(2);
    expect(rarest.every((piece) => piece.state === "owned" && piece.showcaseStatus === "owned")).toBe(true);
    expect(rarest.every((piece) => piece.jewelryItem.bpLabel !== "standard" || piece.isRarestReveal)).toBe(true);
  });

  it("keeps Wishlist and Looking for pieces public without treating them as Rarest Reveals", async () => {
    const showcase = await fixtureShowcase();
    const wanted = showcase?.pieces.filter((piece) => piece.showcaseStatus === "wishlist" || piece.showcaseStatus === "iso") ?? [];

    expect(wanted).toHaveLength(2);
    expect(wanted.every((piece) => piece.isRarestReveal === false)).toBe(true);
    expect(wanted.every((piece) => !showcase?.rarestReveals.includes(piece))).toBe(true);
  });

  it.each(["sparkle-mama", "celeste-stacks", "ivy-curates", "riley-reveals"])(
    "resolves the fixture collector Showcase link for %s",
    async (handle) => {
      await expect(getPublicSparkleShowcaseByHandle(handle, fixtureOptions())).resolves.toBeDefined();
    },
  );

  it("loads one Showcase Collection by slug", async () => {
    const collection = await getShowcaseCollectionBySlug("sparkle-mama", "never-leaving", fixtureOptions());

    expect(collection?.title).toBe("Never Leaving");
    expect(collection?.pieces.length).toBeGreaterThan(0);
    expect(collection?.pieces.every((piece) => piece.visibility === "public")).toBe(true);
  });

  it("loads a shareable Reveal Spotlight with visible comments only", async () => {
    const spotlight = await getRevealSpotlight("sparkle-mama", "jewel-rainbow-crown-ring", fixtureOptions());

    expect(spotlight?.piece.jewelryItem.name).toBe("Rainbow Crown Ring");
    expect(spotlight?.comments.length).toBeGreaterThan(0);
    expect(JSON.stringify(spotlight)).not.toContain("Deleted comment should stay hidden");
  });

  it("returns dancer leads for wanted showcase pieces", async () => {
    const spotlight = await getRevealSpotlight("sparkle-mama", "jewel-rainbow-crown-ring", fixtureOptions());

    expect(spotlight).toBeDefined();
    expect(getShowcasePieceRepLeads(spotlight!.piece)).toContainEqual(
      expect.objectContaining({
        matchType: "exact_item",
        jewelryItemId: "jewel-rainbow-crown-ring",
      }),
    );
  });

  it("loads a real public Showcase from persisted rows with strict public fields", async () => {
    const client = persistedClient();
    const showcase = await getPublicSparkleShowcaseByHandle("real-sparkles", {
      allowFixtureFallback: false,
      catalogItemById: persistedCatalogItem,
      supabase: client,
      viewerUserId: "viewer-user",
    });

    expect(showcase?.profile.customer).toEqual(expect.objectContaining({ id: "owner-user", displayName: "Real Collector" }));
    expect(showcase?.pieces.map((piece) => piece.id)).toEqual(["public-piece"]);
    expect(showcase?.showcaseCollections[0]).toEqual(expect.objectContaining({ slug: "favorites", pieceIds: ["public-piece"] }));
    expect(showcase?.comments.map((comment) => comment.body)).toEqual(["Public celebration"]);
    expect(showcase?.profile).toEqual(expect.objectContaining({ followerCount: 1, followingCount: 1, isFollowedByViewer: true }));
    expect(JSON.stringify(showcase)).not.toContain("owner-private-note");
    expect(client.selections.find((selection) => selection.table === "sparkle_finder_collection_items")?.columns).not.toContain("note");
    expect(client.selections.find((selection) => selection.table === "sparkle_finder_profiles")?.columns).not.toContain("email");
    expect(client.selections.some((selection) => selection.table === "sparkle_finder_collector_follows")).toBe(false);
  });

  it("validates action targets through the server-only public field boundary", async () => {
    const client = persistedClient();

    await expect(isPublicSparkleShowcaseTarget({
      showcaseUserId: "owner-user",
      supabase: client,
    })).resolves.toBe(true);
    await expect(isPublicSparkleShowcaseTarget({
      collectionItemId: "public-piece",
      showcaseUserId: "owner-user",
      supabase: client,
    })).resolves.toBe(true);
    await expect(isPublicSparkleShowcaseTarget({
      collectionItemId: "private-note-piece",
      showcaseUserId: "owner-user",
      supabase: client,
    })).resolves.toBe(false);
    await expect(isPublicSparkleShowcaseTarget({
      showcaseUserId: "owner-user",
      supabase: null,
    })).resolves.toBe(false);
    await expect(isPublicSparkleShowcaseTarget({
      showcaseUserId: "owner-user",
      supabase: throwingClient(),
    })).resolves.toBe(false);

    expect(client.selections.find((selection) => selection.table === "sparkle_finder_collection_items" && selection.columns.includes("showcase_status"))?.columns)
      .not.toContain("note");
  });

  it("loads persisted piece comments only for a public Reveal Spotlight", async () => {
    const spotlight = await getRevealSpotlight("real-sparkles", "jewel-rainbow-crown-ring", {
      allowFixtureFallback: false,
      catalogItemById: persistedCatalogItem,
      supabase: persistedClient(),
      viewerUserId: "viewer-user",
    });

    expect(spotlight?.comments.map((comment) => comment.body)).toEqual(["A persisted piece comment"]);
  });

  it("bounds initial payloads, batches joins and authors, and keeps stable newest-first ordering", async () => {
    const extraPieces = Array.from({ length: 30 }, (_, index) => persistedPieceRow(index));
    const heroOutsidePage = {
      ...persistedPieceRow(90),
      id: "hero-outside-page",
      jewelry_item_id: "hero-catalog-piece",
      is_highlighted: true,
      is_rarest_reveal: true,
      updated_at: "2020-01-01T00:00:00.000Z",
    };
    const extraCollections = Array.from({ length: 15 }, (_, index) => ({
      id: `collection-${index.toString().padStart(2, "0")}`,
      user_id: "owner-user",
      title: `Collection ${index}`,
      slug: `collection-${index}`,
      description: "Bounded collection",
      visibility: "public",
      created_at: `2026-07-${(index + 1).toString().padStart(2, "0")}T12:00:00.000Z`,
    }));
    const extraJoins = extraCollections.map((collection, index) => ({
      showcase_collection_id: collection.id,
      collection_item_id: extraPieces[index].id,
    }));
    const extraComments = Array.from({ length: 25 }, (_, index) => ({
      id: `comment-${index.toString().padStart(2, "0")}`,
      showcase_user_id: "owner-user",
      author_user_id: index % 2 === 0 ? "viewer-user" : "author-two",
      target_type: "showcase",
      target_id: "owner-user",
      body: `Comment ${index}`,
      deleted_at: null,
      created_at: `2026-08-${(index + 1).toString().padStart(2, "0")}T12:00:00.000Z`,
      updated_at: `2026-08-${(index + 1).toString().padStart(2, "0")}T12:00:00.000Z`,
    }));
    const client = persistedClient({ heroCollectionItemId: "hero-outside-page", extraRows: {
      sparkle_finder_collection_items: [...extraPieces, heroOutsidePage],
      sparkle_finder_profiles: [{ user_id: "author-two", display_name: "Second Author", profile_visibility: "sparkle_finder" }],
      sparkle_finder_showcase_collection_items: extraJoins,
      sparkle_finder_showcase_collections: extraCollections,
      sparkle_finder_showcase_comments: extraComments,
    } });

    const showcase = await getPublicSparkleShowcaseByHandle("real-sparkles", {
      allowFixtureFallback: false,
      catalogItemById: boundedCatalogItem,
      supabase: client,
      viewerUserId: "viewer-user",
    });

    expect(showcase?.pieces).toHaveLength(publicShowcaseReadLimits.pieces);
    expect(showcase?.publicPieceCount).toBe(32);
    expect(showcase?.rarestRevealCount).toBe(2);
    expect(showcase?.heroPiece?.id).toBe("hero-outside-page");
    expect(showcase?.pieces.map((piece) => piece.id)).not.toContain("hero-outside-page");
    expect(showcase?.showcaseCollections.length).toBeLessThanOrEqual(publicShowcaseReadLimits.collections);
    expect(showcase?.comments).toHaveLength(publicShowcaseReadLimits.comments);
    expect(showcase?.comments[0].body).toBe("Comment 24");
    expect(client.selections.filter((selection) => selection.table === "sparkle_finder_showcase_collection_items")).toHaveLength(1);
    const authorRead = client.selections.find((selection) =>
      selection.table === "sparkle_finder_profiles" && selection.inFilters.some(([column]) => column === "user_id"));
    expect(authorRead?.inFilters[0][1].sort()).toEqual(["author-two", "viewer-user"]);
    expect(client.selections.find((selection) => selection.table === "sparkle_finder_collection_items")?.limit).toBe(publicShowcaseReadLimits.pieces);
    expect(client.selections.find((selection) => selection.table === "sparkle_finder_collection_items")?.inFilters).toEqual(expect.arrayContaining([
      ["state", ["owned", "wishlist"]],
      ["showcase_status", ["owned", "wishlist", "iso"]],
    ]));
  });

  it("uses exact target reads so detail routes resolve items beyond profile-page caps", async () => {
    const distantPiece = persistedPieceRow(40);
    const distantCollection = {
      id: "collection-distant", user_id: "owner-user", title: "Distant", slug: "distant",
      description: "Past the profile cap", visibility: "public", created_at: "2025-01-01T00:00:00.000Z",
    };
    const client = persistedClient({ extraRows: {
      sparkle_finder_collection_items: [distantPiece, ...Array.from({ length: 30 }, (_, index) => persistedPieceRow(index))],
      sparkle_finder_showcase_collection_items: [{ showcase_collection_id: distantCollection.id, collection_item_id: distantPiece.id }],
      sparkle_finder_showcase_collections: [distantCollection, ...Array.from({ length: 15 }, (_, index) => ({
        id: `other-${index}`, user_id: "owner-user", title: `Other ${index}`, slug: `other-${index}`,
        description: "Other", visibility: "public", created_at: `2026-08-${(index + 1).toString().padStart(2, "0")}T00:00:00.000Z`,
      }))],
    } });

    const spotlight = await getRevealSpotlightForRoute("real-sparkles", String(distantPiece.jewelry_item_id), {
      allowFixtureFallback: false, catalogItemById: boundedCatalogItem, supabase: client,
    });
    const collection = await getShowcaseCollectionForRoute("real-sparkles", "distant", {
      allowFixtureFallback: false, catalogItemById: boundedCatalogItem, supabase: client,
    });

    expect(spotlight?.spotlight.piece.id).toBe(distantPiece.id);
    expect(collection?.collection.pieceIds).toEqual([distantPiece.id]);
  });

  it("paginates public pieces with an opaque stable cursor and no gaps or duplicates", async () => {
    const extraPieces = Array.from({ length: 30 }, (_, index) => persistedPieceRow(index));
    const client = persistedClient({ extraRows: { sparkle_finder_collection_items: extraPieces } });
    const options = { allowFixtureFallback: false, catalogItemById: boundedCatalogItem, supabase: client } as const;

    const first = await getPublicShowcasePiecePage("real-sparkles", options);
    const second = await getPublicShowcasePiecePage("real-sparkles", { ...options, cursor: first?.nextCursor });
    const ids = [...(first?.items ?? []), ...(second?.items ?? [])].map((piece) => piece.id);

    expect(first?.items).toHaveLength(publicShowcaseReadLimits.pieces);
    expect(first?.nextCursor).toEqual(expect.any(String));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("piece-00");
    expect(ids).toContain("piece-29");
    await expect(getPublicShowcasePiecePage("real-sparkles", { ...options, cursor: "not-a-cursor" })).resolves.toBeUndefined();
    expect(client.selections.filter((selection) => selection.table === "sparkle_finder_collection_items").some(
      (selection) => selection.limit === publicShowcaseReadLimits.pieces + 1,
    )).toBe(true);
  });

  it("paginates permitted Showcase comments without duplicates and reapplies viewer-author blocks", async () => {
    const comments = Array.from({ length: 25 }, (_, index) => ({
      id: `page-comment-${index.toString().padStart(2, "0")}`,
      showcase_user_id: "owner-user",
      author_user_id: index === 24 ? "blocked-author" : "viewer-user",
      target_type: "showcase",
      target_id: "owner-user",
      body: `Page comment ${index}`,
      deleted_at: null,
      created_at: `2026-08-${(index + 1).toString().padStart(2, "0")}T12:00:00.000Z`,
      updated_at: `2026-08-${(index + 1).toString().padStart(2, "0")}T12:00:00.000Z`,
    }));
    const client = persistedClient({
      blocks: [{ blocker_user_id: "viewer-user", blocked_user_id: "blocked-author" }],
      extraRows: {
        sparkle_finder_profiles: [{ user_id: "blocked-author", display_name: "Blocked", profile_visibility: "sparkle_finder" }],
        sparkle_finder_showcase_comments: comments,
      },
    });
    const options = { allowFixtureFallback: false, supabase: client, viewerUserId: "viewer-user" } as const;
    const target = { id: "owner-user", type: "showcase" as const };

    const first = await getPublicShowcaseCommentPage("real-sparkles", target, options);
    const second = await getPublicShowcaseCommentPage("real-sparkles", target, { ...options, cursor: first?.nextCursor });
    const items = [...(first?.items ?? []), ...(second?.items ?? [])];

    expect(first?.items).toHaveLength(publicShowcaseReadLimits.comments);
    expect(first?.nextCursor).toEqual(expect.any(String));
    expect(new Set(items.map((comment) => comment.id)).size).toBe(items.length);
    expect(items.map((comment) => comment.body)).not.toContain("Page comment 24");
  });

  it.each([
    { blocker_user_id: "viewer-user", blocked_user_id: "author-two" },
    { blocker_user_id: "author-two", blocked_user_id: "viewer-user" },
  ])("suppresses a blocked comment author for the signed-in viewer without hiding the Showcase", async (block) => {
    const client = persistedClient({
      blocks: [block],
      extraRows: {
        sparkle_finder_profiles: [{ user_id: "author-two", display_name: "Blocked Author", profile_visibility: "sparkle_finder" }],
        sparkle_finder_showcase_comments: [{
          id: "blocked-author-comment", showcase_user_id: "owner-user", author_user_id: "author-two",
          target_type: "showcase", target_id: "owner-user", body: "Must stay hidden", deleted_at: null,
          created_at: "2026-08-20T12:00:00.000Z", updated_at: "2026-08-20T12:00:00.000Z",
        }],
      },
    });
    const showcase = await getPublicSparkleShowcaseByHandle("real-sparkles", {
      allowFixtureFallback: false, catalogItemById: persistedCatalogItem, supabase: client, viewerUserId: "viewer-user",
    });
    expect(showcase).toBeDefined();
    expect(showcase?.comments.map((comment) => comment.body)).not.toContain("Must stay hidden");
  });

  it("resolves real Sparkle Suite catalog ids instead of requiring a fixture jewelry id", async () => {
    const showcase = await getPublicSparkleShowcaseByHandle("real-sparkles", {
      allowFixtureFallback: false,
      catalogItemById: async (itemId) => itemId === "suite-design-real" ? {
        id: itemId,
        name: "Real API Ring",
        collectionName: "Live Catalog",
        jewelryType: "ring",
        imageUrl: "https://example.com/real-ring.jpg",
        bpLabel: "standard",
        itemNumber: "REAL-1",
        knownRepListingIds: [],
      } : undefined,
      supabase: persistedClient({ jewelryItemId: "suite-design-real" }),
    });

    expect(showcase?.pieces[0]).toEqual(expect.objectContaining({
      jewelryItemId: "suite-design-real",
      jewelryItem: expect.objectContaining({ name: "Real API Ring" }),
    }));
  });

  it.each([
    { blocker_user_id: "owner-user", blocked_user_id: "viewer-user" },
    { blocker_user_id: "viewer-user", blocked_user_id: "owner-user" },
  ])("suppresses the entire persisted Showcase across a block in either direction", async (block) => {
    await expect(getPublicSparkleShowcaseByHandle("real-sparkles", {
      allowFixtureFallback: false,
      catalogItemById: persistedCatalogItem,
      supabase: persistedClient({ blocks: [block] }),
      viewerUserId: "viewer-user",
    })).resolves.toBeUndefined();
  });

  it("does not fall back to fixture customers when production fallback is disabled", async () => {
    await expect(getPublicSparkleShowcaseByHandle("sparkle-mama", {
      allowFixtureFallback: false,
      catalogItemById: persistedCatalogItem,
      supabase: persistedClient(),
    })).resolves.toBeUndefined();
  });

  it("allows only the persisted owner to preview a real private Showcase", async () => {
    const client = persistedClient({ showcaseVisibility: "private", profileVisibility: "private" });

    const ownerRoute = await getSparkleShowcaseForRoute("real-sparkles", {
      allowFixtureFallback: false,
      catalogItemById: persistedCatalogItem,
      supabase: client,
      viewerUserId: "owner-user",
    });
    expect(ownerRoute?.access).toBe("owner_private_preview");
    expect(ownerRoute?.showcase.comments).toEqual([]);
    expect(ownerRoute?.showcase.profile).toEqual(expect.objectContaining({ followerCount: 0, followingCount: 0 }));
    expect(client.selections.some((selection) => selection.table === "sparkle_finder_showcase_comments")).toBe(false);
    expect(client.selections.some((selection) => selection.table === "sparkle_finder_collector_follows")).toBe(false);
    expect(client.selections.some((selection) => selection.table === "sparkle_finder_collector_blocks")).toBe(false);

    await expect(getSparkleShowcaseForRoute("real-sparkles", {
      allowFixtureFallback: false,
      catalogItemById: persistedCatalogItem,
      supabase: client,
      viewerUserId: "viewer-user",
    })).resolves.toBeUndefined();
    await expect(getSparkleShowcaseForRoute("unknown-handle", {
      allowFixtureFallback: false,
      catalogItemById: persistedCatalogItem,
      supabase: client,
      viewerUserId: "owner-user",
    })).resolves.toBeUndefined();
    await expect(getRevealSpotlightForRoute("real-sparkles", "unknown-piece", {
      allowFixtureFallback: false,
      catalogItemById: persistedCatalogItem,
      supabase: client,
      viewerUserId: "owner-user",
    })).resolves.toBeUndefined();

    await expect(getSparkleShowcaseForRoute("real-sparkles", {
      allowFixtureFallback: false,
      catalogItemById: persistedCatalogItem,
      supabase: persistedClient({ profileVisibility: "private", showcaseVisibility: "public" }),
      viewerUserId: "owner-user",
    })).resolves.toEqual(expect.objectContaining({ access: "owner_private_preview" }));
  });

  it("hard-disables fixture fallback in production even when explicitly requested", async () => {
    vi.stubEnv("NODE_ENV", "production");
    try {
      await expect(getPublicSparkleShowcaseByHandle("sparkle-mama", {
        allowFixtureFallback: true,
        supabase: null,
      })).resolves.toBeUndefined();
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("allows fixtures in an explicit local production-build smoke without enabling Vercel production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SPARKLE_FINDER_LOCAL_SMOKE_FIXTURES", "true");
    vi.stubEnv("VERCEL_ENV", "preview");
    try {
      await expect(getPublicSparkleShowcaseByHandle("sparkle-mama", {
        allowFixtureFallback: true,
        supabase: null,
      })).resolves.toBeDefined();

      vi.stubEnv("VERCEL_ENV", "production");
      await expect(getPublicSparkleShowcaseByHandle("sparkle-mama", {
        allowFixtureFallback: true,
        supabase: null,
      })).resolves.toBeUndefined();
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

function fixtureOptions() {
  return { allowFixtureFallback: true, supabase: null } as const;
}

function persistedCatalogItem(itemId: string) {
  return Promise.resolve(getJewelryItemById(itemId));
}

function throwingClient(): SupabaseShowcaseReadClient {
  return {
    from() {
      throw new Error("read unavailable");
    },
  } as SupabaseShowcaseReadClient;
}

function fixtureShowcase() {
  return getPublicSparkleShowcaseByHandle("sparkle-mama", fixtureOptions());
}

type Row = Record<string, unknown>;

function persistedClient({
  blocks = [],
  extraRows = {},
  heroCollectionItemId = null,
  jewelryItemId = "jewel-rainbow-crown-ring",
  profileVisibility = "sparkle_finder",
  showcaseVisibility = "public",
}: {
  blocks?: Row[];
  extraRows?: Partial<Record<string, Row[]>>;
  heroCollectionItemId?: string | null;
  jewelryItemId?: string;
  profileVisibility?: "private" | "sparkle_finder";
  showcaseVisibility?: "private" | "public";
} = {}) {
  const tables: Record<string, Row[]> = {
    sparkle_finder_profiles: [
      {
        user_id: "owner-user", display_name: "Real Collector", state: "VA", tiktok_handle: "@real",
        bio: "Collector bio", photo_url: null, profile_visibility: profileVisibility,
        showcase_handle: "real-sparkles", showcase_tagline: "Real persisted sparkle.", showcase_visibility: showcaseVisibility,
        hero_collection_item_id: heroCollectionItemId,
      },
      { user_id: "viewer-user", display_name: "Viewing Collector", profile_visibility: "sparkle_finder" },
    ],
    sparkle_finder_collection_items: [
      {
        id: "public-piece", user_id: "owner-user", jewelry_item_id: jewelryItemId,
        state: "owned", is_highlighted: true, visibility: "public", showcase_status: "owned",
        reveal_story: "A real persisted reveal.", personal_photo_url: null, is_rarest_reveal: true,
      },
      {
        id: "private-piece", user_id: "owner-user", jewelry_item_id: "jewel-starlit-crown-ring",
        state: "owned", note: "owner-private-note", visibility: "private", showcase_status: "owned",
      },
      {
        id: "private-note-piece", user_id: "owner-user", jewelry_item_id: "jewel-lilac-dream-ring",
        state: "private_note_only", visibility: "public", showcase_status: "private_note_only",
      },
    ],
    sparkle_finder_showcase_collections: [
      { id: "public-collection", user_id: "owner-user", title: "Favorites", slug: "favorites", description: "Public set", visibility: "public" },
      { id: "private-collection", user_id: "owner-user", title: "Private", slug: "private", description: "Hidden", visibility: "private" },
    ],
    sparkle_finder_showcase_collection_items: [
      { showcase_collection_id: "public-collection", collection_item_id: "public-piece" },
      { showcase_collection_id: "public-collection", collection_item_id: "private-piece" },
    ],
    sparkle_finder_showcase_comments: [
      {
        id: "public-comment", showcase_user_id: "owner-user", author_user_id: "viewer-user",
        target_type: "showcase", target_id: "owner-user", body: "Public celebration", deleted_at: null,
        created_at: "2026-08-01T12:00:00.000Z", updated_at: "2026-08-01T12:00:00.000Z",
      },
      {
        id: "deleted-comment", showcase_user_id: "owner-user", author_user_id: "viewer-user",
        target_type: "showcase", target_id: "owner-user", body: "Deleted secret", deleted_at: "2026-08-02T12:00:00.000Z",
        created_at: "2026-08-01T12:00:00.000Z", updated_at: "2026-08-02T12:00:00.000Z",
      },
      {
        id: "piece-comment", showcase_user_id: "owner-user", author_user_id: "viewer-user",
        target_type: "piece", target_id: "public-piece", body: "A persisted piece comment", deleted_at: null,
        created_at: "2026-08-03T12:00:00.000Z", updated_at: "2026-08-03T12:00:00.000Z",
      },
    ],
    sparkle_finder_collector_follows: [
      { follower_user_id: "viewer-user", followed_user_id: "owner-user" },
      { follower_user_id: "owner-user", followed_user_id: "other-user" },
    ],
    sparkle_finder_collector_blocks: blocks,
  };
  for (const [table, rows] of Object.entries(extraRows)) {
    tables[table] = [...(tables[table] ?? []), ...(rows ?? [])];
  }
  const selections: Array<{
    columns: string;
    filters: Array<[string, string | boolean | null]>;
    inFilters: Array<[string, string[]]>;
    limit?: number;
    orders: Array<[string, boolean]>;
    table: string;
  }> = [];
  const client = {
    selections,
    rpc: async (functionName: string) => {
      if (functionName !== "sparkle_finder_get_public_showcase_social_summary") return { data: null, error: new Error("unknown rpc") };
      const blockRows = tables.sparkle_finder_collector_blocks;
      const blocked = (left: string, right: string) => blockRows.some((row) =>
        (row.blocker_user_id === left && row.blocked_user_id === right) ||
        (row.blocker_user_id === right && row.blocked_user_id === left));
      const follows = tables.sparkle_finder_collector_follows;
      const publicPieces = tables.sparkle_finder_collection_items.filter((row) =>
        row.user_id === "owner-user" && row.visibility === "public" &&
        ["owned", "wishlist"].includes(String(row.state)) &&
        ["owned", "wishlist", "iso"].includes(String(row.showcase_status)));
      return { data: [{
        follower_count: follows.filter((row) => row.followed_user_id === "owner-user" && !blocked(String(row.follower_user_id), "owner-user")).length,
        following_count: follows.filter((row) => row.follower_user_id === "owner-user" && !blocked("owner-user", String(row.followed_user_id))).length,
        is_followed_by_viewer: follows.some((row) => row.follower_user_id === "viewer-user" && row.followed_user_id === "owner-user") && !blocked("viewer-user", "owner-user"),
        public_piece_count: publicPieces.length,
        rarest_reveal_count: publicPieces.filter((row) => row.state === "owned" && row.showcase_status === "owned" && row.is_rarest_reveal === true).length,
        hero_collection_item_id: heroCollectionItemId,
      }], error: null };
    },
    from(table: string) {
      return {
        select(columns: string) {
          const selection = { table, columns, filters: [], inFilters: [], orders: [] } as (typeof selections)[number];
          selections.push(selection);
          return queryBuilder(tables[table] ?? [], selection);
        },
      };
    },
  };
  return client as typeof client & SupabaseShowcaseReadClient;
}

function queryBuilder(
  source: Row[],
  selection: {
    filters: Array<[string, string | boolean | null]>;
    inFilters: Array<[string, string[]]>;
    limit?: number;
    orders: Array<[string, boolean]>;
  },
) {
  const filters: Array<{ column: string; value: string | boolean }> = [];
  const inFilters: Array<{ column: string; values: string[] }> = [];
  const nullFilters: string[] = [];
  const orders: Array<{ ascending: boolean; column: string }> = [];
  let resultLimit: number | undefined;
  const filtered = () => {
    const rows = source.filter((row) =>
      filters.every((filter) => row[filter.column] === filter.value) &&
      inFilters.every((filter) => filter.values.includes(String(row[filter.column]))) &&
      nullFilters.every((column) => row[column] === null || row[column] === undefined));
    rows.sort((left, right) => {
      for (const order of orders) {
        const comparison = String(left[order.column] ?? "").localeCompare(String(right[order.column] ?? ""));
        if (comparison !== 0) return order.ascending ? comparison : -comparison;
      }
      return 0;
    });
    return resultLimit === undefined ? rows : rows.slice(0, resultLimit);
  };
  const builder = {
    eq(column: string, value: string | boolean) { filters.push({ column, value }); selection.filters.push([column, value]); return builder; },
    in(column: string, values: string[]) { inFilters.push({ column, values }); selection.inFilters.push([column, values]); return builder; },
    is(column: string, value: null) { nullFilters.push(column); selection.filters.push([column, value]); return builder; },
    limit(count: number) { resultLimit = count; selection.limit = count; return builder; },
    order(column: string, options: { ascending?: boolean } = {}) {
      const ascending = options.ascending ?? true;
      orders.push({ column, ascending });
      selection.orders.push([column, ascending]);
      return builder;
    },
    maybeSingle: async () => ({ data: filtered()[0] ?? null, error: null }),
    then<TResult1 = { data: Row[]; error: null }, TResult2 = never>(
      onfulfilled?: ((value: { data: Row[]; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ) {
      return Promise.resolve({ data: filtered(), error: null }).then(onfulfilled, onrejected);
    },
  };
  return builder;
}

function persistedPieceRow(index: number): Row {
  const suffix = index.toString().padStart(2, "0");
  return {
    id: `piece-${suffix}`,
    user_id: "owner-user",
    jewelry_item_id: `catalog-piece-${suffix}`,
    state: "owned",
    is_highlighted: false,
    visibility: "public",
    showcase_status: "owned",
    reveal_story: `Story ${index}`,
    personal_photo_url: null,
    is_rarest_reveal: false,
    updated_at: `2026-08-${((index % 28) + 1).toString().padStart(2, "0")}T12:00:00.000Z`,
  };
}

function boundedCatalogItem(itemId: string) {
  return Promise.resolve({
    id: itemId,
    name: `Catalog ${itemId}`,
    collectionName: "Bounded Reads",
    jewelryType: "ring" as const,
    imageUrl: "/fixtures/jewelry/rainbow-crown-ring.jpg",
    bpLabel: "standard" as const,
    itemNumber: itemId,
    knownRepListingIds: [],
  });
}
