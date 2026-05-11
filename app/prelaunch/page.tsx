import type { Metadata } from 'next'

import { PrelaunchAudience } from './_components/PrelaunchAudience'
import { PrelaunchBenefits } from './_components/PrelaunchBenefits'
import { PrelaunchFooter } from './_components/PrelaunchFooter'
import { PrelaunchHero } from './_components/PrelaunchHero'
import { PrelaunchIntakeForm } from './_components/PrelaunchIntakeForm'
import { PrelaunchVideoSection } from './_components/PrelaunchVideoSection'
import { PrelaunchWaitlistForm } from './_components/PrelaunchWaitlistForm'
import { prelaunchContent } from '@/lib/prelaunch/content'

export const metadata: Metadata = {
  title: 'Sparkle Suite | Coming Soon for Reps',
  description:
    'Sparkle Suite is being built for reps who want smoother live shows, less patchwork, and a more polished customer experience. Join the waitlist.',
  alternates: {
    canonical: '/prelaunch',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Sparkle Suite | Coming Soon for Reps',
    description:
      'A better customer experience starts with a better rep setup. Join the Sparkle Suite waitlist.',
    url: '/prelaunch',
    siteName: 'Sparkle Suite',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Sparkle Suite coming soon: A better customer experience starts with a better rep setup.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sparkle Suite | Coming Soon for Reps',
    description:
      'A better customer experience starts with a better rep setup. Join the Sparkle Suite waitlist.',
    images: [
      {
        url: '/opengraph-image',
        alt: 'Sparkle Suite coming soon: A better customer experience starts with a better rep setup.',
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
      url: 'https://www.yoursparklesuite.com/prelaunch',
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
      url: 'https://www.yoursparklesuite.com/prelaunch',
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
      <PrelaunchIntakeForm />
      <PrelaunchFooter />
    </main>
  )
}
