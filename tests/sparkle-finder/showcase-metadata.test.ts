import { describe, expect, it } from "vitest";
import {
  createRevealSpotlightMetadata,
  createShowcaseCollectionMetadata,
  createSparkleShowcaseMetadata,
} from "../../lib/sparkle-finder/showcase-metadata";
import type {
  RevealSpotlight,
  ShowcaseCollectionWithPieces,
  SparkleShowcase,
  SparkleShowcasePiece,
} from "../../lib/sparkle-finder/showcase-types";

describe("public Sparkle Showcase metadata", () => {
  const publicPiece = {
    customerId: "customer-public",
    id: "collection-piece-public",
    isHighlighted: true,
    isRarestReveal: true,
    jewelryItem: {
      bpLabel: "diamond",
      collectionName: "Celestial Lights",
      id: "jewel-rainbow-crown-ring",
      imageUrl: "https://cdn.example.test/canonical-ring.jpg",
      itemNumber: "CL-101",
      jewelryType: "ring",
      knownRepListingIds: [],
      name: "Rainbow Crown Ring",
    },
    jewelryItemId: "jewel-rainbow-crown-ring",
    note: "PRIVATE OWNER NOTE THAT MUST NEVER APPEAR",
    personalPhotoUrl: "https://cdn.example.test/public-personal-ring.jpg",
    revealStory: "I revealed this one with my family and could not stop smiling.",
    showcaseStatus: "owned",
    state: "owned",
    visibility: "public",
  } satisfies SparkleShowcasePiece;

  const showcaseCollection = {
    customerId: "customer-public",
    description: "Pieces that always make me smile.",
    id: "showcase-collection-1",
    pieceIds: [publicPiece.id],
    pieces: [publicPiece],
    slug: "never-leaving",
    title: "Never Leaving",
    visibility: "public",
  } satisfies ShowcaseCollectionWithPieces;

  const showcase = {
    comments: [],
    pieces: [publicPiece],
    profile: {
      customer: {
        displayName: "Sparkle Mama",
        email: "PRIVATE-EMAIL@example.test",
        id: "customer-public",
        state: "GA",
        tier: "silver",
      },
      followerCount: 2,
      followingCount: 1,
      handle: "sparkle-mama",
      isFollowedByViewer: false,
      profile: {
        bio: "Collector",
        customerId: "customer-public",
        photoUrl: "",
        tiktokHandle: "",
        visibility: "sparkle_finder",
      },
      tagline: "Colorful reveals and pieces with a story.",
    },
    rarestReveals: [publicPiece],
    showcaseCollections: [showcaseCollection],
  } satisfies SparkleShowcase;

  it("builds canonical Showcase metadata from public allowlisted fields", () => {
    const metadata = createSparkleShowcaseMetadata(showcase);
    const serialized = JSON.stringify(metadata);

    expect(metadata.alternates?.canonical).toBe("https://yoursparklefinder.com/showcase/sparkle-mama");
    expect(metadata.title).toBe("Sparkle Mama's Sparkle Showcase | Sparkle Finder");
    expect(metadata.openGraph?.images).toEqual([
      expect.objectContaining({ url: "https://cdn.example.test/public-personal-ring.jpg" }),
    ]);
    expect(serialized).not.toContain("PRIVATE OWNER NOTE");
    expect(serialized).not.toContain("PRIVATE-EMAIL");
  });

  it("builds canonical Showcase Collection metadata", () => {
    const metadata = createShowcaseCollectionMetadata(showcase, showcaseCollection);

    expect(metadata.alternates?.canonical).toBe(
      "https://yoursparklefinder.com/showcase/sparkle-mama/showcase-collections/never-leaving",
    );
    expect(metadata.title).toBe("Never Leaving | Sparkle Finder");
    expect(metadata.description).toBe("Pieces that always make me smile.");
  });

  it("builds canonical Reveal Spotlight metadata", () => {
    const spotlight = {
      comments: [],
      piece: publicPiece,
      showcase,
    } satisfies RevealSpotlight;
    const metadata = createRevealSpotlightMetadata(spotlight);

    expect(metadata.alternates?.canonical).toBe(
      "https://yoursparklefinder.com/showcase/sparkle-mama/pieces/jewel-rainbow-crown-ring",
    );
    expect(metadata.title).toBe("Rainbow Crown Ring Reveal Spotlight | Sparkle Finder");
    expect(metadata.description).toBe(
      "Rainbow Crown Ring from the Celestial Lights collection. I revealed this one with my family and could not stop smiling.",
    );
  });

  it("never exposes a private piece image as social metadata", () => {
    const privatePiece = { ...publicPiece, visibility: "private" as const };
    const privateSpotlight = {
      comments: [],
      piece: privatePiece,
      showcase: { ...showcase, pieces: [privatePiece], rarestReveals: [privatePiece] },
    } satisfies RevealSpotlight;
    const metadata = createRevealSpotlightMetadata(privateSpotlight);

    expect(metadata.openGraph?.images).toBeUndefined();
    expect(metadata.twitter).toMatchObject({ card: "summary" });
  });
});
