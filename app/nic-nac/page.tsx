import { Suspense } from 'react'
import NicNacClient from './_client'
import {
  reviewerSmokeModeEnabled,
  workspaceReviewAccessEnabled,
} from '@/lib/reviewer-smoke/config'
import './nic-nac-tokens.css'

export const dynamic = 'force-dynamic'

export default function NicNacPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
      <NicNacClient
        reviewerSmokeVisible={
          reviewerSmokeModeEnabled() || workspaceReviewAccessEnabled()
        }
      />
    </Suspense>
  )
}
