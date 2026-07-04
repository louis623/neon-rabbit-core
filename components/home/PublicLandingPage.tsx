import Link from "next/link";
import type { ReactNode } from "react";
import { Gem, LockKeyhole, Sparkles, UserRound } from "lucide-react";
import { SparkleFinderFooter } from "@/components/layout/SparkleFinderFooter";
import { SparkleFinderNav } from "@/components/layout/SparkleFinderNav";
import type { CurrentSparkleFinderAccountState } from "@/lib/sparkle-finder/account-service";

type PublicLandingPageProps = {
  accountState: CurrentSparkleFinderAccountState;
};

export function PublicLandingPage({ accountState }: PublicLandingPageProps) {
  return (
    <>
      <SparkleFinderNav accountState={accountState} variant="public" />
      <main
        className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fbf7ff_0%,#f5efff_46%,#fffafd_100%)]"
        data-smoke="public-landing"
      >
        <section
          className="relative isolate px-5 py-10 sm:px-8 lg:py-16"
          data-smoke="public-hero"
        >
          <div className="mx-auto flex min-h-[calc(100vh-15rem)] w-full max-w-3xl flex-col justify-center gap-7 text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[rgba(106,63,145,0.18)] bg-white/75 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--sparkle-plum)] shadow-[0_10px_28px_rgba(70,44,94,0.08)]">
              <LockKeyhole className="size-4" aria-hidden="true" />
              Account required
            </div>

            <div className="grid gap-4">
              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-[var(--sparkle-rose)]">
                Sparkle Finder
              </p>
              <h1 className="font-[family-name:var(--font-playfair)] text-5xl font-semibold leading-[0.98] text-[var(--sparkle-plum-deep)] sm:text-6xl lg:text-7xl">
                Find the pieces you love.
              </h1>
              <p className="mx-auto max-w-2xl text-xl font-semibold leading-8 text-[var(--sparkle-plum)] sm:text-2xl">
                Build your collection with Sparkle Finder.
              </p>
            </div>

            <div
              className="mx-auto grid max-w-2xl gap-3 text-base leading-7 text-[var(--sparkle-ink-muted)]"
              data-smoke="account-gate-copy"
            >
              <p className="font-bold text-[var(--sparkle-plum-deep)]">Free or Silver account required.</p>
              <p>
                Create an account or sign in to use Sparkle Finder, including the library, reps, live shows,
                Wishlist, collection, and Nic-Nac.
              </p>
            </div>

            <AnonymousHomeActions />

            <div className="mx-auto grid w-full max-w-2xl gap-3 text-left sm:grid-cols-2">
              <AccountPathNote
                icon={<UserRound className="size-5" aria-hidden="true" />}
                title="Free account"
                body="Start with the app basics and keep your Sparkle Finder access."
              />
              <AccountPathNote
                icon={<Gem className="size-5" aria-hidden="true" />}
                title="Silver account"
                body="Use the full collector workflow when Silver is active."
              />
            </div>
          </div>
        </section>
      </main>
      <SparkleFinderFooter />
    </>
  );
}

function AnonymousHomeActions() {
  return (
    <div className="mx-auto grid w-full max-w-md gap-3 sm:grid-cols-2">
      <Link
        className="sparkle-home-primary-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] px-6 text-sm font-bold shadow-[0_14px_30px_rgba(64,41,36,0.2)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
        href="/auth/sign-up?next=/"
      >
        <Sparkles className="size-4" aria-hidden="true" />
        Create free account
      </Link>
      <Link
        className="inline-flex min-h-12 items-center justify-center rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-plum)] bg-white/75 px-6 text-sm font-bold text-[var(--sparkle-plum)] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
        href="/auth/sign-in"
      >
        Sign in
      </Link>
    </div>
  );
}

function AccountPathNote({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-3 rounded-[var(--sparkle-radius-sm)] border border-[rgba(106,63,145,0.16)] bg-white/72 p-4 shadow-[0_12px_30px_rgba(70,44,94,0.08)]">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--sparkle-blush-bg)] text-[var(--sparkle-rose)]">
        {icon}
      </span>
      <span>
        <span className="block text-sm font-extrabold text-[var(--sparkle-plum-deep)]">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-[var(--sparkle-ink-muted)]">{body}</span>
      </span>
    </div>
  );
}
