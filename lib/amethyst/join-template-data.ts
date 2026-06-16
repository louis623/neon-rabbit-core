import {
  applyAmethystAppearancePreset,
  type AmethystAppearancePresetId,
} from './appearance-presets'
import { getPublicRepName, redactPublicRepFullName } from './public-rep-name'

export interface AmethystJoinSocialLink {
  label: string
  shortLabel: string
  href: string
}

export interface AmethystJoinFooterLink {
  label: string
  href: string
}

export interface AmethystJoinTeamMember {
  name: string
  business: string
  state: string
  initials?: string
  socialLinks: {
    tiktok?: string
    website?: string
    youtube?: string
  }
}

export interface AmethystRuntimeContext {
  targeted: boolean
  repId?: string | null
  publicSiteSlug?: string | null
}

export interface AmethystJoinTemplateData {
  repName: string
  repCity: string
  repState: string
  businessName: string
  teamName: string
  promoText: string
  heroPitch: string
  heroCtaText: string
  finalPitch: string
  bpReferralUrl: string
  bpIncomeDisclosureUrl: string
  tickerTopText: string
  shopUrl: string
  bombPartyFaqUrl: string
  footerTagline: string
  legalDisclaimer: string
  repSocialLinks: {
    tiktok?: string
    website?: string
    youtube?: string
  }
  socialLinks: [
    AmethystJoinSocialLink,
    AmethystJoinSocialLink,
    AmethystJoinSocialLink,
    AmethystJoinSocialLink,
  ]
  footerLinks: {
    tradeBoard: string
    catalog: string
    preOrders: string
    pastShows: string
    home: string
    joinTeam: string
    faq: string
    contact: string
    privacy: string
    terms: string
    accessibility: string
  }
  footerColumn: {
    title: string
    links: AmethystJoinFooterLink[]
  }
  teamMembers: AmethystJoinTeamMember[]
  faqAnswers: {
    whatIsTeam: string
    cost: string
    experience: string
    timeCommitment: string
    support: string
    income: string
  }
}

export interface AmethystJoinTweakDefaults {
  teamName: string
  repName: string
  repCity: string
  repState: string
  businessName: string
  teamMemberCount: number
  showPromo: boolean
  promoText: string
  heroPitch: string
  heroCtaText: string
  finalPitch: string
  bpReferralUrl: string
  showTicker: boolean
  showHero: boolean
  showTeam: boolean
  showWhy: boolean
  showFaq: boolean
  showFinalCta: boolean
  showFooter: boolean
  showNicNac: boolean
  tickerTopText: string
  primaryColor: string
  accentColor: string
  bgTone: string
  headingFont: string
  bodyFont: string
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

export const defaultAmethystJoinTemplateData: AmethystJoinTemplateData = {
  repName: 'Sasha',
  repCity: 'Austin',
  repState: 'Texas',
  businessName: 'Sparkle by Sasha',
  teamName: 'Sparkle by Sasha',
  promoText:
    'November Promo: New reps get a guaranteed Diamond in their first launch pack.',
  heroPitch:
    "Join a crew of independent reps building real businesses on their own terms. We do live jewelry reveals, support each other through it, and yes, we have a lot of fun. There's a spot waiting for you.",
  heroCtaText: 'See starter packs',
  finalPitch:
    "Pick your starter pack, follow the steps on Bomb Party, and you're in. We'll set up your onboarding call within 24 hours.",
  bpReferralUrl: 'https://bombparty.com/?ref=sparklebysasha',
  bpIncomeDisclosureUrl:
    'https://bombpartyassets.blob.core.windows.net/exigoresourcelibraryassets/Rep%20Use%20Documents/Bomb%20Party_Income%20Disclosure%20Statement_2025%20%281%29.pdf',
  tickerTopText:
    'Live tonight · 8pm CST | Use code AMETHYST15 | Pre-orders close Friday | New Unicorn drops Tuesday',
  shopUrl: 'https://bombparty.com/?ref=sparklebysasha',
  bombPartyFaqUrl: 'https://bombparty.com',
  footerTagline:
    'Live jewelry reveals every Tuesday at 8pm CST. Real pieces, real sparkle.',
  legalDisclaimer:
    'Sparkle by Sasha is operated by an independent Bomb Party Representative. Bomb Party is a registered trademark of Bomb Party LLC. This site is not endorsed by, directly affiliated with, maintained, authorized, or sponsored by Bomb Party LLC. Any agreements formed between site visitors and the rep are solely between those parties, not Bomb Party LLC and not the platform.',
  repSocialLinks: {
    tiktok: 'https://www.tiktok.com',
    website: 'https://bombparty.com/?ref=sparklebysasha',
    youtube: 'https://www.youtube.com',
  },
  socialLinks: [
    { label: 'TikTok', shortLabel: 'TT', href: 'https://www.tiktok.com' },
    { label: 'Facebook', shortLabel: 'FB', href: 'https://www.facebook.com' },
    { label: 'Instagram', shortLabel: 'IG', href: 'https://www.instagram.com' },
    { label: 'YouTube', shortLabel: 'YT', href: 'https://www.youtube.com' },
  ],
  footerLinks: {
    tradeBoard: '/amethyst/Trade.html',
    catalog: 'https://bombparty.com/?ref=sparklebysasha',
    preOrders: 'https://bombparty.com/?ref=sparklebysasha',
    pastShows: '#top',
    home: '/amethyst/Homepage.html',
    joinTeam: '/amethyst/Join.html',
    faq: '#faq',
    contact: 'mailto:hello@sparklebysasha.example',
    privacy: '#faq',
    terms: '#faq',
    accessibility: '#faq',
  },
  footerColumn: {
    title: '',
    links: [],
  },
  teamMembers: [
    {
      name: 'Lindsey',
      business: 'Virtuous Sisters',
      state: 'Texas',
      initials: 'L',
      socialLinks: {
        tiktok: 'https://www.tiktok.com',
        website: 'https://bombparty.com/?ref=sparklebysasha',
      },
    },
    {
      name: 'Mira',
      business: "Mira's Magic Box",
      state: 'Georgia',
      initials: 'M',
      socialLinks: {
        tiktok: 'https://www.tiktok.com',
        youtube: 'https://www.youtube.com',
      },
    },
    {
      name: 'Cassidy',
      business: 'Cassidy Sparkle',
      state: 'Florida',
      initials: 'C',
      socialLinks: {
        tiktok: 'https://www.tiktok.com',
        website: 'https://bombparty.com/?ref=sparklebysasha',
      },
    },
    {
      name: 'Rae',
      business: 'Rae of Sunshine',
      state: 'Arizona',
      initials: 'R',
      socialLinks: {
        tiktok: 'https://www.tiktok.com',
      },
    },
    {
      name: 'Tasha',
      business: "Tasha's Treasure",
      state: 'Ohio',
      initials: 'T',
      socialLinks: {
        tiktok: 'https://www.tiktok.com',
        website: 'https://bombparty.com/?ref=sparklebysasha',
        youtube: 'https://www.youtube.com',
      },
    },
    {
      name: 'Joelle',
      business: 'Joelle Glows',
      state: 'California',
      initials: 'J',
      socialLinks: {
        tiktok: 'https://www.tiktok.com',
      },
    },
  ],
  faqAnswers: {
    whatIsTeam:
      "Sparkle by Sasha is a tight-knit team of independent Bomb Party reps led by Sasha. We're a group of women running our own businesses on our own terms, sharing what works, cheering each other on, and having a ridiculous amount of fun doing live jewelry reveals.",
    cost:
      "Bomb Party starter packs typically run $169-$249 and include sample jewelry boxes plus business tools to get you started. The exact options change with current promotions, so tap the join button and you'll see the latest packs available.",
    experience:
      "Not at all. Most of us started with zero sales experience. If you can talk to your phone and have fun on camera, you can do this. We'll walk you through the rest.",
    timeCommitment:
      "Totally up to you. Some reps go live a few times a month for fun money, others run multiple shows a week as their full-time gig. There's no minimum, just whatever fits your life.",
    support:
      "Personalized 1:1 onboarding, our private team chat for daily questions, weekly group coaching calls, plus all the Bomb Party corporate training and tools. You're never figuring this out alone.",
    income:
      "Yes, and it varies a lot. Income depends on the shows you put in, the customers you build, and how you grow. We'll be honest with you about realistic expectations and show you how to set goals that fit your life.",
  },
}

const lockedTweakDefaults: Omit<
  AmethystJoinTweakDefaults,
  | 'teamName'
  | 'repName'
  | 'repCity'
  | 'repState'
  | 'businessName'
  | 'teamMemberCount'
  | 'promoText'
  | 'heroPitch'
  | 'heroCtaText'
  | 'finalPitch'
  | 'bpReferralUrl'
  | 'tickerTopText'
> = {
  showPromo: true,
  showTicker: true,
  showHero: true,
  showTeam: true,
  showWhy: true,
  showFaq: true,
  showFinalCta: true,
  showFooter: true,
  showNicNac: true,
  primaryColor: '#480DDF',
  accentColor: '#D209E3',
  bgTone: 'lavender',
  headingFont: 'italiana',
  bodyFont: 'inter',
  headingWeight: 600,
  shapeRadius: 'soft',
  density: 'compact',
  saturation: 110,
  preset: 'amethyst',
  sparkleLevel: 'glittery',
  bgTreatment: 'mesh',
  cardSurface: 'holographic',
  textureOverlay: 'sparkle',
  buttonEnergy: 'calm',
  ctaEmphasis: 'pulse',
  tradeFlair: 'tier-glow',
  cursorEffect: 'default',
  tickerSpeed: 0.6,
  showSlots: false,
}

export function buildAmethystJoinTweakDefaults(
  data: AmethystJoinTemplateData,
  appearancePreset?: AmethystAppearancePresetId | string | null,
): AmethystJoinTweakDefaults {
  return applyAmethystAppearancePreset({
    teamName: data.teamName,
    repName: getPublicRepName(data.repName),
    repCity: data.repCity,
    repState: data.repState,
    businessName: data.businessName,
    teamMemberCount: data.teamMembers.length,
    promoText: data.promoText,
    heroPitch: redactPublicRepFullName(data.heroPitch, data.repName),
    heroCtaText: data.heroCtaText,
    finalPitch: redactPublicRepFullName(data.finalPitch, data.repName),
    bpReferralUrl: data.bpReferralUrl,
    tickerTopText: data.tickerTopText,
    ...lockedTweakDefaults,
  }, appearancePreset)
}

function safeScriptJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

function buildPublicRuntimeContext(runtimeContext: AmethystRuntimeContext) {
  const repId = runtimeContext.repId?.trim()
  const publicSiteSlug = runtimeContext.publicSiteSlug?.trim().toLowerCase()

  return {
    targeted: Boolean(runtimeContext.targeted),
    ...(repId ? { repId } : {}),
    ...(publicSiteSlug ? { publicSiteSlug } : {}),
  }
}

export function buildAmethystJoinBootstrapScript(
  data: AmethystJoinTemplateData = defaultAmethystJoinTemplateData,
  appearancePreset?: AmethystAppearancePresetId | string | null,
  runtimeContext: AmethystRuntimeContext = { targeted: false },
) {
  const publicRuntimeContext = buildPublicRuntimeContext(runtimeContext)
  const targeted = publicRuntimeContext.targeted
  const publicData: AmethystJoinTemplateData = {
    ...data,
    repName: getPublicRepName(data.repName),
    heroPitch: redactPublicRepFullName(data.heroPitch, data.repName),
    finalPitch: redactPublicRepFullName(data.finalPitch, data.repName),
    faqAnswers: {
      ...data.faqAnswers,
      whatIsTeam: redactPublicRepFullName(data.faqAnswers.whatIsTeam, data.repName),
      experience: redactPublicRepFullName(data.faqAnswers.experience, data.repName),
      timeCommitment: redactPublicRepFullName(
        data.faqAnswers.timeCommitment,
        data.repName,
      ),
      support: redactPublicRepFullName(data.faqAnswers.support, data.repName),
      income: redactPublicRepFullName(data.faqAnswers.income, data.repName),
    },
  }
  const defaults = {
    ...buildAmethystJoinTweakDefaults(publicData, appearancePreset),
    ...(targeted
      ? {
          showTeam: publicData.teamMembers.length > 0,
          teamMemberCount: publicData.teamMembers.length,
          showPromo: Boolean(publicData.promoText),
        }
      : {}),
  }

  return [
    `window.AMETHYST_RUNTIME_CONTEXT = ${safeScriptJson(publicRuntimeContext)};`,
    `window.AMETHYST_JOIN_TEMPLATE_DATA = ${safeScriptJson(publicData)};`,
    `window.JOIN_TWEAK_DEFAULTS = ${safeScriptJson(defaults)};`,
  ].join('\n')
}
