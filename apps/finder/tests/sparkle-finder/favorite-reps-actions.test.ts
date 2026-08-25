import { describe, expect, it } from "vitest";
import {
  FAVORITE_REP_NOTE_MAX_LENGTH,
  FREE_FAVORITE_REP_LIMIT,
  canEditFavoriteRepNotes,
  canFavoriteRep,
  normalizeFavoriteRepNote,
  normalizeRepId,
} from "../../lib/sparkle-finder/favorite-reps-actions";

describe("Favorite reps actions", () => {
  it("allows logged-in users to favorite a rep", () => {
    expect(
      canFavoriteRep({
        userId: "customer-free-marlena",
        currentFavoriteCount: 0,
        hasSilverAccess: false,
      }),
    ).toEqual({ allowed: true });
  });

  it("limits free users to a small favorite rep count if a cap is configured", () => {
    expect(
      canFavoriteRep({
        userId: "customer-free-marlena",
        currentFavoriteCount: FREE_FAVORITE_REP_LIMIT,
        hasSilverAccess: false,
      }),
    ).toEqual({ allowed: false, reason: "free_limit_reached" });
  });

  it("allows idempotent favorite requests for existing favorites at the free cap", () => {
    expect(
      canFavoriteRep({
        userId: "customer-free-marlena",
        currentFavoriteCount: FREE_FAVORITE_REP_LIMIT,
        hasSilverAccess: false,
        isAlreadyFavorited: true,
      }),
    ).toEqual({ allowed: true, alreadyFavorited: true });
  });

  it("allows Silver users to save rep notes", () => {
    expect(
      canEditFavoriteRepNotes({
        userId: "customer-silver-sparkle-mama",
        hasSilverAccess: true,
        favoriteOwnerUserId: "customer-silver-sparkle-mama",
      }),
    ).toBe(true);
  });

  it("prevents free users from saving Silver rep notes", () => {
    expect(
      canEditFavoriteRepNotes({
        userId: "customer-free-marlena",
        hasSilverAccess: false,
        favoriteOwnerUserId: "customer-free-marlena",
      }),
    ).toBe(false);
  });

  it("trims notes to 500 characters", () => {
    expect(normalizeFavoriteRepNote(` ${"a".repeat(520)} `)).toHaveLength(FAVORITE_REP_NOTE_MAX_LENGTH);
  });

  it("rejects empty rep ids", () => {
    expect(normalizeRepId("   ")).toBe("");
    expect(normalizeRepId(" rep-kelli ")).toBe("rep-kelli");
  });
});
