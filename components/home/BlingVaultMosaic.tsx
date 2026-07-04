"use client";

import { useEffect, useRef, useState } from "react";
import { BlingVaultTile } from "@/components/home/BlingVaultTile";
import type { HomepageBlingVaultItem } from "@/lib/sparkle-finder/homepage-bling-vault";

type BlingVaultMosaicProps = {
  items: HomepageBlingVaultItem[];
};

const initialBatchSize = 8;
const mobileBatchSize = 8;
const desktopBatchSize = 12;
const automaticBatchLimit = 3;

export function BlingVaultMosaic({ items }: BlingVaultMosaicProps) {
  const [visibleCount, setVisibleCount] = useState(Math.min(initialBatchSize, items.length));
  const [automaticLoads, setAutomaticLoads] = useState(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasMore = visibleCount < items.length;
  const visibleItems = items.slice(0, visibleCount);

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

        setVisibleCount((current) => Math.min(current + getBatchSize(), items.length));
        setAutomaticLoads((current) => current + 1);
      },
      { rootMargin: "420px 0px" },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [automaticLoads, hasMore, items.length]);

  function loadMore() {
    setVisibleCount((current) => Math.min(current + getBatchSize(), items.length));
  }

  return (
    <section aria-labelledby="bling-vault-mosaic-title" className="grid gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Bling Vault</p>
        <h3 id="bling-vault-mosaic-title" className="mt-1 font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
          Your collection, loaded as you scroll.
        </h3>
      </div>

      {items.length > 0 ? (
        <>
          <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {visibleItems.map((item, index) => (
              <BlingVaultTile index={index} item={item} key={item.id} />
            ))}
          </div>
          <div ref={sentinelRef} aria-hidden="true" className="h-1" />
          {hasMore && automaticLoads >= automaticBatchLimit ? (
            <button
              className="mx-auto inline-flex min-h-11 items-center justify-center rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border-strong)] bg-white px-5 text-sm font-black text-[var(--sparkle-plum)] shadow-[var(--sparkle-shadow-sm)] transition hover:bg-[var(--sparkle-paper-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
              onClick={loadMore}
              type="button"
            >
              Load more sparkle
            </button>
          ) : null}
        </>
      ) : (
        <div className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
          <p className="font-bold text-[var(--sparkle-plum-deep)]">Your mosaic will grow here.</p>
          <p className="mt-2 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            Add more owned pieces or Wishlist pieces and they will load into the Bling Vault without slowing the homepage down.
          </p>
        </div>
      )}
    </section>
  );
}

function getBatchSize() {
  if (typeof window === "undefined") {
    return mobileBatchSize;
  }

  return window.matchMedia("(min-width: 1024px)").matches ? desktopBatchSize : mobileBatchSize;
}
