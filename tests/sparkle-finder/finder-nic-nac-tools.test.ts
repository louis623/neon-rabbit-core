import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildFinderNicNacTools } from "../../lib/sparkle-finder/nic-nac/tools";
import {
  getFinderAvailabilityForJewelryItem,
  getFinderLiveShows,
} from "../../lib/sparkle-finder/catalog-service";

vi.mock("../../lib/sparkle-finder/catalog-service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/sparkle-finder/catalog-service")>();

  return {
    ...actual,
    getFinderAvailabilityForJewelryItem: vi.fn(),
    getFinderLiveShows: vi.fn(),
  };
});

const getFinderAvailabilityForJewelryItemMock = vi.mocked(getFinderAvailabilityForJewelryItem);
const getFinderLiveShowsMock = vi.mocked(getFinderLiveShows);

describe("Sparkle Finder Nic-Nac tools", () => {
  beforeEach(() => {
    getFinderAvailabilityForJewelryItemMock.mockReset();
    getFinderLiveShowsMock.mockReset();
  });

  it("finds bounded Sparkle Suite availability leads for a jewelry item", async () => {
    getFinderAvailabilityForJewelryItemMock.mockResolvedValue({
      requestedItem: {
        id: "design-er13229",
        name: "The Florence Earrings",
        collectionName: "Sterling Club",
        collectionYear: 2026,
        jewelryType: "earrings",
        material: "Silver",
        mainStone: "Cubic zirconia",
        bpMsrp: 19.95,
        imageUrl: "https://cdn.example.test/er13229.jpg",
        bpLabel: "standard",
        itemNumber: "ER13229",
        searchTags: ["florence"],
        availableListingCount: 2,
        knownRepListingIds: [],
      },
      exactMatches: [
        {
          listingId: "listing-er13229-bling",
          listedAt: "2026-06-21T20:00:00.000Z",
          photoUrl: "https://cdn.example.test/listing-er13229.jpg",
          item: {
            id: "design-er13229",
            name: "The Florence Earrings",
            collectionName: "Sterling Club",
            collectionYear: 2026,
            jewelryType: "earrings",
            material: "Silver",
            mainStone: "Cubic zirconia",
            bpMsrp: 19.95,
            imageUrl: "https://cdn.example.test/er13229.jpg",
            bpLabel: "standard",
            itemNumber: "ER13229",
            searchTags: ["florence"],
            availableListingCount: 2,
            knownRepListingIds: [],
          },
          showName: "BlingKitchen Glow Night",
          repFirstName: "Brittany",
          customerSiteUrl: "https://bling.example.test",
          nextShow: {
            showId: "show-bling-tonight",
            showName: "BlingKitchen Glow Night",
            repFirstName: "Brittany",
            startsAt: "2026-06-22T23:00:00.000Z",
            status: "scheduled",
            customerSiteUrl: "https://bling.example.test",
          },
        },
      ],
      similarMatches: [
        {
          listingId: "listing-er13230-bling",
          listedAt: "2026-06-21T20:05:00.000Z",
          photoUrl: "https://cdn.example.test/listing-er13230.jpg",
          item: {
            id: "design-er13230",
            name: "The Florence Sister Earrings",
            collectionName: "Sterling Club",
            collectionYear: 2026,
            jewelryType: "earrings",
            material: "Silver",
            mainStone: "Cubic zirconia",
            bpMsrp: 19.95,
            imageUrl: "https://cdn.example.test/er13230.jpg",
            bpLabel: "standard",
            itemNumber: "ER13230",
            searchTags: ["florence"],
            availableListingCount: 1,
            knownRepListingIds: [],
          },
          showName: "BlingKitchen Glow Night",
          repFirstName: "Brittany",
          customerSiteUrl: "https://bling.example.test",
          nextShow: {
            showId: "show-bling-tonight",
            showName: "BlingKitchen Glow Night",
            repFirstName: "Brittany",
            startsAt: "2026-06-22T23:00:00.000Z",
            status: "scheduled",
            customerSiteUrl: "https://bling.example.test",
          },
        },
      ],
    });
    const tools = buildFinderNicNacTools(
      {
        userId: "customer-silver-celeste",
      },
      ["availability"],
    );

    const result = await executeTool(tools.find_rep_board_availability, {
      itemId: " design-er13229 ",
      limit: 1,
    });

    expect(getFinderAvailabilityForJewelryItemMock).toHaveBeenCalledWith("design-er13229", {
      limit: 1,
      useFixtureFallback: false,
    });
    expect(result).toEqual({
      status: "connected",
      item: {
        id: "design-er13229",
        itemNumber: "ER13229",
        name: "The Florence Earrings",
        collectionName: "Sterling Club",
        jewelryType: "earrings",
        availableListingCount: 2,
      },
      count: 2,
      leads: [
        {
          matchType: "exact_item",
          listingId: "listing-er13229-bling",
          listedAt: "2026-06-21T20:00:00.000Z",
          itemId: "design-er13229",
          itemNumber: "ER13229",
          itemName: "The Florence Earrings",
          collectionName: "Sterling Club",
          jewelryType: "earrings",
          photoUrl: "https://cdn.example.test/listing-er13229.jpg",
          repFirstName: "Brittany",
          showName: "BlingKitchen Glow Night",
          nextShowAt: "2026-06-22T23:00:00.000Z",
          nextShowStatus: "scheduled",
          customerSiteUrl: "https://bling.example.test",
        },
      ],
      guidance:
        "Use availability leads for rep board and next-show discovery only. Do not mutate Sparkle Suite Trade Boards from Finder.",
    });
  });

  it("lists upcoming Sparkle Suite live shows through Finder-safe discovery", async () => {
    getFinderLiveShowsMock.mockResolvedValue([
      {
        showId: "show-bling-tonight",
        showName: "BlingKitchen Glow Night",
        repFirstName: "Brittany",
        startsAt: "2026-06-22T23:00:00.000Z",
        status: "scheduled",
        customerSiteUrl: "https://bling.example.test",
      },
      {
        showId: "show-sparkle-brunch",
        showName: "Sparkle Brunch",
        repFirstName: "Kelli",
        startsAt: "2026-06-23T15:00:00.000Z",
        status: "live",
        customerSiteUrl: "https://kelli.example.test",
      },
    ]);
    const tools = buildFinderNicNacTools(
      {
        userId: "customer-silver-celeste",
      },
      ["availability"],
    );

    const result = await executeTool(tools.list_upcoming_live_shows, { limit: 1 });

    expect(getFinderLiveShowsMock).toHaveBeenCalledWith({
      limit: 1,
      useFixtureFallback: false,
    });
    expect(result).toEqual({
      status: "connected",
      count: 2,
      shows: [
        {
          showId: "show-bling-tonight",
          showName: "BlingKitchen Glow Night",
          repFirstName: "Brittany",
          startsAt: "2026-06-22T23:00:00.000Z",
          status: "scheduled",
          customerSiteUrl: "https://bling.example.test",
        },
      ],
      guidance:
        "Use live shows for public rep discovery and timing context only. Do not schedule or edit Sparkle Suite shows from Finder.",
    });
  });

  it("lists persisted favorite reps with bounded show and board context", async () => {
    const supabase = createFavoriteRepSupabase();
    const tools = buildFinderNicNacTools(
      {
        supabase,
        userId: "customer-silver-celeste",
      },
      ["rep_discovery"],
    );

    const result = await executeTool(tools.list_favorite_reps, { limit: 1 });

    expect(result).toEqual({
      status: "connected",
      count: 2,
      reps: [
        {
          repId: "rep-sierra",
          displayName: "Lindsay Lucas",
          nextShowAt: "2026-05-30T11:00:00-04:00",
          nextShowTitle: "Celestial Lights Preview",
          boardItemCount: 1,
          hasBoardPath: true,
          hasRepPath: true,
        },
      ],
      guidance: "Use favorite reps for rep-first discovery, show timing, and board shortcuts only.",
    });
  });

  it("finds persisted public Showcase collectors through the bounded RPC", async () => {
    const supabase = createCollectorSupabase([
      {
        user_id: "customer-silver-riley",
        showcase_handle: "Riley-Reveals",
        display_name: "Riley",
        showcase_tagline: "Stacks with reveal stories.",
        photo_url: "https://example.test/riley.jpg",
        follower_count: 8,
        following_count: 3,
        public_piece_count: 12,
        is_followed_by_viewer: true,
        is_blocked_by_viewer: false,
      },
    ]);
    const tools = buildFinderNicNacTools({ supabase, userId: "customer-silver-celeste" }, ["social"]);

    const result = await executeTool(tools.find_public_showcases, { query: " Riley " });

    expect(supabase.rpc).toHaveBeenCalledWith("sparkle_finder_search_public_collectors", {
      search_query: "riley",
      result_limit: 8,
    });
    expect(result).toMatchObject({
      status: "connected",
      query: "Riley",
      collectors: [
        {
          userId: "customer-silver-riley",
          handle: "riley-reveals",
          displayName: "Riley",
          showcaseUrl: "/showcase/riley-reveals",
          isFollowedByViewer: true,
        },
      ],
    });
    expect(result.guidance).toContain("Do not suggest buying from members, DMs, friend requests, trading");
  });

  it("lists only followed collectors from the bounded public collector read model", async () => {
    const supabase = createCollectorSupabase([
      {
        user_id: "customer-silver-riley",
        showcase_handle: "riley-reveals",
        display_name: "Riley",
        public_piece_count: 12,
        is_followed_by_viewer: true,
      },
      {
        user_id: "customer-silver-ivy",
        showcase_handle: "ivy-curates",
        display_name: "Ivy",
        public_piece_count: 4,
        is_followed_by_viewer: false,
      },
    ]);
    const tools = buildFinderNicNacTools({ supabase, userId: "customer-silver-celeste" }, ["social"]);

    const result = await executeTool(tools.list_followed_collectors, {});

    expect(supabase.rpc).toHaveBeenCalledWith("sparkle_finder_search_public_collectors", {
      search_query: "",
      result_limit: 50,
    });
    expect(result).toEqual({
      status: "connected",
      collectors: [
        {
          userId: "customer-silver-riley",
          handle: "riley-reveals",
          displayName: "Riley",
          showcaseUrl: "/showcase/riley-reveals",
          publicPieceCount: 12,
        },
      ],
      guidance:
        "Followed collectors are one-way public Showcase shortcuts only. Do not suggest DMs, friend requests, trading, marketplace, escrow, payment, fulfillment, or disputes.",
    });
  });
});

async function executeTool(tool: unknown, input: Record<string, unknown>) {
  const executable = tool as {
    execute?: (input: Record<string, unknown>) => Promise<unknown>;
  };

  if (!executable.execute) {
    throw new Error("Tool is missing execute");
  }

  return executable.execute(input);
}

function createFavoriteRepSupabase() {
  return {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(async () => {
          if (table === "sparkle_finder_favorite_reps") {
            return {
              data: [
                {
                  id: "favorite-2",
                  user_id: "customer-silver-celeste",
                  rep_id: "rep-kelli",
                  rep_display_name: "Kelli Jo",
                  rep_site_url: "/reps/kelli",
                  rep_board_url: "/rep-boards/kelli",
                  created_at: "2026-06-17T12:00:00.000Z",
                  updated_at: "2026-06-17T12:00:00.000Z",
                },
                {
                  id: "favorite-1",
                  user_id: "customer-silver-celeste",
                  rep_id: "rep-sierra",
                  rep_display_name: "Lindsay Lucas",
                  rep_site_url: "/reps/sierra",
                  rep_board_url: "/rep-boards/sierra",
                  created_at: "2026-06-17T12:00:00.000Z",
                  updated_at: "2026-06-17T12:00:00.000Z",
                },
              ],
              error: null,
            };
          }

          if (table === "sparkle_finder_favorite_rep_details") {
            return {
              data: [
                {
                  favorite_rep_id: "favorite-1",
                  notes: "Ask about July stacks.",
                  notify_next_show: true,
                },
              ],
              error: null,
            };
          }

          return { data: [], error: null };
        }),
      })),
    })),
    rpc: vi.fn(),
  };
}

function createCollectorSupabase(data: Array<Record<string, unknown>>) {
  return {
    from: vi.fn(),
    rpc: vi.fn(async () => ({ data, error: null })),
  };
}
