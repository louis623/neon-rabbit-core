import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { renderRevealSpotlightPageContent } from "../../app/showcase/[handle]/pieces/[pieceId]/page";
import { renderShowcaseCollectionPageContent } from "../../app/showcase/[handle]/showcase-collections/[collectionSlug]/page";
import { renderSparkleShowcasePageContent } from "../../app/showcase/[handle]/page";
import {
  getPublicSparkleShowcaseByHandle,
  getRevealSpotlight,
  getShowcaseCollectionBySlug,
} from "../../lib/sparkle-finder/showcase-service";
import { findSparkleFinderCopyViolations } from "../../lib/sparkle-finder/copy-guardrails";
import { getLocalDevAuthState } from "../../lib/sparkle-finder/auth";
import type { CurrentSparkleFinderAccountState } from "../../lib/sparkle-finder/account-service";

describe("Sparkle Showcase public routes", () => {
  it("renders a public Sparkle Showcase with rarest reveals and showcase collections", async () => {
    const showcase = (await getPublicSparkleShowcaseByHandle("sparkle-mama", fixtureOptions()))!;
    const markup = renderToStaticMarkup(renderSparkleShowcasePageContent(showcase, showcaseRouteAccountState("free")));

    expect(markup).toContain("Sparkle Mama");
    expect(markup).toContain("Sparkle Showcase");
    expect(markup).toContain("The Rarest of Reveals");
    expect(markup).toContain("Showcase Collections");
    expect(markup).toContain("Reveal Spotlight");
    expect(markup).toContain("Rainbow Crown Ring");
    expect(markup).toContain("Follow");
    expect(markup).toContain("Report");
    expect(markup).toContain("Block");
    expect(markup).not.toContain("Safety controls ready.");
    expect(markup).toContain("Confirm block");
    expect(markup).toContain("Report spam or bad behavior");
    expect(markup).not.toContain("Private note");
    expect(markup).not.toContain("My Collection");
    expect(markup).not.toContain("Curated Collections");
    expect(markup).not.toContain("customer-to-customer");
    expect(markup).not.toContain("marketplace");
    expect(findSparkleFinderCopyViolations(markup)).toEqual([]);
  });

  it("does not render a self-follow button on the owner Showcase view", async () => {
    const showcase = (await getPublicSparkleShowcaseByHandle("sparkle-mama", fixtureOptions()))!;
    const markup = renderToStaticMarkup(renderSparkleShowcasePageContent(showcase, showcaseRouteAccountState("silver")));

    expect(markup).toContain("Your Showcase");
    expect(markup).not.toContain(">Follow<");
    expect(markup).not.toContain("Friend request");
    expect(markup).not.toContain("DM");
  });

  it("renders exact public totals instead of capped first-page array lengths", async () => {
    const showcase = (await getPublicSparkleShowcaseByHandle("sparkle-mama", fixtureOptions()))!;
    const markup = renderToStaticMarkup(renderSparkleShowcasePageContent({
      ...showcase,
      publicPieceCount: 99,
      rarestRevealCount: 17,
    }));

    expect(markup).toContain("99 Public pieces");
    expect(markup).toContain("17 Rare reveals");
  });

  it("renders a shareable Reveal Spotlight with dancer leads and comments", async () => {
    const spotlight = (await getRevealSpotlight("sparkle-mama", "jewel-rainbow-crown-ring", fixtureOptions()))!;
    const markup = renderToStaticMarkup(renderRevealSpotlightPageContent(spotlight));

    expect(markup).toContain("Reveal Spotlight");
    expect(markup).toContain("Rainbow Crown Ring");
    expect(markup).toContain("Bomb Party Collection: Celestial Lights");
    expect(markup).toContain("Diamond Reveal");
    expect(markup).toContain("Dancer leads");
    expect(markup).toContain("Exact dancer lead");
    expect(markup).toContain("Open Dance Floor");
    expect(markup).toContain("That reveal was unreal.");
    expect(markup).not.toContain("Deleted comment should stay hidden");
    expect(markup).not.toContain("Private note");
  });

  it("renders a public Showcase Collection detail page", async () => {
    const showcase = (await getPublicSparkleShowcaseByHandle("sparkle-mama", fixtureOptions()))!;
    const showcaseCollection = (await getShowcaseCollectionBySlug("sparkle-mama", "never-leaving", fixtureOptions()))!;
    const markup = renderToStaticMarkup(renderShowcaseCollectionPageContent(showcase, showcaseCollection));

    expect(markup).toContain("Never Leaving");
    expect(markup).toContain("Showcase Collection");
    expect(markup).toContain("Share Collection");
    expect(markup).toContain("Rainbow Crown Ring");
    expect(markup).not.toContain("Private Notes");
    expect(markup).not.toContain("Curated Collections");
  });

  it("renders an owner-only private preview without social or sharing controls", async () => {
    const accountState = showcaseRouteAccountState("silver");
    const showcase = (await getPublicSparkleShowcaseByHandle("sparkle-mama", fixtureOptions()))!;
    const spotlight = (await getRevealSpotlight("sparkle-mama", "jewel-rainbow-crown-ring", fixtureOptions()))!;
    const showcaseCollection = (await getShowcaseCollectionBySlug("sparkle-mama", "never-leaving", fixtureOptions()))!;
    const profileMarkup = renderToStaticMarkup(renderSparkleShowcasePageContent(showcase, accountState, true));
    const spotlightMarkup = renderToStaticMarkup(renderRevealSpotlightPageContent(spotlight, accountState, true));
    const collectionMarkup = renderToStaticMarkup(renderShowcaseCollectionPageContent(showcase, showcaseCollection, accountState, true));

    for (const markup of [profileMarkup, spotlightMarkup, collectionMarkup]) {
      expect(markup).toContain("Private Showcase preview");
      expect(markup).not.toContain("Share Showcase");
      expect(markup).not.toContain("Share Reveal Spotlight");
      expect(markup).not.toContain("Share Collection");
      expect(markup).not.toContain("Confirm block");
      expect(markup).not.toContain("Report spam or bad behavior");
    }
    expect(profileMarkup).not.toContain(">Follow<");
    expect(profileMarkup).not.toContain("Showcase comments");
    expect(spotlightMarkup).not.toContain("That reveal was unreal.");
  });
});

function fixtureOptions() {
  return { allowFixtureFallback: true, supabase: null } as const;
}

function showcaseRouteAccountState(mode: "free" | "silver"): CurrentSparkleFinderAccountState & { status: "authenticated" } {
  const accountState = getLocalDevAuthState(mode);

  if (accountState.status !== "authenticated") {
    throw new Error("Expected authenticated local preview account");
  }

  return {
    ...accountState,
    communicationConsent: {
      accountEmailRequired: true,
      accountSmsAllowed: false,
      accountSmsConsentedAt: null,
      promotionalEmailOptIn: false,
      promotionalEmailConsentedAt: null,
      promotionalSmsOptIn: false,
      promotionalSmsConsentedAt: null,
      privacyAcknowledgedAt: "2026-06-01T12:00:00.000Z",
    },
  };
}
