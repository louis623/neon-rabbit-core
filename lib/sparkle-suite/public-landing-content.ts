export const sparkleSuitePublicLandingSafety = {
  disclaimer:
    'Sparkle Suite is an independent tool for reps. We are not affiliated with, endorsed by, sponsored by, or officially connected to Bomb Party.',
  audienceClarifier:
    'Sparkle Suite provides websites and customer-experience tools for BP reps.',
} as const

export const sparkleSuitePublicLandingContent = {
  brand: 'Sparkle Suite',
  nav: {
    links: [
      { label: 'Features', href: '#tools' },
      { label: 'How It Works', href: '#customers' },
      { label: 'Examples', href: '#examples' },
      { label: 'Help', href: '#faq' },
      { label: 'Pricing', href: '#pricing' },
    ],
  },
  hero: {
    headline: 'Make your Bomb Party customer experience feel more polished.',
    body:
      'Sparkle Suite gives your customers a beautiful place to find your live shows, follow the queue, browse trades, get updates, and stay connected - all in one place.',
    primaryCta: { label: 'Get Sparkle Suite', href: '#pricing' },
    secondaryCta: { label: 'See What It Does', href: '#tools' },
    productHeadline: 'We make live shopping easy to follow.',
    productSubhead: 'Live Thursday 8 PM',
    valueProps: [
      {
        title: 'Live shows',
        body: 'they can find',
      },
      {
        title: 'Queue updates',
        body: 'they can follow',
      },
      {
        title: 'Trade board',
        body: 'they can use',
      },
      {
        title: 'Updates',
        body: 'they actually get',
      },
      {
        title: 'Support with',
        body: 'Nic-Nac',
      },
    ],
    screens: [
      {
        id: 'site',
        title: 'Upcoming Live Shows',
        label: 'Thursday, May 29',
        body: '8:00 PM',
      },
      {
        id: 'queue',
        title: 'Live queue',
        label: 'Now serving',
        body: 'Kayla',
      },
      {
        id: 'trade',
        title: 'Trade board',
        label: 'ISO: Unicorn',
        body: 'Have: Birthday',
      },
      {
        id: 'calendar',
        title: 'Live event',
        label: 'Thursday, May 29',
        body: '8:00 PM',
      },
      {
        id: 'email',
        title: 'Email updates',
        label: 'Live Thursday 8 PM',
        body: 'Reminder sent',
      },
      {
        id: 'sms',
        title: 'SMS updates',
        label: 'Hi! Your spot is saved.',
        body: 'Reminder sent',
      },
      {
        id: 'nic-nac',
        title: 'Ask Nic-Nac',
        label: "Hi! I'm Nic-Nac.",
        body: 'How can I help?',
      },
    ],
  },
  comparison: {
    heading: 'Less scattered. More polished.',
    body:
      'Give your customers one beautiful place to follow along.',
    beforeLabel: 'Before',
    before: [
      'Show details in posts',
      'Queue questions in comments',
      'Trade requests in messages',
      'Reminders handled by hand',
    ],
    afterLabel: 'With Sparkle Suite',
    after: [
      'Shows are easier to find',
      'The queue is easier to follow',
      'Trades have a cleaner home',
      'Updates feel more intentional',
    ],
  },
  features: {
    heading: 'The tools behind the smoother experience.',
    body:
      'Sparkle Suite is not just a prettier link page. It brings the customer-facing pieces of your live-show setup into one polished place.',
    items: [
      {
        title: 'Trade board',
        body:
          'Give trade requests a cleaner place to live so customers can browse wants, haves, and pending trades without digging through messages.',
      },
      {
        title: 'Live queue',
        body:
          'Help customers follow who is up now and who is coming next while your show keeps moving.',
      },
      {
        title: 'Live event calendar',
        body:
          'Make upcoming lives, featured details, and show times easier for customers to find.',
      },
      {
        title: 'Email updates',
        body:
          'Send clearer follow-through when customers need details after the live.',
      },
      {
        title: 'SMS updates',
        body:
          'Send timely reminders when visibility matters and social posts are not enough.',
      },
      {
        title: 'Nic-Nac',
        body:
          'Get practical setup and how-to help inside Sparkle Suite when you need it.',
      },
    ],
  },
  customers: {
    heading: 'Customers should know where to go.',
    body:
      'When the next show, queue, trades, and updates all have a cleaner home, the whole experience feels easier to follow.',
    steps: [
      'Find the next show',
      'Join or follow the queue',
      'Browse trades',
      'Get the update',
    ],
  },
  reps: {
    heading: 'Less repeating. More selling.',
    body:
      'Sparkle Suite does not run your business for you. It gives the repeat details a better place to live, so customers can find more answers without pulling you away from the show.',
    points: [
      {
        title: 'Fewer repeated questions',
        body: 'Show details, queue flow, and links are easier for customers to find.',
      },
      {
        title: 'Cleaner follow-through',
        body:
          'Email and SMS updates help important details leave the chat and reach customers directly.',
      },
      {
        title: 'Support when you need it',
        body:
          'Nic-Nac helps answer Sparkle Suite setup and how-to questions inside the workspace.',
      },
    ],
  },
  pricing: {
    heading: 'Ready to make your customer experience feel more polished?',
    body:
      'Get Sparkle Suite, accept the agreement during checkout, and finish setup inside Sparkle Suite with Nic-Nac there to help.',
    primaryCta: { label: 'Get Sparkle Suite', href: '/login' },
    note:
      'Checkout and setup access happen through your Sparkle Suite account.',
  },
  faq: [
    {
      question: 'What is Sparkle Suite?',
      answer:
        'Sparkle Suite gives reps a polished customer-facing site and live-show tools that help customers find shows, follow the queue, browse trades, get updates, and stay connected.',
    },
    {
      question: 'Who is it for?',
      answer:
        'Sparkle Suite is built for Bomb Party reps who want a cleaner customer experience and smoother live-show setup.',
    },
    {
      question: 'What happens after I purchase?',
      answer:
        'You get access to Sparkle Suite, receive your setup links, and use Nic-Nac and the help/how-to resources to finish setup.',
    },
    {
      question: 'Does Sparkle Suite replace the rep?',
      answer:
        'No. Sparkle Suite supports the customer experience and repeat details so reps can stay focused on their shows and customers.',
    },
    {
      question: 'Is Sparkle Suite affiliated with Bomb Party?',
      answer: sparkleSuitePublicLandingSafety.disclaimer,
    },
  ],
} as const
