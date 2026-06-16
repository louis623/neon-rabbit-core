import { tool, type ToolSet } from "ai";
import { z } from "zod";
import { getCatalogJewelryItems } from "../catalog-service";
import {
  type CustomerMemoryStore,
  createInMemoryCustomerMemoryStore,
  getSafeCustomerMemoryForPrompt,
  writeCustomerMemory,
} from "../customer-memory";
import { getFinderNicNacToolIntentsForText, type FinderNicNacToolIntent } from "./curator";

type FinderNicNacToolContext = {
  memoryStore?: CustomerMemoryStore;
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
  rep_discovery: ["save_favorite_rep"],
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

  return tools;
}
