import { NextResponse } from "next/server";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { getNicNacLanguageModel, getNicNacProviderOptions } from "@/lib/nic-nac/core/model-provider";
import { getNicNacModelPolicy } from "@/lib/nic-nac/core/model-policy";
import { getCurrentSparkleFinderAccount } from "@/lib/sparkle-finder/account-service";
import { getSparkleFinderAccountEntitlements } from "@/lib/sparkle-finder/entitlements";
import {
  createSupabaseCustomerMemoryStore,
  type SupabaseCustomerMemoryClient,
} from "@/lib/sparkle-finder/customer-memory";
import type { SupabaseCollectorSocialReadClient } from "@/lib/sparkle-finder/collector-social-service";
import type { SupabaseFavoriteRepsReadClient } from "@/lib/sparkle-finder/favorite-reps-service";
import {
  buildFinderNicNacTools,
  getFinderNicNacToolIntentsForMessages,
  listFinderNicNacToolNamesForIntents,
} from "@/lib/sparkle-finder/nic-nac/tools";
import { buildFinderNicNacSystemPrompt } from "@/lib/sparkle-finder/nic-nac/prompt-builder";
import type { FinderNicNacAccountContext } from "@/lib/sparkle-finder/nic-nac/prompt-builder";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type FinderNicNacPostBody = {
  messages?: UIMessage[];
};

export async function POST(request: Request) {
  const accountState = await getCurrentSparkleFinderAccount();

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

  const intents = getFinderNicNacToolIntentsForMessages(messages);
  const activeToolNames = listFinderNicNacToolNamesForIntents(intents);
  const supabase = await createClient();
  const memoryStore = createSupabaseCustomerMemoryStore(supabase as unknown as SupabaseCustomerMemoryClient);
  const socialReadClient = supabase as unknown as SupabaseFavoriteRepsReadClient & SupabaseCollectorSocialReadClient;
  const tools = buildFinderNicNacTools({ memoryStore, supabase: socialReadClient, userId: accountState.customer.id }, intents);
  const modelMessages = await convertToModelMessages(messages);
  const modelPolicy = getNicNacModelPolicy("human_default");
  const result = streamText({
    model: getNicNacLanguageModel(modelPolicy),
    system: buildFinderNicNacSystemPrompt({
      activeToolNames,
      intents,
      accountContext: createFinderNicNacAccountContext(accountState),
    }),
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(5),
    providerOptions: getNicNacProviderOptions(modelPolicy),
  });

  return result.toUIMessageStreamResponse({
    onError: () => "Nic-Nac could not answer that just now. Try again in a sec, and if this keeps happening, let Louis know.",
  });
}

function createFinderNicNacAccountContext(accountState: Awaited<ReturnType<typeof getCurrentSparkleFinderAccount>>): FinderNicNacAccountContext {
  const accountTier: FinderNicNacAccountContext["accountTier"] =
    accountState.status === "authenticated" ? accountState.tier : "free";
  const repIdentity =
    accountState.status === "authenticated"
      ? accountState.repIdentity ?? accountState.customer.repIdentity
      : undefined;

  if (repIdentity) {
    return {
      actorType: "linked_rep",
      accountTier,
      linkedSuiteBusinessName: repIdentity.businessName,
      linkedSuiteRepId: repIdentity.sparkleSuiteRepId,
    };
  }

  return {
    actorType: "collector",
    accountTier,
  };
}
