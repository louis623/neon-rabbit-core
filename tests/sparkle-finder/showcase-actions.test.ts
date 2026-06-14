import { describe, expect, it } from "vitest";
import {
  canDeleteComment,
  canEditComment,
  canFollowShowcase,
  getFollowButtonLabel,
  normalizeCommentBody,
  normalizeReportDetails,
  normalizeReportReason,
} from "../../lib/sparkle-finder/showcase-actions";
import { persistShowcasePieceForAccount } from "../../lib/sparkle-finder/customer-state";
import type { CurrentSparkleFinderAccountState } from "../../lib/sparkle-finder/account-service";
import type { SparkleFinderAccessState } from "../../lib/sparkle-finder/account-types";

describe("Sparkle Showcase actions", () => {
  it("allows authenticated users to follow public showcases but not themselves", () => {
    expect(canFollowShowcase("viewer-1", "showcase-1")).toBe(true);
    expect(canFollowShowcase("showcase-1", "showcase-1")).toBe(false);
    expect(canFollowShowcase(null, "showcase-1")).toBe(false);
    expect(getFollowButtonLabel(false)).toBe("Follow");
    expect(getFollowButtonLabel(true)).toBe("Following");
  });

  it("allows a commenter to edit and delete their own comment", () => {
    expect(canEditComment("commenter-1", "commenter-1")).toBe(true);
    expect(canDeleteComment("commenter-1", "commenter-1", "showcase-owner")).toBe(true);
  });

  it("allows the showcase owner to delete comments on their showcase", () => {
    expect(canEditComment("showcase-owner", "commenter-1")).toBe(false);
    expect(canDeleteComment("showcase-owner", "commenter-1", "showcase-owner")).toBe(true);
    expect(canDeleteComment("stranger", "commenter-1", "showcase-owner")).toBe(false);
  });

  it("normalizes comments and reports for spam or bad behavior handling", () => {
    expect(normalizeCommentBody(` ${"a".repeat(520)} `)).toHaveLength(500);
    expect(normalizeReportDetails(` ${"b".repeat(720)} `)).toHaveLength(700);
    expect(normalizeReportReason("spam")).toBe("spam");
    expect(normalizeReportReason("bad-value")).toBe("other");
  });

  it("persists Sparkle Showcase piece fields while keeping legacy state compatible", async () => {
    const client = createFakePersistenceClient();
    const accountState = currentAccountState("silver_paid");

    const result = await persistShowcasePieceForAccount(client, accountState, {
      jewelryItemId: "jewel-aurora-drop-earrings",
      showcaseStatus: "iso",
      visibility: "public",
      revealStory: "Looking for the pink Aurora drops.",
      note: "Private owner note.",
      isRarestReveal: true,
    });

    expect(result).toEqual({ ok: true });
    expect(client.operations).toEqual([
      {
        table: "sparkle_finder_collection_items",
        type: "upsert",
        values: {
          user_id: "user-123",
          jewelry_item_id: "jewel-aurora-drop-earrings",
          state: "wishlist",
          note: "Private owner note.",
          is_highlighted: true,
          visibility: "public",
          showcase_status: "iso",
          reveal_story: "Looking for the pink Aurora drops.",
          is_rarest_reveal: true,
        },
        options: {
          onConflict: "user_id,jewelry_item_id",
        },
      },
    ]);
  });

  it("denies persisted Sparkle Showcase updates for Free accounts", async () => {
    const client = createFakePersistenceClient();
    const result = await persistShowcasePieceForAccount(client, currentAccountState("free"), {
      jewelryItemId: "jewel-aurora-drop-earrings",
      showcaseStatus: "owned",
      visibility: "public",
      revealStory: "Should not save.",
      note: "",
      isRarestReveal: false,
    });

    expect(result).toEqual({ ok: false, reason: "silver_required" });
    expect(client.operations).toEqual([]);
  });
});

function currentAccountState(accessState: SparkleFinderAccessState): CurrentSparkleFinderAccountState & { status: "authenticated" } {
  const hasSilverAccess = accessState !== "free";
  const tier = hasSilverAccess ? "silver" : "free";

  return {
    status: "authenticated",
    tier,
    displayName: "Casey Collector",
    email: "casey@example.test",
    customer: {
      id: "user-123",
      displayName: "Casey Collector",
      email: "casey@example.test",
      state: "PA",
      tier,
    },
    membership: {
      accountId: "user-123",
      personId: "user-123",
      accessState,
      silverSource: accessState === "silver_paid" ? "stripe" : accessState === "silver_trial" ? "trial" : accessState === "silver_rep_included" ? "sparkle_suite_rep" : "none",
      trialStartedAt: null,
      trialEndsAt: null,
      silverStartedAt: hasSilverAccess ? "2026-05-01T12:00:00.000Z" : null,
      silverEndsAt: null,
      effectiveState: accessState,
      hasSilverAccess,
      isTrialActive: accessState === "silver_trial",
      isTrialExpired: false,
    },
    communicationConsent: {
      accountEmailRequired: true,
      accountSmsAllowed: false,
      accountSmsConsentedAt: null,
      promotionalEmailOptIn: false,
      promotionalEmailConsentedAt: null,
      promotionalSmsOptIn: false,
      promotionalSmsConsentedAt: null,
      privacyAcknowledgedAt: "2026-05-01T12:00:00.000Z",
    },
  };
}

function createFakePersistenceClient() {
  const operations: Array<{
    table: string;
    type: "upsert";
    values: Record<string, unknown>;
    options: Record<string, unknown>;
  }> = [];

  return {
    operations,
    from(table: string) {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
        update: () => ({
          eq: async () => ({ data: null, error: null }),
        }),
        insert: async () => ({ data: null, error: null }),
        upsert: async (values: Record<string, unknown>, options: Record<string, unknown>) => {
          operations.push({ table, type: "upsert", values, options });
          return { data: null, error: null };
        },
      };
    },
  };
}
