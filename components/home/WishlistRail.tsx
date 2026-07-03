import Link from "next/link";
import { Heart, Search } from "lucide-react";
import { JewelryImageFrame } from "@/components/library/JewelryImageFrame";
import type { HomepageBlingVaultItem } from "@/lib/sparkle-finder/homepage-bling-vault";

type WishlistRailProps = {
  items: HomepageBlingVaultItem[];
};

const visibleWishlistCount = 6;

export function WishlistRail({ items }: WishlistRailProps) {
  return (
    <aside className="grid rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-4 shadow-[var(--sparkle-shadow-sm)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">
            <Heart aria-hidden="true" className="size-4" />
            Wishlist
          </p>
          <h3 className="mt-1 font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
            Pieces you want to find.
          </h3>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="mt-4 flex snap-x gap-3 overflow-x-auto pb-2 xl:grid xl:overflow-visible xl:pb-0">
          {items.slice(0, visibleWishlistCount).map((item) => (
            <Link
              aria-label={`View Wishlist piece ${item.jewelryItem.name}`}
              className="grid min-w-[14rem] snap-start gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] p-3 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[var(--sparkle-shadow-sm)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)] xl:min-w-0 xl:grid-cols-[5.5rem_minmax(0,1fr)] xl:items-center"
              href={`/library/${item.jewelryItemId}`}
              key={item.id}
            >
              <div className="aspect-[4/3] overflow-hidden rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white xl:aspect-square">
                <JewelryImageFrame
                  imageUrl={item.jewelryItem.imageUrl}
                  jewelryType={item.jewelryItem.jewelryType}
                  name={item.jewelryItem.name}
                />
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold leading-tight text-[var(--sparkle-plum-deep)]">{item.jewelryItem.name}</p>
                <p className="mt-1 truncate text-sm text-[var(--sparkle-ink-muted)]">{item.jewelryItem.collectionName}</p>
                <span className="mt-2 inline-flex items-center gap-1 rounded border border-[rgba(238,44,155,0.18)] bg-white px-2 py-1 text-xs font-black text-[var(--sparkle-rose)]">
                  <Search aria-hidden="true" className="size-3.5" />
                  Find leads
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] p-4">
          <p className="text-sm font-bold text-[var(--sparkle-plum-deep)]">No Wishlist pieces yet.</p>
          <p className="mt-1 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            Add pieces from the Library so Sparkle Finder knows what to look for.
          </p>
          <Link className="mt-3 inline-flex min-h-10 items-center rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-4 text-sm font-black text-white" href="/library">
            Browse Library
          </Link>
        </div>
      )}
    </aside>
  );
}
