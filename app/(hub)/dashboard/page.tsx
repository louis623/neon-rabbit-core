import Link from "next/link";
import { Gem, Library, Radio, UsersRound } from "lucide-react";
import { getCatalogJewelryItems } from "@/lib/sparkle-finder/catalog-service";
import { getJewelryItems, getLiveShows, getRepBoardListings } from "@/lib/sparkle-finder/service";
import type { JewelryItem } from "@/lib/sparkle-finder/types";

const cards = [
  {
    title: "Master Jewelry Library",
    href: "/library",
    icon: Library,
  },
  {
    title: "Live Shows",
    href: "/live-shows",
    icon: Radio,
  },
  {
    title: "Rep Trade Boards / Dance Floors",
    href: "/rep-boards",
    icon: UsersRound,
  },
  {
    title: "Diamonds & Unicorns",
    href: "/diamonds-unicorns",
    icon: Gem,
  },
];

export default async function DashboardPage() {
  const libraryItems = await getCatalogJewelryItems();
  return renderDashboardPageContent(libraryItems);
}

export function renderDashboardPageContent(libraryItems: JewelryItem[] = getJewelryItems()) {
  const diamondAndUnicornCount = libraryItems.filter((item) => item.bpLabel === "diamond" || item.bpLabel === "unicorn").length;

  return (
    <section className="grid gap-6">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-semibold text-[var(--sparkle-plum-deep)]">
          Finder Dashboard
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--sparkle-ink-muted)]">
          Browse Sparkle Suite live shows, rep-hosted board paths, and library records from one warm discovery hub.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]"
              href={card.href}
              key={card.title}
            >
              <Icon aria-hidden="true" className="size-8 text-[var(--sparkle-rose)]" />
              <h2 className="mt-4 font-[family-name:var(--font-playfair)] text-xl font-semibold text-[var(--sparkle-plum-deep)]">
                {card.title}
              </h2>
            </Link>
          );
        })}
      </div>
      <dl className="grid gap-4 md:grid-cols-4">
        <Stat label="Library records" value={libraryItems.length} />
        <Stat label="Live shows" value={getLiveShows().length} />
        <Stat label="Board listings" value={getRepBoardListings().length} />
        <Stat label="Diamond & unicorn labels" value={diamondAndUnicornCount} />
      </dl>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-4">
      <dt className="text-sm font-bold text-[var(--sparkle-ink-muted)]">{label}</dt>
      <dd className="mt-2 text-3xl font-bold text-[var(--sparkle-plum)]">{value}</dd>
    </div>
  );
}
