import type { Metadata } from 'next'

import { PrelaunchAudience } from './_components/PrelaunchAudience'
import { PrelaunchBenefits } from './_components/PrelaunchBenefits'
import { PrelaunchFooter } from './_components/PrelaunchFooter'
import { PrelaunchHero } from './_components/PrelaunchHero'
import { PrelaunchVideoSection } from './_components/PrelaunchVideoSection'
import { PrelaunchWaitlistForm } from './_components/PrelaunchWaitlistForm'
import { prelaunchContent } from '@/lib/prelaunch/content'

export const metadata: Metadata = {
  title: 'Sparkle Suite | Coming Soon',
  description:
    'Sparkle Suite is a coming-soon website and rep tool home base for Bomb Party reps who want a calmer, more polished online setup.',
  alternates: {
    canonical: '/prelaunch',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Sparkle Suite | Coming Soon',
    description:
      'One easier home for your Bomb Party business. Join the Sparkle Suite waitlist.',
    url: '/prelaunch',
    siteName: 'Sparkle Suite',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Sparkle Suite coming soon: one easier home for your Bomb Party business.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sparkle Suite | Coming Soon',
    description:
      'One easier home for your Bomb Party business. Join the Sparkle Suite waitlist.',
    images: [
      {
        url: '/opengraph-image',
        alt: 'Sparkle Suite coming soon: one easier home for your Bomb Party business.',
      },
    ],
  },
}

const prelaunchJsonLd = {
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
      description: prelaunchContent.body,
      url: 'https://www.yoursparklesuite.com/prelaunch',
      audience: {
        '@type': 'Audience',
        audienceType: 'Independent Bomb Party reps',
      },
      offers: {
        '@type': 'Offer',
        availability: 'https://schema.org/PreOrder',
        url: 'https://www.yoursparklesuite.com/prelaunch#waitlist',
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
      parentOrganization: {
        '@type': 'Organization',
        name: 'Neon Rabbit Digital Services',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Jacksonville',
          addressRegion: 'FL',
          addressCountry: 'US',
        },
      },
    },
  ],
}

export default function PrelaunchPage() {
  return (
    <main className="prelaunch-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(prelaunchJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <PrelaunchHero />
      <PrelaunchVideoSection />
      <PrelaunchBenefits />
      <PrelaunchAudience />
      <PrelaunchWaitlistForm />
      <PrelaunchFooter />
    </main>
  )
}
