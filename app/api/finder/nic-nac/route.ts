import { NextResponse } from "next/server";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { getCurrentSparkleFinderAccount } from "@/lib/sparkle-finder/account-service";
import {
  createSupabaseCustomerMemoryStore,
  type SupabaseCustomerMemoryClient,
} from "@/lib/sparkle-finder/customer-memory";
import {
  buildFinderNicNacTools,
  getFinderNicNacToolIntentsForMessages,
  listFinderNicNacToolNamesForIntents,
} from "@/lib/sparkle-finder/nic-nac/tools";
import { buildFinderNicNacSystemPrompt } from "@/lib/sparkle-finder/nic-nac/prompt-builder";
import { createClient } from "@/lib/supabase/server";

const anthropic = createAnthropic({ baseURL: "https://api.anthropic.com/v1" });
const finderNicNacModel = "claude-haiku-4-5-20251001";

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
  const tools = buildFinderNicNacTools({ memoryStore, userId: accountState.customer.id }, intents);
  const modelMessages = await convertToModelMessages(messages);
  const result = streamText({
    model: anthropic(finderNicNacModel),
    system: buildFinderNicNacSystemPrompt({
      activeToolNames,
      intents,
    }),
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse({
    onError: () => "Nic-Nac could not answer that just now. Try again in a sec, and if this keeps happening, let Louis know.",
  });
}
