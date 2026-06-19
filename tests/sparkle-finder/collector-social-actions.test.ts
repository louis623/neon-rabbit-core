import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SOCIAL_REPORT_DETAILS_MAX_LENGTH,
  canBlockCollector,
  canFollowCollector,
  normalizeSocialReportDetails,
  normalizeSocialReportReason,
} from "../../lib/sparkle-finder/collector-social-actions";

const collectorActionRuntime = vi.hoisted(() => ({
  accountState: {
    status: "authenticated",
    tier: "free",
    displayName: "Marlena",
    email: "marlena@example.test",
    customer: {
      id: "customer-free-marlena",
      displayName: "Marlena",
      email: "marlena@example.test",
      state: "NC",
      tier: "free",
    },
  },
  client: null as unknown,
  revalidatedPaths: [] as string[],
}));

vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => {
    collectorActionRuntime.revalidatedPaths.push(path);
  },
}));

vi.mock("../../lib/supabase/server", () => ({
  createClient: async () => {
    if (!collectorActionRuntime.client) {
      throw new Error("Missing fake collector action client");
    }

    return collectorActionRuntime.client;
  },
}));

vi.mock("../../lib/sparkle-finder/account-service", () => ({
  getCurrentSparkleFinderAccount: async () => collectorActionRuntime.accountState,
}));

import {
  blockCollectorAction,
  followCollectorAction,
  reportCollectorAction,
  unfollowCollectorAction,
} from "../../app/(hub)/collectors/actions";

describe("Collector social actions", () => {
  beforeEach(() => {
    collectorActionRuntime.client = createFakeCollectorActionClient();
    collectorActionRuntime.revalidatedPaths = [];
  });

  it("allows authenticated users to follow public collectors", () => {
    expect(
      canFollowCollector({
        viewerUserId: "customer-free-marlena",
        targetUserId: "customer-silver-sparkle-mama",
        isTargetPublic: true,
        isBlockedRelationship: false,
      }),
    ).toEqual({ allowed: true });
  });

  it("prevents self-follow", () => {
    expect(
      canFollowCollector({
        viewerUserId: "customer-silver-sparkle-mama",
        targetUserId: "customer-silver-sparkle-mama",
        isTargetPublic: true,
        isBlockedRelationship: false,
      }),
    ).toEqual({ allowed: false, reason: "self_follow" });
  });

  it("allows duplicate follow requests to be handled idempotently", () => {
    expect(
      canFollowCollector({
        viewerUserId: "customer-free-marlena",
        targetUserId: "customer-silver-sparkle-mama",
        isTargetPublic: true,
        isBlockedRelationship: false,
        isAlreadyFollowing: true,
      }),
    ).toEqual({ allowed: true, alreadyFollowing: true });
  });

  it("requires sign-in and public targets before following", () => {
    expect(
      canFollowCollector({
        viewerUserId: null,
        targetUserId: "customer-silver-sparkle-mama",
        isTargetPublic: true,
        isBlockedRelationship: false,
      }),
    ).toEqual({ allowed: false, reason: "sign_in_required" });

    expect(
      canFollowCollector({
        viewerUserId: "customer-free-marlena",
        targetUserId: "customer-silver-private-jules",
        isTargetPublic: false,
        isBlockedRelationship: false,
      }),
    ).toEqual({ allowed: false, reason: "private_profile" });
  });

  it("prevents following blocked collectors", () => {
    expect(
      canFollowCollector({
        viewerUserId: "customer-silver-riley",
        targetUserId: "customer-silver-sparkle-mama",
        isTargetPublic: true,
        isBlockedRelationship: true,
      }),
    ).toEqual({ allowed: false, reason: "blocked" });
  });

  it("allows users to block another collector, not self", () => {
    expect(
      canBlockCollector({
        viewerUserId: "customer-free-marlena",
        targetUserId: "customer-silver-sparkle-mama",
      }),
    ).toBe(true);

    expect(
      canBlockCollector({
        viewerUserId: "customer-silver-sparkle-mama",
        targetUserId: "customer-silver-sparkle-mama",
      }),
    ).toBe(false);
  });

  it("normalizes allowed report reasons and trims report details", () => {
    expect(normalizeSocialReportReason("harassment")).toBe("harassment");
    expect(normalizeSocialReportReason("SCAM_OR_IMPERSONATION")).toBe("scam_or_impersonation");
    expect(normalizeSocialReportReason("not-a-reason")).toBe("other");
    expect(normalizeSocialReportDetails(` ${"a".repeat(740)} `)).toHaveLength(
      SOCIAL_REPORT_DETAILS_MAX_LENGTH,
    );
  });

  it("guards social report direct inserts with a reportability RLS helper", () => {
    const migrationSql = readFileSync(
      join(process.cwd(), "supabase/migrations/20260617_sparkle_finder_social_favorites.sql"),
      "utf8",
    ).toLowerCase();

    expect(migrationSql).toContain("create or replace function private.sparkle_finder_can_insert_social_report");
    expect(migrationSql).toContain("security definer");
    expect(migrationSql).toContain("target_type = 'collector_profile'");
    expect(migrationSql).toContain("profile.profile_visibility = 'sparkle_finder'");
    expect(migrationSql).toContain("profile.showcase_visibility = 'public'");
    expect(migrationSql).toContain("public.sparkle_finder_collector_blocks block");
    expect(migrationSql).toContain("private.sparkle_finder_can_insert_social_report(reporter_user_id, target_type, target_id)");
  });

  it("requires public Showcase visibility for direct collector follow inserts", () => {
    const migrationSql = readFileSync(
      join(process.cwd(), "supabase/migrations/20260617_sparkle_finder_social_favorites.sql"),
      "utf8",
    ).toLowerCase();
    const followHelper = migrationSql.match(
      /create or replace function private\.sparkle_finder_can_insert_collector_follow[\s\S]*?\$\$;/,
    )?.[0] ?? "";

    expect(followHelper).toContain("profile.profile_visibility = 'sparkle_finder'");
    expect(followHelper).toContain("profile.showcase_visibility = 'public'");
  });

  it("follows and unfollows public collectors through one-way follow rows", async () => {
    const client = createFakeCollectorActionClient();
    collectorActionRuntime.client = client;

    await followCollectorAction(formDataForCollector("customer-silver-sparkle-mama", "sparkle-mama"));
    await unfollowCollectorAction(formDataForCollector("customer-silver-sparkle-mama", "sparkle-mama"));

    expect(client.operations).toContainEqual({
      table: "sparkle_finder_collector_follows",
      type: "upsert",
      values: {
        follower_user_id: "customer-free-marlena",
        followed_user_id: "customer-silver-sparkle-mama",
      },
      options: {
        onConflict: "follower_user_id,followed_user_id",
      },
    });
    expect(client.operations).toContainEqual({
      table: "sparkle_finder_collector_follows",
      type: "delete",
      filters: [
        { column: "follower_user_id", value: "customer-free-marlena" },
        { column: "followed_user_id", value: "customer-silver-sparkle-mama" },
      ],
    });
    expect(collectorActionRuntime.revalidatedPaths).toEqual([
      "/collectors",
      "/showcase/sparkle-mama",
      "/collectors",
      "/showcase/sparkle-mama",
    ]);
  });

  it("does not follow when the target has blocked the viewer", async () => {
    const client = createFakeCollectorActionClient({
      blocks: [
        {
          blockerUserId: "customer-silver-sparkle-mama",
          blockedUserId: "customer-free-marlena",
        },
      ],
    });
    collectorActionRuntime.client = client;

    await followCollectorAction(formDataForCollector("customer-silver-sparkle-mama", "sparkle-mama"));

    expect(hasCollectorFollowUpsert(client.operations)).toBe(false);
    expect(collectorActionRuntime.revalidatedPaths).toEqual([]);
  });

  it("does not follow when the target profile is visible but Showcase is not public", async () => {
    const client = createFakeCollectorActionClient({
      profiles: {
        "customer-silver-sparkle-mama": {
          profileVisibility: "sparkle_finder",
          showcaseVisibility: "private",
        },
      },
    });
    collectorActionRuntime.client = client;

    await followCollectorAction(formDataForCollector("customer-silver-sparkle-mama", "sparkle-mama"));

    expect(hasCollectorFollowUpsert(client.operations)).toBe(false);
    expect(collectorActionRuntime.revalidatedPaths).toEqual([]);
  });

  it("fails closed when follow receives a malformed Supabase client", async () => {
    collectorActionRuntime.client = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: "customer-free-marlena",
            },
          },
          error: null,
        }),
      },
    };

    await expect(
      followCollectorAction(formDataForCollector("customer-silver-sparkle-mama", "sparkle-mama")),
    ).resolves.toBeUndefined();
    expect(collectorActionRuntime.revalidatedPaths).toEqual([]);
  });

  it("fails closed when follow auth lookup resolves null", async () => {
    const client = createFakeCollectorActionClient();
    client.auth.getUser = async () => null as never;
    collectorActionRuntime.client = client;

    await expect(
      followCollectorAction(formDataForCollector("customer-silver-sparkle-mama", "sparkle-mama")),
    ).resolves.toBeUndefined();
    expect(client.operations).toEqual([]);
    expect(collectorActionRuntime.revalidatedPaths).toEqual([]);
  });

  it("blocks collectors, removes follows in both directions, and returns a friendly state", async () => {
    const client = createFakeCollectorActionClient();
    collectorActionRuntime.client = client;

    const result = await blockCollectorAction({ status: "idle", message: "" }, formDataForCollector("customer-silver-celeste", "celeste-stacks"));

    expect(result).toEqual({ status: "success", message: "Collector blocked." });
    expect(client.operations).toContainEqual({
      table: "sparkle_finder_collector_blocks",
      type: "upsert",
      values: {
        blocker_user_id: "customer-free-marlena",
        blocked_user_id: "customer-silver-celeste",
        reason: "",
      },
      options: {
        onConflict: "blocker_user_id,blocked_user_id",
      },
    });
    expect(
      client.operations.filter((operation) => operation.table === "sparkle_finder_collector_follows" && operation.type === "delete"),
    ).toHaveLength(2);
    expect(
      client.operations.filter((operation) => operation.table === "sparkle_finder_showcase_follows" && operation.type === "delete"),
    ).toHaveLength(2);
  });

  it("fails closed when block auth lookup throws", async () => {
    const client = createFakeCollectorActionClient();
    client.auth.getUser = async () => {
      throw new Error("auth unavailable");
    };
    collectorActionRuntime.client = client;

    await expect(
      blockCollectorAction(
        { status: "idle", message: "" },
        formDataForCollector("customer-silver-celeste", "celeste-stacks"),
      ),
    ).resolves.toEqual({
      status: "error",
      message: "Collector actions are unavailable right now.",
    });
    expect(client.operations).toEqual([]);
  });

  it("fails closed when block receives a malformed Supabase client", async () => {
    collectorActionRuntime.client = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: "customer-free-marlena",
            },
          },
          error: null,
        }),
      },
    };

    await expect(
      blockCollectorAction(
        { status: "idle", message: "" },
        formDataForCollector("customer-silver-celeste", "celeste-stacks"),
      ),
    ).resolves.toEqual({
      status: "error",
      message: "Collector actions are unavailable right now.",
    });
  });

  it("reports collector profiles without exposing moderation rows", async () => {
    const client = createFakeCollectorActionClient();
    collectorActionRuntime.client = client;
    const formData = formDataForCollector("customer-silver-sparkle-mama", "sparkle-mama");
    formData.set("reason", "SCAM_OR_IMPERSONATION");
    formData.set("details", ` ${"x".repeat(760)} `);

    const result = await reportCollectorAction({ status: "idle", message: "" }, formData);

    expect(result).toEqual({ status: "success", message: "Report sent for review." });
    expect(client.operations).toContainEqual({
      table: "sparkle_finder_social_reports",
      type: "insert",
      values: {
        reporter_user_id: "customer-free-marlena",
        target_type: "collector_profile",
        target_id: "customer-silver-sparkle-mama",
        reason: "scam_or_impersonation",
        details: "x".repeat(SOCIAL_REPORT_DETAILS_MAX_LENGTH),
      },
    });
  });

  it("does not report private collector profiles", async () => {
    const client = createFakeCollectorActionClient({
      profiles: {
        "customer-silver-private-jules": {
          profileVisibility: "private",
          showcaseVisibility: "public",
        },
      },
    });
    collectorActionRuntime.client = client;

    const result = await reportCollectorAction(
      { status: "idle", message: "" },
      formDataForCollector("customer-silver-private-jules", "private-jules"),
    );

    expect(result.status).toBe("error");
    expect(hasSocialReportInsert(client.operations)).toBe(false);
  });

  it("does not report nonexistent collector profiles", async () => {
    const client = createFakeCollectorActionClient({
      profiles: {
        "customer-missing-collector": null,
      },
    });
    collectorActionRuntime.client = client;

    const result = await reportCollectorAction(
      { status: "idle", message: "" },
      formDataForCollector("customer-missing-collector", "missing-collector"),
    );

    expect(result.status).toBe("error");
    expect(hasSocialReportInsert(client.operations)).toBe(false);
  });

  it("does not report collectors across blocked relationships", async () => {
    const client = createFakeCollectorActionClient({
      blocks: [
        {
          blockerUserId: "customer-silver-sparkle-mama",
          blockedUserId: "customer-free-marlena",
        },
      ],
    });
    collectorActionRuntime.client = client;

    const result = await reportCollectorAction(
      { status: "idle", message: "" },
      formDataForCollector("customer-silver-sparkle-mama", "sparkle-mama"),
    );

    expect(result.status).toBe("error");
    expect(hasSocialReportInsert(client.operations)).toBe(false);
  });

  it("fails closed when report receives a malformed Supabase client", async () => {
    collectorActionRuntime.client = {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: "customer-free-marlena",
            },
          },
          error: null,
        }),
      },
    };

    await expect(
      reportCollectorAction(
        { status: "idle", message: "" },
        formDataForCollector("customer-silver-sparkle-mama", "sparkle-mama"),
      ),
    ).resolves.toEqual({
      status: "error",
      message: "Collector actions are unavailable right now.",
    });
  });

  it("fails closed when report auth lookup resolves an empty object", async () => {
    const client = createFakeCollectorActionClient();
    client.auth.getUser = async () => ({}) as never;
    collectorActionRuntime.client = client;

    await expect(
      reportCollectorAction(
        { status: "idle", message: "" },
        formDataForCollector("customer-silver-sparkle-mama", "sparkle-mama"),
      ),
    ).resolves.toEqual({
      status: "error",
      message: "Collector actions are unavailable right now.",
    });
    expect(client.operations).toEqual([]);
    expect(collectorActionRuntime.revalidatedPaths).toEqual([]);
  });
});

type FakeCollectorOperation =
  | {
      table: string;
      type: "insert" | "upsert";
      values: Record<string, unknown>;
      options?: Record<string, unknown>;
    }
  | {
      table: string;
      type: "select" | "delete";
      filters: Array<{ column: string; value: string }>;
    };

function formDataForCollector(targetUserId: string, handle: string): FormData {
  const formData = new FormData();
  formData.set("targetUserId", targetUserId);
  formData.set("handle", handle);

  return formData;
}

type FakeCollectorActionClientOptions = {
  blocks?: Array<{
    blockerUserId: string;
    blockedUserId: string;
  }>;
  profiles?: Record<
    string,
    | {
        profileVisibility: string;
        showcaseVisibility: string;
      }
    | null
  >;
};

function hasCollectorFollowUpsert(operations: FakeCollectorOperation[]): boolean {
  return operations.some(
    (operation) => operation.table === "sparkle_finder_collector_follows" && operation.type === "upsert",
  );
}

function hasSocialReportInsert(operations: FakeCollectorOperation[]): boolean {
  return operations.some(
    (operation) => operation.table === "sparkle_finder_social_reports" && operation.type === "insert",
  );
}

function createFakeCollectorActionClient(options: FakeCollectorActionClientOptions = {}) {
  const operations: FakeCollectorOperation[] = [];

  return {
    operations,
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: "customer-free-marlena",
          },
        },
        error: null,
      }),
    },
    from(table: string) {
      return {
        select: () => createFilterBuilder(operations, table, "select", options),
        insert: async (values: Record<string, unknown>) => {
          operations.push({ table, type: "insert", values });

          return { data: null, error: null };
        },
        upsert: async (values: Record<string, unknown>, options: Record<string, unknown>) => {
          operations.push({ table, type: "upsert", values, options });

          return { data: null, error: null };
        },
        delete: () => createFilterBuilder(operations, table, "delete", options),
      };
    },
  };
}

function createFilterBuilder(
  operations: FakeCollectorOperation[],
  table: string,
  type: "select" | "delete",
  options: FakeCollectorActionClientOptions,
) {
  const filters: Array<{ column: string; value: string }> = [];
  const builder = {
    eq(column: string, value: string) {
      filters.push({ column, value });

      return builder;
    },
    async maybeSingle() {
      operations.push({ table, type, filters: [...filters] });

      if (table === "sparkle_finder_profiles") {
        const userId = filters.find((filter) => filter.column === "user_id")?.value;
        const profile = userId ? options.profiles?.[userId] : undefined;

        return {
          data: userId && profile !== null
            ? {
                user_id: userId,
                profile_visibility: profile?.profileVisibility ?? "sparkle_finder",
                showcase_visibility: profile?.showcaseVisibility ?? "public",
              }
            : null,
          error: null,
        };
      }

      if (table === "sparkle_finder_collector_blocks") {
        const blockerUserId = filters.find((filter) => filter.column === "blocker_user_id")?.value;
        const blockedUserId = filters.find((filter) => filter.column === "blocked_user_id")?.value;
        const block = options.blocks?.find(
          (candidate) => candidate.blockerUserId === blockerUserId && candidate.blockedUserId === blockedUserId,
        );

        return {
          data: block ? { id: "collector-block-test" } : null,
          error: null,
        };
      }

      return { data: null, error: null };
    },
    then(resolve: (value: { data: null; error: null }) => unknown) {
      operations.push({ table, type, filters: [...filters] });

      return Promise.resolve({ data: null, error: null }).then(resolve);
    },
  };

  return builder;
}
