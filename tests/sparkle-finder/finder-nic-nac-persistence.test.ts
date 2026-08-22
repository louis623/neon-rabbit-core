import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import {
  completeFinderNicNacRun,
  extractTextFromUiMessages,
  recordFinderNicNacStaticRedirect,
  startFinderNicNacRun,
  type FinderNicNacPersistenceClient,
} from "../../lib/sparkle-finder/nic-nac/persistence";

type WriteOperation =
  | {
      table: string;
      type: "insert";
      values: Record<string, unknown> | Array<Record<string, unknown>>;
    }
  | {
      column: string;
      table: string;
      type: "update";
      values: Record<string, unknown>;
      value: string;
    };

class FakePersistenceClient implements FinderNicNacPersistenceClient {
  operations: WriteOperation[] = [];

  from(table: string) {
    return {
      insert: (values: Record<string, unknown> | Array<Record<string, unknown>>) => {
        this.operations.push({
          table,
          type: "insert" as const,
          values,
        });

        return Promise.resolve({ error: null });
      },
      update: (values: Record<string, unknown>) => ({
        eq: (column: string, value: string) => {
          this.operations.push({
            column,
            table,
            type: "update" as const,
            value,
            values,
          });

          return Promise.resolve({ error: null });
        },
      }),
    };
  }
}

const now = () => new Date("2026-06-22T17:30:00.000Z");

describe("Finder Nic-Nac persistence", () => {
  it("extracts text from UI message parts for durable audit rows", () => {
    expect(
      extractTextFromUiMessages([
        {
          id: "message-1",
          role: "user",
          parts: [{ type: "text", text: "Show my favorite reps." }],
        },
        {
          id: "message-2",
          role: "assistant",
          parts: [{ type: "text", text: "Absolutely." }],
        },
      ] as UIMessage[]),
    ).toBe("Show my favorite reps.\nAbsolutely.");
  });

  it("starts and completes a linked-rep run with model, memory, tool, token, and cost metadata", async () => {
    const client = new FakePersistenceClient();
    const run = await startFinderNicNacRun(
      {
        userId: "finder-user-1",
        messages: [createUserMessage("Add ER13229 to my Dance Floor.")],
        accountContext: {
          accountTier: "silver",
          actorType: "linked_rep",
          linkedSuiteBusinessName: "BlingKitchen",
          linkedSuiteRepId: "rep-bling-kitchen",
        },
        requestedIntents: ["suite_workspace_mutation"],
        allowedIntents: [],
        blockedIntents: ["suite_workspace_mutation"],
        activeToolNames: [],
        modelPolicy: {
          key: "human_default",
          modelId: "gpt-5.4",
          provider: "openai",
          purpose: "Default production Nic-Nac conversations.",
          reasoning: "medium",
        },
        finderMemorySummaryCount: 1,
        suiteMemorySummaryCount: 2,
        latencyStartedAt: Date.now(),
      },
      {
        client,
        generateId: createIdGenerator(["conversation-1", "run-1"]),
        now,
      },
    );

    expect(run).toEqual({
      conversationId: "conversation-1",
      modelId: "gpt-5.4",
      runId: "run-1",
      userId: "finder-user-1",
    });
    expect(insertedInto(client, "sparkle_finder_nic_nac_conversations")).toMatchObject({
      actor_type: "linked_rep",
      account_tier: "silver",
      linked_suite_business_name: "BlingKitchen",
      linked_suite_rep_id: "rep-bling-kitchen",
      user_id: "finder-user-1",
    });
    expect(insertedInto(client, "sparkle_finder_nic_nac_runs")).toMatchObject({
      active_tools: [],
      allowed_intents: [],
      blocked_intents: ["suite_workspace_mutation"],
      finder_memory_summary_count: 1,
      memory_summary_count: 3,
      model_name: "gpt-5.4",
      model_policy_key: "human_default",
      model_provider: "openai",
      requested_intents: ["suite_workspace_mutation"],
      status: "started",
      suite_memory_summary_count: 2,
    });

    await completeFinderNicNacRun(
      {
        run,
        assistantText: "I need you logged into Sparkle Suite before I can change that workspace.",
        finishReason: "stop",
        latencyMs: 1_250,
        usage: {
          inputTokens: 1_000,
          outputTokens: 500,
          totalTokens: 1_500,
        },
      },
      {
        client,
        env: {
          NIC_NAC_GPT_5_4_INPUT_USD_PER_1M_TOKENS: "10",
          NIC_NAC_GPT_5_4_OUTPUT_USD_PER_1M_TOKENS: "20",
        },
        now,
      },
    );

    expect(updatedIn(client, "sparkle_finder_nic_nac_runs")).toMatchObject({
      completion_tokens: 500,
      estimated_cost_usd: 0.02,
      finish_reason: "stop",
      latency_ms: 1250,
      outcome: "stream_completed",
      prompt_tokens: 1000,
      status: "completed",
      total_tokens: 1500,
    });
    expect(insertedMessages(client).at(-1)).toMatchObject({
      content: "I need you logged into Sparkle Suite before I can change that workspace.",
      role: "assistant",
    });
  });

  it("records mission redirects with no model, tools, memory, or token cost", async () => {
    const client = new FakePersistenceClient();

    await recordFinderNicNacStaticRedirect(
      {
        userId: "finder-user-2",
        messages: [createUserMessage("Please be my therapist.")],
        accountContext: {
          accountTier: "silver",
          actorType: "collector",
        },
        latencyMs: 12,
        redirectMessage: "I stay focused on Sparkle Finder and live-show support.",
      },
      {
        client,
        generateId: createIdGenerator(["conversation-2", "run-2"]),
        now,
      },
    );

    expect(insertedInto(client, "sparkle_finder_nic_nac_runs")).toMatchObject({
      active_tools: [],
      allowed_intents: [],
      blocked_intents: [],
      completion_tokens: 0,
      estimated_cost_usd: 0,
      finder_memory_summary_count: 0,
      memory_summary_count: 0,
      outcome: "mission_redirect",
      prompt_tokens: 0,
      requested_intents: [],
      status: "redirected",
      suite_memory_summary_count: 0,
      total_tokens: 0,
    });
    expect(insertedMessages(client).map((message) => message.role)).toEqual(["user", "assistant"]);
  });
});

function createUserMessage(text: string): UIMessage {
  return {
    id: "message-1",
    role: "user",
    parts: [{ type: "text", text }],
  } as UIMessage;
}

function createIdGenerator(ids: string[]) {
  let index = 0;

  return () => ids[index++] ?? `generated-${index}`;
}

function insertedInto(client: FakePersistenceClient, table: string) {
  const operation = client.operations.find((item) => item.type === "insert" && item.table === table);

  if (!operation || operation.type !== "insert" || Array.isArray(operation.values)) {
    throw new Error(`Missing insert for ${table}`);
  }

  return operation.values;
}

function updatedIn(client: FakePersistenceClient, table: string) {
  const operation = client.operations.find((item) => item.type === "update" && item.table === table);

  if (!operation || operation.type !== "update") {
    throw new Error(`Missing update for ${table}`);
  }

  return operation.values;
}

function insertedMessages(client: FakePersistenceClient) {
  return client.operations
    .filter((item): item is Extract<WriteOperation, { type: "insert" }> =>
      item.type === "insert" && item.table === "sparkle_finder_nic_nac_messages")
    .map((item) => item.values)
    .filter((item): item is Record<string, unknown> => !Array.isArray(item));
}
