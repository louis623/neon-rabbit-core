import type { Metadata } from 'next'
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
  'Create your rep account',
  'Review plan and terms',
  'Confirm payment in Stripe',
  'Open Nic-Nac and finish setup',
]

const reassurance = [
  {
    title: 'No card is needed on this step.',
    body: 'Start with account details only; payment waits until the checkout review.',
  },
  {
    title:
      'Nothing here texts or emails customers, posts to live or social channels, changes provider settings, or charges you.',
    body: 'This creates a private Sparkle Suite workspace for your setup.',
  },
  {
    title:
      'Review your plan, renewal details, and Sparkle Suite terms before Stripe asks for payment.',
    body: 'You see the billing summary first, then continue to secure Stripe checkout.',
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

export default function StartPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <a className={styles.brand} href="/">
          <SparkleSeal className={styles.seal} />
          <span>Sparkle Suite</span>
        </a>
        <div className={styles.grid}>
          <div className={styles.copy}>
            <h1>Start your Sparkle Suite</h1>
            <p>
              Create your account first, then review the plan, terms, and
              renewal details before payment. Nic-Nac opens after checkout to
              help finish your customer site, dance floor, calendar, and
              updates.
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
          <StartSparkleSuiteForm />
        </div>
      </section>
    </main>
  )
}
