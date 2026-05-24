export type AmethystTier = 'everyday' | 'diamond' | 'unicorn'
export type AmethystEventPlatform = 'tiktok' | 'facebook' | 'shop'
export type AmethystQueueState = 'live' | 'offline' | 'loading' | 'empty'

export interface AmethystNavLink {
  label: string
  href: string
  external?: boolean
}

export interface AmethystSocialLink {
  label: string
  shortLabel: string
  href: string
}

export interface AmethystTradeListing {
  id: string
  title: string
  collection: string
  description: string
  tier: AmethystTier
  msrpLabel: string
  statusLabel: 'Available' | 'Reserved' | 'Traded'
  href?: string
}

export interface AmethystStreamLink {
  label: string
  handle: string
  href: string
  platform: AmethystEventPlatform
}

export interface AmethystEventDiscount {
  code: string
  description: string
}

export interface AmethystEvent {
  id: string
  title: string
  dateLabel: string
  timeLabel: string
  featured: boolean
  featuredCollections: string[]
  discounts: AmethystEventDiscount[]
  platforms: AmethystStreamLink[]
}

export interface AmethystLiveQueueEntry {
  position: string
  label: string
  customerName: string
}

export interface AmethystFooterColumn {
  title: string
  links: Array<{
    label: string
    href: string
    external?: boolean
  }>
}

export interface AmethystSiteContent {
  repName: string
  businessName: string
  teamName: string
  heroEyebrow: string
  heroHeadline: string
  heroSub: string
  announcementText: string
  announcementItems: string[]
  bombPartyLearnMoreUrl: string
  shopUrl: string
  joinTeamUrl: string
  streamLinks: AmethystStreamLink[]
  liveQueueState: AmethystQueueState
  liveQueueLabel: string
  liveQueueSummary: string
  liveQueueEntries: AmethystLiveQueueEntry[]
  tradeBoardListings: AmethystTradeListing[]
  events: AmethystEvent[]
  whatIsBombPartyTitle: string
  whatIsBombPartyBody: string
  signupEyebrow: string
  signupTitle: string
  signupSub: string
  signupConsent: string
  joinTeamEyebrow: string
  joinTeamTitle: string
  joinTeamSub: string
  footerTagline: string
  footerShopLinks: AmethystFooterColumn['links']
  footerAboutLinks: AmethystFooterColumn['links']
  footerColumn: AmethystFooterColumn
  socialLinks: AmethystSocialLink[]
  legalDisclaimer: string
  navLinks: AmethystNavLink[]
}

export const defaultAmethystSiteContent: AmethystSiteContent = {
  repName: 'Rep Name',
  businessName: 'Show Name',
  teamName: "Jane's Sparkle Party",
  heroEyebrow: 'Live reveals · every Tuesday · 8pm local time',
  heroHeadline: 'Real jewelry. Live reveals. Pure sparkle.',
  heroSub:
    "I'm Rep Name. Customers drop in to watch live reveals, browse the trade board, and grab their favorite pieces before the next show starts.",
  announcementText: 'Text club gets first dibs on drops and reminders.',
  announcementItems: [
    'Live tonight · 8pm local time',
    'Use code AMETHYST15',
    'Pre-orders close Friday',
    'Trade board refresh after every reveal',
  ],
  bombPartyLearnMoreUrl: 'https://bombparty.com',
  shopUrl: 'https://bombparty.com',
  joinTeamUrl: '/amethyst/Join.html',
  streamLinks: [
    {
      label: 'Watch on TikTok',
      handle: '@repname',
      href: '#watch-live',
      platform: 'tiktok',
    },
    {
      label: 'Watch on Facebook Live',
      handle: 'Rep Name Live',
      href: '#watch-live',
      platform: 'facebook',
    },
    {
      label: 'Shop Bomb Party',
      handle: 'Official storefront',
      href: 'https://bombparty.com',
      platform: 'shop',
    },
  ],
  liveQueueState: 'live',
  liveQueueLabel: 'Live Reveal Queue',
  liveQueueSummary: 'A reveal is in progress right now. Watch live and keep an eye on the next names in line.',
  liveQueueEntries: [
    { position: '1', label: 'Unboxing Now', customerName: 'Customer A.' },
    { position: '2', label: 'On Deck', customerName: 'Customer B.' },
    { position: '3', label: 'Up Next', customerName: 'Customer C.' },
  ],
  tradeBoardListings: [
    {
      id: 'citrine-sun-pendant',
      title: 'Citrine Sun Pendant',
      collection: 'Velvet Hour',
      description: 'Warm gold tones with a bright center stone and a one-for-one trade request option.',
      tier: 'unicorn',
      msrpLabel: '$148',
      statusLabel: 'Available',
    },
    {
      id: 'rose-quartz-band',
      title: 'Rose Quartz Band',
      collection: 'Estate Halo',
      description: 'Soft pink sparkle with a stackable silhouette customers ask for again and again.',
      tier: 'diamond',
      msrpLabel: '$98',
      statusLabel: 'Reserved',
    },
    {
      id: 'amethyst-halo-ring',
      title: 'Amethyst Halo Ring',
      collection: 'Moonlit Drop',
      description: 'A classic halo profile with a richer purple center stone and crisp silver finish.',
      tier: 'everyday',
      msrpLabel: '$118',
      statusLabel: 'Available',
    },
    {
      id: 'pearl-drop-studs',
      title: 'Pearl Drop Studs',
      collection: 'Holiday Gift Guide',
      description: 'An easy everyday pair with a polished finish that works for gifting and stacking.',
      tier: 'everyday',
      msrpLabel: '$48',
      statusLabel: 'Traded',
    },
  ],
  events: [
    {
      id: 'unicorn-magic-drop',
      title: 'Unicorn Magic Drop',
      dateLabel: 'Tue, Nov 12',
      timeLabel: '8:00 PM local time',
      featured: true,
      featuredCollections: ['Citrine Sun Series', 'November Unicorns', 'Holiday Gift Guide'],
      discounts: [
        { code: 'UNICORN15', description: '15% off unicorn tier boxes' },
        { code: 'FREESHIP75', description: 'Free shipping on orders over $75' },
      ],
      platforms: [
        {
          label: 'Join on TikTok',
          handle: '@repname',
          href: '#watch-live',
          platform: 'tiktok',
        },
        {
          label: 'Watch on Facebook',
          handle: 'Rep Name Live',
          href: '#watch-live',
          platform: 'facebook',
        },
      ],
    },
    {
      id: 'saturday-sparkle-brunch',
      title: 'Saturday Sparkle Brunch',
      dateLabel: 'Sat, Nov 16',
      timeLabel: '1:00 PM local time',
      featured: false,
      featuredCollections: ['Diamond Territory', 'Giftable Favorites'],
      discounts: [
        { code: 'BRUNCH10', description: '10% off Saturday show purchases' },
        { code: 'NEWBIE10', description: '10% off a first order' },
      ],
      platforms: [
        {
          label: 'Join on TikTok',
          handle: '@repname',
          href: '#watch-live',
          platform: 'tiktok',
        },
      ],
    },
  ],
  whatIsBombPartyTitle: 'What is Bomb Party?',
  whatIsBombPartyBody:
    'Customers order a sealed jewelry box, then join the live reveal to watch what comes out in real time. Every box includes real jewelry, with rare Diamond Territory and Unicorn Magic pieces mixed into the regular drops.',
  signupEyebrow: 'Stay in the loop',
  signupTitle: 'Never miss a show.',
  signupSub: 'Get a heads-up when Rep Name goes live, plus first looks at new trade board listings and featured collections.',
  signupConsent:
    'Choose SMS, email, or both. Marketing consent stays separate from reminders and updates from Show Name. Message and data rates may apply. Reply STOP to unsubscribe.',
  joinTeamEyebrow: 'Join the team',
  joinTeamTitle: 'Want to do this too?',
  joinTeamSub:
    "Join my team and I'll show you how to build a real Bomb Party business around your own schedule, your own community, and your own sparkle style.",
  footerTagline: 'Live jewelry reveals every week. Real pieces, real community, real sparkle.',
  footerShopLinks: [
    { label: 'Trade Board', href: '#trade-board' },
    { label: 'Watch Live', href: '#watch-live' },
    { label: 'Upcoming Shows', href: '#events' },
    { label: 'Shop Bomb Party', href: 'https://bombparty.com', external: true },
  ],
  footerAboutLinks: [
    { label: 'Home', href: '#top' },
    { label: 'What is Bomb Party?', href: '#bomb-party' },
    { label: 'Join Team', href: '/amethyst/Join.html' },
    { label: 'Sign Up', href: '#signup' },
  ],
  footerColumn: {
    title: 'Hosting Soon',
    links: [
      { label: 'Holiday Gift Guide Night', href: '#events' },
      { label: 'Diamond Territory Saturday', href: '#events' },
      { label: 'Year-End Sparkle Party', href: '#events' },
    ],
  },
  socialLinks: [
    { label: 'TikTok', shortLabel: 'TT', href: '#watch-live' },
    { label: 'Facebook', shortLabel: 'FB', href: '#watch-live' },
    { label: 'Instagram', shortLabel: 'IG', href: '#watch-live' },
    { label: 'YouTube', shortLabel: 'YT', href: '#watch-live' },
  ],
  legalDisclaimer:
    'Show Name is operated by an independent Bomb Party Representative. Bomb Party and related marks belong to Bomb Party LLC. Trade board listings, show schedules, and rep communications are managed by the individual rep.',
  navLinks: [
    { label: 'Home', href: '#top' },
    { label: 'Trade Board', href: '#trade-board' },
    { label: 'Join Team', href: '#join-team' },
    {
      label: 'Learn about Bomb Party',
      href: 'https://bombparty.com',
      external: true,
    },
  ],
}

export function makeAmethystSiteContent(
  overrides: Partial<AmethystSiteContent> = {},
): AmethystSiteContent {
  const repName = overrides.repName ?? defaultAmethystSiteContent.repName
  const businessName =
    overrides.businessName ?? defaultAmethystSiteContent.businessName

  return {
    ...defaultAmethystSiteContent,
    heroSub:
      overrides.heroSub ??
      `I'm ${repName}. Customers drop in to watch live reveals, browse the trade board, and grab their favorite pieces before the next show starts.`,
    signupSub:
      overrides.signupSub ??
      `Get a heads-up when ${repName} goes live, plus first looks at new trade board listings and featured collections.`,
    signupConsent:
      overrides.signupConsent ??
      `Choose SMS, email, or both. Marketing consent stays separate from reminders and updates from ${businessName}. Message and data rates may apply. Reply STOP to unsubscribe.`,
    legalDisclaimer:
      overrides.legalDisclaimer ??
      `${businessName} is operated by an independent Bomb Party Representative. Bomb Party and related marks belong to Bomb Party LLC. Trade board listings, show schedules, and rep communications are managed by the individual rep.`,
    ...overrides,
  }
}
