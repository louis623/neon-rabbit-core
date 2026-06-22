import { randomUUID, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { UIMessage } from "ai";
import { getNicNacModelPolicy } from "@/lib/nic-nac/core/model-policy";
import { NIC_NAC_MISSION_REDIRECT_MESSAGE } from "@/lib/nic-nac/core/mission-guard";
import {
  completeFinderNicNacRun,
  recordFinderNicNacStaticRedirect,
  startFinderNicNacRun,
} from "@/lib/sparkle-finder/nic-nac/persistence";
import type { FinderNicNacAccountContext } from "@/lib/sparkle-finder/nic-nac/prompt-builder";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type SmokeUser = {
  email: string;
  id: string;
};

type SmokeTableRow = Record<string, unknown>;

type SmokeAdminClient = {
  auth: {
    admin: {
      createUser: (input: {
        email: string;
        email_confirm: boolean;
        password: string;
        user_metadata: Record<string, string>;
      }) => Promise<{ data: { user: { id?: string; email?: string | null } | null }; error: unknown }>;
      deleteUser: (userId: string) => Promise<{ error: unknown }>;
    };
  };
  from: (table: string) => {
    delete: () => {
      eq: (column: string, value: string) => PromiseLike<{ error: unknown }>;
    };
    select: (columns: string) => {
      eq: (column: string, value: string) => PromiseLike<{ data: unknown; error: unknown }>;
    };
  };
};

const smokeTokenEnvName = "SPARKLE_FINDER_INTERNAL_SMOKE_TOKEN";
const conversationTable = "sparkle_finder_nic_nac_conversations";
const messageTable = "sparkle_finder_nic_nac_messages";
const runTable = "sparkle_finder_nic_nac_runs";

export async function POST(request: Request) {
  const authResult = authorizeSmokeRequest(request);

  if (!authResult.configured) {
    return NextResponse.json({ error: "smoke_not_configured" }, { status: 503 });
  }

  if (!authResult.authorized) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseServiceRoleClient() as SmokeAdminClient | null;

  if (!admin) {
    return NextResponse.json({ error: "service_role_not_configured" }, { status: 503 });
  }

  const smokeId = `finder-nic-nac-telemetry-${randomUUID()}`;
  let user: SmokeUser | null = null;
  let cleanup: Awaited<ReturnType<typeof cleanupSmokeUser>> | null = null;

  try {
    user = await createSmokeUser(admin, smokeId);
    await runTelemetryWrites(user.id);
    const verification = await verifyTelemetryRows(admin, user.id);

    cleanup = await cleanupSmokeUser(admin, user.id);

    return NextResponse.json({
      ok: true,
      smokeId,
      checks: verification.checks,
      rowCounts: verification.rowCounts,
      cleanup,
    });
  } catch (error) {
    if (user) {
      cleanup = await cleanupSmokeUser(admin, user.id);
    }

    return NextResponse.json(
      {
        ok: false,
        smokeId,
        error: safeErrorMessage(error),
        cleanup,
      },
      { status: 500 },
    );
  }
}

function authorizeSmokeRequest(request: Request) {
  const expectedToken = process.env[smokeTokenEnvName]?.trim();

  if (!expectedToken) {
    return { authorized: false, configured: false };
  }

  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token = ""] = authorization.split(/\s+/, 2);

  if (scheme.toLowerCase() !== "bearer" || !token) {
    return { authorized: false, configured: true };
  }

  return {
    authorized: safeEqual(token, expectedToken),
    configured: true,
  };
}

async function createSmokeUser(admin: SmokeAdminClient, smokeId: string): Promise<SmokeUser> {
  const email = `finder-telemetry-smoke+${Date.now()}-${randomUUID().slice(0, 8)}@example.test`;
  const password = `FinderTelemetry!${randomUUID().replace(/-/g, "").slice(0, 24)}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: {
      smoke: "finder-nic-nac-telemetry",
      smokeId,
    },
  });

  if (error || !data.user?.id) {
    throw new Error("Could not create telemetry smoke user.");
  }

  return {
    email: data.user.email ?? email,
    id: data.user.id,
  };
}

async function runTelemetryWrites(userId: string) {
  const accountContext: FinderNicNacAccountContext = {
    accountTier: "silver",
    actorType: "linked_rep",
    linkedSuiteBusinessName: "Finder Telemetry Smoke",
    linkedSuiteRepId: "finder-telemetry-smoke-suite-rep",
  };
  const messages: UIMessage[] = [
    {
      id: `finder-telemetry-smoke-${randomUUID()}`,
      role: "user",
      parts: [{ type: "text", text: "Run the Finder Nic-Nac telemetry smoke." }],
    } as UIMessage,
  ];
  const redirect = await recordFinderNicNacStaticRedirect({
    userId,
    messages,
    accountContext,
    redirectMessage: NIC_NAC_MISSION_REDIRECT_MESSAGE,
    latencyMs: 0,
  });

  if (!redirect) {
    throw new Error("Mission redirect telemetry write did not return a run handle.");
  }

  const modelRun = await startFinderNicNacRun({
    userId,
    messages,
    accountContext,
    requestedIntents: ["memory"],
    allowedIntents: ["memory"],
    blockedIntents: [],
    activeToolNames: [],
    modelPolicy: getNicNacModelPolicy("human_default"),
    finderMemorySummaryCount: 1,
    suiteMemorySummaryCount: 1,
    latencyStartedAt: Date.now(),
  });

  if (!modelRun) {
    throw new Error("Model run telemetry start did not return a run handle.");
  }

  const completed = await completeFinderNicNacRun({
    run: modelRun,
    assistantText: "Finder Nic-Nac telemetry smoke completed.",
    usage: {
      inputTokens: 12,
      outputTokens: 8,
      totalTokens: 20,
    },
    finishReason: "stop",
    latencyMs: 1,
  });

  if (!completed) {
    throw new Error("Model run telemetry completion failed.");
  }
}

async function verifyTelemetryRows(admin: SmokeAdminClient, userId: string) {
  const [conversations, messages, runs] = await Promise.all([
    selectRows(admin, conversationTable, userId),
    selectRows(admin, messageTable, userId),
    selectRows(admin, runTable, userId),
  ]);
  const checks = {
    completedRun: runs.some((row) =>
      row.status === "completed"
      && row.outcome === "stream_completed"
      && row.model_provider === "openai"
      && row.model_policy_key === "human_default"
      && row.total_tokens === 20),
    conversations: conversations.length >= 2,
    messages: messages.some((row) => row.role === "user") && messages.some((row) => row.role === "assistant"),
    redirectedRun: runs.some((row) =>
      row.status === "redirected"
      && row.outcome === "mission_redirect"
      && row.total_tokens === 0),
  };

  if (Object.values(checks).some((passed) => !passed)) {
    throw new Error(`Telemetry smoke verification failed: ${JSON.stringify(checks)}`);
  }

  return {
    checks,
    rowCounts: {
      conversations: conversations.length,
      messages: messages.length,
      runs: runs.length,
    },
  };
}

async function selectRows(admin: SmokeAdminClient, table: string, userId: string): Promise<SmokeTableRow[]> {
  const { data, error } = await admin.from(table).select("*").eq("user_id", userId);

  if (error) {
    throw new Error(`Could not read ${table} telemetry rows.`);
  }

  return Array.isArray(data) ? data as SmokeTableRow[] : [];
}

async function cleanupSmokeUser(admin: SmokeAdminClient, userId: string) {
  const cleanupErrors: string[] = [];

  for (const table of [
    messageTable,
    runTable,
    conversationTable,
    "sparkle_finder_memberships",
    "sparkle_finder_communication_consents",
    "sparkle_finder_profiles",
  ]) {
    try {
      const { error } = await admin.from(table).delete().eq("user_id", userId);

      if (error) {
        cleanupErrors.push(table);
      }
    } catch {
      cleanupErrors.push(table);
    }
  }

  try {
    const { error } = await admin.auth.admin.deleteUser(userId);

    if (error) {
      cleanupErrors.push("auth.users");
    }
  } catch {
    cleanupErrors.push("auth.users");
  }

  const residualCounts = await getResidualTelemetryCounts(admin, userId);

  return {
    ok: cleanupErrors.length === 0 && Object.values(residualCounts).every((count) => count === 0),
    residualCounts,
    failedTargets: cleanupErrors,
  };
}

async function getResidualTelemetryCounts(admin: SmokeAdminClient, userId: string) {
  const [conversations, messages, runs] = await Promise.all([
    selectRows(admin, conversationTable, userId).catch(() => []),
    selectRows(admin, messageTable, userId).catch(() => []),
    selectRows(admin, runTable, userId).catch(() => []),
  ]);

  return {
    conversations: conversations.length,
    messages: messages.length,
    runs: runs.length,
  };
}

function safeEqual(value: string, expected: string): boolean {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  return valueBuffer.length === expectedBuffer.length
    && timingSafeEqual(valueBuffer, expectedBuffer);
}

function safeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 300) : "Telemetry smoke failed.";
}
