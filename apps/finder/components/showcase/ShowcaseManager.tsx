"use client";

import { useActionState, useState } from "react";
import { Camera, CheckCircle2, Eye, EyeOff, LoaderCircle, Search, Sparkles, Star } from "lucide-react";
import type { SilverSaveActionState } from "@/app/(hub)/silver/actions";
import type { ManagedCollectionItem } from "@/components/silver/CollectionManager";
import type { SparkleFinderAccountState } from "@/lib/sparkle-finder/auth";
import type { JewelryItem } from "@/lib/sparkle-finder/types";
import type { SparkleShowcaseItemStatus, SparkleShowcaseVisibility } from "@/lib/sparkle-finder/showcase-types";
import { canSelectRarestReveal } from "@/lib/sparkle-finder/showcase-rarity";

type ShowcaseManagerProps = {
  accountState: SparkleFinderAccountState;
  canSaveSilverActions: boolean;
  collectionItems: ManagedCollectionItem[];
  isLocalPreview: boolean;
  libraryItems: JewelryItem[];
  saveAction?: (previousState: SilverSaveActionState, formData: FormData) => Promise<SilverSaveActionState>;
  studioAction?: (previousState: SilverSaveActionState, formData: FormData) => Promise<SilverSaveActionState>;
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

const initialStudioState: SilverSaveActionState = {
  status: "idle",
  message: "Showcase Studio ready for a missing-piece review.",
};

export function ShowcaseManager({
  canSaveSilverActions,
  collectionItems,
  isLocalPreview,
  libraryItems,
  saveAction,
  studioAction,
}: ShowcaseManagerProps) {
  const records = createLocalRecords(collectionItems, libraryItems);
  const [, formAction, isPending] = useActionState(saveAction ?? disabledShowcaseAction, initialState);

  return (
    <section className="grid gap-5" data-smoke="showcase-manager">
      <article
        className="scroll-mt-24 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]"
        data-smoke="showcase-add-pieces"
      >
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
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Advanced intake</p>
        <ShowcaseStudioIntakePanel
          canSaveSilverActions={canSaveSilverActions}
          isLocalPreview={isLocalPreview}
          studioAction={studioAction}
        />
      </article>
    </section>
  );
}

function ShowcaseStudioIntakePanel({
  canSaveSilverActions,
  isLocalPreview,
  studioAction,
}: {
  canSaveSilverActions: boolean;
  isLocalPreview: boolean;
  studioAction?: (previousState: SilverSaveActionState, formData: FormData) => Promise<SilverSaveActionState>;
}) {
  const steps = [
    {
      title: "Original Bomb Party label required",
      body: "Start with the label or package detail that shows the item number and collection clues.",
    },
    {
      title: "Confirm the catalog details",
      body: "Nic-Nac helps identify the design name, collection, jewelry type, stone, material, and label status.",
    },
    {
      title: "Retake with a light-box photo",
      body: "Use a clean white background, bright even light, and a sharp front-facing jewelry photo.",
    },
    {
      title: "Publish after review",
      body: "Approved Silver submissions can be added to the shared master jewelry database for Finder and Suite use.",
    },
  ];
  const [studioState, studioFormAction, isStudioPending] = useActionState(
    studioAction ?? disabledShowcaseAction,
    initialStudioState,
  );
  const formDisabled = !canSaveSilverActions || (!isLocalPreview && isStudioPending);

  return (
    <div
      className="mt-5 overflow-hidden rounded-[var(--sparkle-radius-sm)] border border-dashed border-[var(--sparkle-border-strong)] bg-[linear-gradient(135deg,#fff8fb_0%,#fffef8_100%)]"
      data-smoke="showcase-studio-intake"
      id="showcase-studio"
    >
      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="flex items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white text-[var(--sparkle-coral)]">
            <Camera aria-hidden="true" className="size-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">
              Need a missing piece?
            </p>
            <h3 className="mt-1 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[var(--sparkle-plum-deep)]">
              Showcase Studio
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--sparkle-ink-muted)]">
              If a piece is not in the library yet, prepare a Silver review request. Nic-Nac checks every image and
              only polished, label-backed pieces move toward the master jewelry database.
            </p>
          </div>
        </div>
        <a
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-bold text-[var(--sparkle-rose)] transition hover:border-[var(--sparkle-coral)] hover:text-[var(--sparkle-plum)]"
          href="/photo-setup"
        >
          <Sparkles aria-hidden="true" className="size-4" />
          Light-box setup guide
        </a>
      </div>

      <div className="grid border-t border-[rgba(238,44,155,0.14)] bg-white/55 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step) => (
          <div
            className="flex gap-3 border-t border-[rgba(238,44,155,0.12)] p-4 first:border-t-0 md:border-l md:border-t-0 md:first:border-l-0"
            key={step.title}
          >
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[var(--sparkle-rose)]" />
            <div>
              <h4 className="text-sm font-bold leading-5 text-[var(--sparkle-plum-deep)]">{step.title}</h4>
              <p className="mt-1 text-xs leading-5 text-[var(--sparkle-ink-muted)]">{step.body}</p>
            </div>
          </div>
        ))}
      </div>

      <form
        action={studioFormAction}
        className="grid gap-4 border-t border-[rgba(238,44,155,0.14)] bg-[var(--sparkle-paper)] p-4"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
            Original label photo
            <input
              accept="image/*"
              className="min-h-11 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 py-2 text-sm font-normal text-[var(--sparkle-ink-muted)]"
              disabled={formDisabled}
              name="originalLabelPhoto"
              required
              type="file"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
            Light-box jewelry photo
            <input
              accept="image/*"
              className="min-h-11 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 py-2 text-sm font-normal text-[var(--sparkle-ink-muted)]"
              disabled={formDisabled}
              name="jewelryFrontPhoto"
              required
              type="file"
            />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-[16rem_minmax(0,1fr)]">
          <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
            Item number
            <input
              className="min-h-11 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-normal text-[var(--sparkle-ink)]"
              disabled={formDisabled}
              maxLength={80}
              name="itemNumber"
              placeholder="Example: RG1234"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
            Notes for Nic-Nac
            <input
              className="min-h-11 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-normal text-[var(--sparkle-ink)]"
              disabled={formDisabled}
              maxLength={500}
              name="customerNote"
              placeholder="Collection, year, reveal memory, or anything from the package."
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            aria-busy={!isLocalPreview && isStudioPending}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-4 text-sm font-bold text-white transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55"
            disabled={formDisabled}
            type="submit"
          >
            {!isLocalPreview && isStudioPending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Camera aria-hidden="true" className="size-4" />}
            Submit to Nic-Nac review
          </button>
          <p className="text-sm font-semibold text-[var(--sparkle-ink-muted)]" role="status">
            {isLocalPreview ? "Local preview shows the Studio workflow. Real image saves require a signed-in Silver account." : studioState.message}
          </p>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-2 border-t border-[rgba(238,44,155,0.14)] bg-[var(--sparkle-paper)] px-4 py-3 text-xs font-bold text-[var(--sparkle-ink-muted)]">
        <Search aria-hidden="true" className="size-4 text-[var(--sparkle-coral)]" />
        Mark the piece as something you are looking for while the Studio review is pending, then use dancer leads when a matching library record appears.
      </div>
    </div>
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
  const [status, setStatus] = useState(record.showcaseStatus);

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
        {record.isRarestReveal && canSelectRarestReveal(status) ? (
          <span className="inline-flex items-center gap-1 rounded border border-[#e7be77] bg-[#fff3cf] px-2 py-1 text-xs font-bold text-[#704b11]">
            <Star aria-hidden="true" className="size-3" />
            The Rarest of Reveals
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-bold text-[var(--sparkle-plum-deep)]">
          Status
          <select className="min-h-10 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm" name="showcaseStatus" onChange={(event) => setStatus(event.target.value as SparkleShowcaseItemStatus)} value={status}>
            <option value="owned">Owned</option>
            <option value="wishlist">Wishlist</option>
            <option value="iso">Looking for</option>
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
        Showcase story
        <textarea className="min-h-24 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white p-3 text-sm leading-6" defaultValue={record.revealStory} maxLength={700} name="revealStory" />
      </label>
      <input name="note" type="hidden" value={record.note} />
      {canSelectRarestReveal(status) ? <label className="inline-flex items-center gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
        <input defaultChecked={record.isRarestReveal} name="isRarestReveal" type="checkbox" value="yes" />
        Feature in The Rarest of Reveals
      </label> : <p className="text-sm text-[var(--sparkle-ink-muted)]">Only owned pieces can be Rarest Reveals.</p>}
      <div className="flex flex-wrap gap-2">
        <button
          aria-busy={!isLocalPreview && isPending}
          className="inline-flex min-h-10 items-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled}
          type="submit"
        >
          {!isLocalPreview && isPending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Sparkles aria-hidden="true" className="size-4" />}
          Update Showcase piece
        </button>
        <span className="inline-flex min-h-10 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-xs font-bold text-[var(--sparkle-ink-muted)]">
          {record.visibility === "public" ? <Eye aria-hidden="true" className="size-3.5" /> : <EyeOff aria-hidden="true" className="size-3.5" />}
          Add to Showcase Collection
        </span>
      </div>
    </form>
  );
}

function createLocalRecords(collectionItems: ManagedCollectionItem[], libraryItems: JewelryItem[]): LocalShowcaseRecord[] {
  const existingRecords = collectionItems.map((collectionItem): LocalShowcaseRecord => ({
    item: collectionItem.jewelryItem,
    note: collectionItem.note,
    showcaseStatus: collectionItem.state,
    visibility: collectionItem.state === "private_note_only" ? "private" : "public",
    revealStory: collectionItem.note || `Added ${collectionItem.jewelryItem.name} to my Sparkle Showcase.`,
    isRarestReveal: collectionItem.state === "owned" && (collectionItem.isHighlighted || collectionItem.jewelryItem.bpLabel !== "standard"),
  }));

  return existingRecords.length > 0 ? existingRecords : libraryItems.slice(0, 3).map((item) => createRecord(item, "wishlist"));
}

function createRecord(item: JewelryItem, status: SparkleShowcaseItemStatus): LocalShowcaseRecord {
  return {
    item,
    note: "",
    showcaseStatus: status,
    visibility: status === "private_note_only" ? "private" : "public",
    revealStory: getDefaultRevealStory(item, status),
    isRarestReveal: status === "owned" && item.bpLabel !== "standard",
  };
}

function getDefaultRevealStory(item: JewelryItem, status: SparkleShowcaseItemStatus): string {
  if (status === "iso") {
    return `Looking for ${item.name}.`;
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
