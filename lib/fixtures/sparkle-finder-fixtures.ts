import type {
  CollectionItem,
  CustomerAccount,
  JewelryItem,
  LiveShow,
  RepBoardListing,
  RepSummary,
  SilverProfile,
} from "../sparkle-finder/types";

export const sparkleFinderReps: RepSummary[] = [
  {
    id: "rep-sierra",
    businessName: "Sierra Sparkle Studio",
    displayName: "Sierra Lane",
    avatarUrl: "/fixtures/reps/sierra-lane.jpg",
    state: "TX",
    siteUrl: "https://sparklesuite.example/reps/sierra",
    nextLiveShowId: "show-sierra-tonight",
  },
  {
    id: "rep-maya",
    businessName: "Maya's Glow Room",
    displayName: "Maya Chen",
    avatarUrl: "/fixtures/reps/maya-chen.jpg",
    state: "CA",
    siteUrl: "https://sparklesuite.example/reps/maya",
    nextLiveShowId: "show-maya-brunch",
  },
  {
    id: "rep-kelli",
    businessName: "Kelli Jo Sparkles",
    displayName: "Kelli Jo",
    avatarUrl: "/fixtures/reps/kelli-jo.jpg",
    state: "FL",
    siteUrl: "https://sparklesuite.example/reps/kelli",
    nextLiveShowId: "show-kelli-glimmer",
  },
];

export const sparkleFinderLiveShows: LiveShow[] = [
  {
    id: "show-sierra-tonight",
    repId: "rep-sierra",
    startsAt: "2026-05-29T19:00:00-04:00",
    durationMinutes: 60,
    title: "Celestial Lights Preview",
    status: "scheduled",
    showUrl: "https://sparklesuite.example/reps/sierra/live",
  },
  {
    id: "show-maya-brunch",
    repId: "rep-maya",
    startsAt: "2026-05-29T12:30:00-04:00",
    durationMinutes: 45,
    title: "Bright Finds Brunch",
    status: "scheduled",
    showUrl: "https://sparklesuite.example/reps/maya/live",
  },
  {
    id: "show-kelli-glimmer",
    repId: "rep-kelli",
    startsAt: "2026-05-29T16:30:00-04:00",
    durationMinutes: 45,
    title: "Glimmer Room",
    status: "scheduled",
    showUrl: "https://sparklesuite.example/reps/kelli/live",
  },
];

export const sparkleFinderJewelryItems: JewelryItem[] = [
  {
    id: "jewel-rainbow-crown-ring",
    name: "Rainbow Crown Ring",
    collectionName: "Celestial Lights",
    jewelryType: "ring",
    imageUrl: "/fixtures/jewelry/rainbow-crown-ring.jpg",
    bpLabel: "diamond",
    itemNumber: "CL-R-101",
    knownRepListingIds: ["listing-rainbow-crown-sierra"],
  },
  {
    id: "jewel-starlit-crown-ring",
    name: "Starlit Halo Ring",
    collectionName: "Celestial Lights",
    jewelryType: "ring",
    imageUrl: "/fixtures/jewelry/starlit-crown-ring.jpg",
    bpLabel: "standard",
    itemNumber: "CL-R-102",
    knownRepListingIds: ["listing-starlit-crown-maya"],
  },
  {
    id: "jewel-lilac-orbit-ring",
    name: "Lilac Orbit Ring",
    collectionName: "Orbit Garden",
    jewelryType: "ring",
    imageUrl: "/fixtures/jewelry/lilac-orbit-ring.jpg",
    bpLabel: "unicorn",
    itemNumber: "OG-R-204",
    knownRepListingIds: [],
  },
  {
    id: "jewel-moon-orbit-ring",
    name: "Moon Orbit Ring",
    collectionName: "Orbit Garden",
    jewelryType: "ring",
    imageUrl: "/fixtures/jewelry/moon-orbit-ring.jpg",
    bpLabel: "standard",
    itemNumber: "OG-R-205",
    knownRepListingIds: ["listing-moon-orbit-kelli"],
  },
  {
    id: "jewel-golden-heart-necklace",
    name: "Golden Heart Necklace",
    collectionName: "Heartlight",
    jewelryType: "necklace",
    imageUrl: "/fixtures/jewelry/golden-heart-necklace.jpg",
    bpLabel: "diamond",
    itemNumber: "HL-N-310",
    knownRepListingIds: [],
  },
  {
    id: "jewel-aurora-drop-earrings",
    name: "Aurora Drop Earrings",
    collectionName: "Aurora Lane",
    jewelryType: "earrings",
    imageUrl: "/fixtures/jewelry/aurora-drop-earrings.jpg",
    bpLabel: "unicorn",
    itemNumber: "AL-E-412",
    knownRepListingIds: [],
  },
  {
    id: "jewel-rose-stack-bracelet",
    name: "Rose Stack Bracelet",
    collectionName: "Garden Glow",
    jewelryType: "bracelet",
    imageUrl: "/fixtures/jewelry/rose-stack-bracelet.jpg",
    bpLabel: "standard",
    itemNumber: "GG-B-508",
    knownRepListingIds: ["listing-rose-stack-maya"],
  },
];

export const sparkleFinderRepBoardListings: RepBoardListing[] = [
  {
    id: "listing-rainbow-crown-sierra",
    repId: "rep-sierra",
    jewelryItemId: "jewel-rainbow-crown-ring",
    status: "available",
    listedAt: "2026-05-29T14:00:00-04:00",
    boardUrl: "https://sparklesuite.example/reps/sierra/board/rainbow-crown",
  },
  {
    id: "listing-starlit-crown-maya",
    repId: "rep-maya",
    jewelryItemId: "jewel-starlit-crown-ring",
    status: "available",
    listedAt: "2026-05-29T15:15:00-04:00",
    boardUrl: "https://sparklesuite.example/reps/maya/board/starlit-crown",
  },
  {
    id: "listing-moon-orbit-kelli",
    repId: "rep-kelli",
    jewelryItemId: "jewel-moon-orbit-ring",
    status: "available",
    listedAt: "2026-05-29T16:45:00-04:00",
    boardUrl: "https://sparklesuite.example/reps/kelli/board/moon-orbit",
  },
  {
    id: "listing-rose-stack-maya",
    repId: "rep-maya",
    jewelryItemId: "jewel-rose-stack-bracelet",
    status: "pending",
    listedAt: "2026-05-29T09:10:00-04:00",
    boardUrl: "https://sparklesuite.example/reps/maya/board/rose-stack",
  },
];

export const sparkleFinderCustomers: CustomerAccount[] = [
  {
    id: "customer-free-marlena",
    displayName: "Marlena",
    email: "marlena@example.test",
    state: "NC",
    tier: "free",
  },
  {
    id: "customer-silver-sparkle-mama",
    displayName: "Sparkle Mama",
    email: "sparkle-mama@example.test",
    state: "TX",
    tier: "silver",
  },
];

export const sparkleFinderSilverProfiles: SilverProfile[] = [
  {
    customerId: "customer-silver-sparkle-mama",
    photoUrl: "/fixtures/customers/sparkle-mama.jpg",
    tiktokHandle: "@sparklemama_tx",
    bio: "Collects warm golds, hearts, and statement rings.",
    visibility: "sparkle_finder",
  },
];

export const sparkleFinderCollectionItems: CollectionItem[] = [
  {
    id: "collection-owned-rainbow",
    customerId: "customer-silver-sparkle-mama",
    jewelryItemId: "jewel-rainbow-crown-ring",
    state: "owned",
    note: "Favorite centerpiece ring.",
    isHighlighted: true,
  },
  {
    id: "collection-wishlist-lilac",
    customerId: "customer-silver-sparkle-mama",
    jewelryItemId: "jewel-lilac-orbit-ring",
    state: "wishlist",
    note: "Watch for the softer purple stone.",
    isHighlighted: false,
  },
];
