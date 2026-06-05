import Link from "next/link";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { IndependenceTrustStrip } from "@/components/home/IndependenceTrustStrip";
import { PublicLandingFeatureCards } from "@/components/home/PublicLandingFeatureCards";
import { SparkleFinderNav } from "@/components/layout/SparkleFinderNav";
import type { CurrentSparkleFinderAccountState } from "@/lib/sparkle-finder/account-service";

type PublicLandingPageProps = {
  accountState: CurrentSparkleFinderAccountState;
};

export function PublicLandingPage({ accountState }: PublicLandingPageProps) {
  return (
    <>
      <SparkleFinderNav accountState={accountState} />
      <main className="min-h-screen overflow-hidden bg-[var(--sparkle-warm-bg)]" data-smoke="public-landing">
        <section
          className="relative border-b border-[var(--sparkle-border)] bg-[linear-gradient(180deg,rgba(255,254,253,0.96),rgba(255,246,250,0.88)_54%,rgba(252,248,246,0.94)_100%)] px-5 py-10 sm:px-8 lg:py-14"
          data-smoke="public-hero"
        >
          <div className="absolute left-[-8rem] top-12 hidden size-72 rounded-full bg-[rgba(255,212,234,0.5)] blur-3xl lg:block" />
          <div className="absolute right-[-6rem] top-4 hidden size-80 rounded-full bg-[rgba(238,44,155,0.14)] blur-3xl lg:block" />

          <div className="relative mx-auto grid w-full max-w-[112rem] gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(24rem,0.92fr)] lg:items-center">
            <div className="max-w-4xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-[rgba(238,44,155,0.24)] bg-white/75 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--sparkle-rose)] shadow-[var(--sparkle-shadow-sm)]">
                <Sparkles aria-hidden="true" className="size-4" />
                Collector-first discovery
              </p>
              <h1 className="mt-6 font-[family-name:var(--font-playfair)] text-5xl font-semibold leading-[0.98] text-[var(--sparkle-plum-deep)] sm:text-6xl lg:text-7xl">
                Sparkle Finder
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--sparkle-ink-muted)] sm:text-xl">
                A clean, organized place to help you find the reps, products, and shows you love before you decide
                where to watch, browse, or collect next.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="sparkle-home-primary-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] px-6 text-sm font-bold shadow-[0_14px_30px_rgba(64,41,36,0.2)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
                  href="/auth/sign-up?next=/silver"
                >
                  Start free Silver trial
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-plum)] bg-white/75 px-6 text-sm font-bold text-[var(--sparkle-plum)] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
                  href="/auth/sign-in"
                >
                  Sign in
                </Link>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[var(--sparkle-border)] bg-white/82 p-4 shadow-[var(--sparkle-shadow-md)] backdrop-blur">
              <div className="rounded-[1.15rem] border border-[rgba(238,44,155,0.22)] bg-[linear-gradient(145deg,#fff6fa_0%,#ffffff_52%,#fcf8f6_100%)] p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--sparkle-rose)]">
                      Public preview
                    </p>
                    <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
                      Find faster, with less tab chaos.
                    </h2>
                  </div>
                  <div className="grid size-14 shrink-0 place-items-center rounded-full bg-[var(--sparkle-plum)] text-[#fff6fa]">
                    <Search aria-hidden="true" className="size-6" strokeWidth={1.8} />
                  </div>
                </div>
                <div className="mt-7 grid gap-3">
                  {["Reps", "Products", "Shows"].map((label) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white/78 px-4 py-3 text-sm font-bold text-[var(--sparkle-plum-deep)]"
                    >
                      <span>{label}</span>
                      <span className="h-2 w-24 rounded-full bg-[linear-gradient(90deg,var(--sparkle-blush),var(--sparkle-rose))]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto grid w-full max-w-[112rem] gap-6 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <IndependenceTrustStrip />
          <PublicLandingFeatureCards />
        </div>
      </main>
    </>
  );
}
