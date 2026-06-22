import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { fakeAdmin } = vi.hoisted(() => {
  const tables: Record<string, Array<Record<string, unknown>>> = {};
  const admin = {
    createdUsers: [] as Array<{ email: string; id: string }>,
    deletedUsers: [] as string[],
    reset() {
      for (const key of Object.keys(tables)) {
        delete tables[key];
      }

      this.createdUsers = [];
      this.deletedUsers = [];
    },
    auth: {
      admin: {
        createUser: vi.fn(async ({ email }: { email: string }) => {
          const id = `user-${admin.createdUsers.length + 1}`;
          admin.createdUsers.push({ email, id });

          return { data: { user: { email, id } }, error: null };
        }),
        deleteUser: vi.fn(async (userId: string) => {
          admin.deletedUsers.push(userId);

          return { error: null };
        }),
      },
    },
    from(table: string) {
      tables[table] ??= [];

      return {
        delete: () => ({
          eq: async (column: string, value: string) => {
            tables[table] = tables[table].filter((row) => row[column] !== value);

            return { error: null };
          },
        }),
        insert: async (values: Record<string, unknown> | Array<Record<string, unknown>>) => {
          const rows = Array.isArray(values) ? values : [values];
          tables[table].push(...rows);

          return { error: null };
        },
        select: () => ({
          eq: async (column: string, value: string) => ({
            data: tables[table].filter((row) => row[column] === value),
            error: null,
          }),
        }),
        update: (values: Record<string, unknown>) => ({
          eq: async (column: string, value: string) => {
            tables[table] = tables[table].map((row) =>
              row[column] === value ? { ...row, ...values } : row);

            return { error: null };
          },
        }),
      };
    },
  };

  return { fakeAdmin: admin };
});

vi.mock("@/lib/supabase/service-role", () => ({
  createSupabaseServiceRoleClient: () => fakeAdmin,
}));

import { POST } from "../../app/api/internal/finder/nic-nac-telemetry-smoke/route";

describe("Finder Nic-Nac telemetry smoke route", () => {
  beforeEach(() => {
    fakeAdmin.reset();
    vi.stubEnv("SPARKLE_FINDER_INTERNAL_SMOKE_TOKEN", "test-smoke-token");
    vi.stubEnv("NIC_NAC_HUMAN_DEFAULT_MODEL", "gpt-5.4-test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("requires the internal smoke bearer token", async () => {
    const response = await POST(new Request("https://finder.example/api/internal/finder/nic-nac-telemetry-smoke", {
      method: "POST",
    }));

    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
    expect(response.status).toBe(401);
    expect(fakeAdmin.createdUsers).toEqual([]);
  });

  it("writes, verifies, and cleans Finder Nic-Nac telemetry rows", async () => {
    const response = await POST(new Request("https://finder.example/api/internal/finder/nic-nac-telemetry-smoke", {
      headers: {
        Authorization: "Bearer test-smoke-token",
      },
      method: "POST",
    }));
    const body = await response.json() as {
      checks: Record<string, boolean>;
      cleanup: {
        ok: boolean;
        residualCounts: Record<string, number>;
      };
      ok: boolean;
      rowCounts: Record<string, number>;
    };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.checks).toEqual({
      completedRun: true,
      conversations: true,
      messages: true,
      redirectedRun: true,
    });
    expect(body.rowCounts).toMatchObject({
      conversations: 2,
      messages: 4,
      runs: 2,
    });
    expect(body.cleanup).toEqual({
      failedTargets: [],
      ok: true,
      residualCounts: {
        conversations: 0,
        messages: 0,
        runs: 0,
      },
    });
    expect(fakeAdmin.createdUsers).toHaveLength(1);
    expect(fakeAdmin.deletedUsers).toEqual(["user-1"]);
  });
});
