export type CustomerTier = "free" | "silver";
export type JewelryType = "ring" | "earrings" | "necklace" | "bracelet" | "stack" | "other";
export type BombPartyLabel = "diamond" | "unicorn" | "standard";
export type CollectionItemState = "owned" | "wishlist" | "private_note_only";
export type ListingStatus = "available" | "pending" | "unavailable";
export type MatchType = "exact_item" | "same_collection_type" | "near_match";
export type LiveShowStatus = "scheduled" | "live" | "completed";
export type SilverProfileVisibility = "private" | "sparkle_finder";
export type NicNacFindRequestStatus = "queued" | "complete";

export type SparkleSuiteRepIdentity = {
  sparkleSuiteRepId: string;
  businessName: string;
  publicDiscoveryEnabled: boolean;
};

export type RepSummary = {
  id: string;
  businessName: string;
  displayName: string;
  avatarUrl: string;
  state: string;
  siteUrl: string;
  nextLiveShowId: string;
};

export type LiveShow = {
  id: string;
  repId: string;
  startsAt: string;
  durationMinutes: number;
  title: string;
  status: LiveShowStatus;
  showUrl: string;
};

export type JewelryItem = {
  id: string;
  name: string;
  collectionName: string;
  collectionYear?: number | null;
  jewelryType: JewelryType;
  material?: string | null;
  mainStone?: string | null;
  bpMsrp?: number | null;
  imageUrl: string;
  bpLabel: BombPartyLabel;
  itemNumber: string;
  searchTags?: string[];
  availableListingCount?: number;
  knownRepListingIds: string[];
};

export type RepBoardListing = {
  id: string;
  repId: string;
  jewelryItemId: string;
  status: ListingStatus;
  listedAt: string;
  boardUrl: string;
};

export type CustomerAccount = {
  id: string;
  displayName: string;
  email: string;
  phoneE164?: string;
  state: string;
  tier: CustomerTier;
  repIdentity?: SparkleSuiteRepIdentity;
};

export type SilverProfile = {
  customerId: string;
  photoUrl: string;
  tiktokHandle: string;
  bio: string;
  visibility: SilverProfileVisibility;
};

export type CollectionItem = {
  id: string;
  customerId: string;
  jewelryItemId: string;
  state: CollectionItemState;
  note: string;
  isHighlighted: boolean;
};

export type NicNacFindRequest = {
  customerId: string;
  jewelryItemId: string;
  createdAt: string;
  status: NicNacFindRequestStatus;
};

export type NicNacFindResult = {
  requestId: string;
  repId: string;
  listingId: string;
  liveShowId: string;
  matchType: MatchType;
  confidenceLabel: string;
};

export type AffiliateShopItem = {
  id: string;
  title: string;
  body: string;
  category: "collector" | "livestream";
};

export type AffiliateProductRecommendation = {
  id: string;
  lane: "collector" | "rep";
  category: string;
  title: string;
  shortDescription: string;
  whyItHelps: string;
  retailerProgram: string;
  status: "research" | "needs_louis_review" | "approved" | "live" | "paused";
  affiliateUrl?: string;
  approvedByLouisAt?: string;
  disclosure: string;
  trustCopy: string;
  placement: string;
};

export type RepBoardMatch = NicNacFindResult & {
  jewelryItemId: string;
  matchedJewelryItemId: string;
  boardUrl: string;
};

export type JewelryItemWithNextShow = JewelryItem & {
  nextLiveShow?: LiveShow;
  rep?: RepSummary;
};
