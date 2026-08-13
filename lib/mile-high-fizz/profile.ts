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
  return {
    ...homepage,
    publicSiteVariant: 'mile_high_fizz_hybrid',
    repName: MILE_HIGH_FIZZ_PROFILE.publicName,
    businessName: MILE_HIGH_FIZZ_PROFILE.businessName,
    teamName: MILE_HIGH_FIZZ_PROFILE.teamName,
    tagline: 'Revealing something magical together.',
    heroEyebrow: 'With Lindsey',
    heroHeadline: 'Mile High Fizz',
    heroSub:
      'Revealing something magical together. Place your order and return to the live party to watch your reveal.',
    heroVideoUrl: MILE_HIGH_FIZZ_PROFILE.heroVideoUrl,
    announcementText: MILE_HIGH_FIZZ_PROFILE.announcementText,
    announcementLinkLabel: 'Learn More',
    announcementHref: '#about',
    promoTickerText: MILE_HIGH_FIZZ_PROFILE.promoTickerText,
    aboutHeadline: 'What is a Bomb Party?',
    aboutParagraphs: [
      'Experience the thrilling, must-watch excitement of a Bomb Party jewelry reveal. Submit your order and watch live as Lindsey fizzes, opens, and reveals your beautiful, unique piece of handcrafted jewelry.',
      'Join the live party to share in the fun of discovering your next favorite pieces, then keep an eye on the Sparkle Suite Trade Board when a reveal is not quite your style.',
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
    footerTagline:
      `Lindsey is part of ${MILE_HIGH_FIZZ_PROFILE.uplineTeamName}. Join her Diamond Peak Society team for real-time reveals and sparkling jewelry.`,
    showcaseVideoCaption: '@lindze1188 on TikTok',
    showcaseVideoUrl: MILE_HIGH_FIZZ_PROFILE.tiktokUrl,
    showJoinPage: true,
    streamLinks: {
      ...homepage.streamLinks,
      shop: MILE_HIGH_FIZZ_PROFILE.shopUrl,
      watch: MILE_HIGH_FIZZ_PROFILE.watchUrl,
      tiktok: MILE_HIGH_FIZZ_PROFILE.tiktokUrl,
    },
    socialLinks: homepage.socialLinks,
    footerLinks: {
      ...homepage.footerLinks,
      home: '/amethyst/Homepage.html',
      tradeBoard: '/amethyst/Trade.html',
      joinTeam: '/amethyst/Join.html',
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
    repName: MILE_HIGH_FIZZ_PROFILE.publicName,
    businessName: MILE_HIGH_FIZZ_PROFILE.businessName,
    tradeHeroTitle: 'Mile High Fizz Trade Board',
    tradeHeroSub:
      "Browse Lindsey's available trade pieces and request an item-for-item swap from a live reveal.",
    footerTagline:
      'Real-time reveals, sparkling jewelry, and rep-reviewed trades with Mile High Fizz.',
    footerLinks: {
      ...trade.footerLinks,
      home: '/amethyst/Homepage.html',
      tradeBoard: '/amethyst/Trade.html',
      joinTeam: '/amethyst/Join.html',
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
    repName: MILE_HIGH_FIZZ_PROFILE.publicName,
    repCity: 'Littleton',
    repState: 'Colorado',
    businessName: MILE_HIGH_FIZZ_PROFILE.businessName,
    teamName: MILE_HIGH_FIZZ_PROFILE.teamName,
    heroTitle: 'Welcome to the Diamond Peak Society',
    promoText:
      '$599 Launch Pack includes a guaranteed Diamond reveal for the 10th Anniversary Special.',
    heroPitch:
      'Turn Your Passion into Profit. Be part of something special. Build your own Bomb Party business with the support and energy of the Diamond Peak Society. For a limited time, start with a Diamond reveal in your launch pack.',
    heroCtaText: 'Join the Team Now',
    finalPitch:
      'Join the Diamond Peak Society today and turn your passion for jewelry into a thriving business.',
    bpReferralUrl: MILE_HIGH_FIZZ_PROFILE.joinPackUrl,
    tickerTopText:
      'Join the Diamond Peak Society | Supportive community | Flexible income | Training and mentorship | Work from anywhere',
    footerTagline:
      'Build your own Bomb Party business with the support and energy of the Diamond Peak Society.',
    repSocialLinks: {
      ...join.repSocialLinks,
      tiktok: MILE_HIGH_FIZZ_PROFILE.tiktokUrl,
    },
    socialLinks: join.socialLinks,
    footerLinks: {
      ...join.footerLinks,
      home: '/amethyst/Homepage.html',
      tradeBoard: '/amethyst/Trade.html',
      joinTeam: '/amethyst/Join.html',
      catalog: join.shopUrl,
      preOrders: join.shopUrl,
      pastShows: '/amethyst/Homepage.html#events',
      faq: '#why',
      contact: MILE_HIGH_FIZZ_PROFILE.tiktokUrl,
    },
    footerColumn: {
      title: '',
      links: [],
    },
    teamMembers: [],
    faqAnswers: {
      whatIsTeam:
        'The Diamond Peak Society is the community of independent Bomb Party Representatives led by Lindsey under the Mile High Fizz banner. Lindsey is part of The Virtuous Fizzers, and Diamond Peak Society is the team she leads. Supportive Community: join a team that celebrates your wins, supports your growth, and makes every day fun.',
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
