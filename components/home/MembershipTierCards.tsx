import Link from "next/link";
import { CheckCircle2, Gem } from "lucide-react";

const silverTrialHighlights = [
  "Find pieces you like, follow reps, and track the next shows in one workflow.",
  "Keep favorites in your digital wishlist and add notes on what you are watching.",
  "Show off pieces you already own with a digital collection.",
] as const;

export function MembershipTierCards() {
  return (
    <section
      aria-label="Sparkle Finder membership tiers"
      className="grid gap-5 rounded-[var(--sparkle-radius-md)] border border-[var(--sparkle-border)] bg-white/70 p-5 shadow-[var(--sparkle-shadow-sm)] sm:p-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-start"
      data-smoke="public-membership-tiers"
      data-tone="light"
    >
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--sparkle-rose)]">Memberships</p>
        <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
          Start with your 45-day Silver Tier trial
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
          Silver opens the full collector workflow: jewelry search, rep boards, live show planning, wishlist, and
          collection showcase.
        </p>
      </div>

      <article className="flex min-h-[19rem] flex-col rounded-[var(--sparkle-radius-md)] border border-[var(--sparkle-border)] bg-white/88 p-5 shadow-[var(--sparkle-shadow-sm)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid size-12 place-items-center rounded-full bg-[var(--sparkle-paper-soft)] text-[var(--sparkle-rose)]">
            <Gem aria-hidden="true" className="size-6" strokeWidth={1.8} />
          </div>
          <div className="flex flex-wrap gap-2">
            <p className="rounded-full border border-[rgba(238,44,155,0.18)] bg-[var(--sparkle-blush-bg)] px-3 py-1 text-sm font-extrabold text-[var(--sparkle-plum-deep)]">
              45 days free
            </p>
            <p className="rounded-full border border-[rgba(238,44,155,0.18)] bg-[var(--sparkle-blush-bg)] px-3 py-1 text-sm font-extrabold text-[var(--sparkle-plum-deep)]">
              $4.99/month
            </p>
          </div>
        </div>

        <h3 className="mt-5 font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
          Your Silver trial path
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
          Start with 45 days free. After the trial, Silver is $4.99/month or your account moves to Free Tier
          automatically.
        </p>

        <ul className="mt-4 grid gap-2 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
          {silverTrialHighlights.map((feature) => (
            <li className="flex gap-2" key={feature}>
              <CheckCircle2
                aria-hidden="true"
                className="mt-1 size-4 shrink-0 text-[var(--sparkle-rose)]"
                strokeWidth={2}
              />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Link
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-rose)] px-4 text-sm font-bold !text-white shadow-[0_14px_30px_rgba(64,41,36,0.2)] transition hover:bg-[#d91d88] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
          href="/auth/sign-up?next=/silver"
        >
          Get Started
        </Link>
      </article>
    </section>
  );
}
