import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { JewelryImageFrame } from "@/components/library/JewelryImageFrame";
import type { HomepageBlingVaultItem } from "@/lib/sparkle-finder/homepage-bling-vault";

type HeroPieceSpotlightProps = {
  item?: HomepageBlingVaultItem;
};

export function HeroPieceSpotlight({ item }: HeroPieceSpotlightProps) {
  if (!item) {
    return (
      <article className="grid min-h-[26rem] content-center gap-4 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
        <Sparkles aria-hidden="true" className="size-9 text-[var(--sparkle-coral)]" />
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Hero Piece</p>
          <h3 className="mt-1 font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
            Start your collection.
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            Find a piece in the Library, add it to your Wishlist, or mark it as owned so Sparkle Finder can help with the hunt.
          </p>
        </div>
        <Link className="inline-flex min-h-11 w-fit items-center justify-center rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-4 text-sm font-black text-white" href="/library">
          Browse Library
        </Link>
      </article>
    );
  }

  return (
    <article className="overflow-hidden rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] shadow-[var(--sparkle-shadow-sm)]">
      <div className="grid lg:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.72fr)]">
        <Link
          aria-label={`View ${item.jewelryItem.name}`}
          className="block aspect-[4/3] overflow-hidden bg-[var(--sparkle-paper-soft)] sm:aspect-[16/10] lg:aspect-auto lg:min-h-[25rem]"
          href={`/library/${item.jewelryItemId}`}
        >
          <JewelryImageFrame
            fetchPriority="high"
            imageUrl={item.jewelryItem.imageUrl}
            jewelryType={item.jewelryItem.jewelryType}
            loading="eager"
            name={item.jewelryItem.name}
            variant="card"
          />
        </Link>
        <div className="grid content-center gap-4 p-5 sm:p-6">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">
              <Sparkles aria-hidden="true" className="size-4" />
              Hero Piece
            </p>
            <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-[var(--sparkle-plum-deep)] sm:text-4xl">
              {item.jewelryItem.name}
            </h3>
            <p className="mt-2 text-sm font-bold text-[var(--sparkle-ink-muted)]">
              {item.jewelryItem.collectionName}
              {item.jewelryItem.collectionYear ? ` / ${item.jewelryItem.collectionYear}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <StateBadge state={item.state} />
            {item.isHighlighted ? (
              <span className="inline-flex items-center gap-1 rounded border border-[#e7be77] bg-[#fff3cf] px-2 py-1 text-xs font-black text-[#704b11]">
                <ShieldCheck aria-hidden="true" className="size-3.5" />
                Hero Piece
              </span>
            ) : null}
          </div>

          {item.note ? <p className="text-sm leading-6 text-[var(--sparkle-ink-muted)]">{item.note}</p> : null}

          <Link
            className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-4 text-sm font-black text-white transition hover:bg-[var(--sparkle-plum-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
            href={`/library/${item.jewelryItemId}`}
          >
            View piece
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
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
    <span className="rounded border border-[var(--sparkle-border)] bg-[var(--sparkle-blush-bg)] px-2 py-1 text-xs font-black text-[var(--sparkle-plum)]">
      {labelByState[state]}
    </span>
  );
}
