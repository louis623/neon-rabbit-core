import type { Metadata } from 'next'
import {
  SparkleSuitePublicFooter,
  SparkleSuitePublicHeader,
} from '@/app/_components/sparkle-suite-public-chrome'
import { SparkleSuitePublicNicNac } from '@/app/_components/sparkle-suite-public-nic-nac'
import { reviewerSmokeModeEnabled } from '@/lib/reviewer-smoke/config'
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

export default function StartPage() {
  return (
    <main className={`${styles.page} sparkle-landing-v2`}>
      <div className="sl2-shell">
        <SparkleSuitePublicHeader />
        <section className={styles.hero}>
          <div className={styles.copy}>
            <h1>Start your Sparkle Suite</h1>
            <p>
              Create your Sparkle Suite account, agree to the terms, then head
              to Stripe Checkout for plan and payment details. After checkout,
              Nic-Nac opens to help finish your Sparkle Suite customer-facing
              website, Trade Board, Live Queue, live show calendar, and email
              and SMS updates.
            </p>
            <div className={styles.accountArea}>
              <StartSparkleSuiteForm
                reviewerSmokeVisible={reviewerSmokeModeEnabled()}
              />
              <div className={`${styles.nicNacLauncher} sparkle-landing-v2`}>
                <SparkleSuitePublicNicNac variant="compact" />
              </div>
            </div>
          </div>
        </section>
        <SparkleSuitePublicFooter />
      </div>
    </main>
  )
}
