"use client";

import { useState } from "react";
import { BookmarkPlus, Gem, LockKeyhole, Plus, ShieldCheck, Star } from "lucide-react";
import { addJewelryItemToCustomerCollection } from "@/lib/sparkle-finder/customer-state";
import type { SparkleFinderAccountState } from "@/lib/sparkle-finder/auth";
import type { CollectionItem, JewelryItem } from "@/lib/sparkle-finder/types";

export type ManagedCollectionItem = CollectionItem & {
  jewelryItem: JewelryItem;
};

type CollectionManagerProps = {
  accountState: SparkleFinderAccountState;
  collectionItems: ManagedCollectionItem[];
  libraryItems: JewelryItem[];
};

export function CollectionManager({ accountState, collectionItems, libraryItems }: CollectionManagerProps) {
  const [items, setItems] = useState(collectionItems);
  const [statusMessage, setStatusMessage] = useState("Local collection preview ready.");
  const collectionByJewelryId = new Map(items.map((item) => [item.jewelryItemId, item]));

  function previewAdd(item: JewelryItem, state: CollectionItem["state"]) {
    const result = addJewelryItemToCustomerCollection(accountState, items, {
      isHighlighted: state === "owned",
      jewelryItemId: item.id,
      note: state === "wishlist" ? "Watching this library record." : "Added from the local Silver preview.",
      state,
    });

    if (!result.ok) {
      setStatusMessage("Silver preview is required to save collection updates.");
      return;
    }

    setItems(result.collectionItems.map((collectionItem) => ({ ...collectionItem, jewelryItem: findJewelryItem(collectionItem.jewelryItemId, libraryItems) })));
    setStatusMessage(state === "wishlist" ? "Watchlist preview updated." : "Collection preview updated.");
  }

  return (
    <section className="grid gap-5">
      <article className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Collection preview</p>
            <h2 className="mt-1 font-[var(--font-playfair)] text-3xl font-semibold text-[var(--sparkle-plum-deep)]">
              Saved Library Pieces
            </h2>
          </div>
          <span className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-blush-bg)] px-3 py-1 text-xs font-bold text-[var(--sparkle-ink-muted)]">
            {items.length} local records
          </span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <SavedCollectionCard item={item} key={item.id} />
          ))}
        </div>
      </article>

      <article className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Catalog actions</p>
          <h2 className="mt-1 font-[var(--font-playfair)] text-3xl font-semibold text-[var(--sparkle-plum-deep)]">
            Add Existing Records
          </h2>
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-2">
          {libraryItems.map((item) => {
            const savedItem = collectionByJewelryId.get(item.id);

            return (
              <div
                className="grid gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] p-4"
                key={item.id}
              >
                <div className="flex items-start gap-3">
                  <div className="grid size-12 shrink-0 place-items-center rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white text-[var(--sparkle-plum)]">
                    <Gem aria-hidden="true" className="size-6" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold leading-tight text-[var(--sparkle-plum-deep)]">{item.name}</h3>
                    <p className="mt-1 text-sm leading-5 text-[var(--sparkle-ink-muted)]">{item.collectionName}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="inline-flex min-h-10 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border-strong)] bg-white px-3 text-sm font-bold text-[var(--sparkle-plum)]"
                    onClick={() => previewAdd(item, "owned")}
                    type="button"
                  >
                    <Plus aria-hidden="true" className="size-4" />
                    Add to collection
                  </button>
                  <button
                    className="inline-flex min-h-10 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-bold text-[var(--sparkle-rose)]"
                    onClick={() => previewAdd(item, "wishlist")}
                    type="button"
                  >
                    <BookmarkPlus aria-hidden="true" className="size-4" />
                    Add to watchlist
                  </button>
                  {savedItem ? <StateBadge state={savedItem.state} /> : null}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-sm font-semibold text-[var(--sparkle-ink-muted)]" role="status">
          {statusMessage}
        </p>

        <div className="mt-5 rounded-[var(--sparkle-radius-sm)] border border-dashed border-[var(--sparkle-border-strong)] bg-[var(--sparkle-blush-bg)] p-4">
          <div className="flex items-start gap-3">
            <LockKeyhole aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[var(--sparkle-coral)]" />
            <div>
              <h3 className="font-bold text-[var(--sparkle-plum-deep)]">Future catalog request path</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
                Uncataloged piece requests are parked for a later approved workflow. This preview only uses existing
                library records.
              </p>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}

function SavedCollectionCard({ item }: { item: ManagedCollectionItem }) {
  return (
    <div className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-[var(--sparkle-plum-deep)]">{item.jewelryItem.name}</h3>
          <p className="mt-1 text-sm leading-5 text-[var(--sparkle-ink-muted)]">{item.jewelryItem.collectionName}</p>
        </div>
        {item.isHighlighted ? <ShieldCheck aria-hidden="true" className="size-5 shrink-0 text-[var(--sparkle-coral)]" /> : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--sparkle-ink-muted)]">{item.note}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <StateBadge state={item.state} />
        {item.isHighlighted ? (
          <span className="inline-flex items-center gap-1 rounded border border-[#e7be77] bg-[#fff3cf] px-2 py-1 text-xs font-bold text-[#704b11]">
            <Star aria-hidden="true" className="size-3" />
            Highlighted
          </span>
        ) : null}
      </div>
    </div>
  );
}

function StateBadge({ state }: { state: CollectionItem["state"] }) {
  const labels: Record<CollectionItem["state"], string> = {
    owned: "Owned",
    private_note_only: "Private note",
    wishlist: "Watchlist",
  };

  return (
    <span className="rounded border border-[var(--sparkle-border)] bg-white px-2 py-1 text-xs font-bold text-[var(--sparkle-ink-muted)]">
      {labels[state]}
    </span>
  );
}

function findJewelryItem(jewelryItemId: string, libraryItems: JewelryItem[]): JewelryItem {
  return libraryItems.find((item) => item.id === jewelryItemId) ?? libraryItems[0];
}
