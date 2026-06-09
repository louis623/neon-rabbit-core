import Link from "next/link";
import { IndependenceTrustStrip } from "@/components/home/IndependenceTrustStrip";
import { MembershipTierCards } from "@/components/home/MembershipTierCards";
import { PublicLandingFeatureCards } from "@/components/home/PublicLandingFeatureCards";
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
      <main className="min-h-screen overflow-hidden bg-[var(--sparkle-warm-bg)]" data-smoke="public-landing">
        <section
          className="border-b border-[var(--sparkle-border)] bg-[linear-gradient(180deg,rgba(255,254,253,0.98),rgba(255,246,250,0.86)_58%,rgba(252,248,246,0.96)_100%)] px-5 py-12 sm:px-8 lg:py-16"
          data-smoke="public-hero"
        >
          <div className="mx-auto grid w-full max-w-[112rem] gap-10">
            <div className="mx-auto max-w-5xl text-center" data-smoke="public-hero-editorial">
              <h1 className="font-[family-name:var(--font-playfair)] text-5xl font-semibold leading-[0.98] text-[var(--sparkle-plum-deep)] sm:text-6xl lg:text-7xl">
                Sparkle Finder
              </h1>
              <p className="mx-auto mt-5 max-w-3xl text-xl font-semibold leading-8 text-[var(--sparkle-plum-deep)] sm:text-2xl">
                Find it, favorite it, show it off.
              </p>
              <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-[var(--sparkle-ink-muted)] sm:text-xl">
                Find the pieces you like, see which reps have them on trade boards, and catch the next live show for
                those reps.
              </p>
              <AnonymousHomeActions />
            </div>
          </div>
        </section>

        <div className="mx-auto grid w-full max-w-[112rem] gap-8 px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
          <PublicLandingFeatureCards />
          <IndependenceTrustStrip />
          <MembershipTierCards />
        </div>
      </main>
      <SparkleFinderFooter />
    </>
  );
}

function AnonymousHomeActions() {
  return (
    <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
      <Link
        className="sparkle-home-primary-cta inline-flex min-h-12 items-center justify-center rounded-[var(--sparkle-radius-sm)] px-6 text-sm font-bold shadow-[0_14px_30px_rgba(64,41,36,0.2)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
        href="/auth/sign-up?next=/silver"
      >
        Start free Silver trial
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
