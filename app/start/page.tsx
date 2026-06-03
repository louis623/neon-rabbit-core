import type { Metadata } from 'next'
import { SparkleSuitePublicNicNac } from '@/app/_components/sparkle-suite-public-nic-nac'
import {
  sparkleSuitePublicLandingContent,
  sparkleSuitePublicLandingSafety,
} from '@/lib/sparkle-suite/public-landing-content'
import { StartSparkleSuiteForm } from './StartSparkleSuiteForm'
import styles from './start.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { absolute: 'Start Sparkle Suite' },
  description: 'Create your Sparkle Suite account and begin self-serve setup.',
  robots: {
    index: false,
    follow: false,
  },
}

const steps = [
  'Create your Sparkle Suite account',
  'Agree to the Sparkle Suite terms',
  'Confirm payment in Stripe',
  'Finish setup with Nic-Nac',
]

const reassurance = [
  {
    title: 'Google is the quickest way in.',
    body:
      'Use your Google account to start your Sparkle Suite workspace. Prefer a different email? You can create an account with email instead.',
  },
  {
    title: 'Terms come before checkout.',
    body:
      'Review and accept the Sparkle Suite Terms here, then Stripe opens for plan and payment details.',
  },
  {
    title: 'Nic-Nac helps finish setup after checkout.',
    body:
      'After payment, Nic-Nac opens the setup path for your customer-facing website, dancefloor/trade board, live show calendar, and SMS and email updates.',
  },
]

function SparkleSeal({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 64 64">
      <circle
        cx="32"
        cy="32"
        fill="#ffffff"
        r="30"
        stroke="currentColor"
        strokeWidth="0.75"
      />
      <text
        fill="currentColor"
        fontFamily="'Playfair Display', Georgia, serif"
        fontSize="32"
        fontStyle="italic"
        fontWeight="500"
        textAnchor="middle"
        x="32"
        y="42"
      >
        S
      </text>
    </svg>
  )
}

function StartHeader() {
  const { brand } = sparkleSuitePublicLandingContent

  return (
    <header className="sl2-header">
      <a aria-label="Sparkle Suite home" className="sl2-brand" href="/">
        <SparkleSeal className="sl2-brand__seal" />
        <span>{brand}</span>
      </a>
      <div className="sl2-header__actions">
        <span>Already have Sparkle Suite?</span>
        <a href="/login">Sign in here.</a>
      </div>
    </header>
  )
}

function StartFooter() {
  const { brand, footer } = sparkleSuitePublicLandingContent

  return (
    <footer className="sl2-footer">
      <div className="sl2-footer__brand">
        <SparkleSeal className="sl2-footer__seal" />
        <span>{brand}</span>
      </div>
      <div className="sl2-footer__nav" aria-label="Footer links">
        <div>
          <h2>Links</h2>
          {footer.links.map((link) => (
            <a href={link.href} key={link.href}>
              {link.label}
            </a>
          ))}
        </div>
        <div>
          <h2>Social</h2>
          {footer.socialLinks.map((link) => (
            <a href={link.href} key={link.label}>
              {link.label}
            </a>
          ))}
        </div>
      </div>
      <p>{sparkleSuitePublicLandingSafety.disclaimer}</p>
    </footer>
  )
}

export default function StartPage() {
  return (
    <main className={`${styles.page} sparkle-landing-v2`}>
      <div className="sl2-shell">
        <StartHeader />
        <section className={styles.hero}>
          <div className={styles.grid}>
            <div className={styles.copy}>
              <h1>Start your Sparkle Suite</h1>
              <p>
                Create your Sparkle Suite account, agree to the terms, then head
                to Stripe Checkout for plan and payment details. After checkout,
                Nic-Nac opens to help finish your Sparkle Suite
                customer-facing website, dancefloor/trade board, live show
                calendar, and SMS and email updates.
              </p>
              <div className={styles.reassurance} aria-label="Start reassurance">
                {reassurance.map((item) => (
                  <section className={styles.reassuranceItem} key={item.title}>
                    <h2>{item.title}</h2>
                    <p>{item.body}</p>
                  </section>
                ))}
              </div>
              <ol className={styles.steps} aria-label="Self-serve signup steps">
                {steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
            <div className={styles.formColumn}>
              <StartSparkleSuiteForm />
              <div className={`${styles.nicNacLauncher} sparkle-landing-v2`}>
                <SparkleSuitePublicNicNac variant="compact" />
              </div>
            </div>
          </div>
        </section>
        <StartFooter />
      </div>
    </main>
  )
}
