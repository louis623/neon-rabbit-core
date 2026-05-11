'use client'

import { type ChangeEvent, type FormEvent, useState } from 'react'

import { prelaunchContent } from '@/lib/prelaunch/content'

type WaitlistFormValues = {
  name: string
  email: string
  phone: string
  tiktokHandle: string
  teamRepName: string
  setupPain: string
  website: string
  smsConsent: boolean
  emailConsent: boolean
}

const initialValues: WaitlistFormValues = {
  name: '',
  email: '',
  phone: '',
  tiktokHandle: '',
  teamRepName: '',
  setupPain: '',
  website: '',
  smsConsent: false,
  emailConsent: false,
}

export function PrelaunchWaitlistForm() {
  const [values, setValues] = useState<WaitlistFormValues>(initialValues)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const target = event.currentTarget
    const { name } = target

    if (target instanceof HTMLInputElement && target.type === 'checkbox') {
      setValues((current) => ({
        ...current,
        [name]: target.checked,
      }))
      return
    }

    setValues((current) => ({
      ...current,
      [name]: target.value,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/prelaunch/waitlist', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error || prelaunchContent.waitlistErrorFallback)
      }

      setIsSubmitted(true)
      setValues(initialValues)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : prelaunchContent.waitlistErrorFallback,
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      id="waitlist"
      className="bg-[linear-gradient(180deg,#fff4f8_0%,#ffffff_100%)] px-6 py-16"
    >
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-[color:rgba(90,52,92,0.14)] bg-white p-8 shadow-[0_24px_70px_rgba(90,52,92,0.08)] sm:p-10">
        <div className="max-w-3xl space-y-4">
          <h2 className="font-amethyst-display text-3xl text-[var(--prelaunch-plum-ink)] sm:text-4xl">
            {prelaunchContent.waitlistHeading}
          </h2>
          <p className="text-base leading-7 text-[color:rgba(90,52,92,0.82)]">
            {prelaunchContent.waitlistBody}
          </p>
        </div>

        {isSubmitted ? (
          <div
            aria-live="polite"
            className="mt-8 rounded-[1.5rem] bg-[var(--prelaunch-pearl-blush)] p-6 text-[var(--prelaunch-plum-ink)]"
          >
            <h3 className="font-amethyst-display text-2xl">
              {prelaunchContent.waitlistSuccessTitle}
            </h3>
            <p className="mt-3 max-w-2xl text-base leading-7">
              {prelaunchContent.waitlistSuccessBody}
            </p>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <fieldset className="space-y-6" disabled={isSubmitting}>
              <input
                autoComplete="off"
                className="hidden"
                name="website"
                onChange={handleChange}
                tabIndex={-1}
                type="text"
                value={values.website}
              />
              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  autoComplete="name"
                  id="waitlist-name"
                  label={prelaunchContent.waitlistFields.name.label}
                  name="name"
                  onChange={handleChange}
                  placeholder={prelaunchContent.waitlistFields.name.placeholder}
                  required
                  value={values.name}
                />
                <FormField
                  autoComplete="email"
                  id="waitlist-email"
                  label={prelaunchContent.waitlistFields.email.label}
                  name="email"
                  onChange={handleChange}
                  placeholder={prelaunchContent.waitlistFields.email.placeholder}
                  required
                  type="email"
                  value={values.email}
                />
                <FormField
                  autoComplete="tel"
                  id="waitlist-phone"
                  label={prelaunchContent.waitlistFields.phone.label}
                  name="phone"
                  onChange={handleChange}
                  placeholder={prelaunchContent.waitlistFields.phone.placeholder}
                  required
                  type="tel"
                  value={values.phone}
                />
                <FormField
                  id="waitlist-tiktok"
                  label={prelaunchContent.waitlistFields.tiktokHandle.label}
                  name="tiktokHandle"
                  onChange={handleChange}
                  placeholder={
                    prelaunchContent.waitlistFields.tiktokHandle.placeholder
                  }
                  required
                  value={values.tiktokHandle}
                />
                <FormField
                  id="waitlist-team-rep"
                  label={prelaunchContent.waitlistFields.teamRepName.label}
                  name="teamRepName"
                  onChange={handleChange}
                  placeholder={
                    prelaunchContent.waitlistFields.teamRepName.placeholder
                  }
                  required
                  value={values.teamRepName}
                />
              </div>

              <div className="space-y-2">
                <label
                  className="block text-sm font-semibold text-[var(--prelaunch-plum-ink)]"
                  htmlFor="waitlist-setup-pain"
                >
                  {prelaunchContent.waitlistFields.setupPain.label}
                </label>
                <textarea
                  className="min-h-32 w-full rounded-[1.25rem] border border-[color:rgba(90,52,92,0.16)] bg-[var(--prelaunch-pearl-blush)] px-4 py-3 text-base text-[var(--prelaunch-plum-ink)] outline-none transition focus:border-[var(--prelaunch-plum-ink)] focus:bg-white"
                  id="waitlist-setup-pain"
                  name="setupPain"
                  onChange={handleChange}
                  placeholder={
                    prelaunchContent.waitlistFields.setupPain.placeholder
                  }
                  value={values.setupPain}
                />
              </div>

              <div className="space-y-3 rounded-[1.5rem] bg-[var(--prelaunch-pearl-blush)] p-5">
                <CheckboxField
                  checked={values.smsConsent}
                  id="waitlist-sms-consent"
                  label={prelaunchContent.waitlistSmsConsentLabel}
                  name="smsConsent"
                  onChange={handleChange}
                  required
                />
                <p className="text-xs leading-5 text-[color:rgba(90,52,92,0.72)]">
                  Message frequency may vary. Message and data rates may apply.
                  Consent is not a condition of purchase. Reply STOP to
                  unsubscribe or HELP for help. Wireless carriers are not liable
                  for delayed or undelivered messages. SMS opt-in data is not
                  sold, rented, traded, or shared for third-party marketing. See
                  our{' '}
                  <a className="underline" href="/privacy-policy">
                    Privacy Policy
                  </a>{' '}
                  and{' '}
                  <a className="underline" href="/terms-and-conditions">
                    Terms and Conditions
                  </a>
                  .
                </p>
                <CheckboxField
                  checked={values.emailConsent}
                  id="waitlist-email-consent"
                  label={prelaunchContent.waitlistEmailConsentLabel}
                  name="emailConsent"
                  onChange={handleChange}
                  required
                />
              </div>
            </fieldset>

            {errorMessage ? (
              <p
                aria-live="polite"
                className="rounded-[1.25rem] border border-[color:rgba(170,63,94,0.18)] bg-[#fff0f4] px-4 py-3 text-sm font-medium text-[#8b3050]"
              >
                {errorMessage}
              </p>
            ) : null}

            <button
              className="rounded-full bg-[var(--prelaunch-plum-ink)] px-6 py-3 font-semibold text-white transition hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? prelaunchContent.waitlistSubmittingLabel
                : prelaunchContent.waitlistSubmitLabel}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}

type FormFieldProps = {
  autoComplete?: string
  id: string
  label: string
  name: keyof WaitlistFormValues
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  placeholder: string
  required?: boolean
  type?: 'email' | 'tel' | 'text'
  value: string
}

function FormField({
  autoComplete,
  id,
  label,
  name,
  onChange,
  placeholder,
  required,
  type = 'text',
  value,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label
        className="block text-sm font-semibold text-[var(--prelaunch-plum-ink)]"
        htmlFor={id}
      >
        {label}
      </label>
      <input
        autoComplete={autoComplete}
        className="w-full rounded-full border border-[color:rgba(90,52,92,0.16)] bg-[var(--prelaunch-pearl-blush)] px-4 py-3 text-base text-[var(--prelaunch-plum-ink)] outline-none transition focus:border-[var(--prelaunch-plum-ink)] focus:bg-white"
        id={id}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
    </div>
  )
}

type CheckboxFieldProps = {
  checked: boolean
  id: string
  label: string
  name: 'smsConsent' | 'emailConsent'
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  required?: boolean
}

function CheckboxField({
  checked,
  id,
  label,
  name,
  onChange,
  required,
}: CheckboxFieldProps) {
  return (
    <label
      className="flex items-start gap-3 text-sm leading-6 text-[var(--prelaunch-plum-ink)]"
      htmlFor={id}
    >
      <input
        checked={checked}
        className="mt-1 h-4 w-4 rounded border-[var(--prelaunch-plum-ink)] text-[var(--prelaunch-plum-ink)]"
        id={id}
        name={name}
        onChange={onChange}
        required={required}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  )
}
