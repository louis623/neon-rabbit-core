import Link from "next/link";
import { Heart, Search } from "lucide-react";
import { JewelryImageFrame } from "@/components/library/JewelryImageFrame";
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
      <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-[var(--sparkle-radius-sm)] border border-[rgba(239,201,201,0.72)] bg-[linear-gradient(135deg,#fffefd,#fff3f0)]">
        <JewelryImageFrame imageUrl={item.imageUrl} jewelryType={item.jewelryType} name={item.name} />
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
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-3 text-sm font-bold text-white"
            href={`/library/${item.id}`}
          >
            <Search aria-hidden="true" className="size-4" />
            View piece
          </Link>
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-bold text-[var(--sparkle-rose)]"
            href={`/silver?piece=${encodeURIComponent(item.id)}#add-to-sparkle-showcase`}
          >
            <Heart aria-hidden="true" className="size-4" />
            Save
          </Link>
        </div>
      </div>
    </article>
  );
}
