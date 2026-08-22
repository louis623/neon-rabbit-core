import type { Metadata } from "next";
import { buildRevealSpotlightPath, buildShowcaseCollectionPath, buildSparkleShowcasePath, getCanonicalShowcaseUrl } from "./showcase-sharing";
import type { RevealSpotlight, ShowcaseCollectionWithPieces, SparkleShowcase, SparkleShowcasePiece } from "./showcase-types";

const metadataDescriptionLimit = 160;

export function createSparkleShowcaseMetadata(showcase: SparkleShowcase): Metadata {
  const displayName = cleanPublicText(showcase.profile.customer.displayName) || "A Sparkle Finder collector";
  const title = `${displayName}'s Sparkle Showcase | Sparkle Finder`;
  const description = toDescription(
    showcase.profile.tagline,
    `Browse ${displayName}'s public jewelry collection on Sparkle Finder.`,
  );
  const canonicalUrl = getCanonicalShowcaseUrl(buildSparkleShowcasePath(showcase.profile.handle));
  const imageUrl = getPublicPieceImage(
    showcase.pieces.find((piece) => piece.isHighlighted) ?? showcase.rarestReveals[0] ?? showcase.pieces[0],
  );

  return createPublicMetadata({ canonicalUrl, description, imageUrl, title });
}

export function createShowcaseCollectionMetadata(
  showcase: SparkleShowcase,
  collection: ShowcaseCollectionWithPieces,
): Metadata {
  const titleText = cleanPublicText(collection.title) || "Showcase Collection";
  const displayName = cleanPublicText(showcase.profile.customer.displayName) || "a Sparkle Finder collector";
  const title = `${titleText} | Sparkle Finder`;
  const description = toDescription(
    collection.description,
    `Browse ${titleText}, a public Showcase Collection from ${displayName}.`,
  );
  const canonicalUrl = getCanonicalShowcaseUrl(
    buildShowcaseCollectionPath(showcase.profile.handle, collection.slug),
  );
  const imageUrl = getPublicPieceImage(collection.pieces[0]);

  return createPublicMetadata({ canonicalUrl, description, imageUrl, title });
}

export function createRevealSpotlightMetadata(spotlight: RevealSpotlight): Metadata {
  const pieceName = cleanPublicText(spotlight.piece.jewelryItem.name) || "Reveal Spotlight";
  const collectionName = cleanPublicText(spotlight.piece.jewelryItem.collectionName);
  const revealStory = cleanPublicText(spotlight.piece.revealStory);
  const title = `${pieceName} Reveal Spotlight | Sparkle Finder`;
  const description = toDescription(
    [
      collectionName ? `${pieceName} from the ${collectionName} collection.` : `${pieceName}.`,
      revealStory,
    ].filter(Boolean).join(" "),
    collectionName
      ? `See ${pieceName} from the ${collectionName} collection in a public Sparkle Showcase.`
      : `See ${pieceName} in a public Sparkle Showcase.`,
  );
  const canonicalUrl = getCanonicalShowcaseUrl(
    buildRevealSpotlightPath(spotlight.showcase.profile.handle, spotlight.piece.jewelryItemId),
  );
  const imageUrl = getPublicPieceImage(spotlight.piece);

  return createPublicMetadata({ canonicalUrl, description, imageUrl, title });
}

function createPublicMetadata({
  canonicalUrl,
  description,
  imageUrl,
  title,
}: {
  canonicalUrl: string | null;
  description: string;
  imageUrl: string | null;
  title: string;
}): Metadata {
  const images = imageUrl ? [{ alt: title, url: imageUrl }] : undefined;

  return {
    alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
    description,
    openGraph: {
      description,
      images,
      siteName: "Sparkle Finder",
      title,
      type: "website",
      url: canonicalUrl ?? undefined,
    },
    title,
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      description,
      images: imageUrl ? [imageUrl] : undefined,
      title,
    },
  };
}

function getPublicPieceImage(piece: SparkleShowcasePiece | undefined): string | null {
  if (!piece || piece.visibility !== "public") {
    return null;
  }

  return toSafePublicImageUrl(piece.personalPhotoUrl) ?? toSafePublicImageUrl(piece.jewelryItem.imageUrl);
}

function toSafePublicImageUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function toDescription(value: string | null | undefined, fallback: string): string {
  const text = cleanPublicText(value) || fallback;

  if (text.length <= metadataDescriptionLimit) {
    return text;
  }

  return `${text.slice(0, metadataDescriptionLimit - 1).trimEnd()}…`;
}

function cleanPublicText(value: string | null | undefined): string {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}
