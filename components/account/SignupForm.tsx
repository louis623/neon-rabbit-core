import { Gem, Mail, ShieldCheck } from "lucide-react";
import { signUpWithPassword } from "@/app/auth/sign-up/actions";

const inputClassName =
  "min-h-11 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-normal text-[var(--sparkle-ink)]";

export function SignupForm() {
  return (
    <form
      action={signUpWithPassword}
      aria-label="Sparkle Finder signup form"
      className="grid gap-4 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]"
    >
      <div className="flex items-start gap-3">
        <Gem aria-hidden="true" className="mt-1 size-5 text-[var(--sparkle-coral)]" />
        <div>
          <h2 className="text-lg font-bold text-[var(--sparkle-plum-deep)]">Create your Silver trial</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            Start with a 45-day Silver trial, then keep browsing for free if you do not continue Silver.
          </p>
        </div>
      </div>

      <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
        Display name
        <input
          autoComplete="name"
          className={inputClassName}
          maxLength={80}
          name="displayName"
          placeholder="Sparkle Mama"
          required
        />
      </label>

      <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
        Email
        <input
          autoComplete="email"
          className={inputClassName}
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />
      </label>

      <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
        Phone
        <input
          autoComplete="tel"
          className={inputClassName}
          name="phone"
          placeholder="555-123-4567"
          required
          type="tel"
        />
        <span className="text-xs font-semibold leading-5 text-[var(--sparkle-ink-muted)]">
          Used for account verification, recovery, and trial protection. Not sold. Marketing texts are optional.
        </span>
      </label>

      <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
        State
        <input autoComplete="address-level1" className={inputClassName} maxLength={40} name="state" required />
      </label>

      <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
        Password
        <input
          autoComplete="new-password"
          className={inputClassName}
          minLength={8}
          name="password"
          required
          type="password"
        />
      </label>

      <fieldset className="grid gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] p-3">
        <legend className="px-1 text-sm font-bold text-[var(--sparkle-plum-deep)]">Privacy and updates</legend>
        <label className="flex items-start gap-3 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
          <input className="mt-1" name="privacyAcknowledged" required type="checkbox" value="yes" />
          <span>
            I acknowledge the Sparkle Finder privacy terms and agree that my account details are used to provide the
            45-day Silver trial and account support.
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
          <input className="mt-1" name="promotionalEmail" type="checkbox" value="yes" />
          <span>Email me optional Sparkle Finder updates and Silver tips.</span>
        </label>
        <label className="flex items-start gap-3 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
          <input className="mt-1" name="promotionalSms" type="checkbox" value="yes" />
          <span>Text me optional promotional messages. Consent is optional.</span>
        </label>
      </fieldset>

      <button
        className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-5 text-sm font-bold text-white"
        type="submit"
      >
        <Mail aria-hidden="true" className="size-4" />
        Create account
      </button>

      <p className="flex items-start gap-2 text-xs font-semibold leading-5 text-[var(--sparkle-ink-muted)]">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--sparkle-coral)]" />
        Password signup sends the normal Supabase confirmation email when auth is configured.
      </p>
    </form>
  );
}
