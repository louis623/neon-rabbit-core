import {
  defaultAmethystTradeBoardListings,
  type AmethystTradeBoardListing,
} from './trade-board-listings'
import {
  applyAmethystAppearancePreset,
  type AmethystAppearancePresetId,
} from './appearance-presets'

export interface AmethystTradeSocialLink {
  label: string
  shortLabel: string
  href: string
}

export interface AmethystTradeFooterLink {
  label: string
  href: string
}

export interface AmethystTradeTemplateData {
  repName: string
  businessName: string
  tradeHeroTitle: string
  tradeHeroSub: string
  tickerTopText: string
  shopUrl: string
  footerTagline: string
  legalDisclaimer: string
  tradeRules: [string, string, string, string]
  faqAnswers: {
    howTradeWorks: string
    cashDifference: string
    tradeCredit: string
    matchingRules: string
    msrp: string
    rarePieces: string
    responseTime: string
  }
  socialLinks: [
    AmethystTradeSocialLink,
    AmethystTradeSocialLink,
    AmethystTradeSocialLink,
    AmethystTradeSocialLink,
  ]
  footerLinks: {
    home: string
    tradeBoard: string
    joinTeam: string
    catalog: string
    preOrders: string
    pastShows: string
    faq: string
    privacy: string
    terms: string
    accessibility: string
  }
  footerColumn: {
    title: string
    links: [AmethystTradeFooterLink, AmethystTradeFooterLink, AmethystTradeFooterLink]
  }
}

export interface AmethystTradeTweakDefaults {
  repName: string
  businessName: string
  liveState: string
  contentState: string
  cardCount: number
  cardAspect: string
  tierVisibility: string
  filterStyle: string
  demoSheet: string
  showTicker: boolean
  showHero: boolean
  showFaq: boolean
  showLegal: boolean
  showFooter: boolean
  showNicNac: boolean
  tickerTopText: string
  tradeHeroTitle: string
  tradeHeroSub: string
  primaryColor: string
  accentColor: string
  bgTone: string
  headingFont: string
  headingWeight: number
  shapeRadius: string
  density: string
  saturation: number
  preset: string
  sparkleLevel: string
  bgTreatment: string
  cardSurface: string
  textureOverlay: string
  buttonEnergy: string
  ctaEmphasis: string
  tradeFlair: string
  cursorEffect: string
  tickerSpeed: number
  showSlots: boolean
}

export const defaultAmethystTradeTemplateData: AmethystTradeTemplateData = {
  repName: 'Rep Name',
  businessName: 'Show Name',
  tradeHeroTitle: 'Trade for the piece you wanted to love.',
  tradeHeroSub:
    'This board is for item-for-item swaps only. Requests must stay within the same collection and the same jewelry type, with no pay-the-difference and no credit payouts.',
  tickerTopText:
    'Trade board open now | Item-for-item only | Same collection + same jewelry type | Birthday pieces can trade across months',
  shopUrl: 'https://bombparty.com',
  footerTagline:
    'Live jewelry reveals every Tuesday at 8pm CST. Real pieces, real sparkle.',
  legalDisclaimer:
    'Show Name is operated by an independent Bomb Party Representative. Bomb Party is a registered trademark of Bomb Party LLC. This trade board is not endorsed by, directly affiliated with, maintained, authorized, or sponsored by Bomb Party LLC. Trades are private agreements between the customer and the rep. MSRP is shown for reference only and is not the basis for trade matching.',
  tradeRules: [
    'Item-for-item only.',
    'No pay-the-difference requests.',
    'No trade credit for lower-priced pieces.',
    'Trades must stay within the same collection and the same jewelry type.',
  ],
  faqAnswers: {
    howTradeWorks:
      "When you do not love your reveal, you can request a piece from the board. The rep reviews the match after the show and, if approved, swaps your revealed piece for the board piece one-for-one.",
    cashDifference:
      'No. Customers cannot add money to trade into a more expensive piece on this board.',
    tradeCredit:
      'No. If the board piece has a lower Bomb Party MSRP, there is still no credit or payout attached to the trade.',
    matchingRules:
      'Trades need to stay within the same collection and the same jewelry type. OG trades for OG, Birthday trades for Birthday, and earrings trade for earrings, necklaces for necklaces, pendants for pendants, bracelets for bracelets, and stacks for stacks.',
    msrp:
      'Bomb Party MSRP is shown as a reference detail only. It is not the basis for deciding whether a trade is allowed or even.',
    rarePieces:
      'Diamonds and unicorns are still allowed on the board, but they are expected to be rare edge-case listings rather than the default inventory mix.',
    responseTime:
      'Most reps review trade requests after the live show ends and follow up directly with the customer.',
  },
  socialLinks: [
    { label: 'TikTok', shortLabel: 'TT', href: '#' },
    { label: 'Facebook', shortLabel: 'FB', href: '#' },
    { label: 'Instagram', shortLabel: 'IG', href: '#' },
    { label: 'YouTube', shortLabel: 'YT', href: '#' },
  ],
  footerLinks: {
    home: '/amethyst/Homepage.html',
    tradeBoard: '/amethyst/Trade.html',
    joinTeam: '/amethyst/Join.html',
    catalog: 'https://bombparty.com',
    preOrders: 'https://bombparty.com',
    pastShows: '/amethyst/Homepage.html#events',
    faq: '#faq',
    privacy: '#faq',
    terms: '#faq',
    accessibility: '#faq',
  },
  footerColumn: {
    title: 'Trade Notes',
    links: [
      { label: 'Birthday pieces can trade across months', href: '#faq' },
      { label: 'Diamonds and unicorns are rare', href: '#faq' },
      { label: 'All trades are rep reviewed', href: '#faq' },
    ],
  },
}

const lockedTweakDefaults: Omit<
  AmethystTradeTweakDefaults,
  | 'repName'
  | 'businessName'
  | 'tickerTopText'
  | 'tradeHeroTitle'
  | 'tradeHeroSub'
> = {
  liveState: 'live',
  contentState: 'populated',
  cardCount: 30,
  cardAspect: 'square',
  tierVisibility: 'rare',
  filterStyle: 'dropdowns',
  demoSheet: 'closed',
  showTicker: true,
  showHero: true,
  showFaq: true,
  showLegal: true,
  showFooter: true,
  showNicNac: true,
  primaryColor: '#5C0EFF',
  accentColor: '#FF1AC2',
  bgTone: 'lavender',
  headingFont: 'italiana',
  headingWeight: 600,
  shapeRadius: 'soft',
  density: 'regular',
  saturation: 90,
  preset: 'sparkleParty',
  sparkleLevel: 'glittery',
  bgTreatment: 'confetti',
  cardSurface: 'holographic',
  textureOverlay: 'sparkle',
  buttonEnergy: 'calm',
  ctaEmphasis: 'standard',
  tradeFlair: 'holo-unicorn',
  cursorEffect: 'sparkle',
  tickerSpeed: 0.6,
  showSlots: false,
}

export function buildAmethystTradeTweakDefaults(
  data: AmethystTradeTemplateData,
  appearancePreset?: AmethystAppearancePresetId | string | null,
): AmethystTradeTweakDefaults {
  return applyAmethystAppearancePreset({
    repName: data.repName,
    businessName: data.businessName,
    tickerTopText: data.tickerTopText,
    tradeHeroTitle: data.tradeHeroTitle,
    tradeHeroSub: data.tradeHeroSub,
    ...lockedTweakDefaults,
  }, appearancePreset)
}

function safeScriptJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export function buildAmethystTradeBootstrapScript(
  data: AmethystTradeTemplateData = defaultAmethystTradeTemplateData,
  listings: AmethystTradeBoardListing[] = defaultAmethystTradeBoardListings,
  appearancePreset?: AmethystAppearancePresetId | string | null,
) {
  const defaults = buildAmethystTradeTweakDefaults(data, appearancePreset)

  return [
    `window.AMETHYST_TRADE_TEMPLATE_DATA = ${safeScriptJson(data)};`,
    `window.TRADE_TWEAK_DEFAULTS = ${safeScriptJson(defaults)};`,
    `window.AMETHYST_TRADE_BOARD_LISTINGS = ${safeScriptJson(listings)};`,
  ].join('\n')
}
