import { randomUUID, timingSafeEqual } from "node:crypto";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { getSparkleFinderSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SmokeAdminUser = {
  id?: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

type SmokeAdminClient = {
  auth: {
    admin: {
      createUser: (input: {
        email: string;
        email_confirm: boolean;
        password: string;
        user_metadata: Record<string, string>;
      }) => Promise<{
        data: { user: SmokeAdminUser | null };
        error: unknown;
      }>;
      deleteUser: (userId: string) => Promise<{ error: unknown }>;
      getUserById: (userId: string) => Promise<{
        data: { user: SmokeAdminUser | null };
        error: unknown;
      }>;
    };
  };
  from: (table: string) => {
    upsert: (
      values: Record<string, unknown> | Array<Record<string, unknown>>,
      options?: { onConflict?: string },
    ) => PromiseLike<{ error: unknown }>;
    delete: () => {
      eq: (column: string, value: string) => PromiseLike<{ error: unknown }>;
    };
  };
};

type SmokeSessionClient = {
  auth: {
    signInWithPassword: (input: {
      email: string;
      password: string;
    }) => Promise<{
      data: { session: unknown; user: { id?: string } | null };
      error: unknown;
    }>;
  };
};

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

const smokeTokenEnvName = "SPARKLE_FINDER_INTERNAL_SMOKE_TOKEN";
const smokeUserEmailPrefix = "finder-reviewer-smoke+";
const smokeUserEmailDomain = "@example.test";
const smokeMetadataName = "finder-reviewer-smoke";

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

  const smokeId = `finder-reviewer-smoke-${randomUUID()}`;
  const password = `FinderSmoke!${randomUUID().replace(/-/g, "").slice(0, 24)}`;
  const cookieSink: CookieToSet[] = [];
  let createdUserId: string | null = null;

  try {
    const user = await createSmokeUser(admin, smokeId, password);
    createdUserId = user.id;
    await seedSilverSmokeAccountRows(admin, {
      email: user.email,
      nowIso: new Date().toISOString(),
      userId: user.id,
    });

    const sessionClient = createSmokeSessionClient(cookieSink);

    if (!sessionClient) {
      throw new Error("Supabase public auth is not configured.");
    }

    const signInResult = await sessionClient.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (signInResult.error || !signInResult.data.session) {
      throw new Error("Could not mint reviewer smoke session.");
    }

    const response = NextResponse.json({
      ok: true,
      smokeId,
      userId: user.id,
    });

    applyCookiesToResponse(response, cookieSink);

    return response;
  } catch (error) {
    if (createdUserId) {
      await cleanupSmokeUser(admin, createdUserId);
    }

    return NextResponse.json(
      {
        ok: false,
        smokeId,
        error: safeErrorMessage(error),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const authResult = authorizeSmokeRequest(request);

  if (!authResult.configured) {
    return NextResponse.json({ error: "smoke_not_configured" }, { status: 503 });
  }

  if (!authResult.authorized) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const userId = isRecord(body) && typeof body.userId === "string" ? body.userId : "";

  if (!userId) {
    return NextResponse.json({ error: "missing_user_id" }, { status: 400 });
  }

  const admin = createSupabaseServiceRoleClient() as SmokeAdminClient | null;

  if (!admin) {
    return NextResponse.json({ error: "service_role_not_configured" }, { status: 503 });
  }

  const cleanup = await cleanupSmokeUser(admin, userId);

  return NextResponse.json({
    ok: cleanup.ok,
    cleanup,
  }, { status: cleanup.ok ? 200 : 409 });
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

async function createSmokeUser(
  admin: SmokeAdminClient,
  smokeId: string,
  password: string,
): Promise<{ email: string; id: string }> {
  const email = `${smokeUserEmailPrefix}${Date.now()}-${randomUUID().slice(0, 8)}${smokeUserEmailDomain}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: {
      smoke: smokeMetadataName,
      smokeId,
      display_name: "Finder Reviewer Smoke",
      privacy_acknowledged: "true",
    },
  });

  if (error || !data.user?.id) {
    throw new Error("Could not create reviewer smoke user.");
  }

  return {
    email: data.user.email ?? email,
    id: data.user.id,
  };
}

async function seedSilverSmokeAccountRows(
  admin: SmokeAdminClient,
  input: {
    email: string;
    nowIso: string;
    userId: string;
  },
) {
  const trialEndsAt = new Date(Date.parse(input.nowIso) + 45 * 24 * 60 * 60 * 1000).toISOString();

  await assertUpsertOk(admin, "sparkle_finder_profiles", {
    user_id: input.userId,
    display_name: "Finder Reviewer Smoke",
    email: input.email,
    state: "Smoke",
    bio: "",
    profile_visibility: "private",
    is_rep: false,
  });
  await assertUpsertOk(admin, "sparkle_finder_memberships", {
    user_id: input.userId,
    access_state: "silver_trial",
    silver_source: "trial",
    trial_started_at: input.nowIso,
    trial_ends_at: trialEndsAt,
    silver_started_at: input.nowIso,
    silver_ends_at: trialEndsAt,
  });
}

async function assertUpsertOk(
  admin: SmokeAdminClient,
  table: string,
  values: Record<string, unknown>,
) {
  const { error } = await admin.from(table).upsert(values, { onConflict: "user_id" });

  if (error) {
    throw new Error(`Could not seed ${table} for reviewer smoke.`);
  }
}

function createSmokeSessionClient(cookieSink: CookieToSet[]): SmokeSessionClient | null {
  const config = getSparkleFinderSupabaseConfig();

  if (!config) {
    return null;
  }

  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll(cookiesToSet) {
        cookieSink.push(...cookiesToSet);
      },
    },
  }) as SmokeSessionClient;
}

function applyCookiesToResponse(response: NextResponse, cookiesToSet: CookieToSet[]) {
  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, options);
  }
}

async function cleanupSmokeUser(admin: SmokeAdminClient, userId: string) {
  const verification = await verifySmokeUser(admin, userId);

  if (!verification.ok) {
    return {
      ok: false,
      blocked: true,
      failedTargets: [verification.reason],
    };
  }

  const cleanupErrors: string[] = [];

  for (const table of [
    "sparkle_finder_nic_nac_messages",
    "sparkle_finder_nic_nac_runs",
    "sparkle_finder_nic_nac_conversations",
    "sparkle_finder_memberships",
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

  return {
    ok: cleanupErrors.length === 0,
    blocked: false,
    failedTargets: cleanupErrors,
  };
}

async function verifySmokeUser(admin: SmokeAdminClient, userId: string) {
  try {
    const { data, error } = await admin.auth.admin.getUserById(userId);
    const user = error ? null : data.user;

    if (!user) {
      return { ok: false, reason: "auth_user_not_found" };
    }

    if (isReviewerSmokeUser(user)) {
      return { ok: true, reason: null };
    }

    return { ok: false, reason: "not_reviewer_smoke_user" };
  } catch {
    return { ok: false, reason: "auth_user_verification_failed" };
  }
}

function isReviewerSmokeUser(user: SmokeAdminUser): boolean {
  const email = user.email?.toLowerCase() ?? "";
  const smokeMarker = user.user_metadata?.smoke;

  return (
    smokeMarker === smokeMetadataName ||
    (email.startsWith(smokeUserEmailPrefix) && email.endsWith(smokeUserEmailDomain))
  );
}

function safeEqual(value: string, expected: string): boolean {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  return valueBuffer.length === expectedBuffer.length
    && timingSafeEqual(valueBuffer, expectedBuffer);
}

function safeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message.slice(0, 300) : "Reviewer smoke session failed.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
