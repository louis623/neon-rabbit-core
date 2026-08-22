import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import {
  SparkleSuitePublicFooter,
  SparkleSuitePublicHeader,
} from '@/app/_components/sparkle-suite-public-chrome'
import { reviewerSmokeControlsVisible } from '@/lib/reviewer-smoke/config'
import { StartSparkleSuiteForm } from './StartSparkleSuiteForm'
import styles from './start.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { absolute: 'Sparkle Suite Reviewer Smoke' },
  description: 'Protected Sparkle Suite reviewer smoke controls.',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function StartPage({
  searchParams,
}: {
  searchParams?: Promise<{
    review?: string | string[]
  }>
}) {
  const query = searchParams ? await searchParams : {}
  const reviewToken = Array.isArray(query.review) ? query.review[0] : query.review
  const reviewerSmokeVisible = reviewerSmokeControlsVisible(reviewToken)

  if (!reviewerSmokeVisible) {
    redirect('/prelaunch#waitlist')
  }

  return (
    <main className={`${styles.page} sparkle-landing-v2`}>
      <div className="sl2-shell">
        <SparkleSuitePublicHeader />
        <section className={styles.hero}>
          <div className={styles.copy}>
            <h1>Review Sparkle Suite</h1>
            <p>
              Use the protected synthetic paths below to review the inactive
              account guard, required setup, and the workspace without using a
              personal account.
            </p>
            <div className={styles.accountArea}>
              <StartSparkleSuiteForm
                reviewerSmokeVisible={reviewerSmokeVisible}
              />
            </div>
          </div>
        </section>
        <SparkleSuitePublicFooter />
      </div>
    </main>
  )
}
