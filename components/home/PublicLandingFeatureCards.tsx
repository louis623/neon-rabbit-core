import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, Gem, PackageCheck, UsersRound } from "lucide-react";

const publicLandingFeatureCards = [
  {
    title: "Master Jewelry Library",
    body: "Search and organize the pieces you want to follow before you jump into live shows or rep boards.",
    href: "/auth/sign-up?next=/library",
    icon: BookOpen,
  },
  {
    title: "Live Show Calendar",
    body: "Plan around the reps and shows you love from one calm, collector-friendly schedule.",
    href: "/auth/sign-up?next=/live-shows",
    icon: CalendarDays,
  },
  {
    title: "Rep Trade Boards / Dance Floors",
    body: "Keep an eye on rep-hosted boards and dance floor moments without digging through scattered links.",
    href: "/auth/sign-up?next=/rep-boards",
    icon: UsersRound,
  },
  {
    title: "Collection Showcase",
    body: "Build a private Silver space for your finds, favorites, watchlist, and collector profile.",
    href: "/auth/sign-up?next=/silver",
    icon: Gem,
  },
  {
    title: "Collector & Rep Essentials",
    body: "Browse care, storage, display, livestream, and setup gear after clear affiliate review.",
    href: "/auth/sign-up?next=/shop",
    icon: PackageCheck,
  },
] as const;

export function PublicLandingFeatureCards() {
  return (
    <section
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"
      aria-label="Sparkle Finder public features"
      data-smoke="public-feature-cards"
    >
      {publicLandingFeatureCards.map((card) => {
        const Icon = card.icon;

        return (
          <Link
            key={card.title}
            className="group flex min-h-64 flex-col justify-between rounded-[var(--sparkle-radius-md)] border border-[var(--sparkle-border)] bg-[rgba(255,255,255,0.86)] p-5 shadow-[var(--sparkle-shadow-sm)] transition hover:-translate-y-1 hover:border-[rgba(238,44,155,0.34)] hover:bg-white hover:shadow-[var(--sparkle-shadow-md)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
            href={card.href}
          >
            <div>
              <div className="grid size-12 place-items-center rounded-full bg-[var(--sparkle-paper-soft)] text-[var(--sparkle-rose)]">
                <Icon aria-hidden="true" className="size-6" strokeWidth={1.8} />
              </div>
              <h2 className="mt-5 font-[family-name:var(--font-playfair)] text-xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
                {card.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--sparkle-ink-muted)]">{card.body}</p>
            </div>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
              Start with this
              <ArrowRight aria-hidden="true" className="size-4 transition group-hover:translate-x-1" />
            </span>
          </Link>
        );
      })}
    </section>
  );
}
