'use client'

import { useState } from 'react'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

function readFormValue(formData: FormData, name: string) {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

export function PrelaunchWaitlistForm() {
  const [state, setState] = useState<FormState>('idle')
  const [message, setMessage] = useState('')

  if (state === 'success') {
    return (
      <section className="prelaunch-section" id="waitlist">
        <div className="prelaunch-shell">
          <div className="prelaunch-card max-w-3xl p-8 sm:p-10">
            <h2 className="prelaunch-display text-4xl text-[var(--prelaunch-plum-ink)]">
              You&apos;re on the list.
            </h2>
            <p className="mt-4 text-lg leading-8 text-[var(--prelaunch-muted)]">
              We&apos;ll reach out by email and text when Sparkle Suite is ready.
              Thanks for being early.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="prelaunch-section" id="waitlist">
      <div className="prelaunch-shell grid gap-10 lg:grid-cols-[0.86fr_1.14fr]">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--prelaunch-muted)]">
            Join the Waitlist
          </p>
          <h2 className="prelaunch-display text-4xl leading-tight text-[var(--prelaunch-plum-ink)] sm:text-5xl">
            Tell us where to send launch updates.
          </h2>
          <p className="mt-5 text-lg leading-8 text-[var(--prelaunch-muted)]">
            Want launch updates without starting intake yet? Join here. Start
            with the intake form if you want us to review fit and follow up.
          </p>
        </div>

        <form
          className="prelaunch-card grid gap-5 p-6 sm:p-8"
          onSubmit={async (event) => {
            event.preventDefault()
            setState('submitting')
            setMessage('')

            const formData = new FormData(event.currentTarget)
            const response = await fetch('/api/prelaunch/waitlist', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                name: readFormValue(formData, 'name'),
                email: readFormValue(formData, 'email'),
                phone: readFormValue(formData, 'phone'),
                tiktokHandle: readFormValue(formData, 'tiktokHandle'),
                teamRepName: readFormValue(formData, 'teamRepName'),
                setupPain: readFormValue(formData, 'setupPain'),
                website: readFormValue(formData, 'website'),
                smsConsent: formData.get('smsConsent') === 'on',
                emailConsent: formData.get('emailConsent') === 'on',
              }),
            })

            if (!response.ok) {
              const payload = (await response.json().catch(() => null)) as {
                error?: string
              } | null
              setState('error')
              setMessage(payload?.error ?? 'Waitlist signup failed.')
              return
            }

            setState('success')
          }}
        >
          <input
            autoComplete="off"
            className="hidden"
            name="website"
            tabIndex={-1}
            type="text"
          />
          <label className="grid gap-2 text-sm font-semibold text-[var(--prelaunch-plum-ink)]">
            Name
            <input
              autoComplete="name"
              className="prelaunch-input"
              name="name"
              required
            />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-[var(--prelaunch-plum-ink)]">
              Email
              <input
                autoComplete="email"
                className="prelaunch-input"
                name="email"
                required
                type="email"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--prelaunch-plum-ink)]">
              Phone
              <input
                autoComplete="tel"
                className="prelaunch-input"
                name="phone"
                required
                type="tel"
              />
            </label>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-[var(--prelaunch-plum-ink)]">
              TikTok handle
              <input className="prelaunch-input" name="tiktokHandle" required />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--prelaunch-plum-ink)]">
              Team rep name
              <input className="prelaunch-input" name="teamRepName" required />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-[var(--prelaunch-plum-ink)]">
            What&apos;s the hardest part of your online setup right now?
            <textarea className="prelaunch-input min-h-28" name="setupPain" />
          </label>
          <label className="flex gap-3 text-sm leading-6 text-[var(--prelaunch-muted)]">
            <input className="mt-1 h-4 w-4" name="smsConsent" required type="checkbox" />
            <span>I agree to get launch updates by text.</span>
          </label>
          <p className="-mt-3 text-xs leading-5 text-[var(--prelaunch-muted)]">
            Message frequency may vary. Message and data rates may apply.
            Consent is not a condition of purchase. Reply STOP to unsubscribe or
            HELP for help. Wireless carriers are not liable for delayed or
            undelivered messages. SMS opt-in data is not sold, rented, traded,
            or shared for third-party marketing. See our{' '}
            <a className="prelaunch-link" href="/privacy-policy">
              Privacy Policy
            </a>{' '}
            and{' '}
            <a className="prelaunch-link" href="/terms-and-conditions">
              Terms and Conditions
            </a>
            .
          </p>
          <label className="flex gap-3 text-sm leading-6 text-[var(--prelaunch-muted)]">
            <input
              className="mt-1 h-4 w-4"
              name="emailConsent"
              required
              type="checkbox"
            />
            <span>I agree to get launch updates by email.</span>
          </label>
          {state === 'error' ? (
            <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900">
              {message}
            </p>
          ) : null}
          <button
            className="prelaunch-button w-full"
            disabled={state === 'submitting'}
            type="submit"
          >
            {state === 'submitting' ? 'Saving your spot...' : 'Join the Waitlist'}
          </button>
        </form>
      </div>
    </section>
  )
}
