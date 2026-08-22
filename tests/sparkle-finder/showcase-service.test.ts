import { describe, expect, it, vi } from "vitest";
import { getJewelryItemById } from "../../lib/sparkle-finder/service";
import {
  getPublicSparkleShowcaseByHandle,
  getRevealSpotlight,
  getRevealSpotlightForRoute,
  getSparkleShowcaseForRoute,
  getShowcaseCollectionBySlug,
  getShowcasePieceRepLeads,
  isPublicSparkleShowcaseTarget,
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
  jewelryItemId = "jewel-rainbow-crown-ring",
  profileVisibility = "sparkle_finder",
  showcaseVisibility = "public",
}: {
  blocks?: Row[];
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
  const selections: Array<{ table: string; columns: string }> = [];
  const client = {
    selections,
    from(table: string) {
      return {
        select(columns: string) {
          selections.push({ table, columns });
          return queryBuilder(tables[table] ?? []);
        },
      };
    },
  };
  return client as typeof client & SupabaseShowcaseReadClient;
}

function queryBuilder(source: Row[]) {
  const filters: Array<{ column: string; value: string | boolean }> = [];
  const filtered = () => source.filter((row) => filters.every((filter) => row[filter.column] === filter.value));
  const builder = {
    eq(column: string, value: string | boolean) { filters.push({ column, value }); return builder; },
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
