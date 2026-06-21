import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { JewelryImageFrame } from "@/components/library/JewelryImageFrame";
import type { HomepageBlingVaultItem } from "@/lib/sparkle-finder/homepage-bling-vault";

type BlingVaultTileProps = {
  item: HomepageBlingVaultItem;
  index: number;
};

export function BlingVaultTile({ item, index }: BlingVaultTileProps) {
  return (
    <Link
      aria-label={`View ${item.jewelryItem.name}`}
      className={`group grid break-inside-avoid gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-3 shadow-[var(--sparkle-shadow-sm)] transition hover:-translate-y-0.5 hover:border-[var(--sparkle-border-strong)] hover:shadow-[var(--sparkle-shadow-md)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)] ${tileSpanClass(index)}`}
      data-smoke="bling-vault-tile"
      href={`/library/${item.jewelryItemId}`}
    >
      <div className={`${imageAspectClass(index)} overflow-hidden rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)]`}>
        <JewelryImageFrame
          imageUrl={item.jewelryItem.imageUrl}
          jewelryType={item.jewelryItem.jewelryType}
          name={item.jewelryItem.name}
        />
      </div>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-[family-name:var(--font-playfair)] text-lg font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
              {item.jewelryItem.name}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-[var(--sparkle-ink-muted)]">{item.jewelryItem.collectionName}</p>
          </div>
          {item.isHighlighted ? <ShieldCheck aria-hidden="true" className="size-5 shrink-0 text-[var(--sparkle-coral)]" /> : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <StateBadge state={item.state} />
          {item.jewelryItem.bpLabel !== "standard" ? (
            <span className="rounded border border-[rgba(238,44,155,0.18)] bg-[var(--sparkle-blush-bg)] px-2 py-1 text-xs font-black capitalize text-[var(--sparkle-rose)]">
              {item.jewelryItem.bpLabel}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function StateBadge({ state }: { state: HomepageBlingVaultItem["state"] }) {
  const labelByState: Record<HomepageBlingVaultItem["state"], string> = {
    owned: "Owned",
    private_note_only: "Private note",
    wishlist: "Wishlist",
  };

  return (
    <span className="rounded border border-[var(--sparkle-border)] bg-white px-2 py-1 text-xs font-black text-[var(--sparkle-ink-muted)]">
      {labelByState[state]}
    </span>
  );
}

function imageAspectClass(index: number) {
  if (index % 5 === 0) {
    return "aspect-[4/5]";
  }

  if (index % 3 === 0) {
    return "aspect-square";
  }

  return "aspect-[4/3]";
}

function tileSpanClass(index: number) {
  if (index % 7 === 0) {
    return "sm:[grid-row:span_2]";
  }

  return "";
}
