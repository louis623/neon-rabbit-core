import Link from "next/link";
import { Gem } from "lucide-react";
import type { JewelryItem } from "@/lib/sparkle-finder/types";

type JewelryCardProps = {
  item: JewelryItem;
};

export function formatAvailabilityCount(
  count: number | null | undefined,
  knownRepListingIds: string[] = [],
): string {
  if (typeof count === "number") {
    if (count < 1) {
      return "No current listings";
    }

    return count === 1 ? "1 available" : `${count} available`;
  }

  if (knownRepListingIds.length > 0) {
    return knownRepListingIds.length === 1 ? "Known rep lead" : "Known rep leads";
  }

  return "Availability unknown";
}

export function JewelryCard({ item }: JewelryCardProps) {
  const metadata = [
    formatAvailabilityCount(item.availableListingCount, item.knownRepListingIds),
    item.collectionYear ? String(item.collectionYear) : null,
    item.material,
    item.mainStone,
    ...(item.searchTags ?? []).slice(0, 2),
  ].filter((value): value is string => Boolean(value));

  return (
    <article className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-4 shadow-[var(--sparkle-shadow-sm)]">
      <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-[var(--sparkle-radius-sm)] border border-[rgba(239,201,201,0.72)] bg-[linear-gradient(135deg,#fffefd,#fff3f0)] text-[var(--sparkle-plum)]">
        {item.imageUrl ? (
          <div
            aria-label={item.name}
            className="size-full bg-cover bg-center"
            role="img"
            style={{ backgroundImage: `url("${item.imageUrl}")` }}
          />
        ) : (
          <Gem aria-hidden="true" className="size-12" strokeWidth={1.4} />
        )}
      </div>
      <div className="mt-4">
        <div className="flex flex-wrap gap-2">
          <span className="rounded border border-[var(--sparkle-border)] bg-[var(--sparkle-blush-bg)] px-2 py-1 text-xs font-bold capitalize text-[var(--sparkle-ink-muted)]">
            {item.jewelryType}
          </span>
          {item.bpLabel !== "standard" ? (
            <span className="rounded border border-[#e7be77] bg-[#fff3cf] px-2 py-1 text-xs font-bold capitalize text-[#704b11]">
              {item.bpLabel}
            </span>
          ) : null}
        </div>
        <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
          {item.name}
        </h2>
        <p className="mt-1 text-sm leading-6 text-[var(--sparkle-ink-muted)]">{item.collectionName}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {metadata.map((value, index) => (
            <span
              className="rounded border border-[var(--sparkle-border)] bg-white px-2 py-1 text-xs font-bold text-[var(--sparkle-ink-muted)]"
              key={`${item.id}:${value}:${index}`}
            >
              {value}
            </span>
          ))}
        </div>
        <Link
          className="mt-4 inline-flex text-sm font-bold text-[var(--sparkle-rose)] underline-offset-4 hover:underline"
          href={`/library/${item.id}`}
        >
          View piece
        </Link>
      </div>
    </article>
  );
}
