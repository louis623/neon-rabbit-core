import { randomUUID } from "node:crypto";
import type { UIMessage } from "ai";
import type { NicNacModelPolicy } from "@/lib/nic-nac/core/model-policy";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { FinderNicNacAccountContext } from "./prompt-builder";

type FinderNicNacRunStatus = "started" | "completed" | "failed" | "redirected";

type FinderNicNacUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

type FinderNicNacTableWrite = PromiseLike<{ error: unknown }>;

export type FinderNicNacPersistenceClient = {
  from: (table: string) => {
    insert: (values: Record<string, unknown> | Array<Record<string, unknown>>) => FinderNicNacTableWrite;
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: string) => FinderNicNacTableWrite;
    };
  };
};

export type FinderNicNacRunHandle = {
  conversationId: string;
  modelId?: string;
  runId: string;
  userId: string;
};

export type StartFinderNicNacRunInput = {
  userId: string;
  messages: UIMessage[];
  accountContext: FinderNicNacAccountContext;
  requestedIntents: string[];
  allowedIntents: string[];
  blockedIntents: string[];
  activeToolNames: string[];
  modelPolicy: NicNacModelPolicy;
  finderMemorySummaryCount: number;
  suiteMemorySummaryCount: number;
  latencyStartedAt: number;
};

export type CompleteFinderNicNacRunInput = {
  run: FinderNicNacRunHandle | null;
  assistantText: string;
  usage?: FinderNicNacUsage;
  finishReason?: string;
  latencyMs: number;
};

export type FailFinderNicNacRunInput = {
  run: FinderNicNacRunHandle | null;
  error: unknown;
  latencyMs: number;
};

export type RecordFinderNicNacStaticRedirectInput = {
  userId: string;
  messages: UIMessage[];
  accountContext: FinderNicNacAccountContext;
  redirectMessage: string;
  latencyMs: number;
};

type FinderNicNacPersistenceOptions = {
  client?: FinderNicNacPersistenceClient | null;
  env?: Record<string, string | undefined>;
  now?: () => Date;
  generateId?: () => string;
};

const conversationTable = "sparkle_finder_nic_nac_conversations";
const messageTable = "sparkle_finder_nic_nac_messages";
const runTable = "sparkle_finder_nic_nac_runs";
const maxStoredTextLength = 8_000;

export async function startFinderNicNacRun(
  input: StartFinderNicNacRunInput,
  options: FinderNicNacPersistenceOptions = {},
): Promise<FinderNicNacRunHandle | null> {
  const persistence = createFinderNicNacPersistence(options);

  if (!persistence) {
    return null;
  }

  const { client, now, generateId } = persistence;
  const createdAt = now().toISOString();
  const conversationId = generateId();
  const runId = generateId();
  const userMessage = getLatestMessageByRole(input.messages, "user");
  const memorySummaryCount = input.finderMemorySummaryCount + input.suiteMemorySummaryCount;

  try {
    await assertNoSupabaseError(
      client.from(conversationTable).insert({
        id: conversationId,
        user_id: input.userId,
        actor_type: input.accountContext.actorType,
        account_tier: input.accountContext.accountTier,
        linked_suite_rep_id: input.accountContext.linkedSuiteRepId ?? null,
        linked_suite_business_name: input.accountContext.linkedSuiteBusinessName ?? null,
        source: "finder_nic_nac",
        created_at: createdAt,
        updated_at: createdAt,
        last_message_at: createdAt,
      }),
    );
    await insertNicNacMessage(client, {
      conversationId,
      userId: input.userId,
      role: "user",
      message: userMessage,
      fallbackContent: extractTextFromUiMessages(input.messages),
      createdAt,
    });
    await assertNoSupabaseError(
      client.from(runTable).insert({
        id: runId,
        conversation_id: conversationId,
        user_id: input.userId,
        status: "started" satisfies FinderNicNacRunStatus,
        model_provider: input.modelPolicy.provider,
        model_name: input.modelPolicy.modelId,
        model_policy_key: input.modelPolicy.key,
        reasoning_effort: input.modelPolicy.reasoning,
        requested_intents: input.requestedIntents,
        allowed_intents: input.allowedIntents,
        blocked_intents: input.blockedIntents,
        active_tools: input.activeToolNames,
        actor_type: input.accountContext.actorType,
        account_tier: input.accountContext.accountTier,
        linked_suite_rep_id: input.accountContext.linkedSuiteRepId ?? null,
        finder_memory_summary_count: input.finderMemorySummaryCount,
        suite_memory_summary_count: input.suiteMemorySummaryCount,
        memory_summary_count: memorySummaryCount,
        latency_ms: Math.max(0, Date.now() - input.latencyStartedAt),
        started_at: createdAt,
        created_at: createdAt,
        updated_at: createdAt,
      }),
    );

    return {
      conversationId,
      modelId: input.modelPolicy.modelId,
      runId,
      userId: input.userId,
    };
  } catch (error) {
    warnPersistenceFailure("start", error);
    return null;
  }
}

export async function completeFinderNicNacRun(
  input: CompleteFinderNicNacRunInput,
  options: FinderNicNacPersistenceOptions = {},
): Promise<boolean> {
  if (!input.run) {
    return false;
  }

  const persistence = createFinderNicNacPersistence(options);

  if (!persistence) {
    return false;
  }

  const { client, now, env } = persistence;
  const completedAt = now().toISOString();
  const inputTokens = sanitizeTokenCount(input.usage?.inputTokens);
  const outputTokens = sanitizeTokenCount(input.usage?.outputTokens);
  const totalTokens = sanitizeTokenCount(input.usage?.totalTokens);

  try {
    await insertNicNacMessage(client, {
      conversationId: input.run.conversationId,
      userId: input.run.userId,
      role: "assistant",
      fallbackContent: input.assistantText,
      createdAt: completedAt,
    });
    await assertNoSupabaseError(
      client.from(runTable).update({
        status: "completed" satisfies FinderNicNacRunStatus,
        outcome: "stream_completed",
        prompt_tokens: inputTokens,
        completion_tokens: outputTokens,
        total_tokens: totalTokens,
        estimated_cost_usd: estimateNicNacCostUsd({
          inputTokens,
          outputTokens,
          modelId: input.run.modelId,
          env,
        }),
        latency_ms: input.latencyMs,
        finish_reason: input.finishReason ?? null,
        completed_at: completedAt,
        updated_at: completedAt,
      }).eq("id", input.run.runId),
    );
    await touchConversation(client, input.run.conversationId, completedAt);

    return true;
  } catch (error) {
    warnPersistenceFailure("complete", error);
    return false;
  }
}

export async function failFinderNicNacRun(
  input: FailFinderNicNacRunInput,
  options: FinderNicNacPersistenceOptions = {},
): Promise<boolean> {
  if (!input.run) {
    return false;
  }

  const persistence = createFinderNicNacPersistence(options);

  if (!persistence) {
    return false;
  }

  const { client, now } = persistence;
  const completedAt = now().toISOString();

  try {
    await assertNoSupabaseError(
      client.from(runTable).update({
        status: "failed" satisfies FinderNicNacRunStatus,
        outcome: "stream_failed",
        latency_ms: input.latencyMs,
        error_code: getErrorCode(input.error),
        error_message: truncateText(getErrorMessage(input.error), 1_000),
        completed_at: completedAt,
        updated_at: completedAt,
      }).eq("id", input.run.runId),
    );
    await touchConversation(client, input.run.conversationId, completedAt);

    return true;
  } catch (error) {
    warnPersistenceFailure("fail", error);
    return false;
  }
}

export async function recordFinderNicNacStaticRedirect(
  input: RecordFinderNicNacStaticRedirectInput,
  options: FinderNicNacPersistenceOptions = {},
): Promise<FinderNicNacRunHandle | null> {
  const persistence = createFinderNicNacPersistence(options);

  if (!persistence) {
    return null;
  }

  const { client, now, generateId } = persistence;
  const createdAt = now().toISOString();
  const conversationId = generateId();
  const runId = generateId();
  const userMessage = getLatestMessageByRole(input.messages, "user");

  try {
    await assertNoSupabaseError(
      client.from(conversationTable).insert({
        id: conversationId,
        user_id: input.userId,
        actor_type: input.accountContext.actorType,
        account_tier: input.accountContext.accountTier,
        linked_suite_rep_id: input.accountContext.linkedSuiteRepId ?? null,
        linked_suite_business_name: input.accountContext.linkedSuiteBusinessName ?? null,
        source: "finder_nic_nac",
        created_at: createdAt,
        updated_at: createdAt,
        last_message_at: createdAt,
      }),
    );
    await insertNicNacMessage(client, {
      conversationId,
      userId: input.userId,
      role: "user",
      message: userMessage,
      fallbackContent: extractTextFromUiMessages(input.messages),
      createdAt,
    });
    await insertNicNacMessage(client, {
      conversationId,
      userId: input.userId,
      role: "assistant",
      fallbackContent: input.redirectMessage,
      createdAt,
    });
    await assertNoSupabaseError(
      client.from(runTable).insert({
        id: runId,
        conversation_id: conversationId,
        user_id: input.userId,
        status: "redirected" satisfies FinderNicNacRunStatus,
        outcome: "mission_redirect",
        requested_intents: [],
        allowed_intents: [],
        blocked_intents: [],
        active_tools: [],
        actor_type: input.accountContext.actorType,
        account_tier: input.accountContext.accountTier,
        linked_suite_rep_id: input.accountContext.linkedSuiteRepId ?? null,
        finder_memory_summary_count: 0,
        suite_memory_summary_count: 0,
        memory_summary_count: 0,
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        estimated_cost_usd: 0,
        latency_ms: input.latencyMs,
        completed_at: createdAt,
        started_at: createdAt,
        created_at: createdAt,
        updated_at: createdAt,
      }),
    );

    return {
      conversationId,
      runId,
      userId: input.userId,
    };
  } catch (error) {
    warnPersistenceFailure("redirect", error);
    return null;
  }
}

export function extractTextFromUiMessages(messages: UIMessage[], maxLength = maxStoredTextLength): string {
  return truncateText(
    messages
      .map((message) => extractTextFromUiMessage(message))
      .filter(Boolean)
      .join("\n"),
    maxLength,
  );
}

function createFinderNicNacPersistence(options: FinderNicNacPersistenceOptions) {
  const client = options.client ?? createSupabaseServiceRoleClient();

  if (!client) {
    return null;
  }

  return {
    client,
    env: options.env ?? process.env,
    generateId: options.generateId ?? randomUUID,
    now: options.now ?? (() => new Date()),
  };
}

async function insertNicNacMessage(
  client: FinderNicNacPersistenceClient,
  input: {
    conversationId: string;
    userId: string;
    role: "user" | "assistant" | "system" | "tool";
    message?: UIMessage;
    fallbackContent: string;
    createdAt: string;
  },
) {
  await assertNoSupabaseError(
    client.from(messageTable).insert({
      id: randomUUID(),
      conversation_id: input.conversationId,
      user_id: input.userId,
      role: input.role,
      content: input.message
        ? extractTextFromUiMessage(input.message, maxStoredTextLength)
        : truncateText(input.fallbackContent, maxStoredTextLength),
      parts: input.message ? getSerializableParts(input.message) : [],
      source_message_id: input.message ? getMessageId(input.message) : null,
      created_at: input.createdAt,
    }),
  );
}

async function touchConversation(
  client: FinderNicNacPersistenceClient,
  conversationId: string,
  updatedAt: string,
) {
  await assertNoSupabaseError(
    client.from(conversationTable).update({
      updated_at: updatedAt,
      last_message_at: updatedAt,
    }).eq("id", conversationId),
  );
}

async function assertNoSupabaseError(write: FinderNicNacTableWrite) {
  const result = await write;

  if (result.error) {
    throw result.error;
  }
}

function getLatestMessageByRole(messages: UIMessage[], role: UIMessage["role"]): UIMessage | undefined {
  return [...messages].reverse().find((message) => message.role === role);
}

function extractTextFromUiMessage(message: UIMessage, maxLength = maxStoredTextLength): string {
  const record = message as unknown as Record<string, unknown>;
  const directContent = typeof record.content === "string" ? record.content : "";
  const partText = Array.isArray(message.parts)
    ? message.parts
        .map((part) => extractTextFromMessagePart(part))
        .filter(Boolean)
        .join("")
    : "";

  return truncateText(partText || directContent, maxLength);
}

function extractTextFromMessagePart(part: unknown): string {
  if (!part || typeof part !== "object") {
    return "";
  }

  const record = part as Record<string, unknown>;

  if (typeof record.text === "string") {
    return record.text;
  }

  if (typeof record.content === "string") {
    return record.content;
  }

  return "";
}

function getSerializableParts(message: UIMessage): unknown[] {
  if (!Array.isArray(message.parts)) {
    return [];
  }

  return JSON.parse(JSON.stringify(message.parts)) as unknown[];
}

function getMessageId(message: UIMessage): string | null {
  const record = message as unknown as Record<string, unknown>;

  return typeof record.id === "string" ? record.id : null;
}

function sanitizeTokenCount(value: number | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.round(value) : null;
}

function estimateNicNacCostUsd(input: {
  inputTokens: number | null;
  outputTokens: number | null;
  modelId: string | undefined;
  env: Record<string, string | undefined>;
}): number | null {
  const modelPrefix = input.modelId ? `NIC_NAC_${sanitizeEnvKey(input.modelId)}_` : "NIC_NAC_OPENAI_";
  const inputUsdPerMillion = parsePositiveNumber(
    input.env[`${modelPrefix}INPUT_USD_PER_1M_TOKENS`] ?? input.env.NIC_NAC_OPENAI_INPUT_USD_PER_1M_TOKENS,
  );
  const outputUsdPerMillion = parsePositiveNumber(
    input.env[`${modelPrefix}OUTPUT_USD_PER_1M_TOKENS`] ?? input.env.NIC_NAC_OPENAI_OUTPUT_USD_PER_1M_TOKENS,
  );

  if (
    input.inputTokens === null
    || input.outputTokens === null
    || inputUsdPerMillion === null
    || outputUsdPerMillion === null
  ) {
    return null;
  }

  return Number((((input.inputTokens / 1_000_000) * inputUsdPerMillion)
    + ((input.outputTokens / 1_000_000) * outputUsdPerMillion)).toFixed(6));
}

function parsePositiveNumber(value: string | undefined): number | null {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function sanitizeEnvKey(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

function truncateText(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function getErrorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    return error.code;
  }

  return error instanceof Error ? error.name : "unknown_error";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === "string" ? error : "Unknown Nic-Nac stream error.";
}

function warnPersistenceFailure(stage: string, error: unknown) {
  console.warn(`[finder-nic-nac-persistence] ${stage} telemetry failed`, error);
}
