import type { AmethystHomepageTemplateData } from '@/lib/amethyst/homepage-template-data'
import type { AmethystJoinTemplateData } from '@/lib/amethyst/join-template-data'
import type { AmethystTradeTemplateData } from '@/lib/amethyst/trade-template-data'
import type { SiteSettingsDashboardResult } from '@/lib/services/types'

export const MILE_HIGH_FIZZ_PROFILE = {
  email: 'lindseychapman1188@gmail.com',
  displayName: 'Lindsey Chapman',
  publicName: 'Lindsey',
  businessName: 'Mile High Fizz',
  teamName: 'Diamond Peak Society',
  uplineTeamName: 'The Virtuous Fizzers',
  publicSiteSlug: 'milehighfizz',
  futureCustomDomain: 'milehighfizz.com',
  timeZone: 'America/Denver',
  heroVideoUrl: '/mile-high-fizz/hero.mp4',
  shopUrl: 'https://bombparty.com/Lindseychapman/products',
  joinPackUrl: 'https://bombparty.com/lindseychapman/packs',
  tiktokUrl: 'https://www.tiktok.com/@lindze1188',
  watchUrl:
    'https://www.tiktok.com/@lindze1188?is_from_webapp=1&sender_device=pc',
  tiktokHandle: '@lindze1188',
  sourceSite: 'https://milehighfizz.com/',
  announcementText:
    'Introducing the Sterling Club & 12k Gold Vermeil Collection - our most luxurious reveals ever.',
  promoTickerText:
    '10TH ANNIVERSARY SPECIAL: EVERY $599 LAUNCH PACK NOW INCLUDES A GUARANTEED DIAMOND REVEAL! - JOIN THE DIAMOND PEAK SOCIETY TODAY - START YOUR CLIMB WITH LINDSEY! - MSRP UP TO $3,500 - OFFER ENDS DEC 31, 2026!',
} as const

export function isMileHighFizzSettings(settings: SiteSettingsDashboardResult) {
  const email = settings.email.trim().toLowerCase()
  const businessName = settings.businessName.trim().toLowerCase()
  const teamName = settings.teamName.trim().toLowerCase()

  return (
    email === MILE_HIGH_FIZZ_PROFILE.email ||
    businessName === 'mile high fizz' ||
    teamName === 'mile high fizz'
  )
}

export function applyMileHighFizzHomepage(
  homepage: AmethystHomepageTemplateData,
): AmethystHomepageTemplateData {
  const hasCustomTagline =
    homepage.tagline.trim() &&
    homepage.tagline.trim() !== 'Revealing something magical together.'
  const hasCustomAboutHeadline =
    homepage.aboutHeadline.trim() &&
    !/^meet .+ and the story behind .+\.$/i.test(homepage.aboutHeadline.trim())
  const hasConfiguredAboutNarrative = !homepage.aboutParagraphs.some((paragraph) =>
    /share how you got started|nic-nac can rewrite this|add a final paragraph/i.test(
      paragraph,
    ),
  )

  return {
    ...homepage,
    publicSiteVariant: 'mile_high_fizz_hybrid',
    heroEyebrow: 'With Lindsey',
    heroHeadline: homepage.heroHeadlineOverride || 'Mile High Fizz',
    // Preserve Lindsey's migrated line today, but let a later Site Settings
    // tagline become the public hero line instead of being hidden by the
    // bespoke skin.
    heroSub: hasCustomTagline
      ? homepage.tagline
      : 'Revealing something magical together. Place your order and return to the live party to watch your reveal.',
    heroVideoUrl: MILE_HIGH_FIZZ_PROFILE.heroVideoUrl,
    announcementText: MILE_HIGH_FIZZ_PROFILE.announcementText,
    announcementLinkLabel: 'Learn More',
    announcementHref: '#about',
    promoTickerText: MILE_HIGH_FIZZ_PROFILE.promoTickerText,
    aboutHeadline: hasCustomAboutHeadline
      ? homepage.aboutHeadline
      : 'What is a Bomb Party?',
    aboutParagraphs: hasConfiguredAboutNarrative
      ? homepage.aboutParagraphs
      : [
          'Experience the thrilling, must-watch excitement of a Bomb Party jewelry reveal. Submit your order and watch live as Lindsey fizzes, opens, and reveals your beautiful, unique piece of handcrafted jewelry.',
          'Join the live party to share in the fun of discovering your next favorite pieces, then keep an eye on the Sparkle Suite Dance Floor when a reveal is not quite your style.',
          'Order your jewelry, watch Lindsey live on TikTok, and receive your handcrafted jewelry shipped directly to you, ready to enjoy.',
        ],
    signupTitle: 'Never Miss a Show!',
    signupSub:
      'Get email updates now and be first in line when SMS show reminders launch.',
    signupConsent:
      'We respect your privacy. No spam, ever. Unsubscribe anytime. By adding your number you agree to receive SMS notifications when available.',
    joinTeamTitle: 'Join the Mile High Fizz Team',
    joinTeamSub:
      'Turn your passion into profit with the support and energy of the Mile High Fizz family.',
    joinTeamUrl: '/amethyst/Join.html',
    footerTagline: hasCustomTagline
      ? homepage.footerTagline
      : `Lindsey is part of ${MILE_HIGH_FIZZ_PROFILE.uplineTeamName}. Join her Diamond Peak Society team for real-time reveals and sparkling jewelry.`,
    showcaseVideoCaption: '@lindze1188 on TikTok',
    // A rep's Site Settings video is the public-site source of truth. The
    // profile link is only a fallback for the legacy site configuration.
    showcaseVideoUrl:
      homepage.showcaseVideoUrl.trim() && homepage.showcaseVideoUrl !== '#'
        ? homepage.showcaseVideoUrl
        : MILE_HIGH_FIZZ_PROFILE.tiktokUrl,
    showJoinPage: homepage.showJoinPage,
    streamLinks: {
      ...homepage.streamLinks,
      shop: MILE_HIGH_FIZZ_PROFILE.shopUrl,
    },
    socialLinks: homepage.socialLinks,
    footerLinks: {
      ...homepage.footerLinks,
      home: '/amethyst/Homepage.html',
      tradeBoard: '/amethyst/Trade.html',
      joinTeam: homepage.footerLinks.joinTeam,
      catalog: MILE_HIGH_FIZZ_PROFILE.shopUrl,
      preOrders: MILE_HIGH_FIZZ_PROFILE.shopUrl,
      pastShows: '#events',
      faq: '#signup',
      contact: '#signup',
    },
  }
}

export function applyMileHighFizzTrade(
  trade: AmethystTradeTemplateData,
): AmethystTradeTemplateData {
  return {
    ...trade,
    publicSiteVariant: 'mile_high_fizz_hybrid',
    tradeHeroTitle: `${trade.businessName} Dance Floor`,
    tradeHeroSub:
      `Browse ${trade.repName}'s available trade pieces and request an item-for-item swap from a live reveal.`,
    footerTagline:
      `Real-time reveals, sparkling jewelry, and rep-reviewed trades with ${trade.businessName}.`,
    footerLinks: {
      ...trade.footerLinks,
      home: '/amethyst/Homepage.html',
      tradeBoard: '/amethyst/Trade.html',
      joinTeam: trade.footerLinks.joinTeam,
      catalog: trade.shopUrl,
      preOrders: trade.shopUrl,
      pastShows: '/amethyst/Homepage.html#events',
      faq: '#faq',
      contact: '#faq',
    },
  }
}

export function applyMileHighFizzJoin(
  join: AmethystJoinTemplateData,
): AmethystJoinTemplateData {
  return {
    ...join,
    publicSiteVariant: 'mile_high_fizz_hybrid',
    repCity: 'Littleton',
    repState: 'Colorado',
    heroTitle: `Welcome to the ${join.teamName}`,
    promoText:
      '$599 Launch Pack includes a guaranteed Diamond reveal for the 10th Anniversary Special.',
    heroPitch:
      `Turn Your Passion into Profit. Be part of something special. Build your own Bomb Party business with the support and energy of the ${join.teamName}. For a limited time, start with a Diamond reveal in your launch pack.`,
    heroCtaText: 'Join the Team Now',
    finalPitch:
      `Join the ${join.teamName} today and turn your passion for jewelry into a thriving business.`,
    bpReferralUrl: MILE_HIGH_FIZZ_PROFILE.joinPackUrl,
    tickerTopText:
      `Join the ${join.teamName} | Supportive community | Flexible income | Training and mentorship | Work from anywhere`,
    footerTagline:
      `Build your own Bomb Party business with the support and energy of the ${join.teamName}.`,
    repSocialLinks: {
      ...join.repSocialLinks,
    },
    socialLinks: join.socialLinks,
    footerLinks: {
      ...join.footerLinks,
      home: '/amethyst/Homepage.html',
      tradeBoard: '/amethyst/Trade.html',
      joinTeam: join.footerLinks.joinTeam,
      catalog: join.shopUrl,
      preOrders: join.shopUrl,
      pastShows: '/amethyst/Homepage.html#events',
      faq: '#why',
      contact: join.repSocialLinks.tiktok || MILE_HIGH_FIZZ_PROFILE.tiktokUrl,
    },
    footerColumn: {
      title: '',
      links: [],
    },
    teamMembers: [],
    faqAnswers: {
      whatIsTeam:
        `${join.teamName} is the community of independent Bomb Party Representatives led by ${join.repName} under the ${join.businessName} banner. ${join.repName} is part of The Virtuous Fizzers, and ${join.teamName} is the team they lead. Supportive Community: join a team that celebrates your wins, supports your growth, and makes every day fun.`,
      cost:
        'Starter pack details and current promotions are handled by Bomb Party. Use the join button to review the current options.',
      experience:
        'No experience required. Mile High Fizz focuses on training, mentorship, and practical support as you get started.',
      timeCommitment:
        'Work on your own schedule. Whether you want extra income or a full-time opportunity, you control your success.',
      support:
        'Get all the tools, training, and one-on-one support you need to succeed.',
      income:
        'Income varies by sales, effort, and time. Build your own team, earn bonuses, and unlock rewards as your business grows.',
    },
  }
}
