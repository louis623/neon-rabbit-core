import type { Metadata } from 'next'

import { MarketingHeader, MarketingFooter } from '../_components/landing-experience'
import { FounderAvailabilityProvider, FounderOffer, FounderSpotLabel, IncludedFeatures } from '../_components/landing-interactions'
import styles from '../_components/landing-experience.module.css'
import { PrelaunchWaitlistForm } from './_components/PrelaunchWaitlistForm'
import { prelaunchContent } from '@/lib/prelaunch/content'

export const metadata: Metadata = {
  title: {
    absolute: 'Join the build queue | Sparkle Suite',
  },
  description: prelaunchContent.body,
  alternates: {
    canonical: '/prelaunch',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Join the build queue | Sparkle Suite',
    description: prelaunchContent.body,
    url: '/prelaunch',
    siteName: 'Sparkle Suite',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Sparkle Suite: now building sites for Bomb Party reps.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Join the build queue | Sparkle Suite',
    description: prelaunchContent.body,
    images: [
      {
        url: '/opengraph-image',
        alt: 'Sparkle Suite: now building sites for Bomb Party reps.',
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
        availability: 'https://schema.org/InStock',
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
    <FounderAvailabilityProvider><main className={`prelaunch-shell ${styles.page}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(prelaunchJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <a className={styles.skipLink} href="#waitlist">Skip to signup</a>
      <MarketingHeader intake />
      <section className={styles.intakeIntro}>
        <p className={styles.eyebrow}>Now building Sparkle Suite sites</p>
        <h1>Your spot in line starts here.</h1>
        <p>Tell us a little about your business. We’ll follow up about your site and the next steps. No payment to join.</p>
        <FounderSpotLabel />
      </section>
      <div className={styles.intakeLayout}>
        <div className={styles.intakeForm}><PrelaunchWaitlistForm /></div>
        <aside className={styles.intakeAside}><h2>A more polished place for your business.</h2><p>Your brand, your customers, and the tools that help showtime run more smoothly.</p><IncludedFeatures /><FounderOffer compact /></aside>
      </div>
      <MarketingFooter />
    </main></FounderAvailabilityProvider>
  )
}
