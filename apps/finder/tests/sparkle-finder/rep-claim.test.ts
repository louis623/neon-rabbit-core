import { describe, expect, it, vi } from "vitest";
import {
  claimSparkleSuiteRepForFinderUser,
  getSuiteRepClaimConfig,
} from "../../lib/sparkle-finder/rep-claim";

describe("Sparkle Finder Sparkle Suite rep claim", () => {
  it("builds the internal Suite claim endpoint from the Suite API base URL", () => {
    expect(
      getSuiteRepClaimConfig({
        SPARKLE_SUITE_FINDER_API_BASE_URL: "https://suite.example/",
        SPARKLE_FINDER_TO_SUITE_REP_CLAIM_TOKEN: " claim-token ",
      }),
    ).toEqual({
      apiUrl: "https://suite.example/api/internal/finder/rep-claim",
      bearerToken: "claim-token",
      timeoutMs: 8000,
    });
  });

  it("claims a Secret Rep ID Number through Suite and persists the linked Rep Silver account", async () => {
    const nowIso = "2026-06-22T09:00:00.000Z";
    const serviceRoleClient = createFakeRepClaimClient({ profileExists: true });
    const fetcher = vi.fn(async () =>
      new Response(
        JSON.stringify({
          ok: true,
          status: "claimed",
          suiteRepId: "rep-bling-kitchen",
          displayName: "Brittany",
          businessName: "BlingKitchen",
          publicSiteSlug: "blingkitchen",
          finderEntitlement: {
            isRep: true,
            silverRepIncluded: true,
            badge: "bp_rep",
          },
        }),
        { status: 200 },
      ),
    );

    const result = await claimSparkleSuiteRepForFinderUser({
      finderUserId: "finder-user-1",
      finderEmail: "brittany@example.test",
      displayName: "Brittany",
      secretRepIdNumber: " bli-3767 ",
      config: {
        apiUrl: "https://suite.example/api/internal/finder/rep-claim",
        bearerToken: "claim-token",
        timeoutMs: 8000,
      },
      fetcher,
      nowIso,
      serviceRoleClient,
    });

    expect(result).toMatchObject({
      ok: true,
      status: "claimed",
      suiteRepId: "rep-bling-kitchen",
      businessName: "BlingKitchen",
    });
    expect(fetcher).toHaveBeenCalledWith(
      "https://suite.example/api/internal/finder/rep-claim",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer claim-token",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          sourceProduct: "sparkle_finder",
          finderUserId: "finder-user-1",
          secretRepIdNumber: "BLI-3767",
        }),
      }),
    );
    expect(serviceRoleClient.operations).toContainEqual({
      table: "sparkle_finder_profiles",
      action: "update",
      values: {
        is_rep: true,
        sparkle_suite_rep_id: "rep-bling-kitchen",
        sparkle_suite_rep_business_name: "BlingKitchen",
        sparkle_suite_rep_public_site_slug: "blingkitchen",
        sparkle_suite_rep_claimed_at: nowIso,
      },
      column: "user_id",
      value: "finder-user-1",
    });
    expect(serviceRoleClient.operations).toContainEqual({
      table: "sparkle_finder_memberships",
      action: "upsert",
      values: {
        user_id: "finder-user-1",
        access_state: "silver_rep_included",
        silver_source: "sparkle_suite_rep",
        silver_started_at: nowIso,
        silver_ends_at: null,
      },
      options: { onConflict: "user_id" },
    });
  });

  it("does not write Finder account rows when Suite rejects the Secret Rep ID Number", async () => {
    const serviceRoleClient = createFakeRepClaimClient({ profileExists: true });
    const fetcher = vi.fn(async () =>
      new Response(
        JSON.stringify({
          ok: false,
          status: "not_found",
          message: "That Secret Rep ID Number did not match an active Sparkle Suite rep.",
        }),
        { status: 404 },
      ),
    );

    const result = await claimSparkleSuiteRepForFinderUser({
      finderUserId: "finder-user-1",
      finderEmail: "brittany@example.test",
      displayName: "Brittany",
      secretRepIdNumber: "missing",
      config: {
        apiUrl: "https://suite.example/api/internal/finder/rep-claim",
        bearerToken: "claim-token",
        timeoutMs: 8000,
      },
      fetcher,
      serviceRoleClient,
    });

    expect(result).toEqual({
      ok: false,
      status: "not_found",
      message: "That Secret Rep ID Number did not match an active Sparkle Suite rep.",
    });
    expect(serviceRoleClient.operations).toEqual([]);
  });

  it("fails closed without a configured Suite claim token or service-role writer", async () => {
    const fetcher = vi.fn();

    await expect(
      claimSparkleSuiteRepForFinderUser({
        finderUserId: "finder-user-1",
        finderEmail: "brittany@example.test",
        displayName: "Brittany",
        secretRepIdNumber: "BLI-3767",
        config: null,
        fetcher,
        serviceRoleClient: null,
      }),
    ).resolves.toEqual({
      ok: false,
      status: "not_configured",
      message: "Sparkle Suite rep claiming is not configured in this environment.",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
});

type FakeRepClaimClient = {
  operations: unknown[];
  from: (table: string) => {
    select: () => {
      eq: () => {
        maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
      };
    };
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<{ data: unknown; error: unknown }>;
    };
    insert: (values: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
    upsert: (
      values: Record<string, unknown>,
      options?: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: unknown }>;
  };
};

function createFakeRepClaimClient({ profileExists }: { profileExists: boolean }): FakeRepClaimClient {
  const operations: unknown[] = [];

  return {
    operations,
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: profileExists ? { user_id: "finder-user-1" } : null,
            error: null,
          }),
        }),
      }),
      update: (values: Record<string, unknown>) => ({
        eq: async (column: string, value: string) => {
          operations.push({ table, action: "update", values, column, value });

          return { data: {}, error: null };
        },
      }),
      insert: async (values: Record<string, unknown>) => {
        operations.push({ table, action: "insert", values });

        return { data: {}, error: null };
      },
      upsert: async (values: Record<string, unknown>, options?: Record<string, unknown>) => {
        operations.push({ table, action: "upsert", values, options });

        return { data: {}, error: null };
      },
    }),
  };
}
