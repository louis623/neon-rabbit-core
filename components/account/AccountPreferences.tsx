import { Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { updateAccountProfile, updateCommunicationPreferences } from "@/app/account/actions";
import type { CurrentSparkleFinderAccountState } from "@/lib/sparkle-finder/account-service";

const inputClassName =
  "min-h-11 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-normal text-[var(--sparkle-ink)]";

type AccountPreferencesProps = {
  accountState: CurrentSparkleFinderAccountState & { status: "authenticated" };
};

export function AccountPreferences({ accountState }: AccountPreferencesProps) {
  const consent = accountState.communicationConsent;
  const customer = accountState.customer;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form
        action={updateAccountProfile}
        aria-label="Sparkle Finder account profile form"
        className="grid gap-4 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]"
      >
        <div className="flex items-start gap-3">
          <UserRound aria-hidden="true" className="mt-1 size-5 text-[var(--sparkle-coral)]" />
          <div>
            <h2 className="text-lg font-bold text-[var(--sparkle-plum-deep)]">Profile basics</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
              Phone is used for account identification, recovery, trial protection, and security notices. We do not sell
              your phone number.
            </p>
          </div>
        </div>

        <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
          Display name
          <input
            autoComplete="name"
            className={inputClassName}
            defaultValue={accountState.displayName}
            maxLength={80}
            name="displayName"
            required
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
          Email
          <input className={inputClassName} defaultValue={accountState.email ?? ""} disabled type="email" />
          <span className="text-xs font-semibold leading-5 text-[var(--sparkle-ink-muted)]">
            Account email is required for sign-in and service notices.
          </span>
        </label>

        <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
          Phone
          <input
            autoComplete="tel"
            className={inputClassName}
            defaultValue={customer?.phoneE164 ?? ""}
            name="phone"
            placeholder="555-123-4567"
            type="tel"
          />
          <span className="text-xs font-semibold leading-5 text-[var(--sparkle-ink-muted)]">
            Marketing texts are optional and separate from account/security notices.
          </span>
        </label>

        <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
          State
          <input
            autoComplete="address-level1"
            className={inputClassName}
            defaultValue={customer?.state ?? ""}
            maxLength={40}
            name="state"
          />
        </label>

        <button
          className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-5 text-sm font-bold text-white"
          type="submit"
        >
          <ShieldCheck aria-hidden="true" className="size-4" />
          Save profile basics
        </button>
      </form>

      <form
        action={updateCommunicationPreferences}
        aria-label="Sparkle Finder communication preferences form"
        className="grid gap-4 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]"
      >
        <div className="flex items-start gap-3">
          <Mail aria-hidden="true" className="mt-1 size-5 text-[var(--sparkle-coral)]" />
          <div>
            <h2 className="text-lg font-bold text-[var(--sparkle-plum-deep)]">Communication preferences</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
              Required account email stays on. Promotional email and promotional SMS are optional.
            </p>
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white p-3 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
          <input checked disabled className="mt-1" name="accountEmailRequired" type="checkbox" value="yes" />
          <span>
            <span className="block font-bold text-[var(--sparkle-plum-deep)]">Required account email</span>
            Used for sign-in, recovery, trial status, and security notices.
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white p-3 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
          <input
            className="mt-1"
            defaultChecked={Boolean(consent.privacyAcknowledgedAt)}
            disabled={Boolean(consent.privacyAcknowledgedAt)}
            name="privacyAcknowledged"
            required={!consent.privacyAcknowledgedAt}
            type="checkbox"
            value="yes"
          />
          <span>
            <span className="block font-bold text-[var(--sparkle-plum-deep)]">Privacy acknowledgment</span>
            I acknowledge the{" "}
            <a className="font-bold text-[var(--sparkle-rose)] underline-offset-4 hover:underline" href="/privacy-policy">
              Sparkle Finder privacy terms
            </a>{" "}
            and agree that my account details are used to provide the 45-day Silver trial and account support.
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white p-3 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
          <input
            className="mt-1"
            defaultChecked={consent.accountSmsAllowed}
            name="accountSmsAllowed"
            type="checkbox"
            value="yes"
          />
          <span>
            <span className="block font-bold text-[var(--sparkle-plum-deep)]">Account/security SMS notices</span>
            Phone notices may support account recovery, trial protection, and security messages. This does not enable
            phone OTP sign-in.
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white p-3 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
          <input
            className="mt-1"
            defaultChecked={consent.promotionalEmailOptIn}
            name="promotionalEmail"
            type="checkbox"
            value="yes"
          />
          <span>
            <span className="block font-bold text-[var(--sparkle-plum-deep)]">Optional promotional email</span>
            Email me Sparkle Finder updates, Silver tips, and future launch notes.
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white p-3 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
          <input
            className="mt-1"
            defaultChecked={consent.promotionalSmsOptIn}
            name="promotionalSms"
            type="checkbox"
            value="yes"
          />
          <span>
            <span className="block font-bold text-[var(--sparkle-plum-deep)]">Optional promotional SMS</span>
            Text me optional promotional messages. Consent is optional and can be turned off here.
          </span>
        </label>

        <p className="flex items-start gap-2 text-xs font-semibold leading-5 text-[var(--sparkle-ink-muted)]">
          <Phone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--sparkle-coral)]" />
          Opting in records a server timestamp. Opting out clears promotional consent timestamps.
        </p>

        <button
          className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-5 text-sm font-bold text-white"
          type="submit"
        >
          <ShieldCheck aria-hidden="true" className="size-4" />
          Save communication preferences
        </button>
      </form>
    </div>
  );
}
