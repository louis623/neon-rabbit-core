import { CalendarDays, Gem, LockKeyhole } from "lucide-react";
import type { CurrentSparkleFinderAccountState } from "@/lib/sparkle-finder/account-service";
import { isSparkleFinderCheckoutConfigured } from "@/lib/sparkle-finder/billing";

type SilverStatusPanelProps = {
  accountState: CurrentSparkleFinderAccountState & { status: "authenticated" };
  now?: Date;
};

export function SilverStatusPanel({ accountState, now = new Date() }: SilverStatusPanelProps) {
  const membership = accountState.membership;
  const effectiveState = membership?.effectiveState ?? "free";
  const trialEndsAt = membership?.trialEndsAt ?? null;
  const trialDaysLeft = trialEndsAt ? getDaysLeft(trialEndsAt, now) : null;
  const shouldShowUpgrade =
    effectiveState === "free" ||
    (effectiveState === "silver_trial" && typeof trialDaysLeft === "number" && trialDaysLeft <= 7);
  const isBillingConfigured = isSparkleFinderCheckoutConfigured();

  return (
    <section className="grid gap-4 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
      <div className="flex items-start gap-3">
        <Gem aria-hidden="true" className="mt-1 size-5 text-[var(--sparkle-coral)]" />
        <div>
          <h2 className="text-lg font-bold text-[var(--sparkle-plum-deep)]">Silver access</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            Current access state: <span className="font-bold text-[var(--sparkle-ink)]">{formatAccessState(effectiveState)}</span>
          </p>
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white p-3">
          <dt className="text-xs font-bold uppercase tracking-wide text-[var(--sparkle-ink-muted)]">Trial end date</dt>
          <dd className="mt-1 text-sm font-bold text-[var(--sparkle-plum-deep)]">
            {trialEndsAt ? formatDate(trialEndsAt) : "No trial end date on file"}
          </dd>
        </div>
        <div className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white p-3">
          <dt className="text-xs font-bold uppercase tracking-wide text-[var(--sparkle-ink-muted)]">Membership source</dt>
          <dd className="mt-1 text-sm font-bold text-[var(--sparkle-plum-deep)]">{membership?.silverSource ?? "none"}</dd>
        </div>
      </dl>

      {effectiveState === "silver_trial" ? (
        <div className="flex items-start gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white p-4">
          <CalendarDays aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[var(--sparkle-coral)]" />
          <p className="text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            Your <span className="font-bold text-[var(--sparkle-ink)]">45-day Silver trial</span> is active.
            {trialEndsAt ? (
              <>
                {" "}
                Trial ends {formatDate(trialEndsAt)}
                {typeof trialDaysLeft === "number" ? (
                  <>
                    {" "}
                    with <span className="font-bold text-[var(--sparkle-ink)]">{formatDaysLeft(trialDaysLeft)}</span>.
                  </>
                ) : null}
              </>
            ) : null}
          </p>
        </div>
      ) : null}

      {shouldShowUpgrade ? (
        <div className="grid gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white p-4">
          <div className="flex items-start gap-3">
            <LockKeyhole aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[var(--sparkle-coral)]" />
            <div>
              <h3 className="text-base font-bold text-[var(--sparkle-plum-deep)]">Continue Silver at $4.99/month</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
                {isBillingConfigured
                  ? "Start secure Stripe-hosted Checkout for monthly Silver access."
                  : "Paid checkout is temporarily unavailable until Stripe webhooks and secure membership writes are fully configured."}
              </p>
            </div>
          </div>
          {isBillingConfigured ? (
            <form action="/billing/checkout" method="post">
              <button
                className="inline-flex min-h-11 w-fit items-center justify-center rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-5 text-sm font-bold text-white"
                type="submit"
              >
                Continue Silver at $4.99/month
              </button>
            </form>
          ) : (
            <button
              className="inline-flex min-h-11 w-fit items-center justify-center rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-shell)] px-5 text-sm font-bold text-[var(--sparkle-ink-muted)]"
              disabled
              type="button"
            >
              Continue Silver at $4.99/month
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}

function formatAccessState(state: string): string {
  return state
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function getDaysLeft(value: string, now: Date): number {
  const end = new Date(value).getTime();
  const current = now.getTime();
  return Math.max(0, Math.ceil((end - current) / 86_400_000));
}

function formatDaysLeft(days: number): string {
  return days === 1 ? "1 day left" : `${days} days left`;
}
