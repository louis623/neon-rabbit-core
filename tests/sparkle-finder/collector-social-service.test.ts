import { describe, expect, it } from "vitest";
import {
  getCollectorFollowSummary,
  getPersistedFollowedShowcaseHighlights,
  getPublicCollectorProfile,
  searchPersistedPublicCollectorProfiles,
  searchPublicCollectorProfiles,
} from "../../lib/sparkle-finder/collector-social-service";

describe("Collector social service", () => {
  it("searches public collector profiles by handle and display name", () => {
    expect(
      searchPublicCollectorProfiles({
        query: "sparkle",
        viewerUserId: "customer-free-marlena",
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: "customer-silver-sparkle-mama",
          handle: "sparkle-mama",
          displayName: "Sparkle Mama",
          publicPieceCount: 5,
          isFollowedByViewer: true,
        }),
      ]),
    );

    expect(
      searchPublicCollectorProfiles({
        query: "celeste",
        viewerUserId: "customer-free-marlena",
      }),
    ).toEqual([
      expect.objectContaining({
        userId: "customer-silver-celeste",
        handle: "celeste-stacks",
        displayName: "Celeste",
      }),
    ]);
  });

  it("excludes private profiles from search and direct lookup", () => {
    expect(
      searchPublicCollectorProfiles({
        query: "jules",
        viewerUserId: "customer-free-marlena",
      }),
    ).toEqual([]);

    expect(
      getPublicCollectorProfile({
        handle: "jules-private-box",
        viewerUserId: "customer-free-marlena",
      }),
    ).toBeUndefined();
  });

  it("respects blocked relationships in both directions", () => {
    expect(
      getPublicCollectorProfile({
        handle: "sparkle-mama",
        viewerUserId: "customer-silver-riley",
      }),
    ).toBeUndefined();

    expect(
      getPublicCollectorProfile({
        handle: "ivy-curates",
        viewerUserId: "customer-silver-sparkle-mama",
      }),
    ).toBeUndefined();
  });

  it("returns follower counts, following counts, and viewer follow state", () => {
    expect(
      getCollectorFollowSummary({
        userId: "customer-silver-sparkle-mama",
        viewerUserId: "customer-free-marlena",
      }),
    ).toEqual({
      followerCount: 2,
      followingCount: 1,
      isFollowedByViewer: true,
    });
  });

  it("does not leak private or blocked follow relationships in summary counts", () => {
    expect(
      getCollectorFollowSummary({
        userId: "customer-silver-sparkle-mama",
        viewerUserId: "customer-silver-riley",
      }),
    ).toEqual({
      followerCount: 0,
      followingCount: 0,
      isFollowedByViewer: false,
    });

    expect(
      getCollectorFollowSummary({
        userId: "customer-silver-jules",
        viewerUserId: "customer-silver-sparkle-mama",
      }),
    ).toEqual({
      followerCount: 0,
      followingCount: 0,
      isFollowedByViewer: false,
    });
  });

  it("limits search results deterministically", () => {
    const profiles = searchPublicCollectorProfiles({
      query: "",
      viewerUserId: "customer-free-marlena",
      limit: 2,
    });

    expect(profiles).toHaveLength(2);
    expect(profiles.map((profile) => profile.handle)).toEqual(["celeste-stacks", "ivy-curates"]);
  });

  it("does not expose private collection notes through public profiles", () => {
    const profile = getPublicCollectorProfile({
      handle: "sparkle-mama",
      viewerUserId: "customer-free-marlena",
    });

    expect(JSON.stringify(profile)).not.toContain("Private note for owner planning only");
    expect(JSON.stringify(profile)).not.toContain("Favorite centerpiece ring");
  });

  it("maps persisted collector discovery RPC rows", async () => {
    const collectors = await searchPersistedPublicCollectorProfiles({
      supabase: createCollectorReadClient({
        data: [
          {
            user_id: "user-123",
            showcase_handle: "casey-finds",
            display_name: "Casey Finds",
            showcase_tagline: "Looking for jewel tones.",
            photo_url: "https://images.example/casey.jpg",
            follower_count: 12,
            following_count: 4,
            public_piece_count: 8,
            is_followed_by_viewer: true,
            is_blocked_by_viewer: false,
          },
        ],
      }),
      query: "casey",
      limit: 6,
    });

    expect(collectors).toEqual([
      {
        userId: "user-123",
        handle: "casey-finds",
        displayName: "Casey Finds",
        tagline: "Looking for jewel tones.",
        photoUrl: "https://images.example/casey.jpg",
        showcaseUrl: "/showcase/casey-finds",
        followerCount: 12,
        followingCount: 4,
        publicPieceCount: 8,
        isFollowedByViewer: true,
        isBlockedByViewer: false,
      },
    ]);
  });

  it("returns null when persisted collector discovery fails", async () => {
    await expect(
      searchPersistedPublicCollectorProfiles({
        supabase: createCollectorReadClient({ data: [], error: { message: "rpc failed" } }),
        query: "",
      }),
    ).resolves.toBeNull();
  });

  it("maps only the strict public fields returned for followed Showcase highlights", async () => {
    const highlights = await getPersistedFollowedShowcaseHighlights({
      supabase: {
        rpc: async (functionName, args) => {
          expect(functionName).toBe("sparkle_finder_list_followed_showcase_highlights");
          expect(args).toEqual({ result_limit: 6 });
          return {
            error: null,
            data: [{
              user_id: "user-123",
              showcase_handle: "casey-finds",
              display_name: "Casey Finds",
              showcase_tagline: "Jewel tones and rare reveals.",
              photo_url: "https://images.example/casey.jpg",
              collection_item_id: "b1d5d56c-e870-4c37-8af1-c76127642ff0",
              jewelry_item_id: "jewelry-123",
              reveal_story: "I found this one on my birthday.",
              personal_photo_url: "https://images.example/reveal.jpg",
              is_rarest_reveal: true,
              updated_at: "2026-08-22T19:30:00.000Z",
              private_note: "must never be mapped",
            }],
          };
        },
      },
    });

    expect(highlights).toEqual([expect.objectContaining({
      displayName: "Casey Finds",
      showcaseUrl: "/showcase/casey-finds",
      spotlightUrl: "/showcase/casey-finds/pieces/jewelry-123",
      isRarestReveal: true,
    })]);
    expect(JSON.stringify(highlights)).not.toContain("must never be mapped");
  });

  it("fails closed when followed Showcase highlight reads fail", async () => {
    await expect(getPersistedFollowedShowcaseHighlights({
      supabase: { rpc: async () => ({ data: [], error: { message: "blocked" } }) },
    })).resolves.toBeNull();
  });
});

function createCollectorReadClient({
  data,
  error = null,
}: {
  data: unknown[];
  error?: unknown;
}) {
  return {
    rpc: async (functionName: string, args: Record<string, unknown>) => {
      expect(functionName).toBe("sparkle_finder_search_public_collectors");
      expect(args).toEqual(expect.objectContaining({ search_query: expect.any(String), result_limit: expect.any(Number) }));

      return { data, error };
    },
  };
}
