import { tool, type ToolSet } from "ai";
import { z } from "zod";
import {
  getCatalogJewelryItemById,
  getCatalogJewelryItems,
  getFinderAvailabilityForJewelryItem,
  getFinderLiveShows,
} from "../catalog-service";
import type { CurrentSparkleFinderAccountState } from "../account-service";
import { searchPersistedPublicCollectorProfiles, type SupabaseCollectorSocialReadClient } from "../collector-social-service";
import {
  type CustomerMemoryStore,
  createInMemoryCustomerMemoryStore,
  getSafeCustomerMemoryForPrompt,
  writeCustomerMemory,
} from "../customer-memory";
import { getPersistedFavoriteRepCardsForUser, type SupabaseFavoriteRepsReadClient } from "../favorite-reps-service";
import { getShowcaseStudioConfig } from "../showcase-studio";
import { getFinderNicNacToolIntentsForText, type FinderNicNacToolIntent } from "./curator";

type FinderNicNacToolContext = {
  accountState?: CurrentSparkleFinderAccountState;
  memoryStore?: CustomerMemoryStore;
  supabase?: SupabaseFavoriteRepsReadClient & SupabaseCollectorSocialReadClient & SupabaseFinderStateReadClient;
  userId: string;
};

type SupabaseReadResult = PromiseLike<{ data: unknown; error: unknown }>;

type SupabaseFinderStateReadClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => SupabaseReadResult;
    };
  };
};

const toolPacks: Record<FinderNicNacToolIntent, string[]> = {
  memory: ["read_customer_memory", "write_customer_memory"],
  collection: ["list_customer_collection"],
  showcase: ["summarize_my_showcase"],
  catalog: ["search_catalog"],
  studio: ["get_showcase_studio_requirements"],
  availability: ["find_rep_board_availability", "list_upcoming_live_shows"],
  profile: ["read_my_profile_status"],
  rep_discovery: ["list_favorite_reps", "save_favorite_rep"],
  social: ["find_public_showcases", "list_followed_collectors"],
  suite_workspace: [],
};

export function listFinderNicNacToolNamesForIntents(intents: FinderNicNacToolIntent[]): string[] {
  const names: string[] = [];

  for (const intent of intents) {
    for (const name of toolPacks[intent]) {
      if (!names.includes(name)) {
        names.push(name);
      }
    }
  }

  return names;
}

export function getFinderNicNacToolIntentsForMessages(messages: Array<{ role?: string; parts?: unknown[] }>) {
  const latestUser = [...messages].reverse().find((message) => message.role === "user");
  const text = latestUser?.parts?.map(readTextPart).join("\n") ?? "";

  return getFinderNicNacToolIntentsForText(text);
}

function readTextPart(part: unknown): string {
  if (!part || typeof part !== "object") {
    return "";
  }

  const record = part as Record<string, unknown>;

  return record.type === "text" && typeof record.text === "string" ? record.text : "";
}

export function buildFinderNicNacTools(ctx: FinderNicNacToolContext, intents: FinderNicNacToolIntent[]): ToolSet {
  const activeNames = listFinderNicNacToolNamesForIntents(intents);
  const memoryStore = ctx.memoryStore ?? createInMemoryCustomerMemoryStore();
  const tools: ToolSet = {};

  if (activeNames.includes("read_customer_memory")) {
    tools.read_customer_memory = tool({
      description: "Read safe Sparkle Finder customer memory for the current customer.",
      inputSchema: z.object({}),
      execute: async () => ({
        memories: await getSafeCustomerMemoryForPrompt(memoryStore, ctx.userId),
      }),
    });
  }

  if (activeNames.includes("write_customer_memory")) {
    tools.write_customer_memory = tool({
      description: "Write safe customer-scoped Sparkle Finder curator memory.",
      inputSchema: z.object({
        memoryType: z.enum([
          "style_preference",
          "collection_goal",
          "current_hunt",
          "favorite_rep",
          "rep_preference",
          "size_or_fit_note",
          "gift_or_occasion_note",
          "workflow_preference",
          "guarded_note",
        ]),
        summary: z.string(),
      }),
      execute: async ({ memoryType, summary }) =>
        writeCustomerMemory(memoryStore, {
          userId: ctx.userId,
          memoryType,
          summary,
          source: "explicit",
          confidence: "high",
        }),
    });
  }

  if (activeNames.includes("search_catalog")) {
    tools.search_catalog = tool({
      description: "Search Sparkle Finder's shared Sparkle Suite jewelry catalog.",
      inputSchema: z.object({
        query: z.string(),
        limit: z.number().int().min(1).max(12).optional(),
      }),
      execute: async ({ query, limit }) => {
        const items = await getCatalogJewelryItems({
          query,
          limit: limit ?? 8,
          useFixtureFallback: false,
        });

        return {
          count: items.length,
          items: items.map((item) => ({
            id: item.id,
            itemNumber: item.itemNumber,
            name: item.name,
            collectionName: item.collectionName,
            jewelryType: item.jewelryType,
            material: item.material,
            mainStone: item.mainStone,
            photoUrl: item.imageUrl,
            availableListingCount: item.availableListingCount ?? 0,
          })),
        };
      },
    });
  }

  if (activeNames.includes("find_rep_board_availability")) {
    tools.find_rep_board_availability = tool({
      description:
        "Find bounded public Sparkle Suite rep board availability and next-show leads for a Sparkle Finder catalog item.",
      inputSchema: z.object({
        itemId: z.string(),
        limit: z.number().int().min(1).max(12).optional(),
      }),
      execute: async ({ itemId, limit }) => {
        const trimmedItemId = itemId.trim();

        if (!trimmedItemId) {
          return {
            status: "missing_item_id",
            leads: [],
            guidance: "Ask for the item number or catalog item before checking rep board availability.",
          };
        }

        const availability = await getFinderAvailabilityForJewelryItem(trimmedItemId, {
          limit: limit ?? 8,
          useFixtureFallback: false,
        });

        if (!availability) {
          return {
            status: "unavailable",
            itemId: trimmedItemId,
            leads: [],
            guidance: "Sparkle Suite availability could not be read right now. Offer to retry.",
          };
        }

        if (!availability.requestedItem) {
          return {
            status: "item_not_found",
            itemId: trimmedItemId,
            leads: [],
            guidance: "No shared catalog item matched that id. Guide the customer to search the catalog or Studio.",
          };
        }

        const leads = [
          ...availability.exactMatches.map((match) => ({
            matchType: "exact_item" as const,
            ...mapAvailabilityLead(match),
          })),
          ...availability.similarMatches.map((match) => ({
            matchType: "same_collection_type" as const,
            ...mapAvailabilityLead(match),
          })),
        ];

        return {
          status: "connected",
          item: {
            id: availability.requestedItem.id,
            itemNumber: availability.requestedItem.itemNumber,
            name: availability.requestedItem.name,
            collectionName: availability.requestedItem.collectionName,
            jewelryType: availability.requestedItem.jewelryType,
            availableListingCount: availability.requestedItem.availableListingCount ?? 0,
          },
          count: leads.length,
          leads: leads.slice(0, limit ?? 8),
          guidance:
            "Use availability leads for rep board and next-show discovery only. Do not mutate Sparkle Suite Trade Boards from Finder.",
        };
      },
    });
  }

  if (activeNames.includes("list_upcoming_live_shows")) {
    tools.list_upcoming_live_shows = tool({
      description:
        "List bounded public Sparkle Suite live shows for Finder discovery and timing context.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(12).optional(),
      }),
      execute: async ({ limit }) => {
        const shows = await getFinderLiveShows({
          limit: limit ?? 8,
          useFixtureFallback: false,
        });

        return {
          status: "connected",
          count: shows.length,
          shows: shows.slice(0, limit ?? 8).map((show) => ({
            showId: show.showId,
            showName: show.showName,
            repFirstName: show.repFirstName,
            startsAt: show.startsAt,
            status: show.status,
            customerSiteUrl: show.customerSiteUrl,
          })),
          guidance:
            "Use live shows for public rep discovery and timing context only. Do not schedule or edit Sparkle Suite shows from Finder.",
        };
      },
    });
  }

  if (activeNames.includes("list_customer_collection")) {
    tools.list_customer_collection = tool({
      description:
        "List the current customer's bounded Sparkle Finder collection rows with catalog context.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(20).optional(),
      }),
      execute: async ({ limit }) => {
        if (!ctx.supabase) {
          return {
            status: "not_connected",
            dataSource: "unavailable",
            count: 0,
            items: [],
            guidance: "Collection rows are unavailable in this Nic-Nac context.",
          };
        }

        const result = await readFinderRows(
          ctx.supabase,
          "sparkle_finder_collection_items",
          "id,user_id,jewelry_item_id,state,note,is_highlighted,visibility,showcase_status,reveal_story,is_rarest_reveal",
          ctx.userId,
        );

        if (!result) {
          return {
            status: "unavailable",
            dataSource: "persisted",
            count: 0,
            items: [],
            guidance: "Collection rows could not be read right now. Offer to retry.",
          };
        }

        const boundedRows = result.slice(0, limit ?? 12);
        const items = await Promise.all(boundedRows.map(mapCollectionToolItem));

        return {
          status: "connected",
          dataSource: "persisted",
          count: result.length,
          stateCounts: countCollectionStates(result),
          items,
          guidance:
            "Use collection rows as owner-scoped context only. Do not claim saves, edits, deletes, or public visibility changes unless a save tool result says so.",
        };
      },
    });
  }

  if (activeNames.includes("summarize_my_showcase")) {
    tools.summarize_my_showcase = tool({
      description:
        "Summarize the current customer's Sparkle Showcase visibility and sharing readiness.",
      inputSchema: z.object({}),
      execute: async () => {
        if (!ctx.supabase) {
          return {
            status: "not_connected",
            dataSource: "unavailable",
            publicPieceCount: 0,
            privatePieceCount: 0,
            rarestRevealCount: 0,
            piecesWithRevealStoryCount: 0,
            showcaseCollections: [],
            guidance: "Showcase rows are unavailable in this Nic-Nac context.",
          };
        }

        const [collectionRows, showcaseCollections] = await Promise.all([
          readFinderRows(
            ctx.supabase,
            "sparkle_finder_collection_items",
            "id,user_id,jewelry_item_id,state,visibility,showcase_status,reveal_story,is_rarest_reveal",
            ctx.userId,
          ),
          readFinderRows(
            ctx.supabase,
            "sparkle_finder_showcase_collections",
            "id,user_id,title,slug,description,visibility",
            ctx.userId,
          ),
        ]);

        if (!collectionRows || !showcaseCollections) {
          return {
            status: "unavailable",
            dataSource: "persisted",
            publicPieceCount: 0,
            privatePieceCount: 0,
            rarestRevealCount: 0,
            piecesWithRevealStoryCount: 0,
            showcaseCollections: [],
            guidance: "Showcase rows could not be read right now. Offer to retry.",
          };
        }

        return {
          status: "connected",
          dataSource: "persisted",
          publicPieceCount: collectionRows.filter((row) => readString(row.visibility) === "public").length,
          privatePieceCount: collectionRows.filter((row) => readString(row.visibility) !== "public").length,
          rarestRevealCount: collectionRows.filter((row) => row.is_rarest_reveal === true).length,
          piecesWithRevealStoryCount: collectionRows.filter((row) => Boolean(readString(row.reveal_story))).length,
          showcaseCollections: showcaseCollections.map((collection) => ({
            id: readString(collection.id),
            title: readString(collection.title),
            slug: readString(collection.slug),
            visibility: readString(collection.visibility) || "private",
          })),
          guidance:
            "Use Showcase summary for visibility and sharing-readiness coaching only. Do not claim Showcase changes unless a save tool result says so.",
        };
      },
    });
  }

  if (activeNames.includes("get_showcase_studio_requirements")) {
    tools.get_showcase_studio_requirements = tool({
      description:
        "Describe the current Showcase Studio missing-piece intake requirements without submitting files from chat.",
      inputSchema: z.object({}),
      execute: async () => {
        const config = getShowcaseStudioConfig();

        return {
          status: "connected",
          suiteIntakeConnected: Boolean(config.apiUrl && config.bearerToken),
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
        };
      },
    });
  }

  if (activeNames.includes("read_my_profile_status")) {
    tools.read_my_profile_status = tool({
      description: "Read the current customer's Sparkle Finder profile status and linked-rep identity.",
      inputSchema: z.object({}),
      execute: async () => {
        const accountState = ctx.accountState;

        if (!accountState || accountState.status !== "authenticated") {
          return {
            status: "not_connected",
            profile: null,
            guidance: "Profile status is unavailable in this Nic-Nac context.",
          };
        }

        const profile = accountState.silverProfile;
        const repIdentity = accountState.repIdentity ?? accountState.customer.repIdentity;
        const repEntitlement = accountState.repEntitlement;
        const linkedSuiteRepId = repIdentity?.sparkleSuiteRepId ?? repEntitlement?.sparkleSuiteRepId ?? null;
        const linkedSuiteBusinessName = repIdentity?.businessName ?? repEntitlement?.businessName ?? null;
        const bio = profile?.bio?.trim() ?? "";
        const tiktokHandle = profile?.tiktokHandle?.trim() ?? "";
        const photoUrl = profile?.photoUrl?.trim() ?? "";

        return {
          status: "connected",
          profile: {
            userId: accountState.customer.id,
            displayName: accountState.customer.displayName,
            tier: accountState.tier,
            membershipState: accountState.membership?.effectiveState ?? accountState.tier,
            visibility: profile?.visibility ?? "private",
            hasBio: Boolean(bio),
            bioSnippet: cleanSnippet(bio, 160),
            hasTikTokHandle: Boolean(tiktokHandle),
            tiktokHandle: tiktokHandle || null,
            hasProfilePhoto: Boolean(photoUrl),
            isLinkedSuiteRep: Boolean(linkedSuiteRepId),
            linkedSuiteRepId,
            linkedSuiteBusinessName,
          },
          guidance:
            "Use profile status for Sparkle Finder profile coaching only. Do not claim profile saves unless a save tool result says so.",
        };
      },
    });
  }

  if (activeNames.includes("save_favorite_rep")) {
    tools.save_favorite_rep = tool({
      description: "Remember a customer's favorite Sparkle Suite/Finder rep.",
      inputSchema: z.object({
        repName: z.string(),
      }),
      execute: async ({ repName }) =>
        writeCustomerMemory(memoryStore, {
          userId: ctx.userId,
          memoryType: "favorite_rep",
          summary: `Favorite rep: ${repName.trim()}.`,
          source: "explicit",
          confidence: "high",
        }),
    });
  }

  if (activeNames.includes("list_favorite_reps")) {
    tools.list_favorite_reps = tool({
      description: "List the customer's persisted favorite reps with next-show and board context.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(12).optional(),
      }),
      execute: async ({ limit }) => {
        if (!ctx.supabase) {
          return {
            status: "not_connected",
            reps: [],
            guidance: "Favorite rep rows are unavailable in this Nic-Nac context.",
          };
        }

        const cards = await getPersistedFavoriteRepCardsForUser({
          supabase: ctx.supabase,
          userId: ctx.userId,
          hasSilverAccess: true,
        });

        if (!cards) {
          return {
            status: "unavailable",
            reps: [],
            guidance: "Favorite reps could not be read right now.",
          };
        }

        return {
          status: "connected",
          count: cards.length,
          reps: cards.slice(0, limit ?? 8).map((card) => ({
            repId: card.repId,
            displayName: card.repDisplayName,
            nextShowAt: card.nextShowAt,
            nextShowTitle: card.nextShowTitle,
            boardItemCount: card.boardItemCount,
            hasBoardPath: Boolean(card.repBoardUrl),
            hasRepPath: Boolean(card.repSiteUrl),
          })),
          guidance: "Use favorite reps for rep-first discovery, show timing, and board shortcuts only.",
        };
      },
    });
  }

  if (activeNames.includes("find_public_showcases")) {
    tools.find_public_showcases = tool({
      description:
        "List the current bounded status for finding public Sparkle Showcase collectors without DMs, friend requests, trading, or marketplace flows.",
      inputSchema: z.object({
        query: z.string().optional(),
      }),
      execute: async ({ query }) => {
        if (!ctx.supabase) {
          return {
            status: "not_connected",
            query: query?.trim() || null,
            collectors: [],
            guidance:
              "Public collector matching is limited to public Sparkle Showcase discovery surfaces. Do not suggest buying from members, DMs, friend requests, trading, marketplace, escrow, payment, fulfillment, or disputes.",
          };
        }

        const collectors = await searchPersistedPublicCollectorProfiles({
          supabase: ctx.supabase,
          query: query ?? "",
          limit: 8,
        });

        if (!collectors) {
          return {
            status: "unavailable",
            query: query?.trim() || null,
            collectors: [],
            guidance: "Public Showcase discovery could not be read right now.",
          };
        }

        return {
          status: "connected",
          query: query?.trim() || null,
          collectors: collectors.map((collector) => ({
            userId: collector.userId,
            handle: collector.handle,
            displayName: collector.displayName,
            tagline: collector.tagline,
            showcaseUrl: collector.showcaseUrl,
            followerCount: collector.followerCount,
            followingCount: collector.followingCount,
            publicPieceCount: collector.publicPieceCount,
            isFollowedByViewer: collector.isFollowedByViewer,
          })),
          guidance:
            "Public collector matching is limited to public Sparkle Showcase discovery surfaces. Do not suggest buying from members, DMs, friend requests, trading, marketplace, escrow, payment, fulfillment, or disputes.",
        };
      },
    });
  }

  if (activeNames.includes("list_followed_collectors")) {
    tools.list_followed_collectors = tool({
      description:
        "Report the current bounded status for followed collectors and one-way public Showcase follows.",
      inputSchema: z.object({}),
      execute: async () => {
        if (!ctx.supabase) {
          return {
            status: "not_connected",
            collectors: [],
            guidance:
              "Followed collector lookup is unavailable in this Nic-Nac context. Keep the answer to one-way follows and public Showcases only.",
          };
        }

        const collectors = await searchPersistedPublicCollectorProfiles({
          supabase: ctx.supabase,
          query: "",
          limit: 50,
        });

        if (!collectors) {
          return {
            status: "unavailable",
            collectors: [],
            guidance: "Followed collectors could not be read right now.",
          };
        }

        return {
          status: "connected",
          collectors: collectors
            .filter((collector) => collector.isFollowedByViewer)
            .map((collector) => ({
              userId: collector.userId,
              handle: collector.handle,
              displayName: collector.displayName,
              showcaseUrl: collector.showcaseUrl,
              publicPieceCount: collector.publicPieceCount,
            })),
          guidance:
            "Followed collectors are one-way public Showcase shortcuts only. Do not suggest DMs, friend requests, trading, marketplace, escrow, payment, fulfillment, or disputes.",
        };
      },
    });
  }

  return tools;
}

type FinderAvailabilityLeadInput = NonNullable<
  Awaited<ReturnType<typeof getFinderAvailabilityForJewelryItem>>
>["exactMatches"][number];

function mapAvailabilityLead(match: FinderAvailabilityLeadInput) {
  return {
    listingId: match.listingId,
    listedAt: match.listedAt,
    itemId: match.item.id,
    itemNumber: match.item.itemNumber,
    itemName: match.item.name,
    collectionName: match.item.collectionName,
    jewelryType: match.item.jewelryType,
    photoUrl: match.photoUrl,
    repFirstName: match.repFirstName,
    showName: match.showName,
    nextShowAt: match.nextShow.startsAt,
    nextShowStatus: match.nextShow.status,
    customerSiteUrl: match.customerSiteUrl,
  };
}

async function readFinderRows(
  supabase: SupabaseFinderStateReadClient,
  table: string,
  columns: string,
  userId: string,
): Promise<Array<Record<string, unknown>> | null> {
  try {
    const result = await supabase.from(table).select(columns).eq("user_id", userId);

    if (result.error || !Array.isArray(result.data)) {
      return null;
    }

    return result.data.flatMap((row) => {
      const record = asRecord(row);

      return record ? [record] : [];
    });
  } catch {
    return null;
  }
}

async function mapCollectionToolItem(row: Record<string, unknown>) {
  const itemId = readString(row.jewelry_item_id);
  const catalogItem = itemId
    ? await getCatalogJewelryItemById(itemId, { useFixtureFallback: true })
    : undefined;
  const note = readString(row.note);
  const revealStory = readString(row.reveal_story);

  return {
    collectionItemId: readString(row.id),
    itemId,
    itemNumber: catalogItem?.itemNumber ?? null,
    itemName: catalogItem?.name ?? null,
    collectionName: catalogItem?.collectionName ?? null,
    jewelryType: catalogItem?.jewelryType ?? null,
    state: normalizeCollectionState(row.state),
    visibility: normalizeVisibility(row.visibility),
    showcaseStatus: readString(row.showcase_status) || normalizeCollectionState(row.state),
    isHighlighted: row.is_highlighted === true,
    isRarestReveal: row.is_rarest_reveal === true,
    hasNote: Boolean(note),
    noteSnippet: cleanSnippet(note, 160),
    hasRevealStory: Boolean(revealStory),
  };
}

function countCollectionStates(rows: Array<Record<string, unknown>>): {
  owned: number;
  wishlist: number;
  privateNoteOnly: number;
} {
  return rows.reduce<{ owned: number; wishlist: number; privateNoteOnly: number }>(
    (counts, row) => {
      const state = normalizeCollectionState(row.state);

      if (state === "owned") {
        counts.owned += 1;
      } else if (state === "wishlist") {
        counts.wishlist += 1;
      } else {
        counts.privateNoteOnly += 1;
      }

      return counts;
    },
    {
      owned: 0,
      wishlist: 0,
      privateNoteOnly: 0,
    } satisfies { owned: number; wishlist: number; privateNoteOnly: number },
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCollectionState(value: unknown): "owned" | "wishlist" | "private_note_only" {
  return value === "owned" || value === "wishlist" || value === "private_note_only"
    ? value
    : "private_note_only";
}

function normalizeVisibility(value: unknown): "public" | "private" {
  return value === "public" ? "public" : "private";
}

function cleanSnippet(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}
