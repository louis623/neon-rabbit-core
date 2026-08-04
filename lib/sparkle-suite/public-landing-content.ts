export const sparkleSuitePublicLandingSafety = {
  disclaimer:
    'Sparkle Suite is an independent tool for reps. We are not affiliated with, endorsed by, sponsored by, or officially connected to Bomb Party.',
  audienceClarifier:
    'Sparkle Suite is built for reps who want a more polished customer experience, smoother live shows, and less patchwork behind the scenes.',
} as const

export const sparkleSuitePublicLandingContent = {
  brand: 'Sparkle Suite',
  sections: [
    { id: 'hero', label: 'Hero' },
    { id: 'customer-site-proof', label: 'Customer site proof' },
    { id: 'workspace-proof', label: 'Workspace proof' },
    { id: 'pricing', label: 'Pricing' },
  ],
  hero: {
    eyebrow: 'Sparkle Suite for reps',
    headline: 'A better customer experience starts with a better rep setup.',
    body:
      'Sparkle Suite gives reps a polished customer site, standout live-show tools, and built-in support that helps customers feel the difference.',
    primaryCta: { label: 'Join the waitlist', href: '/prelaunch#waitlist' },
  },
  workspaceProof: {
    eyebrow: 'Rep workspace',
    heading: 'Run the show with less scramble behind the scenes.',
    body:
      'Instead of chasing show details across scattered tools, reps get one workspace for Live queue, Trade board, Live event calendar, email and SMS updates, customer-site customizations, and Nic-Nac, the built-in assistant for live-show support.',
  },
  customerSiteProof: {
    eyebrow: 'Customer-facing site',
    heading: 'Make the customer side feel like you.',
    body:
      'Choose a look that fits your brand, then give customers one polished place to find your show, queue, trade board, and updates.',
  },
  assets: {
    tradeBoardDesktopProof: {
      src: '/sparkle-suite/landing/trade-board-desktop-proof.png',
      alt: 'Sparkle Suite customer Trade Board preview on desktop.',
    },
    nicNacWorkspaceProof: {
      src: '/sparkle-suite/landing/nic-nac-workspace-proof.png',
      alt: 'Sparkle Suite Nic-Nac workspace preview on desktop.',
    },
    customerSiteVioletProof: {
      src: '/sparkle-suite/landing/customer-site-violet-proof.png',
      alt: 'Violet customer-facing Sparkle Suite site preview.',
    },
    customerSiteNightProof: {
      src: '/sparkle-suite/landing/customer-site-night-proof.png',
      alt: 'Dark customer-facing Sparkle Suite site preview.',
    },
    customerSiteBlushProof: {
      src: '/sparkle-suite/landing/customer-site-blush-proof.png',
      alt: 'Blush customer-facing Sparkle Suite site preview.',
    },
  },
  pricing: {
    eyebrow: 'Pricing',
    heading: 'Time to level up.',
    body:
      'If you have been waiting for a sign to stop piecing it together, this is it.',
    buildFee: {
      label: 'Sparkle Suite build fee',
      price: '$49.99',
      body: 'One-time and non-refundable, itemized separately at checkout.',
    },
    standard: {
      label: 'Standard monthly',
      badge: 'Current monthly rate',
      price: '$74.99/month',
      term: 'Monthly subscription from the start.',
      firstCheckout: '$124.98 first checkout. Tax is not included in this price.',
    },
    included: [
      'Customer site',
      'Trade board',
      'Live queue',
      'Live event calendar',
      'Email updates',
      'SMS updates',
      'Nic-Nac',
    ],
    primaryCta: { label: 'Join the waitlist', href: '/prelaunch#waitlist' },
    sectionCta: { label: 'Join the waitlist', href: '/prelaunch#waitlist' },
  },
  publicNicNacAssistant: {
    teaser: 'Still have questions? Ask Nic-Nac.',
    body:
      "Get quick answers about setup, pricing, what's included, and whether Sparkle Suite fits your live-show workflow.",
    buttonLabel: 'Ask Nic-Nac',
    panelTitle: 'Ask Nic-Nac',
    panelIntro:
      'Nic-Nac can answer public Sparkle Suite questions before you join the waitlist.',
    starterQuestions: [
      "What's included?",
      'How does setup work?',
      'Is Sparkle Suite affiliated with Bomb Party?',
    ],
    inputLabel: 'Your question',
    inputPlaceholder: 'Ask about setup, pricing, included tools, or fit.',
    submitLabel: 'Ask',
    handoffLabels: {
      name: 'Name',
      email: 'Email',
      question: 'Question for Louis',
      submit: 'Save question here',
      saved:
        'Saved here for Louis to review. No email, text, calendar, payment, or provider action was triggered.',
    },
  },
  footer: {
    links: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms and Conditions', href: '/terms-and-conditions' },
    ],
    socialLinks: [
      { label: 'Sparkle Finder', href: '#' },
      { label: 'YouTube', href: '#' },
      { label: 'TikTok', href: '#' },
    ],
  },
} as const
