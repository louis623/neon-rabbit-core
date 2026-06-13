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

describe("Sparkle Showcase public routes", () => {
  it("renders a public Sparkle Showcase with rarest reveals and showcase collections", () => {
    const showcase = getPublicSparkleShowcaseByHandle("sparkle-mama")!;
    const markup = renderToStaticMarkup(renderSparkleShowcasePageContent(showcase, getLocalDevAuthState("free")));

    expect(markup).toContain("Sparkle Mama");
    expect(markup).toContain("Sparkle Showcase");
    expect(markup).toContain("The Rarest of Reveals");
    expect(markup).toContain("Showcase Collections");
    expect(markup).toContain("Reveal Spotlight");
    expect(markup).toContain("Rainbow Crown Ring");
    expect(markup).toContain("Follow");
    expect(markup).toContain("Report spam or bad behavior");
    expect(markup).not.toContain("Private note");
    expect(markup).not.toContain("My Collection");
    expect(markup).not.toContain("Curated Collections");
    expect(markup).not.toContain("customer-to-customer");
    expect(markup).not.toContain("marketplace");
    expect(findSparkleFinderCopyViolations(markup)).toEqual([]);
  });

  it("renders a shareable Reveal Spotlight with rep leads and comments", () => {
    const spotlight = getRevealSpotlight("sparkle-mama", "jewel-rainbow-crown-ring")!;
    const markup = renderToStaticMarkup(renderRevealSpotlightPageContent(spotlight));

    expect(markup).toContain("Reveal Spotlight");
    expect(markup).toContain("Rainbow Crown Ring");
    expect(markup).toContain("Bomb Party Collection: Celestial Lights");
    expect(markup).toContain("Diamond Reveal");
    expect(markup).toContain("Rep leads");
    expect(markup).toContain("Exact item lead");
    expect(markup).toContain("Open rep board path");
    expect(markup).toContain("That reveal was unreal.");
    expect(markup).not.toContain("Deleted comment should stay hidden");
    expect(markup).not.toContain("Private note");
  });

  it("renders a public Showcase Collection detail page", () => {
    const showcase = getPublicSparkleShowcaseByHandle("sparkle-mama")!;
    const showcaseCollection = getShowcaseCollectionBySlug("sparkle-mama", "never-leaving")!;
    const markup = renderToStaticMarkup(renderShowcaseCollectionPageContent(showcase, showcaseCollection));

    expect(markup).toContain("Never Leaving");
    expect(markup).toContain("Showcase Collection");
    expect(markup).toContain("Rainbow Crown Ring");
    expect(markup).not.toContain("Private Notes");
    expect(markup).not.toContain("Curated Collections");
  });
});
