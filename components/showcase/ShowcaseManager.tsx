"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Gem, LoaderCircle, Plus, Search, Sparkles, Star } from "lucide-react";
import type { SilverSaveActionState } from "@/app/(hub)/silver/actions";
import type { ManagedCollectionItem } from "@/components/silver/CollectionManager";
import type { SparkleFinderAccountState } from "@/lib/sparkle-finder/auth";
import type { JewelryItem } from "@/lib/sparkle-finder/types";
import type { SparkleShowcaseItemStatus, SparkleShowcaseVisibility } from "@/lib/sparkle-finder/showcase-types";

type ShowcaseManagerProps = {
  accountState: SparkleFinderAccountState;
  canSaveSilverActions: boolean;
  collectionItems: ManagedCollectionItem[];
  isLocalPreview: boolean;
  libraryItems: JewelryItem[];
  saveAction?: (previousState: SilverSaveActionState, formData: FormData) => Promise<SilverSaveActionState>;
};

type LocalShowcaseRecord = {
  isRarestReveal: boolean;
  item: JewelryItem;
  note: string;
  revealStory: string;
  showcaseStatus: SparkleShowcaseItemStatus;
  visibility: SparkleShowcaseVisibility;
};

const initialState: SilverSaveActionState = {
  status: "idle",
  message: "Sparkle Showcase ready.",
};

export function ShowcaseManager({
  accountState,
  canSaveSilverActions,
  collectionItems,
  isLocalPreview,
  libraryItems,
  saveAction,
}: ShowcaseManagerProps) {
  const [records, setRecords] = useState(() => createLocalRecords(collectionItems, libraryItems));
  const [localStatus, setLocalStatus] = useState(
    canSaveSilverActions ? "Sparkle Showcase preview ready." : "Silver preview is required to save Sparkle Showcase updates.",
  );
  const [actionState, formAction, isPending] = useActionState(saveAction ?? disabledShowcaseAction, initialState);
  const statusMessage = isLocalPreview ? localStatus : actionState.message;
  const savedIds = new Set(records.map((record) => record.item.id));

  function previewUpdate(item: JewelryItem, nextStatus: SparkleShowcaseItemStatus) {
    if (!canSaveSilverActions || accountState.status !== "authenticated") {
      setLocalStatus("Silver preview is required to save Sparkle Showcase updates.");
      return;
    }

    setRecords((current) => upsertLocalRecord(current, item, nextStatus));
    setLocalStatus(
      nextStatus === "iso"
        ? "ISO piece added to your Sparkle Showcase preview."
        : nextStatus === "wishlist"
          ? "Wishlist piece added to your Sparkle Showcase preview."
          : "Sparkle Showcase preview updated.",
    );
  }

  return (
    <section className="grid gap-5" data-smoke="showcase-manager">
      <article className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Owner tools</p>
            <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[var(--sparkle-plum-deep)]">
              Sparkle Showcase
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
              Build, track, highlight, and share the pieces you own or hope to find.
            </p>
          </div>
          <span className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-blush-bg)] px-3 py-1 text-xs font-bold text-[var(--sparkle-ink-muted)]">
            {records.length} Showcase records
          </span>
        </div>

        <div className="mt-5 grid gap-3">
          {records.map((record) => (
            <ShowcaseRecordCard
              formAction={formAction}
              isLocalPreview={isLocalPreview}
              isPending={isPending}
              key={record.item.id}
              record={record}
              saveEnabled={canSaveSilverActions}
            />
          ))}
        </div>
      </article>

      <article className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Library actions</p>
          <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[var(--sparkle-plum-deep)]">
            Add to Sparkle Showcase
          </h2>
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-2">
          {libraryItems.map((item) => (
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
                  <p className="mt-1 text-sm leading-5 text-[var(--sparkle-ink-muted)]">
                    Bomb Party Collection: {item.collectionName}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <PreviewActionButton
                  disabled={!canSaveSilverActions}
                  formAction={formAction}
                  icon="owned"
                  isLocalPreview={isLocalPreview}
                  item={item}
                  label={savedIds.has(item.id) ? "Update owned" : "Add owned"}
                  onPreviewUpdate={previewUpdate}
                  status="owned"
                />
                <PreviewActionButton
                  disabled={!canSaveSilverActions}
                  formAction={formAction}
                  icon="wishlist"
                  isLocalPreview={isLocalPreview}
                  item={item}
                  label="Add wishlist"
                  onPreviewUpdate={previewUpdate}
                  status="wishlist"
                />
                <PreviewActionButton
                  disabled={!canSaveSilverActions}
                  formAction={formAction}
                  icon="iso"
                  isLocalPreview={isLocalPreview}
                  item={item}
                  label="Mark as ISO"
                  onPreviewUpdate={previewUpdate}
                  status="iso"
                />
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm font-semibold text-[var(--sparkle-ink-muted)]" role="status">
          {statusMessage}
        </p>

        <div className="mt-5 rounded-[var(--sparkle-radius-sm)] border border-dashed border-[var(--sparkle-border-strong)] bg-[var(--sparkle-blush-bg)] p-4">
          <div className="flex items-start gap-3">
            <Search aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[var(--sparkle-coral)]" />
            <div>
              <h3 className="font-bold text-[var(--sparkle-plum-deep)]">Need a missing piece?</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
                Mark it as ISO, then use rep leads to find active Sparkle Suite reps who may have the exact piece or the
                same Bomb Party Collection and type.
              </p>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}

function ShowcaseRecordCard({
  formAction,
  isLocalPreview,
  isPending,
  record,
  saveEnabled,
}: {
  formAction: (formData: FormData) => void;
  isLocalPreview: boolean;
  isPending: boolean;
  record: LocalShowcaseRecord;
  saveEnabled: boolean;
}) {
  const disabled = !saveEnabled || (!isLocalPreview && isPending);

  return (
    <form action={formAction} className="grid gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] p-4">
      <input name="jewelryItemId" type="hidden" value={record.item.id} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-[var(--sparkle-plum-deep)]">{record.item.name}</h3>
          <p className="mt-1 text-sm leading-5 text-[var(--sparkle-ink-muted)]">
            Bomb Party Collection: {record.item.collectionName}
          </p>
        </div>
        {record.isRarestReveal ? (
          <span className="inline-flex items-center gap-1 rounded border border-[#e7be77] bg-[#fff3cf] px-2 py-1 text-xs font-bold text-[#704b11]">
            <Star aria-hidden="true" className="size-3" />
            The Rarest of Reveals
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-bold text-[var(--sparkle-plum-deep)]">
          Status
          <select className="min-h-10 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm" defaultValue={record.showcaseStatus} name="showcaseStatus">
            <option value="owned">Owned</option>
            <option value="wishlist">Wishlist</option>
            <option value="iso">ISO</option>
            <option value="private_note_only">Private note only</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-bold text-[var(--sparkle-plum-deep)]">
          Visibility
          <select className="min-h-10 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm" defaultValue={record.visibility} name="visibility">
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </label>
      </div>

      <label className="grid gap-1 text-sm font-bold text-[var(--sparkle-plum-deep)]">
        Reveal story
        <textarea className="min-h-24 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white p-3 text-sm leading-6" defaultValue={record.revealStory} maxLength={700} name="revealStory" />
      </label>
      <input name="note" type="hidden" value={record.note} />
      <label className="inline-flex items-center gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
        <input defaultChecked={record.isRarestReveal} name="isRarestReveal" type="checkbox" value="yes" />
        Feature in The Rarest of Reveals
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          aria-busy={!isLocalPreview && isPending}
          className="inline-flex min-h-10 items-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled}
          type="submit"
        >
          {!isLocalPreview && isPending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Sparkles aria-hidden="true" className="size-4" />}
          Save Sparkle Showcase piece
        </button>
        <span className="inline-flex min-h-10 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-xs font-bold text-[var(--sparkle-ink-muted)]">
          {record.visibility === "public" ? <Eye aria-hidden="true" className="size-3.5" /> : <EyeOff aria-hidden="true" className="size-3.5" />}
          Add to Showcase Collection
        </span>
      </div>
    </form>
  );
}

function PreviewActionButton({
  disabled,
  formAction,
  icon,
  isLocalPreview,
  item,
  label,
  onPreviewUpdate,
  status,
}: {
  disabled: boolean;
  formAction: (formData: FormData) => void;
  icon: SparkleShowcaseItemStatus;
  isLocalPreview: boolean;
  item: JewelryItem;
  label: string;
  onPreviewUpdate: (item: JewelryItem, status: SparkleShowcaseItemStatus) => void;
  status: SparkleShowcaseItemStatus;
}) {
  const Icon = icon === "owned" ? Plus : icon === "iso" ? Search : Star;

  if (!isLocalPreview) {
    return (
      <form action={formAction}>
        <input name="isRarestReveal" type="hidden" value={item.bpLabel !== "standard" ? "yes" : "no"} />
        <input name="jewelryItemId" type="hidden" value={item.id} />
        <input name="note" type="hidden" value="" />
        <input name="revealStory" type="hidden" value={getDefaultRevealStory(item, status)} />
        <input name="showcaseStatus" type="hidden" value={status} />
        <input name="visibility" type="hidden" value="public" />
        <button
          className="inline-flex min-h-10 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-bold text-[var(--sparkle-rose)] disabled:cursor-not-allowed disabled:opacity-55"
          disabled={disabled}
          type="submit"
        >
          <Icon aria-hidden="true" className="size-4" />
          {label}
        </button>
      </form>
    );
  }

  return (
    <button
      className="inline-flex min-h-10 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-bold text-[var(--sparkle-rose)] disabled:cursor-not-allowed disabled:opacity-55"
      disabled={disabled}
      onClick={() => onPreviewUpdate(item, status)}
      type="button"
    >
      <Icon aria-hidden="true" className="size-4" />
      {label}
    </button>
  );
}

function createLocalRecords(collectionItems: ManagedCollectionItem[], libraryItems: JewelryItem[]): LocalShowcaseRecord[] {
  const existingRecords = collectionItems.map((collectionItem): LocalShowcaseRecord => ({
    item: collectionItem.jewelryItem,
    note: collectionItem.note,
    showcaseStatus: collectionItem.state,
    visibility: collectionItem.state === "private_note_only" ? "private" : "public",
    revealStory: collectionItem.note || `Added ${collectionItem.jewelryItem.name} to my Sparkle Showcase.`,
    isRarestReveal: collectionItem.isHighlighted || collectionItem.jewelryItem.bpLabel !== "standard",
  }));

  return existingRecords.length > 0 ? existingRecords : libraryItems.slice(0, 3).map((item) => createRecord(item, "wishlist"));
}

function upsertLocalRecord(
  records: LocalShowcaseRecord[],
  item: JewelryItem,
  status: SparkleShowcaseItemStatus,
): LocalShowcaseRecord[] {
  const nextRecord = createRecord(item, status);
  const existing = records.find((record) => record.item.id === item.id);

  return existing
    ? records.map((record) => (record.item.id === item.id ? { ...record, ...nextRecord } : record))
    : [nextRecord, ...records];
}

function createRecord(item: JewelryItem, status: SparkleShowcaseItemStatus): LocalShowcaseRecord {
  return {
    item,
    note: "",
    showcaseStatus: status,
    visibility: status === "private_note_only" ? "private" : "public",
    revealStory: getDefaultRevealStory(item, status),
    isRarestReveal: item.bpLabel !== "standard",
  };
}

function getDefaultRevealStory(item: JewelryItem, status: SparkleShowcaseItemStatus): string {
  if (status === "iso") {
    return `ISO ${item.name}.`;
  }

  if (status === "wishlist") {
    return `Watching for ${item.name}.`;
  }

  return `Added ${item.name} to my Sparkle Showcase.`;
}

async function disabledShowcaseAction(): Promise<SilverSaveActionState> {
  return {
    status: "denied",
    message: "Silver access is required to save Sparkle Showcase updates.",
  };
}
