import Link from "next/link";
import { BookOpen, CalendarDays } from "lucide-react";
import { DiscoveryCards } from "@/components/home/DiscoveryCards";
import { LiveShowAgenda } from "@/components/live/LiveShowAgenda";
import type { LiveShow, RepSummary } from "@/lib/sparkle-finder/types";

type HeroAndAgendaProps = {
  liveShows: LiveShow[];
  reps: RepSummary[];
};

export function HeroAndAgenda({ liveShows, reps }: HeroAndAgendaProps) {
  return (
    <section className="border-b border-[var(--sparkle-border-strong)] bg-[linear-gradient(180deg,rgba(255,254,253,0.96),rgba(255,248,245,0.9))]">
      <div className="mx-auto grid w-full max-w-[112rem] lg:min-h-[calc(100vh-5.75rem-5.8rem)] lg:grid-cols-[minmax(0,2fr)_minmax(26rem,0.98fr)]">
        <div className="relative overflow-hidden px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
          <DecorativeSparkles />
          <div className="relative z-10 grid gap-8 xl:grid-cols-[17rem_minmax(0,1fr)] xl:items-start">
            <div
              aria-hidden="true"
              className="mx-auto grid size-48 place-items-center rounded-full border-2 border-[rgba(239,139,115,0.78)] bg-[radial-gradient(circle,rgba(255,255,255,0.92)_58%,rgba(253,226,221,0.68)_100%)] shadow-[inset_0_0_0_0.8rem_rgba(255,255,255,0.78),inset_0_0_0_1.05rem_rgba(239,139,115,0.24),var(--sparkle-shadow-md)] sm:size-60 xl:mx-0"
            >
              <span className="font-[var(--font-playfair)] text-[6.5rem] font-medium leading-none text-[var(--sparkle-plum)] sm:text-[8rem]">
                SF
              </span>
            </div>

            <div className="max-w-3xl text-center xl:text-left">
              <h1 className="font-[var(--font-playfair)] text-4xl font-semibold leading-[1.05] text-[var(--sparkle-plum-deep)] sm:text-5xl lg:text-[4.3rem]">
                Find the sparkle you&apos;re hunting.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--sparkle-ink-muted)] sm:text-lg">
                One login gives you access to Sparkle Suite live shows, rep-hosted boards and dance floors,
                and the jewelry discovery library so you can browse, collect, and plan with confidence.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center xl:justify-start">
                <Link
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-7 text-sm font-bold text-white shadow-[0_12px_26px_rgba(111,18,61,0.22)] transition hover:bg-[var(--sparkle-plum-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
                  href="#live-shows"
                >
                  <CalendarDays aria-hidden="true" className="size-4" />
                  Explore Live Calendar
                </Link>
                <Link
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-plum)] bg-[rgba(255,254,253,0.82)] px-7 text-sm font-bold text-[var(--sparkle-plum)] transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
                  href="#library"
                >
                  <BookOpen aria-hidden="true" className="size-4" />
                  Browse Library
                </Link>
              </div>
            </div>
          </div>

          <DiscoveryCards />
        </div>

        <LiveShowAgenda liveShows={liveShows} reps={reps} />
      </div>
    </section>
  );
}

function DecorativeSparkles() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-60">
      <span className="sparkle-star absolute left-[4%] top-[8%] size-7" />
      <span className="sparkle-star absolute left-[27%] top-[18%] size-10" />
      <span className="sparkle-star absolute right-[16%] top-[16%] size-6" />
      <span className="sparkle-star absolute bottom-[33%] right-[8%] size-5" />
      <span className="sparkle-star absolute bottom-[42%] left-[8%] size-5" />
    </div>
  );
}
