import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import {
  getNicNacLanguageModel,
  getNicNacProviderOptions,
  isNicNacOpenAIConfigured,
} from "@/lib/nic-nac/core/model-provider";
import { classifyNicNacMissionScopeForMessages } from "@/lib/nic-nac/core/mission-guard";
import { getNicNacModelPolicy } from "@/lib/nic-nac/core/model-policy";
import { createNicNacStaticTextStreamResponse } from "@/lib/nic-nac/core/static-stream";
import { getCurrentSparkleFinderAccount } from "@/lib/sparkle-finder/account-service";
import {
  isLocalPreviewAuthEnabled,
  parseSparkleFinderAuthMode,
  sparkleFinderAuthCookieName,
  type SparkleFinderAuthMode,
} from "@/lib/sparkle-finder/auth";
import { getSparkleFinderAccountEntitlements } from "@/lib/sparkle-finder/entitlements";
import {
  createSupabaseCustomerMemoryStore,
  getSafeCustomerMemoryForPrompt,
  type SupabaseCustomerMemoryClient,
} from "@/lib/sparkle-finder/customer-memory";
import {
  buildFinderNicNacTools,
  getFinderNicNacToolIntentsForMessages,
  listFinderNicNacToolNamesForIntents,
} from "@/lib/sparkle-finder/nic-nac/tools";
import { summarizeFinderNicNacMemoryHints } from "@/lib/sparkle-finder/nic-nac/curator";
import { buildFinderNicNacSystemPrompt } from "@/lib/sparkle-finder/nic-nac/prompt-builder";
import type { FinderNicNacAccountContext } from "@/lib/sparkle-finder/nic-nac/prompt-builder";
import {
  completeFinderNicNacRun,
  failFinderNicNacRun,
  recordFinderNicNacStaticRedirect,
  startFinderNicNacRun,
} from "@/lib/sparkle-finder/nic-nac/persistence";
import {
  createFinderNicNacProductContext,
  filterFinderNicNacToolIntentsForContext,
} from "@/lib/sparkle-finder/nic-nac/tool-policy";
import { getSuiteLinkedRepMemorySummariesForFinder } from "@/lib/sparkle-finder/suite-linked-rep-memory";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type FinderNicNacPostBody = {
  messages?: UIMessage[];
};

export async function POST(request: Request) {
  const routeStartedAt = Date.now();
  const localPreviewAuthMode = getLocalPreviewAuthMode(request);
  const accountState = await getCurrentSparkleFinderAccount(
    localPreviewAuthMode ? { localPreviewAuthMode } : undefined,
  );

  if (accountState.status !== "authenticated") {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const entitlements = getSparkleFinderAccountEntitlements(accountState);

  if (!entitlements.canUseNicNacFindRequests) {
    return NextResponse.json({ error: "silver_required" }, { status: 403 });
  }

  let body: FinderNicNacPostBody;

  try {
    body = (await request.json()) as FinderNicNacPostBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];

  if (messages.length === 0) {
    return NextResponse.json({ error: "missing_messages" }, { status: 400 });
  }

  const accountContext = createFinderNicNacAccountContext(accountState);
  const missionScope = classifyNicNacMissionScopeForMessages(messages);

  if (missionScope.action === "redirect") {
    await recordFinderNicNacStaticRedirect({
      userId: accountState.customer.id,
      messages,
      accountContext,
      redirectMessage: missionScope.message,
      latencyMs: Date.now() - routeStartedAt,
    });

    return createNicNacStaticTextStreamResponse({
      message: missionScope.message,
      messageId: randomUUID(),
    });
  }

  if (!isNicNacOpenAIConfigured()) {
    return NextResponse.json({ error: "model_not_configured" }, { status: 503 });
  }

  const requestedIntents = getFinderNicNacToolIntentsForMessages(messages);
  const supabase = await createClient();
  const memoryStore = createSupabaseCustomerMemoryStore(supabase as unknown as SupabaseCustomerMemoryClient);
  const finderToolClient = supabase as unknown as NonNullable<
    Parameters<typeof buildFinderNicNacTools>[0]["supabase"]
  >;
  const finderMemorySummaries = summarizeFinderNicNacMemoryHints(
    await getSafeCustomerMemoryForPrompt(memoryStore, accountState.customer.id),
  );
  const productContext = createFinderNicNacProductContext({
    actorType: accountContext.actorType,
    accountTier: accountContext.accountTier,
    linkedSuiteRepId: accountContext.linkedSuiteRepId,
  });
  const toolPolicy = filterFinderNicNacToolIntentsForContext(productContext, requestedIntents);
  const intents = toolPolicy.allowedIntents;
  const blockedIntentLabels = toolPolicy.blockedIntents.map((blocked) => `${blocked.intent}:${blocked.reason}`);
  const activeToolNames = toolPolicy.allowedToolNames.length > 0
    ? toolPolicy.allowedToolNames
    : listFinderNicNacToolNamesForIntents(intents);
  const suiteMemorySummaries =
    accountContext.actorType === "linked_rep" && accountContext.linkedSuiteRepId
      ? await getSuiteLinkedRepMemorySummariesForFinder({
          finderUserId: accountState.customer.id,
          suiteRepId: accountContext.linkedSuiteRepId,
        })
      : [];
  const memorySummaries = [
    ...finderMemorySummaries,
    ...suiteMemorySummaries,
  ].slice(0, 8);
  const tools = buildFinderNicNacTools(
    {
      accountState,
      memoryStore,
      supabase: finderToolClient,
      userId: accountState.customer.id,
    },
    intents,
  );
  const modelMessages = await convertToModelMessages(messages);
  const modelPolicy = getNicNacModelPolicy("human_default");
  const telemetryRun = await startFinderNicNacRun({
    userId: accountState.customer.id,
    messages,
    accountContext,
    requestedIntents,
    allowedIntents: intents,
    blockedIntents: blockedIntentLabels,
    activeToolNames,
    modelPolicy,
    finderMemorySummaryCount: finderMemorySummaries.length,
    suiteMemorySummaryCount: suiteMemorySummaries.length,
    latencyStartedAt: routeStartedAt,
  });
  const result = streamText({
    model: getNicNacLanguageModel(modelPolicy),
    system: buildFinderNicNacSystemPrompt({
      activeToolNames,
      intents,
      blockedToolIntents: toolPolicy.blockedIntents,
      accountContext,
      memorySummaries,
    }),
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(5),
    providerOptions: getNicNacProviderOptions(modelPolicy),
    onError: async ({ error }) => {
      await failFinderNicNacRun({
        run: telemetryRun,
        error,
        latencyMs: Date.now() - routeStartedAt,
      });
    },
    onFinish: async (event) => {
      await completeFinderNicNacRun({
        run: telemetryRun,
        assistantText: event.text,
        usage: {
          inputTokens: event.totalUsage.inputTokens,
          outputTokens: event.totalUsage.outputTokens,
          totalTokens: event.totalUsage.totalTokens,
        },
        finishReason: event.finishReason,
        latencyMs: Date.now() - routeStartedAt,
      });
    },
  });

  return result.toUIMessageStreamResponse({
    onError: () => "Nic-Nac could not answer that just now. Try again in a sec, and if this keeps happening, let Louis know.",
  });
}

function getLocalPreviewAuthMode(request: Request): SparkleFinderAuthMode | undefined {
  if (!isLocalPreviewAuthEnabled()) {
    return undefined;
  }

  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return undefined;
  }

  const rawValue = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${sparkleFinderAuthCookieName}=`))
    ?.slice(sparkleFinderAuthCookieName.length + 1);

  if (!rawValue) {
    return undefined;
  }

  try {
    const authMode = parseSparkleFinderAuthMode(decodeURIComponent(rawValue));

    return authMode === "anonymous" ? undefined : authMode;
  } catch {
    return undefined;
  }
}

function createFinderNicNacAccountContext(accountState: Awaited<ReturnType<typeof getCurrentSparkleFinderAccount>>): FinderNicNacAccountContext {
  const accountTier: FinderNicNacAccountContext["accountTier"] =
    accountState.status === "authenticated" ? accountState.tier : "free";
  const repIdentity =
    accountState.status === "authenticated"
      ? accountState.repIdentity ?? accountState.customer.repIdentity
      : undefined;
  const repEntitlement =
    accountState.status === "authenticated"
      ? accountState.repEntitlement
      : undefined;

  if (repIdentity) {
    return {
      actorType: "linked_rep",
      accountTier,
      linkedSuiteBusinessName: repIdentity.businessName,
      linkedSuiteRepId: repIdentity.sparkleSuiteRepId,
    };
  }

  if (repEntitlement) {
    return {
      actorType: "linked_rep",
      accountTier,
      linkedSuiteBusinessName: repEntitlement.businessName,
      linkedSuiteRepId: repEntitlement.sparkleSuiteRepId,
    };
  }

  return {
    actorType: "collector",
    accountTier,
  };
}
