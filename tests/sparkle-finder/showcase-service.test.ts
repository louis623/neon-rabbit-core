import { describe, expect, it } from "vitest";
import {
  getPublicSparkleShowcaseByHandle,
  getRevealSpotlight,
  getShowcaseCollectionBySlug,
  getShowcasePieceRepLeads,
} from "../../lib/sparkle-finder/showcase-service";

describe("Sparkle Showcase service", () => {
  it("loads a public Sparkle Showcase by handle with public pieces only", () => {
    const showcase = getPublicSparkleShowcaseByHandle("sparkle-mama");

    expect(showcase?.profile.customer.displayName).toBe("Sparkle Mama");
    expect(showcase?.profile.handle).toBe("sparkle-mama");
    expect(showcase?.pieces.every((piece) => piece.visibility === "public")).toBe(true);
    expect(showcase?.pieces.some((piece) => piece.isRarestReveal)).toBe(true);
  });

  it("keeps private notes and private pieces out of public showcase reads", () => {
    const showcase = getPublicSparkleShowcaseByHandle("sparkle-mama");

    expect(JSON.stringify(showcase)).not.toContain("Private note");
    expect(showcase?.pieces.find((piece) => piece.showcaseStatus === "private_note_only")).toBeUndefined();
    expect(showcase?.pieces.find((piece) => piece.jewelryItemId === "jewel-starlit-crown-ring")).toBeUndefined();
  });

  it("loads The Rarest of Reveals from Diamond, Unicorn, and customer-highlighted rare pieces", () => {
    const showcase = getPublicSparkleShowcaseByHandle("sparkle-mama");
    const rarest = showcase?.rarestReveals ?? [];

    expect(rarest.length).toBeGreaterThan(0);
    expect(rarest.every((piece) => piece.jewelryItem.bpLabel !== "standard" || piece.isRarestReveal)).toBe(true);
  });

  it("loads one Showcase Collection by slug", () => {
    const collection = getShowcaseCollectionBySlug("sparkle-mama", "never-leaving");

    expect(collection?.title).toBe("Never Leaving");
    expect(collection?.pieces.length).toBeGreaterThan(0);
    expect(collection?.pieces.every((piece) => piece.visibility === "public")).toBe(true);
  });

  it("loads a shareable Reveal Spotlight with visible comments only", () => {
    const spotlight = getRevealSpotlight("sparkle-mama", "jewel-rainbow-crown-ring");

    expect(spotlight?.piece.jewelryItem.name).toBe("Rainbow Crown Ring");
    expect(spotlight?.comments.length).toBeGreaterThan(0);
    expect(JSON.stringify(spotlight)).not.toContain("Deleted comment should stay hidden");
  });

  it("returns rep leads for wanted showcase pieces", () => {
    const spotlight = getRevealSpotlight("sparkle-mama", "jewel-rainbow-crown-ring");

    expect(spotlight).toBeDefined();
    expect(getShowcasePieceRepLeads(spotlight!.piece)).toContainEqual(
      expect.objectContaining({
        matchType: "exact_item",
        jewelryItemId: "jewel-rainbow-crown-ring",
      }),
    );
  });
});
