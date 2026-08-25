export type FavoriteRepAccessLevel = "free" | "silver";

export type FavoriteRep = {
  id: string;
  userId: string;
  repId: string;
  repDisplayName: string;
  repSiteUrl: string | null;
  repBoardUrl: string | null;
  notes: string;
  notifyNextShow: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FavoriteRepCard = FavoriteRep & {
  nextShowAt: string | null;
  nextShowTitle: string | null;
  boardItemCount: number;
  isSilverEnhanced: boolean;
};

export type CollectorFollow = {
  id: string;
  followerUserId: string;
  followedUserId: string;
  createdAt: string;
};

export type CollectorBlock = {
  id: string;
  blockerUserId: string;
  blockedUserId: string;
  reason: string;
  createdAt: string;
};

export type SocialReportReason =
  | "spam"
  | "harassment"
  | "scam_or_impersonation"
  | "inappropriate"
  | "other";

export type SocialReport = {
  id: string;
  reporterUserId: string;
  targetType: "collector_profile" | "showcase" | "favorite_rep";
  targetId: string;
  reason: SocialReportReason;
  details: string;
  createdAt: string;
};

export type PublicCollectorProfile = {
  userId: string;
  handle: string;
  displayName: string;
  tagline: string;
  photoUrl: string | null;
  showcaseUrl: string;
  followerCount: number;
  followingCount: number;
  publicPieceCount: number;
  isFollowedByViewer: boolean;
  isBlockedByViewer: boolean;
};

export type FollowedShowcaseHighlight = {
  userId: string;
  handle: string;
  displayName: string;
  tagline: string;
  collectorPhotoUrl: string | null;
  collectionItemId: string;
  jewelryItemId: string;
  revealStory: string;
  personalPhotoUrl: string | null;
  isRarestReveal: boolean;
  updatedAt: string;
  showcaseUrl: string;
  spotlightUrl: string;
};
