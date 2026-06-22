import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type CookieSetCall = {
  name: string;
  value: string;
  options: Record<string, unknown>;
};

const { fakeAdmin, sessionSignIns } = vi.hoisted(() => {
  const tables: Record<string, Array<Record<string, unknown>>> = {};
  const users = new Map<string, {
    email: string;
    id: string;
    user_metadata: Record<string, unknown>;
  }>();
  const admin = {
    createdUsers: [] as Array<{ email: string; id: string }>,
    deletedUsers: [] as string[],
    reset() {
      for (const key of Object.keys(tables)) {
        delete tables[key];
      }

      users.clear();
      this.createdUsers = [];
      this.deletedUsers = [];
    },
    addUser(user: { email: string; id: string; user_metadata: Record<string, unknown> }) {
      users.set(user.id, user);
    },
    getTable(table: string) {
      return tables[table] ?? [];
    },
    auth: {
      admin: {
        createUser: vi.fn(async ({
          email,
          user_metadata,
        }: {
          email: string;
          user_metadata: Record<string, unknown>;
        }) => {
          const id = `user-${admin.createdUsers.length + 1}`;
          admin.createdUsers.push({ email, id });
          users.set(id, { email, id, user_metadata });

          return { data: { user: { email, id, user_metadata } }, error: null };
        }),
        deleteUser: vi.fn(async (userId: string) => {
          admin.deletedUsers.push(userId);
          users.delete(userId);

          return { error: null };
        }),
        getUserById: vi.fn(async (userId: string) => ({
          data: { user: users.get(userId) ?? null },
          error: null,
        })),
      },
    },
    from(table: string) {
      tables[table] ??= [];

      return {
        upsert: async (values: Record<string, unknown> | Array<Record<string, unknown>>) => {
          const rows = Array.isArray(values) ? values : [values];

          for (const row of rows) {
            const userId = row.user_id;
            const existingIndex = tables[table].findIndex((existing) => existing.user_id === userId);

            if (existingIndex >= 0) {
              tables[table][existingIndex] = { ...tables[table][existingIndex], ...row };
            } else {
              tables[table].push(row);
            }
          }

          return { error: null };
        },
        delete: () => ({
          eq: async (column: string, value: string) => {
            tables[table] = tables[table].filter((row) => row[column] !== value);

            return { error: null };
          },
        }),
      };
    },
  };
  const signIns: Array<{ email: string; password: string }> = [];

  return { fakeAdmin: admin, sessionSignIns: signIns };
});

vi.mock("@/lib/supabase/service-role", () => ({
  createSupabaseServiceRoleClient: () => fakeAdmin,
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    options: {
      cookies: {
        setAll: (cookies: CookieSetCall[]) => void;
      };
    },
  ) => ({
    auth: {
      signInWithPassword: vi.fn(async ({
        email,
        password,
      }: {
        email: string;
        password: string;
      }) => {
        sessionSignIns.push({ email, password });
        options.cookies.setAll([
          {
            name: "sb-smoke-auth-token",
            value: "session-value",
            options: {
              httpOnly: true,
              path: "/",
              sameSite: "lax",
            },
          },
        ]);

        return { data: { session: { access_token: "token" }, user: { id: "user-1" } }, error: null };
      }),
    },
  }),
}));

import {
  DELETE,
  POST,
} from "../../app/api/internal/finder/reviewer-smoke-session/route";

describe("Finder reviewer smoke session route", () => {
  beforeEach(() => {
    fakeAdmin.reset();
    sessionSignIns.length = 0;
    vi.stubEnv("SPARKLE_FINDER_INTERNAL_SMOKE_TOKEN", "test-smoke-token");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://finder.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("requires the internal smoke bearer token", async () => {
    const response = await POST(new Request("https://finder.example/api/internal/finder/reviewer-smoke-session", {
      method: "POST",
    }));

    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
    expect(response.status).toBe(401);
    expect(fakeAdmin.createdUsers).toEqual([]);
  });

  it("creates a temporary Silver smoke account and returns Supabase cookies", async () => {
    const response = await POST(new Request("https://finder.example/api/internal/finder/reviewer-smoke-session", {
      headers: {
        Authorization: "Bearer test-smoke-token",
      },
      method: "POST",
    }));
    const body = await response.json() as {
      ok: boolean;
      smokeId: string;
      userId: string;
    };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.userId).toBe("user-1");
    expect(body.smokeId).toContain("finder-reviewer-smoke-");
    expect(response.headers.get("set-cookie")).toContain("sb-smoke-auth-token=session-value");
    expect(fakeAdmin.createdUsers[0]?.email).toContain("finder-reviewer-smoke+");
    expect(fakeAdmin.getTable("sparkle_finder_profiles")).toHaveLength(1);
    expect(fakeAdmin.getTable("sparkle_finder_memberships")[0]).toMatchObject({
      access_state: "silver_trial",
      silver_source: "trial",
      user_id: "user-1",
    });
    expect(fakeAdmin.getTable("sparkle_finder_communication_consents")).toEqual([]);
    expect(sessionSignIns).toHaveLength(1);
  });

  it("cleans only verified reviewer smoke users", async () => {
    const createResponse = await POST(new Request("https://finder.example/api/internal/finder/reviewer-smoke-session", {
      headers: {
        Authorization: "Bearer test-smoke-token",
      },
      method: "POST",
    }));
    const created = await createResponse.json() as { userId: string };
    const cleanupResponse = await DELETE(new Request("https://finder.example/api/internal/finder/reviewer-smoke-session", {
      body: JSON.stringify({ userId: created.userId }),
      headers: {
        Authorization: "Bearer test-smoke-token",
        "content-type": "application/json",
      },
      method: "DELETE",
    }));
    const cleanup = await cleanupResponse.json() as {
      cleanup: { ok: boolean; blocked: boolean; failedTargets: string[] };
      ok: boolean;
    };

    expect(cleanupResponse.status).toBe(200);
    expect(cleanup).toEqual({
      cleanup: {
        blocked: false,
        failedTargets: [],
        ok: true,
      },
      ok: true,
    });
    expect(fakeAdmin.deletedUsers).toEqual(["user-1"]);
    expect(fakeAdmin.getTable("sparkle_finder_profiles")).toEqual([]);

    fakeAdmin.addUser({
      email: "real-user@example.com",
      id: "real-user",
      user_metadata: {},
    });

    const blockedResponse = await DELETE(new Request("https://finder.example/api/internal/finder/reviewer-smoke-session", {
      body: JSON.stringify({ userId: "real-user" }),
      headers: {
        Authorization: "Bearer test-smoke-token",
        "content-type": "application/json",
      },
      method: "DELETE",
    }));
    const blocked = await blockedResponse.json() as {
      cleanup: { blocked: boolean; failedTargets: string[]; ok: boolean };
      ok: boolean;
    };

    expect(blockedResponse.status).toBe(409);
    expect(blocked).toEqual({
      cleanup: {
        blocked: true,
        failedTargets: ["not_reviewer_smoke_user"],
        ok: false,
      },
      ok: false,
    });
    expect(fakeAdmin.deletedUsers).toEqual(["user-1"]);
  });
});
