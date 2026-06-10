'use client'

import { type FormEvent, useState } from 'react'
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

export function StartSparkleSuiteForm({
  reviewerSmokeVisible = false,
}: {
  reviewerSmokeVisible?: boolean
}) {
  const [reviewToken] = useState(() => {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get('review')?.trim() ?? ''
  })
  const [referralCode] = useState(() => {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get('ref')?.trim() ?? ''
  })
  const [agreementAccepted, setAgreementAccepted] = useState(false)
  const [emailSignupOpen, setEmailSignupOpen] = useState(false)
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

  async function openCheckout(activeReferralCode = referralCode) {
    const checkoutResponse = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        planType: 'monthly',
        agreementAccepted: true,
        referralCode: activeReferralCode || undefined,
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
  }

  async function startGoogleSignup() {
    if (!agreementAccepted) {
      setError('Please agree to the Sparkle Suite Terms before checkout.')
      return
    }

    setBusy(true)
    setError(null)
    setFieldErrors(undefined)

    const supabase = createClient()
    const authCallbackUrl = new URL('/api/auth/callback', window.location.origin)
    authCallbackUrl.searchParams.set(
      'next',
      '/nic-nac?onboarding=checkout-required',
    )
    if (referralCode) {
      authCallbackUrl.searchParams.set('ref', referralCode)
    }

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: authCallbackUrl.toString(),
      },
    })

    if (signInError) {
      setError(signInError.message)
      setBusy(false)
    }
  }

  async function startEmailSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setFieldErrors(undefined)

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim().toLowerCase()
    const password = String(form.get('password') ?? '')
    const passwordConfirm = String(form.get('passwordConfirm') ?? '')
    const submittedReferralCode =
      String(form.get('referralCode') ?? '').trim() || referralCode

    try {
      if (!agreementAccepted) {
        throw new Error('Please agree to the Sparkle Suite Terms before checkout.')
      }

      if (password !== passwordConfirm) {
        setFieldErrors({
          passwordConfirm: ['Enter the same password twice.'],
        })
        throw new Error('Enter the same password twice.')
      }

      const response = await fetch('/api/self-serve/signup', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          displayName: form.get('displayName'),
          email,
          password,
          referralCode: submittedReferralCode || undefined,
        }),
      })
      const payload = (await response.json().catch(() => null)) as
        | SignupResponse
        | null

      if (!response.ok || !isSignupSuccess(payload)) {
        const failed = payload && !isSignupSuccess(payload) ? payload : undefined
        setFieldErrors(failed?.fields)
        throw new Error(failed?.error || 'Unable to create your account.')
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

      await openCheckout(submittedReferralCode)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to create your account.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.formStack}>
      {reviewerSmokeVisible ? (
        <section className={styles.reviewerPanel} aria-label="Reviewer smoke mode">
          <div>
            <span>Reviewer smoke mode</span>
            <h3>Review the customer path</h3>
            <p>
              Use Stripe test checkout for the real customer path, or open
              seeded previews for setup and workspace smoke checks.
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
              onClick={() => startReviewerSmoke('required_setup')}
              disabled={reviewerBusy !== null || busy}
            >
              {reviewerBusy === 'required_setup'
                ? 'Preparing...'
                : 'Open setup preview'}
            </button>
            <button
              type="button"
              onClick={() => startReviewerSmoke('dashboard_unlocked')}
              disabled={reviewerBusy !== null || busy}
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
      ) : null}

      <section className={styles.form} aria-label="Start Sparkle Suite account creation">
        <div className={styles.formHead}>
          <span>Let's get started</span>
          <h2>Account creation</h2>
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            disabled={busy || !agreementAccepted}
            onClick={startGoogleSignup}
          >
            {busy ? 'Opening Google...' : 'Continue with Google'}
          </button>
          <button
            className={styles.secondaryButton}
            disabled={busy}
            type="button"
            aria-expanded={emailSignupOpen}
            onClick={() => {
              setError(null)
              setFieldErrors(undefined)
              setEmailSignupOpen(true)
            }}
          >
            Create account with a different email
          </button>
          <a className={styles.signInLink} href="/login">
            Sign in instead
          </a>
        </div>

        <label className={styles.termsCheck}>
          <input
            name="agreementAccepted"
            type="checkbox"
            value="true"
            checked={agreementAccepted}
            onChange={(event) => setAgreementAccepted(event.currentTarget.checked)}
          />
          <span>
            I agree to the{' '}
            <a href="/terms-and-conditions" target="_blank" rel="noreferrer">
              Sparkle Suite Terms
            </a>
            .
          </span>
        </label>

        {error ? <div className={styles.error}>{error}</div> : null}

        {emailSignupOpen ? (
          <form
            aria-label="Create account with email"
            className={styles.emailSignupPanel}
            onSubmit={startEmailSignup}
          >
            <div className={styles.emailSignupHeader}>
              <h3>Email account</h3>
              <button
                type="button"
                className={styles.closePanelButton}
                disabled={busy}
                onClick={() => setEmailSignupOpen(false)}
              >
                Close
              </button>
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
              <span>Referral code</span>
              <input
                name="referralCode"
                autoComplete="off"
                defaultValue={referralCode}
                placeholder="SS-K7M4Q9"
              />
              {firstFieldError(fieldErrors, 'referralCode') ? (
                <em>{firstFieldError(fieldErrors, 'referralCode')}</em>
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

            <label>
              <span>Confirm password</span>
              <input
                name="passwordConfirm"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
              {firstFieldError(fieldErrors, 'passwordConfirm') ? (
                <em>{firstFieldError(fieldErrors, 'passwordConfirm')}</em>
              ) : null}
            </label>

            <button type="submit" disabled={busy || !agreementAccepted}>
              {busy ? 'Creating account...' : 'Create account and continue'}
            </button>
          </form>
        ) : null}
      </section>
    </div>
  )
}
