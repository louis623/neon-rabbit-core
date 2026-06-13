import type { CollectionItem, CustomerAccount, JewelryItem, SilverProfile } from "./types";

export type SparkleShowcaseVisibility = "private" | "public";
export type SparkleShowcaseItemStatus = "owned" | "wishlist" | "iso" | "private_note_only";
export type ShowcaseReportReason = "spam" | "harassment" | "scam_or_impersonation" | "inappropriate" | "other";
export type ShowcaseCommentTargetType = "showcase" | "piece";
export type ShowcaseReportTargetType = "showcase" | "piece" | "comment";

export type SparkleShowcaseProfile = {
  customer: CustomerAccount;
  profile: SilverProfile;
  handle: string;
  tagline: string;
  followerCount: number;
  followingCount: number;
  isFollowedByViewer: boolean;
};

export type SparkleShowcasePiece = CollectionItem & {
  jewelryItem: JewelryItem;
  visibility: SparkleShowcaseVisibility;
  showcaseStatus: SparkleShowcaseItemStatus;
  revealStory: string;
  personalPhotoUrl?: string | null;
  isRarestReveal: boolean;
};

export type ShowcaseCollection = {
  id: string;
  customerId: string;
  title: string;
  slug: string;
  description: string;
  visibility: SparkleShowcaseVisibility;
  pieceIds: string[];
};

export type ShowcaseCollectionWithPieces = ShowcaseCollection & {
  pieces: SparkleShowcasePiece[];
};

export type ShowcaseComment = {
  id: string;
  showcaseCustomerId: string;
  authorCustomerId: string;
  authorDisplayName: string;
  targetType: ShowcaseCommentTargetType;
  targetId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type ShowcaseReport = {
  id: string;
  reporterCustomerId: string;
  showcaseCustomerId: string;
  targetType: ShowcaseReportTargetType;
  targetId: string;
  reason: ShowcaseReportReason;
  details: string;
  createdAt: string;
};

export type SparkleShowcase = {
  profile: SparkleShowcaseProfile;
  pieces: SparkleShowcasePiece[];
  rarestReveals: SparkleShowcasePiece[];
  showcaseCollections: ShowcaseCollectionWithPieces[];
  comments: ShowcaseComment[];
};

export type RevealSpotlight = {
  showcase: SparkleShowcase;
  piece: SparkleShowcasePiece;
  comments: ShowcaseComment[];
};
