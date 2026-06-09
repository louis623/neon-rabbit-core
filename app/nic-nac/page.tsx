import { Suspense } from 'react'
import {
  SparkleSuitePublicFooter,
  SparkleSuitePublicHeader,
} from '@/app/_components/sparkle-suite-public-chrome'
import NicNacClient from './_client'
import {
  reviewerSmokeModeEnabled,
  workspaceReviewAccessEnabled,
} from '@/lib/reviewer-smoke/config'
import styles from './page.module.css'
import './nic-nac-tokens.css'

export const dynamic = 'force-dynamic'

export default function NicNacPage() {
  return (
    <main className={styles.page}>
      <div className={`sparkle-landing-v2 ${styles.chrome}`}>
        <div className="sl2-shell">
          <SparkleSuitePublicHeader />
        </div>
      </div>
      <div className={styles.app}>
        <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
          <NicNacClient
            reviewerSmokeVisible={
              reviewerSmokeModeEnabled() || workspaceReviewAccessEnabled()
            }
          />
        </Suspense>
      </div>
      <div className={`sparkle-landing-v2 ${styles.chrome}`}>
        <div className="sl2-shell">
          <SparkleSuitePublicFooter />
        </div>
      </div>
    </main>
  )
}
