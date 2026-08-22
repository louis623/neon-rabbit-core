"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { loadBlingVaultPage, type BlingVaultPageResult } from "@/app/actions/bling-vault";
import { BlingVaultTile } from "@/components/home/BlingVaultTile";
import {
  createInitialBlingVaultLoadState,
  reduceBlingVaultLoadState,
} from "@/lib/sparkle-finder/bling-vault-load-state";
import {
  filterHomepageBlingVaultItems,
  type BlingVaultFilter,
  type HomepageBlingVaultItem,
} from "@/lib/sparkle-finder/homepage-bling-vault";

type BlingVaultMosaicProps = {
  canLoadPersistedItems?: boolean;
  heroItemId?: string;
  initialLoadError?: string | null;
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

export function BlingVaultMosaic({
  canLoadPersistedItems = false,
  heroItemId,
  initialLoadError,
  items,
  totalItemCount = items.length,
}: BlingVaultMosaicProps) {
  const shouldRefreshAfterRecovery = useRef(Boolean(initialLoadError));
  const [loadState, dispatch] = useReducer(
    reduceBlingVaultLoadState,
    { errorMessage: initialLoadError, items, total: totalItemCount },
    createInitialBlingVaultLoadState,
  );
  const requestNumber = useRef(0);
  const pendingRequest = useRef<number | null>(null);
  const { activeFilter, errorMessage, items: persistedItems, status, total: persistedTotal } = loadState;
  const isLoading = status === "loading";
  const filteredItems = canLoadPersistedItems ? persistedItems : filterHomepageBlingVaultItems(items, activeFilter);
  const total = canLoadPersistedItems ? persistedTotal : filteredItems.length;
  const [visibleCount, setVisibleCount] = useState(Math.min(initialBatchSize, filteredItems.length));
  const [automaticLoads, setAutomaticLoads] = useState(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasMore = status !== "error" && (canLoadPersistedItems ? persistedItems.length < persistedTotal : visibleCount < filteredItems.length);
  const visibleItems = canLoadPersistedItems ? persistedItems : filteredItems.slice(0, visibleCount);

  const loadMore = useCallback(async () => {
    if (pendingRequest.current !== null) return;
    if (!canLoadPersistedItems) {
      setVisibleCount((current) => Math.min(current + getBatchSize(), filteredItems.length));
      setAutomaticLoads((current) => current + 1);
      return;
    }

    const requestId = ++requestNumber.current;
    pendingRequest.current = requestId;
    dispatch({ type: "request_started", filter: activeFilter, requestId, replace: false });

    try {
      const result = await loadBlingVaultPage(activeFilter, persistedItems.length, getBatchSize());
      dispatch({ type: "request_finished", requestId, replace: false, result });
      if (result.status === "success") {
        setAutomaticLoads((current) => current + 1);
      }
    } catch {
      const result: BlingVaultPageResult = {
        status: "error",
        message: "We couldn't load more of your Bling Vault. Please try again.",
      };
      dispatch({ type: "request_finished", requestId, replace: false, result });
    } finally {
      if (pendingRequest.current === requestId) {
        pendingRequest.current = null;
      }
    }
  }, [activeFilter, canLoadPersistedItems, filteredItems.length, persistedItems.length]);

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
  }, [automaticLoads, filteredItems.length, hasMore, loadMore, status]);

  async function selectFilter(filter: BlingVaultFilter) {
    setVisibleCount(initialBatchSize);
    setAutomaticLoads(0);
    if (!canLoadPersistedItems) {
      dispatch({ type: "filter_changed", filter });
      return;
    }

    await loadFirstPage(filter);
  }

  async function loadFirstPage(filter: BlingVaultFilter) {
    const requestId = ++requestNumber.current;
    pendingRequest.current = requestId;
    dispatch({ type: "request_started", filter, requestId, replace: true });

    try {
      const result = await loadBlingVaultPage(filter, 0, initialBatchSize);
      dispatch({ type: "request_finished", requestId, replace: true, result });
      if (result.status === "success" && shouldRefreshAfterRecovery.current) {
        shouldRefreshAfterRecovery.current = false;
        window.location.reload();
      }
    } catch {
      const result: BlingVaultPageResult = {
        status: "error",
        message: "We couldn't load your Bling Vault. Please try again.",
      };
      dispatch({ type: "request_finished", requestId, replace: true, result });
    } finally {
      if (pendingRequest.current === requestId) {
        pendingRequest.current = null;
      }
    }
  }

  return (
    <section aria-labelledby="bling-vault-mosaic-title" className="grid gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Bling Vault</p>
        <h3 id="bling-vault-mosaic-title" className="mt-1 font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
          Your collection, all in one place.
        </h3>
      </div>

      <div
        aria-label="Filter your Bling Vault"
        className="sparkle-scrollbar-hidden -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1"
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

      {errorMessage ? (
        <div
          className="rounded-[var(--sparkle-radius-sm)] border border-[rgba(238,44,155,0.24)] bg-[var(--sparkle-blush-bg)] p-4"
          role="alert"
        >
          <p className="font-bold text-[var(--sparkle-plum-deep)]">{errorMessage}</p>
          <button
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border-strong)] bg-white px-4 text-sm font-black text-[var(--sparkle-plum)] transition hover:bg-[var(--sparkle-paper-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
            onClick={() => void loadFirstPage(activeFilter)}
            type="button"
          >
            {isLoading ? "Trying again…" : "Try again"}
          </button>
        </div>
      ) : null}

      {isLoading && visibleItems.length === 0 ? (
        <p aria-live="polite" className="text-sm font-semibold text-[var(--sparkle-ink-muted)]" role="status">
          Loading your Bling Vault…
        </p>
      ) : null}

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
      ) : !errorMessage && !isLoading ? (
        <div className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
          <p className="font-bold text-[var(--sparkle-plum-deep)]">
            {totalItemCount > 0
              ? filterOptions.find((option) => option.value === activeFilter)?.emptyTitle
              : "Your mosaic will grow here."}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            {totalItemCount > 0
              ? "Try another filter or add a piece from the Library."
              : "Add an owned or Wishlist piece from the Library, and it will appear here."}
          </p>
        </div>
      ) : null}
    </section>
  );
}

function getBatchSize() {
  if (typeof window === "undefined") {
    return mobileBatchSize;
  }

  return window.matchMedia("(min-width: 1024px)").matches ? desktopBatchSize : mobileBatchSize;
}
