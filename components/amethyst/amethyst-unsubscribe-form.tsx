'use client'

import { useState } from 'react'

type SubmitState =
  | { status: 'idle'; message: string }
  | { status: 'submitting'; message: string }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string }

export function AmethystUnsubscribeForm() {
  const [form, setForm] = useState({
    phone: '',
    email: '',
    unsubscribeSms: false,
    unsubscribeEmail: false,
  })
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: 'idle',
    message: '',
  })

  function updateField(key: keyof typeof form, value: string | boolean) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitState({ status: 'submitting', message: '' })

    try {
      const response = await fetch('/api/amethyst/customer-audience/unsubscribe', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setSubmitState({
          status: 'error',
          message:
            typeof payload?.error === 'string'
              ? payload.error
              : "We couldn't process your unsubscribe right now.",
        })
        return
      }

      setForm({
        phone: '',
        email: '',
        unsubscribeSms: false,
        unsubscribeEmail: false,
      })
      setSubmitState({
        status: 'success',
        message: "You're all set. We'll honor the preferences you selected.",
      })
    } catch (error) {
      setSubmitState({
        status: 'error',
        message: "We couldn't process your unsubscribe right now.",
      })
    }
  }

  return (
    <form
      action="/api/amethyst/customer-audience/unsubscribe"
      className="mt-10 space-y-5"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--amethyst-fg-muted)]">
            Phone number
          </span>
          <input
            className="w-full rounded-xl border border-[var(--amethyst-border)] bg-white px-4 py-3 text-[15px] text-[var(--amethyst-fg)] outline-none transition focus:border-[var(--amethyst-primary)]"
            name="phone"
            onChange={(event) => updateField('phone', event.target.value)}
            placeholder="(555) 555-5555"
            type="tel"
            value={form.phone}
          />
        </label>

        <label className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--amethyst-fg-muted)]">
            Email address
          </span>
          <input
            className="w-full rounded-xl border border-[var(--amethyst-border)] bg-white px-4 py-3 text-[15px] text-[var(--amethyst-fg)] outline-none transition focus:border-[var(--amethyst-primary)]"
            name="email"
            onChange={(event) => updateField('email', event.target.value)}
            placeholder="you@example.com"
            type="email"
            value={form.email}
          />
        </label>
      </div>

      <div className="grid gap-3 rounded-[1rem] border border-[var(--amethyst-border)] bg-white/70 p-4 text-sm text-[var(--amethyst-fg)]">
        <label className="flex items-start gap-3">
          <input
            checked={form.unsubscribeSms}
            className="mt-1"
            name="unsubscribe_sms"
            onChange={(event) =>
              updateField('unsubscribeSms', event.target.checked)
            }
            type="checkbox"
          />
          <span>Stop SMS updates</span>
        </label>
        <label className="flex items-start gap-3">
          <input
            checked={form.unsubscribeEmail}
            className="mt-1"
            name="unsubscribe_email"
            onChange={(event) =>
              updateField('unsubscribeEmail', event.target.checked)
            }
            type="checkbox"
          />
          <span>Stop email updates</span>
        </label>
      </div>

      <div className="flex flex-col items-center gap-4 pt-2">
        <button
          className="inline-flex items-center gap-2 rounded-full bg-[var(--amethyst-primary)] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[var(--amethyst-accent)]"
          disabled={submitState.status === 'submitting'}
          type="submit"
        >
          {submitState.status === 'submitting'
            ? 'Saving...'
            : 'Update preferences'}
        </button>
        <p className="max-w-2xl text-center text-xs leading-6 text-[var(--amethyst-fg-muted)]">
          Choose one or both channels. If you reply STOP during a text
          conversation, Sparkle Suite will also record that SMS opt-out.
        </p>
        {submitState.message ? (
          <p
            className={`text-sm ${
              submitState.status === 'success'
                ? 'text-[var(--amethyst-primary)]'
                : 'text-[#b42318]'
            }`}
          >
            {submitState.message}
          </p>
        ) : null}
      </div>
    </form>
  )
}
