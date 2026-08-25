import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { renderCollectorsPageContent } from "../../app/(hub)/collectors/page";
import { MembershipTierCards } from "../../components/home/MembershipTierCards";
import { CollectorSocialPanel } from "../../components/social/CollectorSocialPanel";
import { RarestReveals } from "../../components/showcase/RarestReveals";
import { ShowcaseCollectionRail } from "../../components/showcase/ShowcaseCollectionRail";
import { ShowcasePieceGrid } from "../../components/showcase/ShowcasePieceGrid";
import { SparkleShowcaseProfile } from "../../components/showcase/SparkleShowcaseProfile";
import { getLocalDevAuthState } from "../../lib/sparkle-finder/auth";
import { getPublicSparkleShowcaseByHandle } from "../../lib/sparkle-finder/showcase-service";

describe("Release 4 customer copy and empty-state polish", () => {
  it("uses customer-benefit copy on collector, membership, and auth surfaces", () => {
    const collectorsMarkup = renderToStaticMarkup(
      renderCollectorsPageContent(getLocalDevAuthState("silver"), "", [], []),
    );
    const membershipMarkup = renderToStaticMarkup(<MembershipTierCards />);
    const assignedSources = [
      "app/auth/sign-in/page.tsx",
      "app/auth/sign-up/page.tsx",
      "components/home/MembershipTierCards.tsx",
      "components/social/FollowedShowcases.tsx",
    ].map((file) => fs.readFileSync(path.resolve(process.cwd(), file), "utf8")).join("\n");

    expect(collectorsMarkup).toContain(
      "Discover public Sparkle Showcases, follow collectors you love, and keep your safety controls close.",
    );
    expect(membershipMarkup).toContain("personalized help from Nic-Nac");
    expect(membershipMarkup).toContain("your Bling Vault");
    expect(assignedSources).not.toContain("focused Nic-Nac requests");
    expect(assignedSources).not.toContain("newest-first");
    expect(assignedSources).not.toContain("compact view");
    expect(assignedSources).not.toContain("collector workflow");
  });

  it("distinguishes an empty collector directory from an empty search result", () => {
    const newDirectoryMarkup = renderToStaticMarkup(
      <CollectorSocialPanel collectors={[]} viewerUserId="viewer-1" />,
    );
    const emptySearchMarkup = renderToStaticMarkup(
      <CollectorSocialPanel collectors={[]} query="casey" viewerUserId="viewer-1" />,
    );

    expect(newDirectoryMarkup).toContain("Public Showcases will appear here.");
    expect(newDirectoryMarkup).toContain("Check back as collectors begin sharing the jewelry they love.");
    expect(emptySearchMarkup).toContain("No public Showcases match this search.");
    expect(emptySearchMarkup).toContain("Try another collector name, handle, state, or TikTok handle.");
  });

  it("renders one warm state instead of empty Showcase modules", async () => {
    const fixture = await getPublicSparkleShowcaseByHandle("sparkle-mama", {
      allowFixtureFallback: true,
      supabase: null,
    });

    expect(fixture).not.toBeNull();

    const emptyShowcase = {
      ...fixture!,
      comments: [],
      pieces: [],
      rarestReveals: [],
      showcaseCollections: [],
    };
    const markup = renderToStaticMarkup(
      <SparkleShowcaseProfile isPrivatePreview showcase={emptyShowcase} viewerUserId={fixture!.profile.customer.id} />,
    );

    expect(markup).toContain("This Showcase is ready for its first public piece.");
    expect(markup).toContain("When you make a piece public, it will appear here.");
    expect(markup).not.toContain("The Rarest of Reveals");
    expect(markup).not.toContain("Showcase Collections");
    expect(markup).not.toContain("Sparkle Showcase Pieces");
    expect(markup).not.toContain("Showcase Conversation");
    const publicMarkup = renderToStaticMarkup(
      <SparkleShowcaseProfile showcase={emptyShowcase} />,
    );
    expect(publicMarkup).toContain("When this collector shares jewelry, it will appear here.");
    expect(renderToStaticMarkup(<RarestReveals handle="casey" pieces={[]} />)).toBe("");
    expect(renderToStaticMarkup(<ShowcaseCollectionRail collections={[]} handle="casey" />)).toBe("");
    expect(renderToStaticMarkup(<ShowcasePieceGrid handle="casey" pieces={[]} />)).toBe("");
  });

  it("hides scrollbar chrome while preserving the scroll container", () => {
    const css = fs.readFileSync(path.resolve(process.cwd(), "app/globals.css"), "utf8");
    const wishlist = fs.readFileSync(
      path.resolve(process.cwd(), "components/home/WishlistRail.tsx"),
      "utf8",
    );

    expect(css).toContain(".sparkle-scrollbar-hidden");
    expect(css).toContain("scrollbar-width: none");
    expect(css).toContain("-ms-overflow-style: none");
    expect(css).toContain(".sparkle-scrollbar-hidden::-webkit-scrollbar");
    expect(wishlist).toContain("sparkle-scrollbar-hidden");
    expect(wishlist).toContain("overflow-x-auto");
    expect(wishlist).toContain("snap-x");
    expect(wishlist).toContain("md:overflow-visible");
  });
});
