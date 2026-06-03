'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import styles from './start.module.css'

type SignupResponse =
  | {
      ok: true
      email: string
      next: string
    }
  | {
      ok?: false
      error?: string
      fields?: Record<string, string[]>
    }

type CheckoutResponse = {
  url?: string | null
  error?: string
}

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

function isSignupSuccess(
  payload: SignupResponse | null,
): payload is Extract<SignupResponse, { ok: true }> {
  return payload?.ok === true
}

function firstFieldError(
  fields: Record<string, string[]> | undefined,
  key: string,
) {
  return fields?.[key]?.[0] ?? null
}

export function StartSparkleSuiteForm() {
  const [reviewToken] = useState(() => {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get('review')?.trim() ?? ''
  })
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] =
    useState<Record<string, string[]> | undefined>()
  const [busy, setBusy] = useState(false)
  const [reviewerBusy, setReviewerBusy] = useState<ReviewerSmokeState | null>(
    null,
  )
  const [reviewerError, setReviewerError] = useState<string | null>(null)

  async function startReviewerSmoke(state: ReviewerSmokeState) {
    setReviewerBusy(state)
    setReviewerError(null)
    setError(null)
    setFieldErrors(undefined)

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

      const separator = payload.next.includes('?') ? '&' : '?'
      window.location.href = `${payload.next}${separator}review=${encodeURIComponent(reviewToken)}`
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
      {reviewToken ? (
        <section className={styles.reviewerPanel} aria-label="Reviewer smoke mode">
          <div>
            <span>Reviewer smoke mode</span>
            <h3>Review the customer path</h3>
            <p>
              Reset the reusable test rep and open checkout without using your
              personal account details.
            </p>
          </div>
          <div className={styles.reviewerActions}>
            <button
              type="button"
              className={styles.reviewerPrimaryAction}
              onClick={() => startReviewerSmoke('checkout_required')}
              disabled={reviewerBusy !== null || busy}
            >
              {reviewerBusy === 'checkout_required'
                ? 'Preparing...'
                : 'Start smoke checkout'}
            </button>
            <button
              type="button"
              onClick={() => startReviewerSmoke('dashboard_unlocked')}
              disabled={reviewerBusy !== null || busy}
            >
              {reviewerBusy === 'dashboard_unlocked'
                ? 'Preparing...'
                : 'Open dashboard preview'}
            </button>
          </div>
          {reviewerError ? (
            <p className={styles.reviewerError}>{reviewerError}</p>
          ) : null}
        </section>
      ) : null}
      <form
        className={styles.form}
        onSubmit={async (event) => {
        event.preventDefault()
        setBusy(true)
        setError(null)
        setFieldErrors(undefined)

        const form = new FormData(event.currentTarget)
        const email = String(form.get('email') ?? '').trim().toLowerCase()
        const password = String(form.get('password') ?? '')
        const agreementAccepted = form.get('agreementAccepted') === 'true'

        try {
          if (!agreementAccepted) {
            throw new Error(
              'Please accept the Sparkle Suite terms step before checkout.',
            )
          }

          const response = await fetch('/api/self-serve/signup', {
            method: 'POST',
            credentials: 'include',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              displayName: form.get('displayName'),
              email,
              password,
            }),
          })
          const payload = (await response.json().catch(() => null)) as
            | SignupResponse
            | null

          if (!response.ok || !isSignupSuccess(payload)) {
            const failed =
              payload && !isSignupSuccess(payload) ? payload : undefined
            setFieldErrors(failed?.fields)
            throw new Error(
              failed?.error || 'Unable to create your account.',
            )
          }

          const supabase = createClient()
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })
          if (signInError) {
            throw new Error(
              'Your account was created, but sign-in did not finish. Please sign in to continue.',
            )
          }

          const checkoutResponse = await fetch('/api/stripe/create-checkout', {
            method: 'POST',
            credentials: 'include',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              planType: 'monthly',
              agreementAccepted: true,
            }),
          })
          const checkoutPayload = (await checkoutResponse
            .json()
            .catch(() => null)) as CheckoutResponse | null

          if (!checkoutResponse.ok || !checkoutPayload?.url) {
            throw new Error(
              checkoutPayload?.error ||
                'Your account is ready, but checkout did not open. Please continue from Nic-Nac.',
            )
          }

          window.location.href = checkoutPayload.url
        } catch (caught) {
          setError(
            caught instanceof Error
              ? caught.message
              : 'Unable to create your account.',
          )
        } finally {
          setBusy(false)
        }
      }}
    >
      <div className={styles.formHead}>
        <span>Private account start</span>
        <h2>Create your rep account</h2>
        <p>
          No card is needed on this step. Your checkout review comes next.
        </p>
      </div>

      <label>
        <span>Your name</span>
        <input name="displayName" autoComplete="name" required />
        {firstFieldError(fieldErrors, 'displayName') ? (
          <em>{firstFieldError(fieldErrors, 'displayName')}</em>
        ) : null}
      </label>

      <label>
        <span>Email</span>
        <input name="email" type="email" autoComplete="email" required />
        {firstFieldError(fieldErrors, 'email') ? (
          <em>{firstFieldError(fieldErrors, 'email')}</em>
        ) : null}
      </label>

      <label>
        <span>Password</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        {firstFieldError(fieldErrors, 'password') ? (
          <em>{firstFieldError(fieldErrors, 'password')}</em>
        ) : null}
      </label>

      <p className={styles.accountNotice}>
        Sparkle Suite sends account and setup updates for this private workspace.
      </p>

      <label className={styles.termsCheck}>
        <input
          name="agreementAccepted"
          type="checkbox"
          value="true"
          required
        />
        <span>
          I agree to review and accept the Sparkle Suite terms before payment.
        </span>
      </label>

      {error ? <div className={styles.error}>{error}</div> : null}

      <button type="submit" disabled={busy}>
        {busy ? 'Creating account...' : 'Create account and continue'}
      </button>
      <button
        className={styles.secondaryButton}
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          setError(null)
          setFieldErrors(undefined)

          const supabase = createClient()
          const { error: signInError } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/api/auth/callback?next=/nic-nac?onboarding=checkout-required`,
            },
          })

          if (signInError) {
            setError(signInError.message)
            setBusy(false)
          }
        }}
        type="button"
      >
        Continue with Google
      </button>
      </form>
    </div>
  )
}
