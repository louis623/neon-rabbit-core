import Link from "next/link";
import { BookOpen, CalendarDays, Heart, UsersRound } from "lucide-react";
import { DiscoveryCards } from "@/components/home/DiscoveryCards";
import { LiveShowAgenda } from "@/components/live/LiveShowAgenda";
import type { LiveShow, RepSummary } from "@/lib/sparkle-finder/types";

type HeroAndAgendaProps = {
  liveShows: LiveShow[];
  reps: RepSummary[];
};

export function HeroAndAgenda({ liveShows, reps }: HeroAndAgendaProps) {
  return (
    <section
      className="border-b border-[var(--sparkle-border-strong)] bg-[linear-gradient(180deg,rgba(255,254,253,0.96),rgba(255,248,245,0.9))]"
      data-smoke="hero"
    >
      <div className="mx-auto grid w-full max-w-[112rem] lg:min-h-[29rem] lg:grid-cols-[minmax(0,2fr)_minmax(26rem,0.98fr)]">
        <div className="relative overflow-hidden px-5 py-6 sm:px-8 lg:px-10 lg:py-7">
          <div className="relative z-10 mx-auto max-w-4xl py-6 text-center lg:py-7">
            <h1 className="sparkle-display text-4xl font-semibold leading-[1.04] text-[var(--sparkle-plum-deep)] sm:text-5xl lg:text-[3.25rem]">
              Find the sparkle you&apos;re hunting.
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-[var(--sparkle-ink-muted)] sm:text-lg">
              One login gives you access to Sparkle Suite live shows, rep-hosted boards and dance floors,
              and the jewelry discovery library so you can browse, collect, and plan with confidence.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                className="sparkle-home-primary-cta inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] px-6 text-sm font-bold shadow-[0_12px_26px_rgba(111,18,61,0.22)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
                href="/live-shows"
              >
                <CalendarDays aria-hidden="true" className="size-4" />
                Explore Live Calendar
              </Link>
              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-plum)] bg-[rgba(255,254,253,0.82)] px-6 text-sm font-bold text-[var(--sparkle-plum)] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
                href="/library"
              >
                <BookOpen aria-hidden="true" className="size-4" />
                Browse Library
              </Link>
              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-4 text-sm font-bold text-[var(--sparkle-rose)] transition hover:border-[var(--sparkle-coral)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
                href="/favorites"
              >
                <Heart aria-hidden="true" className="size-4" />
                Favorite Reps
              </Link>
              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-4 text-sm font-bold text-[var(--sparkle-plum)] transition hover:border-[var(--sparkle-coral)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
                href="/collectors"
              >
                <UsersRound aria-hidden="true" className="size-4" />
                Find Collectors
              </Link>
            </div>
          </div>

          <DiscoveryCards />
        </div>

        <LiveShowAgenda liveShows={liveShows} reps={reps} />
      </div>
    </section>
  );
}
