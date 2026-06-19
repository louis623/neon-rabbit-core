import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { getCatalogJewelryItems } from "../catalog-service";
import { searchPersistedPublicCollectorProfiles, type SupabaseCollectorSocialReadClient } from "../collector-social-service";
import {
  type CustomerMemoryStore,
  createInMemoryCustomerMemoryStore,
  getSafeCustomerMemoryForPrompt,
  writeCustomerMemory,
} from "../customer-memory";
import { getPersistedFavoriteRepCardsForUser, type SupabaseFavoriteRepsReadClient } from "../favorite-reps-service";
import { getFinderNicNacToolIntentsForText, type FinderNicNacToolIntent } from "./curator";

type FinderNicNacToolContext = {
  memoryStore?: CustomerMemoryStore;
  supabase?: SupabaseFavoriteRepsReadClient & SupabaseCollectorSocialReadClient;
  userId: string;
};

const toolPacks: Record<FinderNicNacToolIntent, string[]> = {
  memory: ["read_customer_memory", "write_customer_memory"],
  collection: [],
  showcase: [],
  catalog: ["search_catalog"],
  studio: [],
  availability: [],
  profile: [],
  rep_discovery: ["list_favorite_reps", "save_favorite_rep"],
  social: ["find_public_showcases", "list_followed_collectors"],
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
