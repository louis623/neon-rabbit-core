'use client'

import { useState } from 'react'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

function readFormValue(formData: FormData, name: string) {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

export function PrelaunchIntakeForm() {
  const [state, setState] = useState<FormState>('idle')
  const [message, setMessage] = useState('')

  if (state === 'success') {
    return (
      <section className="prelaunch-section bg-white" id="intake">
        <div className="prelaunch-shell">
          <div className="prelaunch-card max-w-3xl p-8 sm:p-10">
            <h2 className="prelaunch-display text-4xl text-[var(--prelaunch-plum-ink)]">
              Intake received.
            </h2>
            <p className="mt-4 text-lg leading-8 text-[var(--prelaunch-muted)]">
              Nic-Nac saved your first pre-qualification answers. We&apos;ll review
              fit and follow up with the next practical step.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="prelaunch-section bg-white" id="intake">
      <div className="prelaunch-shell grid gap-10 lg:grid-cols-[0.82fr_1.18fr]">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--prelaunch-muted)]">
            Start Intake
          </p>
          <h2 className="prelaunch-display text-4xl leading-tight text-[var(--prelaunch-plum-ink)] sm:text-5xl">
            Nic-Nac pre-qualification
          </h2>
          <p className="mt-5 text-lg leading-8 text-[var(--prelaunch-muted)]">
            Share enough context for a useful first review. This is a fit check,
            not a sales pitch.
          </p>
        </div>

        <form
          className="prelaunch-card grid gap-5 p-6 sm:p-8"
          onSubmit={async (event) => {
            event.preventDefault()
            setState('submitting')
            setMessage('')

            const formData = new FormData(event.currentTarget)
            const response = await fetch('/api/prelaunch/intake', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                fullName: readFormValue(formData, 'fullName'),
                email: readFormValue(formData, 'email'),
                phone: readFormValue(formData, 'phone'),
                businessName: readFormValue(formData, 'businessName'),
                tiktokHandle: readFormValue(formData, 'tiktokHandle'),
                instagramHandle: readFormValue(formData, 'instagramHandle'),
                facebookUrl: readFormValue(formData, 'facebookUrl'),
                teamName: readFormValue(formData, 'teamName'),
                teamSize: readFormValue(formData, 'teamSize'),
                primaryPlatform: readFormValue(formData, 'primaryPlatform'),
                streamingFrequency: readFormValue(
                  formData,
                  'streamingFrequency',
                ),
                currentSetup: readFormValue(formData, 'currentSetup'),
                setupGoal: readFormValue(formData, 'setupGoal'),
                deviceSetup: readFormValue(formData, 'deviceSetup'),
                brandVibe: readFormValue(formData, 'brandVibe'),
                colorPreferences: readFormValue(formData, 'colorPreferences'),
                specialRequests: readFormValue(formData, 'specialRequests'),
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
              setMessage(payload?.error ?? 'Intake submission failed.')
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
              name="fullName"
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
          <label className="grid gap-2 text-sm font-semibold text-[var(--prelaunch-plum-ink)]">
            Business name
            <input
              autoComplete="organization"
              className="prelaunch-input"
              name="businessName"
              required
            />
          </label>
          <div className="grid gap-5 sm:grid-cols-3">
            <label className="grid gap-2 text-sm font-semibold text-[var(--prelaunch-plum-ink)]">
              TikTok handle
              <input className="prelaunch-input" name="tiktokHandle" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--prelaunch-plum-ink)]">
              Instagram handle
              <input className="prelaunch-input" name="instagramHandle" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--prelaunch-plum-ink)]">
              Facebook URL
              <input className="prelaunch-input" name="facebookUrl" />
            </label>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-[var(--prelaunch-plum-ink)]">
              Team name
              <input className="prelaunch-input" name="teamName" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--prelaunch-plum-ink)]">
              Team size
              <select className="prelaunch-input" name="teamSize" required>
                <option value="">Select one</option>
                <option value="1-5">1-5 reps</option>
                <option value="6-20">6-20 reps</option>
                <option value="21-50">21-50 reps</option>
                <option value="51-plus">51+ reps</option>
              </select>
            </label>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-[var(--prelaunch-plum-ink)]">
              Primary live platform
              <select className="prelaunch-input" name="primaryPlatform" required>
                <option value="">Select one</option>
                <option value="tiktok">TikTok</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="multiple">Multiple platforms</option>
                <option value="not_sure">Not sure yet</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--prelaunch-plum-ink)]">
              How often are you live right now?
              <select
                className="prelaunch-input"
                name="streamingFrequency"
                required
              >
                <option value="">Select one</option>
                <option value="not_live_yet">Not live yet</option>
                <option value="occasional">Occasionally</option>
                <option value="weekly">Weekly</option>
                <option value="multiple_weekly">Multiple times a week</option>
              </select>
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-[var(--prelaunch-plum-ink)]">
            What are you using online today?
            <textarea
              className="prelaunch-input min-h-24"
              name="currentSetup"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[var(--prelaunch-plum-ink)]">
            What do you want Sparkle Suite to help with first?
            <textarea
              className="prelaunch-input min-h-24"
              name="setupGoal"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-[var(--prelaunch-plum-ink)]">
            Do you use a computer or tablet while you stream?
            <select className="prelaunch-input" name="deviceSetup" required>
              <option value="">Select one</option>
              <option value="phone_only">Phone only</option>
              <option value="phone_and_computer">Phone and computer</option>
              <option value="phone_and_tablet">Phone and tablet</option>
              <option value="not_sure">Not sure</option>
            </select>
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-[var(--prelaunch-plum-ink)]">
              Brand vibe
              <input className="prelaunch-input" name="brandVibe" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[var(--prelaunch-plum-ink)]">
              Color preferences
              <input className="prelaunch-input" name="colorPreferences" />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold text-[var(--prelaunch-plum-ink)]">
            Special requests or concerns
            <textarea className="prelaunch-input min-h-24" name="specialRequests" />
          </label>
          <label className="flex gap-3 text-sm leading-6 text-[var(--prelaunch-muted)]">
            <input className="mt-1 h-4 w-4" name="smsConsent" required type="checkbox" />
            <span>I agree to get intake follow-up by text.</span>
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
            <span>I agree to get intake follow-up by email.</span>
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
            {state === 'submitting' ? 'Saving intake...' : 'Submit Intake'}
          </button>
        </form>
      </div>
    </section>
  )
}
