'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import styles from './start.module.css'

type ReviewerSmokeState =
  | 'checkout_required'
  | 'required_setup'
  | 'dashboard_unlocked'

type ReviewerSmokeResponse =
  | {
      ok: true
      email: string
      password: string
      next: string
      state: ReviewerSmokeState
    }
  | {
      ok?: false
      error?: string
    }

export function StartSparkleSuiteForm({
  reviewerSmokeVisible = false,
}: {
  reviewerSmokeVisible?: boolean
}) {
  const [reviewToken] = useState(() => {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get('review')?.trim() ?? ''
  })
  const [reviewerBusy, setReviewerBusy] = useState<ReviewerSmokeState | null>(
    null,
  )
  const [reviewerError, setReviewerError] = useState<string | null>(null)

  if (!reviewerSmokeVisible) return null

  async function startReviewerSmoke(state: ReviewerSmokeState) {
    setReviewerBusy(state)
    setReviewerError(null)

    try {
      const response = await fetch('/api/reviewer-smoke/session', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: reviewToken, state }),
      })
      const payload = (await response.json().catch(() => null)) as
        | ReviewerSmokeResponse
        | null

      if (!response.ok || payload?.ok !== true) {
        const message =
          payload && 'error' in payload ? payload.error : undefined
        throw new Error(message ?? 'Reviewer smoke mode is not available.')
      }

      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: payload.email,
        password: payload.password,
      })
      if (signInError) throw signInError

      window.location.href =
        reviewToken.length > 0
          ? `${payload.next}${payload.next.includes('?') ? '&' : '?'}review=${encodeURIComponent(reviewToken)}`
          : payload.next
    } catch (caught) {
      setReviewerError(
        caught instanceof Error
          ? caught.message
          : 'Reviewer smoke mode did not start.',
      )
    } finally {
      setReviewerBusy(null)
    }
  }

  return (
    <div className={styles.formStack}>
      <section className={styles.reviewerPanel} aria-label="Reviewer smoke mode">
        <div>
          <span>Reviewer smoke mode</span>
          <h3>Review the customer path</h3>
          <p>
            Review the inactive-account guard or open seeded previews for setup
            and workspace smoke checks.
          </p>
        </div>
        <div className={styles.reviewerActions}>
          <button
            type="button"
            className={styles.reviewerPrimaryAction}
            onClick={() => startReviewerSmoke('checkout_required')}
            disabled={reviewerBusy !== null}
          >
            {reviewerBusy === 'checkout_required'
              ? 'Preparing...'
              : 'Review inactive account'}
          </button>
          <button
            type="button"
            onClick={() => startReviewerSmoke('required_setup')}
            disabled={reviewerBusy !== null}
          >
            {reviewerBusy === 'required_setup'
              ? 'Preparing...'
              : 'Open setup preview'}
          </button>
          <button
            type="button"
            onClick={() => startReviewerSmoke('dashboard_unlocked')}
            disabled={reviewerBusy !== null}
          >
            {reviewerBusy === 'dashboard_unlocked'
              ? 'Preparing...'
              : 'Open workspace preview'}
          </button>
        </div>
        {reviewerError ? (
          <p className={styles.reviewerError}>{reviewerError}</p>
        ) : null}
      </section>
    </div>
  )
}
