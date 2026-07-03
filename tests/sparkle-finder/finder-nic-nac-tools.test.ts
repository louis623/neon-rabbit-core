import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildFinderNicNacTools } from "../../lib/sparkle-finder/nic-nac/tools";
import {
  getCatalogJewelryItemById,
  getFinderAvailabilityForJewelryItem,
  getFinderLiveShows,
} from "../../lib/sparkle-finder/catalog-service";

vi.mock("../../lib/sparkle-finder/catalog-service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/sparkle-finder/catalog-service")>();

  return {
    ...actual,
    getCatalogJewelryItemById: vi.fn(),
    getFinderAvailabilityForJewelryItem: vi.fn(),
    getFinderLiveShows: vi.fn(),
  };
});

const getCatalogJewelryItemByIdMock = vi.mocked(getCatalogJewelryItemById);
const getFinderAvailabilityForJewelryItemMock = vi.mocked(getFinderAvailabilityForJewelryItem);
const getFinderLiveShowsMock = vi.mocked(getFinderLiveShows);

describe("Sparkle Finder Nic-Nac tools", () => {
  beforeEach(() => {
    getCatalogJewelryItemByIdMock.mockReset();
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

  it("lists a customer's bounded collection with catalog context and private-note safety", async () => {
    getCatalogJewelryItemByIdMock.mockImplementation(async (itemId: string) => {
      const items = {
        "design-owned": {
          id: "design-owned",
          itemNumber: "RG1234",
          name: "Rose Garden Ring",
          collectionName: "Garden Glow",
          jewelryType: "ring",
          imageUrl: "",
          bpLabel: "standard",
          knownRepListingIds: [],
        },
        "design-wishlist": {
          id: "design-wishlist",
          itemNumber: "ER4321",
          name: "Aurora Drop Earrings",
          collectionName: "Aurora Lane",
          jewelryType: "earrings",
          imageUrl: "",
          bpLabel: "unicorn",
          knownRepListingIds: [],
        },
      } as const;

      return items[itemId as keyof typeof items];
    });
    const supabase = createFinderStateSupabase({
      collectionRows: [
        {
          id: "collection-owned",
          user_id: "customer-silver-celeste",
          jewelry_item_id: "design-owned",
          state: "owned",
          note: "Favorite centerpiece ring for lives.",
          is_highlighted: true,
          visibility: "public",
          showcase_status: "owned",
          reveal_story: "The fizz reveal was perfect.",
          is_rarest_reveal: true,
          acquisition_source: "sparkle_finder_lead",
        },
        {
          id: "collection-wishlist",
          user_id: "customer-silver-celeste",
          jewelry_item_id: "design-wishlist",
          state: "wishlist",
          note: "Looking for a pink pair.",
          is_highlighted: false,
          visibility: "private",
          showcase_status: "iso",
          reveal_story: "",
          is_rarest_reveal: false,
          acquisition_source: "wishlist",
        },
      ],
    });
    const tools = buildFinderNicNacTools(
      {
        supabase,
        userId: "customer-silver-celeste",
      },
      ["collection"],
    );

    const result = await executeTool(tools.list_customer_collection, { limit: 2 });

    expect(supabase.from).toHaveBeenCalledWith("sparkle_finder_collection_items");
    expect(getCatalogJewelryItemByIdMock).toHaveBeenCalledWith("design-owned", { useFixtureFallback: true });
    expect(result).toEqual({
      status: "connected",
      dataSource: "persisted",
      count: 2,
      stateCounts: {
        owned: 1,
        wishlist: 1,
        privateNoteOnly: 0,
      },
      items: [
        {
          collectionItemId: "collection-owned",
          itemId: "design-owned",
          itemNumber: "RG1234",
          itemName: "Rose Garden Ring",
          collectionName: "Garden Glow",
          jewelryType: "ring",
          state: "owned",
          visibility: "public",
          showcaseStatus: "owned",
          isHighlighted: true,
          isRarestReveal: true,
          hasNote: true,
          noteSnippet: "Favorite centerpiece ring for lives.",
          hasRevealStory: true,
          acquisitionSource: "sparkle_finder_lead",
        },
        {
          collectionItemId: "collection-wishlist",
          itemId: "design-wishlist",
          itemNumber: "ER4321",
          itemName: "Aurora Drop Earrings",
          collectionName: "Aurora Lane",
          jewelryType: "earrings",
          state: "wishlist",
          visibility: "private",
          showcaseStatus: "iso",
          isHighlighted: false,
          isRarestReveal: false,
          hasNote: true,
          noteSnippet: "Looking for a pink pair.",
          hasRevealStory: false,
          acquisitionSource: "wishlist",
        },
      ],
      guidance:
        "Use collection rows as owner-scoped context only. Do not claim saves, edits, deletes, or public visibility changes unless a save tool result says so.",
    });
  });

  it("summarizes a customer's Showcase readiness from bounded owner rows", async () => {
    const supabase = createFinderStateSupabase({
      collectionRows: [
        {
          id: "collection-public",
          user_id: "customer-silver-celeste",
          jewelry_item_id: "design-owned",
          state: "owned",
          visibility: "public",
          showcase_status: "owned",
          is_rarest_reveal: true,
          reveal_story: "A favorite reveal.",
        },
        {
          id: "collection-private",
          user_id: "customer-silver-celeste",
          jewelry_item_id: "design-private",
          state: "private_note_only",
          visibility: "private",
          showcase_status: "private_note_only",
          is_rarest_reveal: false,
          reveal_story: "",
        },
      ],
      showcaseCollectionRows: [
        {
          id: "showcase-pink-dreams",
          user_id: "customer-silver-celeste",
          title: "Pink Dreams",
          slug: "pink-dreams",
          description: "Soft pinks.",
          visibility: "public",
        },
      ],
    });
    const tools = buildFinderNicNacTools(
      {
        supabase,
        userId: "customer-silver-celeste",
      },
      ["showcase"],
    );

    const result = await executeTool(tools.summarize_my_showcase, {});

    expect(result).toEqual({
      status: "connected",
      dataSource: "persisted",
      publicPieceCount: 1,
      privatePieceCount: 1,
      rarestRevealCount: 1,
      piecesWithRevealStoryCount: 1,
      showcaseCollections: [
        {
          id: "showcase-pink-dreams",
          title: "Pink Dreams",
          slug: "pink-dreams",
          visibility: "public",
        },
      ],
      guidance:
        "Use Showcase summary for visibility and sharing-readiness coaching only. Do not claim Showcase changes unless a save tool result says so.",
    });
  });

  it("reports profile status from the current Finder account context", async () => {
    const tools = buildFinderNicNacTools(
      {
        accountState: createAuthenticatedAccountState(),
        userId: "customer-silver-celeste",
      },
      ["profile"],
    );

    const result = await executeTool(tools.read_my_profile_status, {});

    expect(result).toEqual({
      status: "connected",
      profile: {
        userId: "customer-silver-celeste",
        displayName: "Celeste",
        tier: "silver",
        membershipState: "silver_paid",
        visibility: "sparkle_finder",
        hasBio: true,
        bioSnippet: "Stacks cool-toned rings.",
        hasTikTokHandle: true,
        tiktokHandle: "@celeste_stacks",
        hasProfilePhoto: true,
        isLinkedSuiteRep: true,
        linkedSuiteRepId: "rep-celeste",
        linkedSuiteBusinessName: "Celeste Sparkles",
      },
      guidance:
        "Use profile status for Sparkle Finder profile coaching only. Do not claim profile saves unless a save tool result says so.",
    });
  });

  it("saves a customer collection item through the owner-scoped persistence helper", async () => {
    getCatalogJewelryItemByIdMock.mockResolvedValue({
      id: "design-owned",
      itemNumber: "RG1234",
      name: "Rose Garden Ring",
      collectionName: "Garden Glow",
      jewelryType: "ring",
      imageUrl: "",
      bpLabel: "standard",
      knownRepListingIds: [],
    });
    const supabase = createFinderMutationSupabase();
    const tools = buildFinderNicNacTools(
      {
        accountState: createAuthenticatedAccountState(),
        supabase,
        userId: "customer-silver-celeste",
      },
      ["collection"],
    );

    const result = await executeTool(tools.save_my_collection_item, {
      jewelryItemId: " design-owned ",
      state: "owned",
      note: "My favorite reveal.",
      isHighlighted: true,
      showcaseCollectionTitle: "Rarest Reveals",
      acquisitionSource: "nic_nac_request",
      acquisitionContext: {
        requestId: "nic-nac-run-123",
      },
    });

    expect(getCatalogJewelryItemByIdMock).toHaveBeenCalledWith("design-owned", { useFixtureFallback: false });
    expect(result).toEqual({
      status: "saved",
      saved: true,
      message: "Collection item saved.",
      acquisitionSource: "nic_nac_request",
      guidance:
        "Nic-Nac may now say the collection save succeeded because the save tool returned saved. Only describe this as found by Sparkle Finder when acquisitionSource is sparkle_finder_lead or nic_nac_request.",
    });
    expect(supabase.operations).toContainEqual({
      table: "sparkle_finder_collection_items",
      type: "upsert",
      values: {
        user_id: "customer-silver-celeste",
        jewelry_item_id: "design-owned",
        state: "owned",
        note: "My favorite reveal.",
        is_highlighted: true,
        acquisition_source: "nic_nac_request",
        acquisition_context: {
          requestId: "nic-nac-run-123",
        },
        acquisition_marked_at: expect.any(String),
      },
      options: {
        onConflict: "user_id,jewelry_item_id",
      },
    });
  });

  it("refuses a collection save when the catalog item cannot be verified", async () => {
    getCatalogJewelryItemByIdMock.mockResolvedValue(undefined);
    const supabase = createFinderMutationSupabase();
    const tools = buildFinderNicNacTools(
      {
        accountState: createAuthenticatedAccountState(),
        supabase,
        userId: "customer-silver-celeste",
      },
      ["collection"],
    );

    const result = await executeTool(tools.save_my_collection_item, {
      jewelryItemId: "missing-design",
      state: "wishlist",
    });

    expect(result).toEqual({
      status: "denied",
      saved: false,
      reason: "catalog_item_not_found",
      guidance: "Do not claim a collection save. Ask the customer to search the library or use Showcase Studio.",
    });
    expect(supabase.operations).toEqual([]);
  });

  it("saves Showcase piece fields through the owner-scoped persistence helper", async () => {
    getCatalogJewelryItemByIdMock.mockResolvedValue({
      id: "design-wishlist",
      itemNumber: "ER4321",
      name: "Aurora Drop Earrings",
      collectionName: "Aurora Lane",
      jewelryType: "earrings",
      imageUrl: "",
      bpLabel: "unicorn",
      knownRepListingIds: [],
    });
    const supabase = createFinderMutationSupabase();
    const tools = buildFinderNicNacTools(
      {
        accountState: createAuthenticatedAccountState(),
        supabase,
        userId: "customer-silver-celeste",
      },
      ["showcase"],
    );

    const result = await executeTool(tools.save_my_showcase_piece, {
      jewelryItemId: "design-wishlist",
      showcaseStatus: "iso",
      visibility: "public",
      revealStory: "Looking for the pink Aurora drops.",
      note: "Private note for me.",
      isRarestReveal: true,
    });

    expect(result).toEqual({
      status: "saved",
      saved: true,
      message: "Sparkle Showcase piece saved.",
      guidance: "Nic-Nac may now say the Showcase piece save succeeded because the save tool returned saved.",
    });
    expect(supabase.operations).toContainEqual({
      table: "sparkle_finder_collection_items",
      type: "upsert",
      values: {
        user_id: "customer-silver-celeste",
        jewelry_item_id: "design-wishlist",
        state: "wishlist",
        note: "Private note for me.",
        is_highlighted: true,
        visibility: "public",
        showcase_status: "iso",
        reveal_story: "Looking for the pink Aurora drops.",
        is_rarest_reveal: true,
      },
      options: {
        onConflict: "user_id,jewelry_item_id",
      },
    });
  });

  it("updates profile text fields while preserving unspecified profile details", async () => {
    const supabase = createFinderMutationSupabase({
      profileRow: {
        user_id: "customer-silver-celeste",
        display_name: "Celeste",
        tiktok_handle: "@celeste_stacks",
        bio: "New bio for cool-toned stacks.",
        profile_visibility: "sparkle_finder",
      },
    });
    const tools = buildFinderNicNacTools(
      {
        accountState: createAuthenticatedAccountState(),
        supabase,
        userId: "customer-silver-celeste",
      },
      ["profile"],
    );

    const result = await executeTool(tools.update_my_profile, {
      bio: "New bio for cool-toned stacks.",
    });

    expect(result).toEqual({
      status: "saved",
      saved: true,
      message: "Profile saved.",
      guidance: "Nic-Nac may now say the profile save succeeded because the save tool returned saved. Profile photo changes still use the account upload flow.",
    });
    expect(supabase.operations).toContainEqual({
      table: "sparkle_finder_profiles",
      type: "update",
      values: {
        display_name: "Celeste",
        tiktok_handle: "@celeste_stacks",
        bio: "New bio for cool-toned stacks.",
        profile_visibility: "sparkle_finder",
      },
      filters: [["user_id", "customer-silver-celeste"]],
    });
  });

  it("describes Showcase Studio requirements without submitting missing-piece intake from chat", async () => {
    vi.stubEnv("SPARKLE_SUITE_FINDER_INTAKE_API_URL", "https://suite.example/api/internal/finder/jewelry-intake");
    vi.stubEnv("SPARKLE_FINDER_TO_SUITE_INTAKE_TOKEN", "finder-to-suite-token");
    const tools = buildFinderNicNacTools(
      {
        userId: "customer-silver-celeste",
      },
      ["studio"],
    );

    const result = await executeTool(tools.get_showcase_studio_requirements, {});

    expect(result).toEqual({
      status: "connected",
      suiteIntakeConnected: true,
      requiredInputs: [
        "original Bomb Party label/details photo",
        "clear customer-facing jewelry photo",
        "item number when available",
        "short customer note or collection context when helpful",
      ],
      photoRules: [
        "Label/details photos are details evidence only.",
        "A separate jewelry-front photo is required before customer-facing publishing.",
        "Clear boxed display jewelry photos are acceptable when centered, close, and attractive.",
      ],
      maxPhotoMegabytes: 10,
      guidance:
        "Do not submit Studio intake from chat without uploaded files. Ask the customer to use the Studio upload flow when photos are required.",
    });
    vi.unstubAllEnvs();
  });

  it("reads current Studio intake status from app-owned uploaded file state", async () => {
    const supabase = createFinderStateSupabase({
      studioSubmissionRows: [
        {
          id: "studio-submission-123",
          user_id: "customer-silver-celeste",
          status: "submitted",
          item_number: "RG1234",
          design_name: "Starlight Ring",
          jewelry_type: "ring",
          collection_name: "Birthday 2024",
          collection_year: 2024,
          customer_note: "This came from a 2024 reveal.",
          photo_feedback: [],
          last_error: "",
          submitted_at: "2026-06-13T16:00:00.000Z",
          accepted_at: null,
          published_at: null,
          updated_at: "2026-06-13T16:05:00.000Z",
          created_at: "2026-06-13T15:55:00.000Z",
        },
      ],
      studioAssetRows: [
        {
          id: "studio-label-asset",
          submission_id: "studio-submission-123",
          user_id: "customer-silver-celeste",
          asset_kind: "original_label",
          content_type: "image/jpeg",
          byte_size: 11,
          nic_nac_quality_status: "pending",
          nic_nac_quality_feedback: [],
          created_at: "2026-06-13T16:01:00.000Z",
        },
        {
          id: "studio-jewelry-asset",
          submission_id: "studio-submission-123",
          user_id: "customer-silver-celeste",
          asset_kind: "jewelry_front",
          content_type: "image/jpeg",
          byte_size: 13,
          nic_nac_quality_status: "pending",
          nic_nac_quality_feedback: [],
          created_at: "2026-06-13T16:02:00.000Z",
        },
      ],
    });
    const tools = buildFinderNicNacTools(
      {
        supabase,
        userId: "customer-silver-celeste",
      },
      ["studio"],
    );

    const result = await executeTool(tools.read_my_studio_intake_status, {});

    expect(result).toEqual({
      status: "connected",
      dataSource: "persisted",
      hasSubmittedIntake: true,
      requiredUploadRoles: [
        {
          role: "original_label",
          label: "original Bomb Party label/details photo",
          present: true,
          qualityStatus: "pending",
          feedback: [],
        },
        {
          role: "jewelry_front",
          label: "clear customer-facing jewelry photo",
          present: true,
          qualityStatus: "pending",
          feedback: [],
        },
      ],
      missingUploadRoles: [],
      studioUploadHref: "/silver#showcase-studio",
      canContinueFromChat: false,
      nextAction: "report_existing_status",
      latestSubmission: {
        status: "submitted",
        itemNumber: "RG1234",
        designName: "Starlight Ring",
        jewelryType: "ring",
        collectionName: "Birthday 2024",
        collectionYear: 2024,
        mainStone: null,
        material: null,
        bpLabel: null,
        customerNoteSnippet: "This came from a 2024 reveal.",
        photoFeedback: [],
        submittedAt: "2026-06-13T16:00:00.000Z",
        acceptedAt: null,
        publishedAt: null,
        updatedAt: "2026-06-13T16:05:00.000Z",
      },
      guidance:
        "Use app-owned Studio state only. Report this existing Studio intake status; do not claim a new upload or submission from chat.",
    });
  });

  it("directs Studio chat handoff to upload flow with exact missing file roles", async () => {
    const supabase = createFinderStateSupabase({
      studioSubmissionRows: [],
      studioAssetRows: [],
    });
    const tools = buildFinderNicNacTools(
      {
        supabase,
        userId: "customer-silver-celeste",
      },
      ["studio"],
    );

    const result = await executeTool(tools.read_my_studio_intake_status, {});

    expect(result).toMatchObject({
      status: "connected",
      dataSource: "persisted",
      hasSubmittedIntake: false,
      missingUploadRoles: ["original_label", "jewelry_front"],
      studioUploadHref: "/silver#showcase-studio",
      canContinueFromChat: false,
      nextAction: "open_studio_upload_flow",
      latestSubmission: null,
    });
    expect(String((result as { guidance?: unknown }).guidance)).toContain("original_label, jewelry_front");
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

function createFinderStateSupabase({
  collectionRows = [],
  showcaseCollectionRows = [],
  studioSubmissionRows = [],
  studioAssetRows = [],
}: {
  collectionRows?: Array<Record<string, unknown>>;
  showcaseCollectionRows?: Array<Record<string, unknown>>;
  studioSubmissionRows?: Array<Record<string, unknown>>;
  studioAssetRows?: Array<Record<string, unknown>>;
}) {
  const rowsByTable: Record<string, Array<Record<string, unknown>>> = {
    sparkle_finder_collection_items: collectionRows,
    sparkle_finder_showcase_collections: showcaseCollectionRows,
    sparkle_finder_nic_nac_intake_submissions: studioSubmissionRows,
    sparkle_finder_nic_nac_intake_assets: studioAssetRows,
  };

  return {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(async () => ({
          data: rowsByTable[table] ?? [],
          error: null,
        })),
      })),
    })),
    rpc: vi.fn(),
  };
}

function createFinderMutationSupabase({
  profileRow = { user_id: "customer-silver-celeste" },
}: {
  profileRow?: Record<string, unknown> | null;
} = {}) {
  const operations: Array<Record<string, unknown>> = [];
  const collectionItemId = "collection-upserted";
  const showcaseCollectionId = "showcase-collection-created";

  return {
    operations,
    from: vi.fn((table: string) => ({
      select: vi.fn(() => {
        const filters: Array<[string, string]> = [];
        const builder = {
          eq: vi.fn((column: string, value: string) => {
            filters.push([column, value]);

            return builder;
          }),
          maybeSingle: vi.fn(async () => {
            if (table === "sparkle_finder_profiles") {
              return { data: profileRow, error: null };
            }

            if (table === "sparkle_finder_collection_items") {
              return { data: { id: collectionItemId }, error: null };
            }

            if (table === "sparkle_finder_showcase_collections") {
              return { data: { id: showcaseCollectionId }, error: null };
            }

            return { data: null, error: null };
          }),
          then: (resolve: (value: { data: unknown; error: unknown }) => void) => {
            resolve({ data: [], error: null });
          },
        };

        return builder;
      }),
      update: vi.fn((values: Record<string, unknown>) => {
        const filters: Array<[string, string]> = [];
        const builder = {
          eq: vi.fn((column: string, value: string) => {
            filters.push([column, value]);
            operations.push({ table, type: "update", values, filters: [...filters] });

            return Promise.resolve({ data: null, error: null });
          }),
        };

        return builder;
      }),
      insert: vi.fn(async (values: Record<string, unknown>) => {
        operations.push({ table, type: "insert", values });

        return { data: null, error: null };
      }),
      upsert: vi.fn(async (values: Record<string, unknown>, options: Record<string, unknown>) => {
        operations.push({ table, type: "upsert", values, options });

        return { data: { id: collectionItemId }, error: null };
      }),
    })),
    rpc: vi.fn(),
  };
}

function createAuthenticatedAccountState() {
  return {
    status: "authenticated",
    tier: "silver",
    displayName: "Celeste",
    email: "celeste@example.test",
    customer: {
      id: "customer-silver-celeste",
      displayName: "Celeste",
      email: "celeste@example.test",
      state: "WA",
      tier: "silver",
      repIdentity: {
        sparkleSuiteRepId: "rep-celeste",
        businessName: "Celeste Sparkles",
        publicDiscoveryEnabled: true,
      },
    },
    membership: {
      effectiveState: "silver_paid",
      hasSilverAccess: true,
    },
    silverProfile: {
      customerId: "customer-silver-celeste",
      photoUrl: "https://cdn.example.test/celeste.jpg",
      tiktokHandle: "@celeste_stacks",
      bio: "Stacks cool-toned rings.",
      visibility: "sparkle_finder",
    },
    repIdentity: {
      sparkleSuiteRepId: "rep-celeste",
      businessName: "Celeste Sparkles",
      publicDiscoveryEnabled: true,
    },
  };
}
