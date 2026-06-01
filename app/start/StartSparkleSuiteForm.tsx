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
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] =
    useState<Record<string, string[]> | undefined>()
  const [busy, setBusy] = useState(false)

  return (
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

        try {
          const response = await fetch('/api/self-serve/signup', {
            method: 'POST',
            credentials: 'include',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              displayName: form.get('displayName'),
              businessName: form.get('businessName'),
              email,
              password,
              phone: form.get('phone'),
              primarySocialUrl: form.get('primarySocialUrl'),
              shopUrl: form.get('shopUrl'),
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

          window.location.href = payload.next
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
        <span>Business name</span>
        <input name="businessName" autoComplete="organization" required />
        {firstFieldError(fieldErrors, 'businessName') ? (
          <em>{firstFieldError(fieldErrors, 'businessName')}</em>
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

      <div className={styles.split}>
        <label>
          <span>Phone</span>
          <input name="phone" type="tel" autoComplete="tel" />
        </label>
        <label>
          <span>Primary live/social link</span>
          <input name="primarySocialUrl" type="url" />
        </label>
      </div>

      <label>
        <span>Shop link</span>
        <input name="shopUrl" type="url" />
      </label>

      <p className={styles.accountNotice}>
        Sparkle Suite sends account and setup updates for this private workspace.
      </p>
      <p className={styles.termsNote}>
        Terms are reviewed separately in the checkout review before payment.
      </p>

      {error ? <div className={styles.error}>{error}</div> : null}

      <button type="submit" disabled={busy}>
        {busy ? 'Creating account...' : 'Create account and continue'}
      </button>
    </form>
  )
}
