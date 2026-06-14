import {
  sparkleFinderCollectionItems,
  sparkleFinderCustomers,
  sparkleFinderShowcaseCollections,
  sparkleFinderShowcaseComments,
  sparkleFinderSilverProfiles,
} from "../fixtures/sparkle-finder-fixtures";
import { getJewelryItemById, matchJewelryItemToRepBoardListings } from "./service";
import type { CollectionItem } from "./types";
import type {
  RevealSpotlight,
  ShowcaseCollection,
  ShowcaseCollectionWithPieces,
  ShowcaseComment,
  SparkleShowcase,
  SparkleShowcaseItemStatus,
  SparkleShowcasePiece,
  SparkleShowcaseVisibility,
} from "./showcase-types";

const fixtureShowcaseHandles: Record<string, string> = {
  "sparkle-mama": "customer-silver-sparkle-mama",
};

const fixtureShowcasePieceOverrides: Record<
  string,
  {
    visibility?: SparkleShowcaseVisibility;
    showcaseStatus?: SparkleShowcaseItemStatus;
    revealStory?: string;
    personalPhotoUrl?: string | null;
    isRarestReveal?: boolean;
  }
> = {
  "collection-owned-rainbow": {
    visibility: "public",
    showcaseStatus: "owned",
    revealStory: "My jaw dropped when this Diamond came out of the fizz.",
    isRarestReveal: true,
  },
  "collection-owned-starlit": {
    visibility: "private",
    showcaseStatus: "owned",
    revealStory: "Private note for owner planning only.",
    isRarestReveal: false,
  },
  "collection-wishlist-lilac": {
    visibility: "public",
    showcaseStatus: "wishlist",
    revealStory: "Still watching for this Unicorn because the soft purple is everything.",
    isRarestReveal: true,
  },
  "collection-owned-heart": {
    visibility: "public",
    showcaseStatus: "owned",
    revealStory: "A sweet gold piece that feels like an everyday favorite.",
    isRarestReveal: true,
  },
  "collection-wishlist-aurora": {
    visibility: "public",
    showcaseStatus: "iso",
    revealStory: "Looking for the pink Aurora drops for my dream earring stack.",
    isRarestReveal: true,
  },
  "collection-highlight-rose": {
    visibility: "public",
    showcaseStatus: "owned",
    revealStory: "The bracelet stack I keep reaching for.",
    isRarestReveal: false,
  },
};

export function getPublicSparkleShowcaseByHandle(handle: string): SparkleShowcase | undefined {
  const customerId = fixtureShowcaseHandles[normalizeHandle(handle)];

  if (!customerId) {
    return undefined;
  }

  const customer = sparkleFinderCustomers.find((candidate) => candidate.id === customerId);
  const profile = sparkleFinderSilverProfiles.find((candidate) => candidate.customerId === customerId);

  if (!customer || !profile || profile.visibility !== "sparkle_finder") {
    return undefined;
  }

  const pieces = getPublicShowcasePiecesByCustomerId(customerId);
  const comments = getVisibleShowcaseComments(customerId, "showcase", customerId);
  const showcaseCollections = getPublicShowcaseCollections(customerId, pieces);

  return {
    profile: {
      customer,
      profile,
      handle: normalizeHandle(handle),
      tagline: "Warm golds, hearts, unicorn hunts, and favorite reveals.",
      followerCount: 42,
      followingCount: 8,
      isFollowedByViewer: false,
    },
    pieces,
    rarestReveals: pieces.filter(isRarestRevealPiece),
    showcaseCollections,
    comments,
  };
}

export function getShowcaseCollectionBySlug(
  handle: string,
  slug: string,
): ShowcaseCollectionWithPieces | undefined {
  const showcase = getPublicSparkleShowcaseByHandle(handle);

  return showcase?.showcaseCollections.find((collection) => collection.slug === normalizeHandle(slug));
}

export function getRevealSpotlight(handle: string, jewelryItemId: string): RevealSpotlight | undefined {
  const showcase = getPublicSparkleShowcaseByHandle(handle);
  const piece = showcase?.pieces.find((candidate) => candidate.jewelryItemId === jewelryItemId);

  if (!showcase || !piece) {
    return undefined;
  }

  return {
    showcase,
    piece,
    comments: getVisibleShowcaseComments(showcase.profile.customer.id, "piece", piece.id),
  };
}

export function getShowcasePieceRepLeads(piece: SparkleShowcasePiece) {
  return matchJewelryItemToRepBoardListings(piece.jewelryItemId);
}

export function getPublicShowcasePiecesByCustomerId(customerId: string): SparkleShowcasePiece[] {
  return sparkleFinderCollectionItems
    .filter((item) => item.customerId === customerId)
    .flatMap((item) => {
      const piece = mapShowcasePiece(item);

      if (!piece || piece.visibility !== "public" || piece.showcaseStatus === "private_note_only") {
        return [];
      }

      return [piece];
    });
}

export function getVisibleShowcaseComments(
  showcaseCustomerId: string,
  targetType?: ShowcaseComment["targetType"],
  targetId?: string,
): ShowcaseComment[] {
  return sparkleFinderShowcaseComments.filter((comment) => {
    if (comment.showcaseCustomerId !== showcaseCustomerId || comment.deletedAt) {
      return false;
    }

    if (targetType && comment.targetType !== targetType) {
      return false;
    }

    if (targetId && comment.targetId !== targetId) {
      return false;
    }

    return true;
  });
}

function getPublicShowcaseCollections(
  customerId: string,
  publicPieces: SparkleShowcasePiece[],
): ShowcaseCollectionWithPieces[] {
  const pieceById = new Map(publicPieces.map((piece) => [piece.id, piece]));

  return sparkleFinderShowcaseCollections
    .filter((collection) => collection.customerId === customerId && collection.visibility === "public")
    .map((collection) => mapShowcaseCollection(collection, pieceById))
    .filter((collection) => collection.pieces.length > 0);
}

function mapShowcaseCollection(
  collection: ShowcaseCollection,
  pieceById: Map<string, SparkleShowcasePiece>,
): ShowcaseCollectionWithPieces {
  return {
    ...collection,
    pieces: collection.pieceIds.flatMap((pieceId) => {
      const piece = pieceById.get(pieceId);

      return piece ? [piece] : [];
    }),
  };
}

function mapShowcasePiece(item: CollectionItem): SparkleShowcasePiece | null {
  const jewelryItem = getJewelryItemById(item.jewelryItemId);

  if (!jewelryItem) {
    return null;
  }

  const override = fixtureShowcasePieceOverrides[item.id] ?? {};

  return {
    ...item,
    jewelryItem,
    visibility: override.visibility ?? "private",
    showcaseStatus: override.showcaseStatus ?? item.state,
    revealStory: override.revealStory ?? "",
    personalPhotoUrl: override.personalPhotoUrl ?? null,
    isRarestReveal: override.isRarestReveal ?? item.isHighlighted,
    note: "",
  };
}

function isRarestRevealPiece(piece: SparkleShowcasePiece): boolean {
  return piece.isRarestReveal || piece.jewelryItem.bpLabel === "diamond" || piece.jewelryItem.bpLabel === "unicorn";
}

function normalizeHandle(value: string): string {
  return value.trim().toLowerCase();
}
