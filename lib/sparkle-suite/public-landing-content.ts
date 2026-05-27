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
      { label: 'Tools', href: '#tools' },
      { label: 'Customers', href: '#customers' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
  },
  hero: {
    headline: 'Make your live-show customer experience feel more polished.',
    body:
      'Sparkle Suite gives your customers a beautiful place to find your shows, follow the queue, browse trades, get updates, and stay connected, while Nic-Nac helps you keep the setup moving inside Sparkle Suite.',
    primaryCta: { label: 'Get Sparkle Suite', href: '#pricing' },
    secondaryCta: { label: 'See What It Does', href: '#tools' },
    screens: [
      {
        id: 'site',
        title: 'Customer site',
        label: 'Live Thursday 8 PM',
        body: 'Shows, queue, trades, and updates in one polished place.',
      },
      {
        id: 'queue',
        title: 'Live queue',
        label: 'Now serving: Kayla',
        body: 'Up next: Amanda',
      },
      {
        id: 'trade',
        title: 'Trade board',
        label: 'Wants and haves',
        body: 'Cleaner trade requests without digging through messages.',
      },
      {
        id: 'calendar',
        title: 'Live event calendar',
        label: 'Next show saved',
        body: 'Show times and featured details are easier to find.',
      },
      {
        id: 'updates',
        title: 'Customer updates',
        label: 'Reminder sent',
        body: 'Email and SMS follow-through when visibility matters.',
      },
      {
        id: 'nic-nac',
        title: 'Nic-Nac',
        label: 'Ask Nic-Nac',
        body: 'Practical Sparkle Suite setup and how-to help.',
      },
    ],
  },
  comparison: {
    heading: 'Less scattered. More polished.',
    body:
      'Sparkle Suite gives customers one clearer place to follow what is happening, instead of piecing it together from old posts, comments, links, and messages.',
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
        'Sparkle Suite is built for BP reps who want a cleaner customer experience and smoother live-show setup.',
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
