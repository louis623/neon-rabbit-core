import type { AmethystHomepageTemplateData } from '@/lib/amethyst/homepage-template-data'
import type {
  AmethystJoinTeamMember,
  AmethystJoinTemplateData,
} from '@/lib/amethyst/join-template-data'
import type { AmethystTradeTemplateData } from '@/lib/amethyst/trade-template-data'
import type { SiteSettingsDashboardResult } from '@/lib/services/types'

export const BRITT_WITH_BLING_PROFILE = {
  email: '',
  displayName: 'Brittany',
  publicName: 'Brittany',
  businessName: 'Britt with Bling',
  teamName: 'The Virtuous Fizzers',
  publicSiteSlug: 'brittwithbling',
  futureCustomDomain: 'brittwithbling.com',
  sourceSite: 'https://brittwithbling.com/',
  shopUrl: 'https://bombparty.com/brittwithbling/parties',
  joinPackUrl: 'https://bombparty.com/brittwithbling/packs',
  tiktokUrl: 'https://www.tiktok.com/@brittwithbling',
  tiktokHandle: '@brittwithbling',
  facebookVipUrl: 'https://www.facebook.com/groups/390848873287947',
  heroImageUrl:
    'https://static.readdy.ai/image/6521ef01a44cd5c540b1d9b66db907e8/76f968c944f6b1dd16c30e418f371af6.jpeg',
  joinHeroImageUrl:
    'https://readdy.ai/api/search-image?query=Cinematic%20macro%20photography%20of%20luxury%20jewelry%20reveals%20with%20gold%20sparkles%2C%20pink%20glitter%2C%20cyan%20neon%20accents%2C%20black%20velvet%20background%2C%20premium%20Bomb%20Party%20aesthetic%2C%20dramatic%20lighting%2C%20bokeh%2C%20celebration%20energy&width=1920&height=1080&seq=promo-hero-glitter-001&orientation=landscape',
  announcementText:
    'Sterling Club & 12k Gold Vermeil collections are here - genuine precious metals, elevated designs.',
  promoTickerText:
    '10TH ANNIVERSARY SPECIAL: EVERY $599 LAUNCH PACK NOW INCLUDES A GUARANTEED DIAMOND REVEAL! -- JOIN THE VIRTUOUS FIZZERS TODAY -- START YOUR FIZZ BIZ WITH BRITTANY! -- MSRP UP TO $3,500 -- OFFER ENDS DEC 31, 2026!',
} as const

export const BRITT_WITH_BLING_TEAM_MEMBERS: AmethystJoinTeamMember[] = [
  {
    name: 'Brittany',
    business: 'Britt with Bling',
    state: 'Florida',
    imageUrl:
      'https://static.readdy.ai/image/6521ef01a44cd5c540b1d9b66db907e8/9f36b9d17474d9a7eca3dafdf020cb59.png',
    socialLinks: {
      tiktok: 'https://www.tiktok.com/@brittwithbling',
      website: 'https://bombparty.com/brittwithbling',
      facebook: 'https://www.facebook.com/groups/390848873287947',
    },
  },
  {
    name: 'Rayna',
    business: 'Queen of Blingy Thingz',
    state: 'Florida',
    imageUrl:
      'https://static.readdy.ai/image/6521ef01a44cd5c540b1d9b66db907e8/897137d74c3630eab56408dd32ccca21.png',
    socialLinks: {
      tiktok:
        'https://www.tiktok.com/@queenofblingythingz?is_from_webapp=1&sender_device=pc',
      facebook: 'https://www.facebook.com/share/g/14TcP1vbcq8/?mibextid=wwXIfr',
    },
  },
  {
    name: 'Britt',
    business: 'Sudds & Sparkles',
    state: 'Alabama',
    imageUrl:
      'https://static.readdy.ai/image/6521ef01a44cd5c540b1d9b66db907e8/31610f19f48576052efe55c0538ab303.png',
    socialLinks: {
      tiktok: 'https://www.tiktok.com/@brittsudduth32',
    },
  },
  {
    name: 'Lindsey',
    business: 'Mile High Fizz',
    state: 'Colorado',
    imageUrl:
      'https://static.readdy.ai/image/6521ef01a44cd5c540b1d9b66db907e8/dbb293e6fe52eedfc0fc6c235ca1669a.png',
    socialLinks: {
      tiktok: 'https://www.tiktok.com/@lindze1188',
      website: 'https://milehighfizz.com/',
      facebook: 'https://www.facebook.com/groups/390848873287947',
    },
  },
  {
    name: 'Trish',
    business: 'Fizzn with Mama T',
    state: 'North Carolina',
    imageUrl:
      'https://static.readdy.ai/image/6521ef01a44cd5c540b1d9b66db907e8/2fc71ebb8f20f6b5f9e92069e5f04d08.png',
    socialLinks: {
      tiktok: 'https://www.tiktok.com/@trishander',
      facebook: 'https://www.facebook.com/groups/390848873287947',
    },
  },
  {
    name: 'Veronica',
    business: 'Fizzy Finds with V',
    state: 'Indiana',
    imageUrl:
      'https://static.readdy.ai/image/6521ef01a44cd5c540b1d9b66db907e8/e9fe589658eb02e54e379b7a2b3eb8cd.png',
    socialLinks: {
      tiktok: 'https://www.tiktok.com/@fizzyfindswithv',
      facebook: 'https://www.facebook.com/groups/390848873287947',
    },
  },
  {
    name: 'Kim',
    business: 'Go for the Bling',
    state: 'West Virginia',
    imageUrl:
      'https://static.readdy.ai/image/6521ef01a44cd5c540b1d9b66db907e8/cb21bf9a697fa432623f76f4a7310530.png',
    socialLinks: {
      tiktok: 'https://www.tiktok.com/@goforthebling',
    },
  },
  {
    name: 'Brooke',
    business: 'Bdubbfizz',
    state: 'Alabama',
    imageUrl:
      'https://static.readdy.ai/image/6521ef01a44cd5c540b1d9b66db907e8/40e955faf1a34494eaa9994c9f9b9871.png',
    socialLinks: {
      facebook: 'https://www.facebook.com/groups/390848873287947',
    },
  },
  {
    name: 'Beverly',
    business: 'Bev with Bling',
    state: 'Tennessee',
    imageUrl:
      'https://static.readdy.ai/image/6521ef01a44cd5c540b1d9b66db907e8/263ecf11a702a7374f7d21ec5c8e1bb4.png',
    imageClassName: 'object-left rotate-left',
    socialLinks: {
      tiktok: 'https://www.tiktok.com/@bevwithbling',
      facebook: 'https://www.facebook.com/groups/181XwEFtDQ/',
    },
  },
  {
    name: 'Julie',
    business: 'Jules Fizzin Jewels',
    state: 'Illinois',
    imageUrl:
      'https://static.readdy.ai/image/6521ef01a44cd5c540b1d9b66db907e8/3172f05d39a497ac64bf162e8bd98851.png',
    socialLinks: {
      tiktok: 'https://www.tiktok.com/@julesfizzinjewels',
      facebook: 'https://www.facebook.com/natwithbling.vip?mibextid=LQQJ4d',
    },
  },
  {
    name: 'Natalia',
    business: 'Nat with Blingg',
    state: 'California',
    imageUrl:
      'https://static.readdy.ai/image/6521ef01a44cd5c540b1d9b66db907e8/89b901685cc96319744852ca82597f78.png',
    socialLinks: {
      tiktok: 'https://www.tiktok.com/@natwithblingg',
      facebook: 'https://www.facebook.com/natwithbling.vip?mibextid=LQQJ4d',
    },
  },
  {
    name: 'Karen',
    business: 'The Opal Cowgirl',
    state: 'Oklahoma',
    imageUrl:
      'https://static.readdy.ai/image/6521ef01a44cd5c540b1d9b66db907e8/88d550e5360e9318430035d51d239bdb.png',
    socialLinks: {
      tiktok: 'https://www.tiktok.com/@theopalcowgirl',
    },
  },
  {
    name: 'Angie and Kylee',
    business: 'The Heirloom Duo',
    state: 'Florida',
    imageUrl:
      'https://static.readdy.ai/image/6521ef01a44cd5c540b1d9b66db907e8/cd05da2a34c50f492c39284db428132b.png',
    socialLinks: {
      tiktok: 'https://www.tiktok.com/@the.heirloom.duo',
    },
  },
  {
    name: 'Heather',
    business: 'Curls and Cubes',
    state: 'Florida',
    imageUrl:
      'https://static.readdy.ai/image/6521ef01a44cd5c540b1d9b66db907e8/55282223bbafc472e845bc5c73b18668.png',
    socialLinks: {
      tiktok: 'https://www.tiktok.com/@curlsandcubes',
      facebook: 'https://www.facebook.com/share/g/1Bs28D8d6p/?mibextid=wwXIfr',
    },
  },
  {
    name: 'Kayse',
    business: 'Twenty 2 Lane',
    state: 'Tennessee',
    imageUrl:
      'https://static.readdy.ai/image/6521ef01a44cd5c540b1d9b66db907e8/203ef742f2d137b3850c5f42740f3f9e.png',
    socialLinks: {
      tiktok: 'https://www.tiktok.com/@kayse.twenty2lane',
    },
  },
  {
    name: 'Blake',
    business: 'Blakes_famof6',
    state: 'Alabama',
    imageUrl:
      'https://static.readdy.ai/image/6521ef01a44cd5c540b1d9b66db907e8/1ddeb994ad22fb991bffdb522d510f12.png',
    socialLinks: {
      tiktok:
        'https://www.tiktok.com/@blakes_famof6?is_from_webapp=1&sender_device=pc',
    },
  },
  {
    name: 'Michelle',
    business: 'michelledfizzcity',
    state: 'California',
    imageUrl:
      'https://storage.readdy-site.link/project_files/799b7601-b78c-4873-bc28-e9ba9cd9230e/28655a68-90ea-4192-b863-7d8896c9de06_Michelle-Brit-with-Bling--team-member-.jpg?v=24bfdd7068ae36b228360a72c66c0ef5',
    socialLinks: {
      tiktok: 'https://www.tiktok.com/@michelledfizzcity',
    },
  },
  {
    name: 'Alexandra',
    business: 'Fizzchemy',
    state: 'Ohio',
    imageUrl:
      'https://static.readdy.ai/image/6521ef01a44cd5c540b1d9b66db907e8/c571566a18d676c352ec7fe3755b7bf6.jpeg',
    socialLinks: {
      tiktok: 'https://www.tiktok.com/@fizzchemy?is_from_webapp=1&sender_device=pc',
    },
  },
  {
    name: 'Susan',
    business: 'Gypsy Jewels Boutique',
    state: 'Georgia',
    imageUrl:
      'https://static.readdy.ai/image/6521ef01a44cd5c540b1d9b66db907e8/1e2eec3b324459d867603596ca9ea5be.jpeg',
    imageClassName: 'object-top',
    socialLinks: {
      tiktok:
        'https://www.tiktok.com/@susanawaters22?is_from_webapp=1&sender_device=pc',
    },
  },
  {
    name: 'Michelle',
    business: 'Fizzinfarm-Housewife',
    state: 'New York',
    imageUrl:
      'https://storage.readdy-site.link/project_files/799b7601-b78c-4873-bc28-e9ba9cd9230e/cdb9aa3b-fdf6-44af-aea7-55c457293d20_caeeea96ce2e1fedf46b8d857b3c981dtplv-tiktokx-cropcenter_1080_1080.jpeg?v=1c17bec7d41c196158c246d3c64d9d18',
    socialLinks: {
      tiktok:
        'https://www.tiktok.com/@fizzinfarm_housewife?is_from_webapp=1&sender_device=pc',
    },
  },
  {
    name: 'Danny',
    business: 'sparkletherapy',
    state: 'Florida',
    imageUrl:
      'https://storage.readdy-site.link/project_files/799b7601-b78c-4873-bc28-e9ba9cd9230e/28dba2fc-ed31-428b-b664-5b7216285752_316687ec143fae0fd08e34f98273328ftplv-tiktokx-cropcenter_1080_1080.jpeg?v=83bfc8ce267eb536b8407310240ac097',
    socialLinks: {
      tiktok: 'https://www.tiktok.com/@dannyaa1183?is_from_webapp=1&sender_device=pc',
    },
  },
  {
    name: 'Kelly',
    business: 'fizzinghomeruns',
    state: 'Indiana',
    imageUrl:
      'https://storage.readdy-site.link/project_files/799b7601-b78c-4873-bc28-e9ba9cd9230e/9429d03f-16d8-4b8f-b401-4e16b432f594_43ce13739bc18109d384b5fee22dffcdtplv-tiktokx-cropcenter_1080_1080.jpeg?v=c66645088b4bcf2c8dc9dd97d059d3f6',
    socialLinks: {
      tiktok: 'https://www.tiktok.com/@kelpoo77?is_from_webapp=1&sender_device=pc',
    },
  },
  {
    name: 'Jenn',
    business: 'jennfizz4keeps',
    state: 'California',
    imageUrl:
      'https://storage.readdy-site.link/project_files/799b7601-b78c-4873-bc28-e9ba9cd9230e/bc8f8d2a-6af3-4cc7-8df3-6b8421965367_88c3268f03a4f1eb30998972bb73f26btplv-tiktokx-cropcenter_1080_1080.jpeg?v=5d16717edaf812d13dad9cfe3d76aeae',
    socialLinks: {
      tiktok:
        'https://www.tiktok.com/@jennfizz4keeps?is_from_webapp=1&sender_device=pc',
    },
  },
]

export function isBrittWithBlingSettings(settings: SiteSettingsDashboardResult) {
  const email = settings.email.trim().toLowerCase()
  const businessName = settings.businessName.trim().toLowerCase()
  const teamName = settings.teamName.trim().toLowerCase()

  return (
    (BRITT_WITH_BLING_PROFILE.email !== '' &&
      email === BRITT_WITH_BLING_PROFILE.email) ||
    businessName === 'britt with bling' ||
    teamName === 'the virtuous fizzers'
  )
}

export function applyBrittWithBlingHomepage(
  homepage: AmethystHomepageTemplateData,
): AmethystHomepageTemplateData {
  return {
    ...homepage,
    publicSiteVariant: 'britt_with_bling_hybrid',
    repName: BRITT_WITH_BLING_PROFILE.publicName,
    businessName: BRITT_WITH_BLING_PROFILE.businessName,
    teamName: BRITT_WITH_BLING_PROFILE.teamName,
    tagline: 'Where Faith Meets Fizz & Every Reveal is a VIP Experience',
    heroEyebrow: 'The Virtuous Fizzers',
    heroHeadline: 'Britt with Bling',
    heroSub:
      'Where Faith Meets Fizz & Every Reveal is a VIP Experience. Place your order and return to the live party to watch your reveal.',
    heroImageUrl: BRITT_WITH_BLING_PROFILE.heroImageUrl,
    announcementText: BRITT_WITH_BLING_PROFILE.announcementText,
    announcementLinkLabel: 'Learn More',
    announcementHref: '#wibp',
    promoTickerText: BRITT_WITH_BLING_PROFILE.promoTickerText,
    shopCtaLabel: 'Shop Now',
    featuredReveal: {
      eyebrow: 'Style Council Elite',
      title: 'The Rise of Her',
      body:
        'Representing The Virtuous Fizzers, Brittany has been honored with naming a legacy piece for Bomb Party. Born from the storm, defined by resilience - this is the Mother of Pearl masterpiece.',
      ctaLabel: 'Shop the Luxe Layers Collection',
      ctaHref: BRITT_WITH_BLING_PROFILE.shopUrl,
      videoUrl: 'https://www.tiktok.com/embed/7609434971228425486',
      videoTitle: 'Rise of Her Luxe Layer 2026',
    },
    revealExplainer: {
      title: 'What is a Bomb Party?',
      body:
        'Experience the thrilling, must-watch excitement of a Bomb Party jewelry reveal. Submit your order and watch live as Brittany fizzes, opens, and reveals your beautiful, unique piece of handcrafted jewelry. Join the live party to chase highly sought-after unicorns and diamond pieces while sharing in the fun of discovering your next favorite pieces.',
      videoCaption: 'Watch a Live Reveal!',
      videoHandle: '@brittwithbling on TikTok',
      videoUrl: 'https://www.tiktok.com/embed/7602795836380073229',
      videoTitle: 'Britt with Bling TikTok Video',
      ctaLabel: 'Follow for More Reveals',
      ctaHref: BRITT_WITH_BLING_PROFILE.tiktokUrl,
      steps: [
        {
          title: 'Order Your Jewelry',
          body: 'Purchase the items you want to reveal.',
        },
        {
          title: 'Watch Live',
          body:
            "Join Brittany's live on TikTok to watch as she reveals your surprise jewelry.",
        },
        {
          title: 'Receive Your Amazing Handcrafted Jewelry',
          body: 'Your jewelry ships directly to you - ready to enjoy.',
        },
      ],
    },
    aboutHeadline: 'What is a Bomb Party?',
    aboutParagraphs: [
      'Experience the thrill of a live jewelry reveal with Brittany and the Britt with Bling community.',
      'Order your jewelry, return to the live party, and watch the fizz reveal your new favorite sparkle.',
      'When a reveal is not quite your style, the Sparkle Suite Trade Board gives the community a rep-reviewed place to swap.',
    ],
    signupTitle: 'Never Miss a Show!',
    signupSub:
      'Get email updates now and be first in line when SMS show reminders launch.',
    joinTeamTitle: 'Join The Virtuous Fizzers',
    joinTeamSub:
      'Start your Fizz Biz with Brittany, mentorship, community, and a launch-pack path built for sparkle.',
    joinTeamUrl: '/amethyst/Join.html',
    footerTagline:
      'Britt with Bling is where faith meets fizz, community, and VIP reveals.',
    showJoinPage: true,
    streamLinks: {
      ...homepage.streamLinks,
      shop: BRITT_WITH_BLING_PROFILE.shopUrl,
      watch: BRITT_WITH_BLING_PROFILE.tiktokUrl,
      tiktok: BRITT_WITH_BLING_PROFILE.tiktokUrl,
      facebook: BRITT_WITH_BLING_PROFILE.facebookVipUrl,
    },
    socialLinks: [
      { label: 'TikTok', shortLabel: 'TT', href: BRITT_WITH_BLING_PROFILE.tiktokUrl },
      {
        label: 'VIP Group',
        shortLabel: 'VIP',
        href: BRITT_WITH_BLING_PROFILE.facebookVipUrl,
      },
      {
        label: 'Facebook',
        shortLabel: 'FB',
        href: BRITT_WITH_BLING_PROFILE.facebookVipUrl,
      },
      { label: 'Shop', shortLabel: 'BP', href: BRITT_WITH_BLING_PROFILE.shopUrl },
    ],
    footerLinks: {
      ...homepage.footerLinks,
      home: '/amethyst/Homepage.html',
      tradeBoard: '/amethyst/Trade.html',
      joinTeam: '/amethyst/Join.html',
      catalog: BRITT_WITH_BLING_PROFILE.shopUrl,
      preOrders: BRITT_WITH_BLING_PROFILE.shopUrl,
      pastShows: '#events',
      faq: '#wibp',
      contact: BRITT_WITH_BLING_PROFILE.facebookVipUrl,
    },
  }
}

export function applyBrittWithBlingTrade(
  trade: AmethystTradeTemplateData,
): AmethystTradeTemplateData {
  return {
    ...trade,
    publicSiteVariant: 'britt_with_bling_hybrid',
    repName: BRITT_WITH_BLING_PROFILE.publicName,
    businessName: BRITT_WITH_BLING_PROFILE.businessName,
    tradeHeroTitle: 'Britt with Bling Trade Board',
    tradeHeroSub:
      "Browse Brittany's available trade pieces and request a standard Sparkle Suite item-for-item swap.",
    footerTagline:
      'Faith, fizz, VIP reveals, and rep-reviewed trades with Britt with Bling.',
    footerLinks: {
      ...trade.footerLinks,
      home: '/amethyst/Homepage.html',
      tradeBoard: '/amethyst/Trade.html',
      joinTeam: '/amethyst/Join.html',
      catalog: BRITT_WITH_BLING_PROFILE.shopUrl,
      preOrders: BRITT_WITH_BLING_PROFILE.shopUrl,
      pastShows: '/amethyst/Homepage.html#events',
      faq: '#faq',
      contact: BRITT_WITH_BLING_PROFILE.facebookVipUrl,
    },
  }
}

export function applyBrittWithBlingJoin(
  join: AmethystJoinTemplateData,
  teamMembers: AmethystJoinTeamMember[] = [],
): AmethystJoinTemplateData {
  return {
    ...join,
    publicSiteVariant: 'britt_with_bling_hybrid',
    repName: BRITT_WITH_BLING_PROFILE.publicName,
    repCity: '',
    repState: 'Florida',
    businessName: BRITT_WITH_BLING_PROFILE.businessName,
    teamName: BRITT_WITH_BLING_PROFILE.teamName,
    heroTitle: 'WELCOME TO THE VIRTUOUS FIZZERS',
    promoText:
      '$599 Launch Pack. Guaranteed Diamond reveal. MSRP up to $3,500. 10 years of sparkle.',
    heroPitch:
      'Your sparkle story starts here. Join The Virtuous Fizzers with Brittany and build your Bomb Party business with mentorship, community, and VIP energy.',
    heroCtaText: 'CLAIM MY DIAMOND AND START MY CLIMB',
    finalPitch:
      'Join the Virtuous Fizzers and turn your passion for jewelry into a thriving business.',
    bpReferralUrl: BRITT_WITH_BLING_PROFILE.joinPackUrl,
    tickerTopText:
      'Join The Virtuous Fizzers | Supportive Community | Flexible Income | Training & Mentorship | Amazing Products | Work From Anywhere | Growth Opportunities',
    footerTagline:
      'Build your Bomb Party business with Brittany and The Virtuous Fizzers.',
    shopUrl: BRITT_WITH_BLING_PROFILE.shopUrl,
    repSocialLinks: {
      ...join.repSocialLinks,
      tiktok: BRITT_WITH_BLING_PROFILE.tiktokUrl,
      website: BRITT_WITH_BLING_PROFILE.shopUrl,
    },
    socialLinks: [
      { label: 'TikTok', shortLabel: 'TT', href: BRITT_WITH_BLING_PROFILE.tiktokUrl },
      {
        label: 'VIP Group',
        shortLabel: 'VIP',
        href: BRITT_WITH_BLING_PROFILE.facebookVipUrl,
      },
      join.socialLinks[2],
      { label: 'Shop', shortLabel: 'BP', href: BRITT_WITH_BLING_PROFILE.shopUrl },
    ],
    footerLinks: {
      ...join.footerLinks,
      home: '/amethyst/Homepage.html',
      tradeBoard: '/amethyst/Trade.html',
      joinTeam: '/amethyst/Join.html',
      catalog: BRITT_WITH_BLING_PROFILE.shopUrl,
      preOrders: BRITT_WITH_BLING_PROFILE.shopUrl,
      pastShows: '/amethyst/Homepage.html#events',
      faq: '#join-faq',
      contact: BRITT_WITH_BLING_PROFILE.facebookVipUrl,
    },
    footerColumn: {
      title: '',
      links: [],
    },
    teamMembers,
    faqAnswers: {
      whatIsTeam:
        "The Virtuous Fizzers is Brittany's Bomb Party rep team - a supportive community that celebrates wins, shares what works, and helps new reps build with confidence.",
      cost:
        'Starter pack details and current promotions are handled by Bomb Party. The current offer highlights a $599 Launch Pack with a guaranteed Diamond reveal.',
      experience:
        'No experience required. Brittany and the team focus on training, mentorship, and practical support as you get started.',
      timeCommitment:
        'Work on your own schedule. Whether you want extra income or a full-time opportunity, you control your success.',
      support:
        'Get tools, training, community, and one-on-one support from a team built around helping reps grow.',
      income:
        'Income varies by effort, sales, and time. Review the Bomb Party income disclosure before enrolling.',
    },
  }
}
