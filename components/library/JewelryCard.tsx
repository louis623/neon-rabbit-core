import Link from "next/link";
import { Heart, Search } from "lucide-react";
import { JewelryImageFrame } from "@/components/library/JewelryImageFrame";
import type { JewelryItem } from "@/lib/sparkle-finder/types";

type JewelryCardProps = {
  item: JewelryItem;
};

export function formatAvailabilityCount(
  leadCount: number | null | undefined,
  dancerCount: number | null | undefined,
  legacyListingCount: number | null | undefined,
  knownRepListingIds: string[] = [],
): string {
  if (isNonnegativeInteger(leadCount) && isNonnegativeInteger(dancerCount) && dancerCount >= leadCount) {
    if (leadCount === 0 && dancerCount === 0) {
      return "No dancers right now";
    }
    if (leadCount > 0) {
      return `${formatLeadCount(leadCount)} · ${formatDancerCount(dancerCount)}`;
    }
  }

  const knownLeadCount = isNonnegativeInteger(leadCount)
    ? leadCount
    : isNonnegativeInteger(legacyListingCount)
      ? legacyListingCount
      : knownRepListingIds.length;
  if (knownLeadCount > 0) {
    return `${formatLeadCount(knownLeadCount)} · dancer quantity unavailable`;
  }
  if (knownRepListingIds.length > 0) {
    return knownRepListingIds.length === 1 ? "Known dancer lead" : "Known dancer leads";
  }

  return "Dancer availability unknown";
}

export function JewelryCard({ item }: JewelryCardProps) {
  const metadata = [
    formatAvailabilityCount(
      item.availableLeadCount,
      item.availableDancerCount,
      item.availableListingCount,
      item.knownRepListingIds,
    ),
    item.collectionYear ? String(item.collectionYear) : null,
    ...(item.searchTags ?? []).slice(0, 2),
  ].filter((value): value is string => Boolean(value));
  const exactDesignHref = `/library/${encodeURIComponent(item.id)}`;
  const exactSaveHref = `/silver?piece=${encodeURIComponent(item.id)}#add-to-sparkle-showcase`;

  return (
    <article
      className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-4 shadow-[var(--sparkle-shadow-sm)]"
      data-design-id={item.id}
      data-smoke="library-jewelry-card"
    >
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
        <div
          className="mt-3 grid grid-cols-2 gap-2 rounded-[var(--sparkle-radius-sm)] border border-[rgba(238,44,155,0.16)] bg-[var(--sparkle-blush-bg)] p-3"
          data-smoke="library-variant-identity"
        >
          <VariantFact label="Stone" value={item.mainStone} />
          <VariantFact label="Material" value={item.material} />
          <p className="col-span-2 text-xs font-bold text-[var(--sparkle-ink-muted)]">
            Item {item.itemNumber}
          </p>
        </div>
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
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-3 text-sm font-bold text-white"
            href={exactDesignHref}
          >
            <Search aria-hidden="true" className="size-4" />
            View piece
          </Link>
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-bold text-[var(--sparkle-rose)]"
            href={exactSaveHref}
          >
            <Heart aria-hidden="true" className="size-4" />
            Save
          </Link>
        </div>
      </div>
    </article>
  );
}

function isNonnegativeInteger(value: number | null | undefined): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function formatLeadCount(count: number): string {
  return `${count} ${count === 1 ? "rep lead" : "rep leads"}`;
}

function formatDancerCount(count: number): string {
  return `${count} ${count === 1 ? "dancer available" : "dancers available"}`;
}

function VariantFact({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-black uppercase tracking-[0.08em] text-[var(--sparkle-ink-muted)]">{label}</p>
      <p className="mt-1 break-words text-sm font-bold leading-5 text-[var(--sparkle-plum-deep)]">
        {value?.trim() || "Not listed"}
      </p>
    </div>
  );
}
