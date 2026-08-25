import Link from "next/link";
import { Gem, Search, ShieldCheck } from "lucide-react";
import { HeroPieceActionForm } from "@/components/home/HeroPieceActionForm";
import { JewelryImageFrame } from "@/components/library/JewelryImageFrame";
import {
  getHomepageBlingVaultImageUrl,
  isFinderAssistedCollectionItem,
  type HomepageBlingVaultItem,
} from "@/lib/sparkle-finder/homepage-bling-vault";

type BlingVaultTileProps = {
  isHeroPiece?: boolean;
  item: HomepageBlingVaultItem;
  index: number;
};

export function BlingVaultTile({ isHeroPiece = false, item, index }: BlingVaultTileProps) {
  return (
    <article
      className="group grid break-inside-avoid gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-3 shadow-[var(--sparkle-shadow-sm)] transition hover:-translate-y-0.5 hover:border-[var(--sparkle-border-strong)] hover:shadow-[var(--sparkle-shadow-md)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
      data-smoke="bling-vault-tile"
    >
      <Link
        aria-label={`View ${item.jewelryItem.name}`}
        className={`relative block ${imageAspectClass(index)} overflow-hidden rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sparkle-rose)]`}
        href={`/library/${item.jewelryItemId}`}
      >
        <JewelryImageFrame
          imageUrl={getHomepageBlingVaultImageUrl(item)}
          jewelryType={item.jewelryItem.jewelryType}
          name={item.jewelryItem.name}
        />
        {item.personalPhotoUrl?.trim() ? (
          <span className="absolute left-2 top-2 rounded-full bg-[rgba(49,18,64,0.82)] px-2 py-1 text-[0.65rem] font-black text-white backdrop-blur-sm">
            Your photo
          </span>
        ) : null}
      </Link>
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              className="line-clamp-2 font-[family-name:var(--font-playfair)] text-lg font-semibold leading-tight text-[var(--sparkle-plum-deep)] hover:text-[var(--sparkle-plum)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sparkle-rose)]"
              href={`/library/${item.jewelryItemId}`}
            >
              {item.jewelryItem.name}
            </Link>
            <p className="mt-1 truncate text-sm font-semibold text-[var(--sparkle-ink-muted)]">{item.jewelryItem.collectionName}</p>
          </div>
          {isHeroPiece ? <ShieldCheck aria-label="Current Hero Piece" className="size-5 shrink-0 text-[var(--sparkle-coral)]" /> : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <StateBadge state={item.state} />
          {item.jewelryItem.bpLabel !== "standard" ? (
            <span className="inline-flex items-center gap-1 rounded border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] px-2 py-1 text-xs font-black capitalize text-[var(--sparkle-plum)]">
              <Gem aria-hidden="true" className="size-3.5" />
              {item.jewelryItem.bpLabel}
            </span>
          ) : null}
          {isFinderAssistedCollectionItem(item) ? (
            <span className="inline-flex items-center gap-1 rounded border border-[rgba(238,44,155,0.18)] bg-[var(--sparkle-blush-bg)] px-2 py-1 text-xs font-black text-[var(--sparkle-rose)]">
              <Search aria-hidden="true" className="size-3.5" />
              Found by Sparkle Finder
            </span>
          ) : null}
        </div>
      </div>
      {item.state === "owned" ? (
        <HeroPieceActionForm
          collectionItemId={item.id}
          compact
          isSelected={isHeroPiece}
          pieceName={item.jewelryItem.name}
        />
      ) : null}
    </article>
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
