import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, PackageCheck, UsersRound } from "lucide-react";

const discoveryCards = [
  {
    title: "Master Live Calendar",
    body: "All live shows. All reps. One master schedule.",
    href: "/live-shows",
    icon: CalendarDays,
  },
  {
    title: "Rep Trade Boards / Dance Floors",
    body: "Browse rep-hosted boards and planned dance floor moments.",
    href: "/rep-boards",
    icon: UsersRound,
  },
  {
    title: "Master Jewelry Library",
    body: "Search collections and pieces across Sparkle Suite reps.",
    href: "/library",
    icon: BookOpen,
  },
  {
    title: "Collector & Rep Essentials",
    body: "Shop care, storage, display, livestream, and setup gear.",
    href: "/shop",
    icon: PackageCheck,
  },
];

export function DiscoveryCards() {
  return (
    <div className="relative z-10 mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4" data-smoke="discovery-cards">
      {discoveryCards.map((card) => {
        const Icon = card.icon;

        return (
          <Link
            key={card.title}
            className="group flex min-h-28 flex-col justify-between rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[rgba(255,254,253,0.82)] p-4 shadow-[var(--sparkle-shadow-sm)] transition hover:-translate-y-0.5 hover:border-[var(--sparkle-border-strong)] hover:bg-white hover:shadow-[var(--sparkle-shadow-md)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
            href={card.href}
          >
            <div className="flex gap-4">
              <Icon aria-hidden="true" className="mt-1 size-9 shrink-0 text-[var(--sparkle-rose)]" strokeWidth={1.8} />
              <div>
                <h2 className="font-[var(--font-playfair)] text-lg font-semibold leading-tight text-[var(--sparkle-plum-deep)] xl:text-xl">
                  {card.title}
                </h2>
                <p className="mt-1.5 text-sm leading-5 text-[var(--sparkle-ink-muted)]">{card.body}</p>
              </div>
            </div>
            <ArrowRight
              aria-hidden="true"
              className="mt-3 size-5 self-end text-[var(--sparkle-plum)] transition group-hover:translate-x-1"
            />
          </Link>
        );
      })}
    </div>
  );
}
