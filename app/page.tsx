import type { Metadata } from 'next'

import { SparkleSuitePublicLanding } from '@/app/_components/sparkle-suite-public-landing'
import { sparkleSuitePublicLandingContent } from '@/lib/sparkle-suite/public-landing-content'

export const metadata: Metadata = {
  title: {
    absolute: 'Sparkle Suite',
  },
  description:
    'Make your live-show customer experience feel more polished with Sparkle Suite.',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Sparkle Suite',
    description:
      'A polished customer-facing site and live-show tools for reps who want a cleaner customer experience.',
    url: '/',
    siteName: 'Sparkle Suite',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Sparkle Suite public landing page.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sparkle Suite',
    description:
      'Make your live-show customer experience feel more polished with Sparkle Suite.',
    images: [
      {
        url: '/opengraph-image',
        alt: 'Sparkle Suite public landing page.',
      },
    ],
  },
}

const sparkleSuiteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://www.yoursparklesuite.com/#website',
      name: 'Sparkle Suite',
      url: 'https://www.yoursparklesuite.com/',
      description: metadata.description,
      inLanguage: 'en-US',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://www.yoursparklesuite.com/#software',
      name: 'Sparkle Suite',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: sparkleSuitePublicLandingContent.hero.body,
      url: 'https://www.yoursparklesuite.com/',
      audience: {
        '@type': 'Audience',
        audienceType: 'BP reps',
      },
      offers: {
        '@type': 'Offer',
        availability: 'https://schema.org/InStock',
        url: 'https://www.yoursparklesuite.com/#pricing',
      },
      areaServed: {
        '@type': 'Country',
        name: 'United States',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://www.yoursparklesuite.com/#organization',
      name: 'Sparkle Suite',
      url: 'https://www.yoursparklesuite.com/',
    },
  ],
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(sparkleSuiteJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <SparkleSuitePublicLanding />
    </>
  )
}
