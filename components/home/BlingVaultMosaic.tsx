"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadBlingVaultPage } from "@/app/actions/bling-vault";
import { BlingVaultTile } from "@/components/home/BlingVaultTile";
import {
  filterHomepageBlingVaultItems,
  type BlingVaultFilter,
  type HomepageBlingVaultItem,
} from "@/lib/sparkle-finder/homepage-bling-vault";

type BlingVaultMosaicProps = {
  canLoadPersistedItems?: boolean;
  heroItemId?: string;
  items: HomepageBlingVaultItem[];
  totalItemCount?: number;
};

const initialBatchSize = 8;
const mobileBatchSize = 8;
const desktopBatchSize = 12;
const automaticBatchLimit = 3;

const filterOptions: Array<{ emptyTitle: string; label: string; value: BlingVaultFilter }> = [
  { emptyTitle: "Your mosaic will grow here.", label: "All", value: "all" },
  { emptyTitle: "No owned pieces yet.", label: "Owned", value: "owned" },
  { emptyTitle: "No Wishlist pieces yet.", label: "Wishlist", value: "wishlist" },
  { emptyTitle: "No Diamonds yet.", label: "Diamonds", value: "diamonds" },
  { emptyTitle: "No Unicorns yet.", label: "Unicorns", value: "unicorns" },
  { emptyTitle: "No pieces found by Sparkle Finder yet.", label: "Found by Sparkle Finder", value: "finder" },
];

export function BlingVaultMosaic({ canLoadPersistedItems = false, heroItemId, items, totalItemCount = items.length }: BlingVaultMosaicProps) {
  const [activeFilter, setActiveFilter] = useState<BlingVaultFilter>("all");
  const [persistedItems, setPersistedItems] = useState(items);
  const [persistedTotal, setPersistedTotal] = useState(totalItemCount);
  const [isLoading, setIsLoading] = useState(false);
  const requestNumber = useRef(0);
  const filteredItems = canLoadPersistedItems ? persistedItems : filterHomepageBlingVaultItems(items, activeFilter);
  const total = canLoadPersistedItems ? persistedTotal : filteredItems.length;
  const [visibleCount, setVisibleCount] = useState(Math.min(initialBatchSize, filteredItems.length));
  const [automaticLoads, setAutomaticLoads] = useState(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasMore = canLoadPersistedItems ? persistedItems.length < persistedTotal : visibleCount < filteredItems.length;
  const visibleItems = canLoadPersistedItems ? persistedItems : filteredItems.slice(0, visibleCount);

  const loadMore = useCallback(async () => {
    if (isLoading) return;
    if (!canLoadPersistedItems) {
      setVisibleCount((current) => Math.min(current + getBatchSize(), filteredItems.length));
      setAutomaticLoads((current) => current + 1);
      return;
    }

    setIsLoading(true);
    const page = await loadBlingVaultPage(activeFilter, persistedItems.length, getBatchSize());
    setPersistedItems((current) => mergeUniqueItems(current, page.items));
    setPersistedTotal(page.total);
    setAutomaticLoads((current) => current + 1);
    setIsLoading(false);
  }, [activeFilter, canLoadPersistedItems, filteredItems.length, isLoading, persistedItems.length]);

  useEffect(() => {
    if (!hasMore || automaticLoads >= automaticBatchLimit) {
      return;
    }

    const sentinel = sentinelRef.current;

    if (!sentinel || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }

        void loadMore();
      },
      { rootMargin: "420px 0px" },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [automaticLoads, filteredItems.length, hasMore, loadMore]);

  async function selectFilter(filter: BlingVaultFilter) {
    setActiveFilter(filter);
    setVisibleCount(initialBatchSize);
    setAutomaticLoads(0);
    if (!canLoadPersistedItems) return;

    const currentRequest = ++requestNumber.current;
    setIsLoading(true);
    const page = await loadBlingVaultPage(filter, 0, initialBatchSize);
    if (currentRequest !== requestNumber.current) return;
    setPersistedItems(page.items);
    setPersistedTotal(page.total);
    setIsLoading(false);
  }

  return (
    <section aria-labelledby="bling-vault-mosaic-title" className="grid gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Bling Vault</p>
        <h3 id="bling-vault-mosaic-title" className="mt-1 font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
          Your collection, loaded as you scroll.
        </h3>
      </div>

      <div
        aria-label="Filter your Bling Vault"
        className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1"
        role="group"
      >
        {filterOptions.map((option) => (
          <button
            aria-pressed={activeFilter === option.value}
            className={`min-h-10 shrink-0 snap-start rounded-full border px-3.5 text-xs font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--sparkle-rose)] ${
              activeFilter === option.value
                ? "border-[var(--sparkle-plum)] bg-[var(--sparkle-plum)] text-white shadow-[var(--sparkle-shadow-sm)]"
                : "border-[var(--sparkle-border-strong)] bg-white text-[var(--sparkle-plum)] hover:bg-[var(--sparkle-paper-soft)]"
            }`}
            key={option.value}
            onClick={() => void selectFilter(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>

      {visibleItems.length > 0 ? (
        <>
          <p aria-live="polite" className="text-xs font-bold text-[var(--sparkle-ink-muted)]">
            Showing {visibleItems.length} of {total} {total === 1 ? "piece" : "pieces"}
          </p>
          <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {visibleItems.map((item, index) => (
              <BlingVaultTile index={index} isHeroPiece={item.id === heroItemId} item={item} key={item.id} />
            ))}
          </div>
          <div ref={sentinelRef} aria-hidden="true" className="h-1" />
          {hasMore && automaticLoads >= automaticBatchLimit ? (
            <button
              className="mx-auto inline-flex min-h-11 items-center justify-center rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border-strong)] bg-white px-5 text-sm font-black text-[var(--sparkle-plum)] shadow-[var(--sparkle-shadow-sm)] transition hover:bg-[var(--sparkle-paper-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
              disabled={isLoading}
              onClick={() => void loadMore()}
              type="button"
            >
              {isLoading ? "Loading sparkle…" : "Load more sparkle"}
            </button>
          ) : null}
          {activeFilter === "all" && total < 4 ? (
            <div className="rounded-[var(--sparkle-radius-sm)] border border-dashed border-[var(--sparkle-border-strong)] bg-[var(--sparkle-paper-soft)] p-4 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
              Your showroom is off to a sparkling start. Add another owned or Wishlist piece whenever you are ready.
            </div>
          ) : null}
        </>
      ) : (
        <div className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
          <p className="font-bold text-[var(--sparkle-plum-deep)]">
            {totalItemCount > 0
              ? filterOptions.find((option) => option.value === activeFilter)?.emptyTitle
              : "Your mosaic will grow here."}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            {totalItemCount > 0
              ? "Try another filter or add a piece from the Library."
              : "Add more owned pieces or Wishlist pieces and they will load into the Bling Vault without slowing the homepage down."}
          </p>
        </div>
      )}
    </section>
  );
}

function mergeUniqueItems(current: HomepageBlingVaultItem[], next: HomepageBlingVaultItem[]) {
  const byId = new Map(current.map((item) => [item.id, item]));
  next.forEach((item) => byId.set(item.id, item));
  return [...byId.values()];
}

function getBatchSize() {
  if (typeof window === "undefined") {
    return mobileBatchSize;
  }

  return window.matchMedia("(min-width: 1024px)").matches ? desktopBatchSize : mobileBatchSize;
}
