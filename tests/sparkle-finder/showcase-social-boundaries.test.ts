import { beforeEach, describe, expect, it, vi } from "vitest";

const showcaseRuntime = vi.hoisted(() => ({
  client: null as unknown,
  revalidatedPaths: [] as string[],
}));

vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => {
    showcaseRuntime.revalidatedPaths.push(path);
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => showcaseRuntime.client,
}));

vi.mock("@/lib/sparkle-finder/account-service", () => ({
  getCurrentSparkleFinderAccount: async () => ({
    status: "authenticated",
    customer: {
      id: "viewer-user",
    },
  }),
}));

import {
  createShowcaseCommentAction,
  followShowcaseAction,
  reportShowcaseTargetAction,
} from "../../app/showcase/actions";

describe("Showcase social block boundaries", () => {
  beforeEach(() => {
    showcaseRuntime.client = createShowcaseActionClient();
    showcaseRuntime.revalidatedPaths = [];
  });

  it("does not follow public Showcases across a collector block", async () => {
    const client = createShowcaseActionClient({
      blocks: [{ blockerUserId: "showcase-user", blockedUserId: "viewer-user" }],
    });
    showcaseRuntime.client = client;

    await followShowcaseAction(showcaseFormData());

    expect(client.operations).not.toContainEqual(expect.objectContaining({ table: "sparkle_finder_showcase_follows" }));
    expect(showcaseRuntime.revalidatedPaths).toEqual([]);
  });

  it("does not comment across a collector block", async () => {
    const client = createShowcaseActionClient({
      blocks: [{ blockerUserId: "viewer-user", blockedUserId: "showcase-user" }],
    });
    showcaseRuntime.client = client;

    const result = await createShowcaseCommentAction({ status: "idle", message: "" }, showcaseFormData({ body: "Love this one." }));

    expect(result).toEqual({
      ok: false,
      reason: "not_allowed",
      message: "This Sparkle Showcase conversation is not available.",
    });
    expect(client.operations).not.toContainEqual(expect.objectContaining({ table: "sparkle_finder_showcase_comments" }));
  });

  it("does not report public Showcases across a collector block", async () => {
    const client = createShowcaseActionClient({
      blocks: [{ blockerUserId: "showcase-user", blockedUserId: "viewer-user" }],
    });
    showcaseRuntime.client = client;

    const result = await reportShowcaseTargetAction({ status: "idle", message: "" }, showcaseFormData());

    expect(result).toEqual({
      ok: false,
      reason: "not_allowed",
      message: "This Sparkle Showcase item is not available to report.",
    });
    expect(client.operations).not.toContainEqual(expect.objectContaining({ table: "sparkle_finder_showcase_reports" }));
  });
});

function showcaseFormData(overrides: { body?: string } = {}): FormData {
  const formData = new FormData();
  formData.set("showcaseUserId", "showcase-user");
  formData.set("handle", "showcase-handle");
  formData.set("targetType", "showcase");
  formData.set("targetId", "showcase-user");
  formData.set("body", overrides.body ?? "");

  return formData;
}

type FakeShowcaseOperation = {
  table: string;
  type: "insert" | "upsert" | "select";
  values?: Record<string, unknown>;
  filters?: Array<{ column: string; value: string }>;
};

function createShowcaseActionClient({
  blocks = [],
}: {
  blocks?: Array<{ blockerUserId: string; blockedUserId: string }>;
} = {}) {
  const operations: FakeShowcaseOperation[] = [];

  return {
    operations,
    auth: {
      getUser: async () => ({
        data: {
          user: {
            id: "viewer-user",
          },
        },
        error: null,
      }),
    },
    from(table: string) {
      return {
        select: () => createSelectBuilder(table, operations, blocks),
        insert: async (values: Record<string, unknown>) => {
          operations.push({ table, type: "insert", values });

          return { data: null, error: null };
        },
        upsert: async (values: Record<string, unknown>) => {
          operations.push({ table, type: "upsert", values });

          return { data: null, error: null };
        },
      };
    },
  };
}

function createSelectBuilder(
  table: string,
  operations: FakeShowcaseOperation[],
  blocks: Array<{ blockerUserId: string; blockedUserId: string }>,
) {
  const filters: Array<{ column: string; value: string }> = [];
  const builder = {
    eq(column: string, value: string) {
      filters.push({ column, value });

      return builder;
    },
    async maybeSingle() {
      operations.push({ table, type: "select", filters: [...filters] });

      if (table === "sparkle_finder_profiles") {
        const userId = filters.find((filter) => filter.column === "user_id")?.value;

        return {
          data: userId === "showcase-user"
            ? {
                user_id: "showcase-user",
                profile_visibility: "sparkle_finder",
                showcase_visibility: "public",
              }
            : null,
          error: null,
        };
      }

      if (table === "sparkle_finder_collector_blocks") {
        const blockerUserId = filters.find((filter) => filter.column === "blocker_user_id")?.value;
        const blockedUserId = filters.find((filter) => filter.column === "blocked_user_id")?.value;
        const block = blocks.find(
          (candidate) => candidate.blockerUserId === blockerUserId && candidate.blockedUserId === blockedUserId,
        );

        return {
          data: block ? { id: "block-row" } : null,
          error: null,
        };
      }

      return { data: null, error: null };
    },
  };

  return builder;
}
