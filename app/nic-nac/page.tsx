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
import './nic-nac-tokens.css'

export const dynamic = 'force-dynamic'

export default function NicNacPage() {
  return (
    <main>
      <div className="sparkle-landing-v2">
        <div className="sl2-shell">
          <SparkleSuitePublicHeader />
        </div>
      </div>
      <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
        <NicNacClient
          reviewerSmokeVisible={
            reviewerSmokeModeEnabled() || workspaceReviewAccessEnabled()
          }
        />
      </Suspense>
      <div className="sparkle-landing-v2">
        <div className="sl2-shell">
          <SparkleSuitePublicFooter />
        </div>
      </div>
    </main>
  )
}
