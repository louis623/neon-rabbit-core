"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ExternalLink, Eye, EyeOff, FolderHeart, LoaderCircle, Save, Sparkles, Trash2 } from "lucide-react";
import type { SilverSaveActionState } from "@/app/(hub)/silver/actions";
import type { ManagedCollectionItem } from "@/components/silver/CollectionManager";
import type { ShowcaseCollection } from "@/lib/sparkle-finder/showcase-types";

export type ShowcaseOwnerData = {
  handle: string;
  tagline: string;
  visibility: "private" | "public";
  collections: ShowcaseCollection[];
};

type OwnerAction = (previousState: SilverSaveActionState, formData: FormData) => Promise<SilverSaveActionState>;

type ShowcaseOwnerPanelProps = {
  canSave: boolean;
  collectionItems: ManagedCollectionItem[];
  data: ShowcaseOwnerData;
  isLocalPreview: boolean;
  savePieceAction?: OwnerAction;
  saveProfileAction?: OwnerAction;
  saveCollectionAction?: OwnerAction;
  deleteCollectionAction?: OwnerAction;
  assignPieceAction?: OwnerAction;
};

const initialState: SilverSaveActionState = { status: "idle", message: "Showcase controls ready." };

export function ShowcaseOwnerPanel({
  canSave,
  collectionItems,
  data,
  isLocalPreview,
  savePieceAction,
  saveProfileAction,
  saveCollectionAction,
  deleteCollectionAction,
  assignPieceAction,
}: ShowcaseOwnerPanelProps) {
  const [profileState, profileFormAction, profilePending] = useActionState(saveProfileAction ?? disabledAction, initialState);
  const [collectionState, collectionFormAction, collectionPending] = useActionState(saveCollectionAction ?? disabledAction, initialState);
  const [deleteState, deleteFormAction, deletePending] = useActionState(deleteCollectionAction ?? disabledAction, initialState);
  const [pieceState, pieceFormAction, piecePending] = useActionState(savePieceAction ?? disabledAction, initialState);
  const [assignmentState, assignmentFormAction, assignmentPending] = useActionState(assignPieceAction ?? disabledAction, initialState);
  const disabled = !canSave || isLocalPreview;
  const publicUrl = data.handle ? `/showcase/${data.handle}` : "";

  return (
    <section className="grid gap-5" aria-labelledby="manage-showcase-heading" data-smoke="showcase-owner-panel">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Public Showcase controls</p>
        <h2 id="manage-showcase-heading" className="mt-1 font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[var(--sparkle-plum-deep)]">
          Tell the story of your collection
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--sparkle-ink-muted)]">
          Nothing becomes public automatically. Choose your public pieces, add reveal stories, and publish only when you are ready.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <form action={profileFormAction} className="grid gap-4 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-[var(--sparkle-plum-deep)]">Showcase setup</p>
              <p className="mt-1 text-sm leading-5 text-[var(--sparkle-ink-muted)]">Choose a public address, tagline, and privacy setting.</p>
            </div>
            {data.visibility === "public" ? <Eye aria-hidden="true" className="size-5 text-[var(--sparkle-plum)]" /> : <EyeOff aria-hidden="true" className="size-5 text-[var(--sparkle-ink-muted)]" />}
          </div>
          <label className="grid gap-1 text-sm font-bold text-[var(--sparkle-plum-deep)]">
            Showcase handle
            <span className="flex min-w-0 items-center rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 focus-within:ring-2 focus-within:ring-[var(--sparkle-plum)]">
              <span className="shrink-0 text-[var(--sparkle-ink-muted)]">yoursparklefinder.com/showcase/</span>
              <input className="min-h-11 min-w-0 flex-1 bg-transparent pl-1 outline-none" defaultValue={data.handle} maxLength={40} name="handle" placeholder="your-name" required />
            </span>
          </label>
          <label className="grid gap-1 text-sm font-bold text-[var(--sparkle-plum-deep)]">
            Short tagline
            <textarea className="min-h-24 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white p-3 font-normal" defaultValue={data.tagline} maxLength={160} name="tagline" placeholder="What makes your collection sparkle?" />
          </label>
          <fieldset className="grid grid-cols-2 gap-2">
            <legend className="mb-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">Who can see it?</legend>
            <VisibilityChoice defaultChecked={data.visibility !== "public"} icon={<EyeOff aria-hidden="true" className="size-4" />} label="Keep private" value="private" />
            <VisibilityChoice defaultChecked={data.visibility === "public"} icon={<Eye aria-hidden="true" className="size-4" />} label="Make public" value="public" />
          </fieldset>
          <div className="flex flex-wrap gap-2">
            <SubmitButton disabled={disabled} pending={profilePending}>Save Showcase</SubmitButton>
            {publicUrl ? (
              <Link className="inline-flex min-h-11 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] px-4 text-sm font-bold text-[var(--sparkle-plum)]" href={publicUrl}>
                <ExternalLink aria-hidden="true" className="size-4" /> Preview
              </Link>
            ) : null}
          </div>
          <ActionStatus state={profileState} />
        </form>

        <div className="grid content-start gap-4 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
          <div>
            <p className="font-bold text-[var(--sparkle-plum-deep)]">Start a Showcase Collection</p>
            <p className="mt-1 text-sm leading-5 text-[var(--sparkle-ink-muted)]">Group favorites into visual stories such as “Purple Dreams” or “Never Leaving.”</p>
          </div>
          <CollectionForm action={collectionFormAction} disabled={disabled} pending={collectionPending} />
          <ActionStatus state={collectionState} />
        </div>
      </div>

      {data.collections.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {data.collections.map((collection) => (
            <article className="grid gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-4" key={collection.id}>
              <CollectionForm action={collectionFormAction} collection={collection} disabled={disabled} pending={collectionPending} />
              <div className="flex items-center justify-between gap-3 text-sm text-[var(--sparkle-ink-muted)]">
                <span>{collection.pieceIds.length} {collection.pieceIds.length === 1 ? "piece" : "pieces"}</span>
                <form action={deleteFormAction}>
                  <input name="collectionId" type="hidden" value={collection.id} />
                  <button className="inline-flex min-h-11 items-center gap-1 px-2 font-bold text-[var(--sparkle-coral)] disabled:opacity-50" disabled={disabled || deletePending} type="submit">
                    <Trash2 aria-hidden="true" className="size-4" /> Remove collection
                  </button>
                </form>
              </div>
            </article>
          ))}
          <ActionStatus state={deleteState} />
        </div>
      ) : null}

      <div className="grid gap-3">
        <div>
          <p className="font-bold text-[var(--sparkle-plum-deep)]">Piece stories and visibility</p>
          <p className="mt-1 text-sm leading-5 text-[var(--sparkle-ink-muted)]">Open only the piece you want to edit. Private notes are never included in the public Showcase.</p>
        </div>
        {collectionItems.length === 0 ? (
          <p className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 text-sm text-[var(--sparkle-ink-muted)]">Add an owned piece or Wishlist item first, then return here to shape its Showcase story.</p>
        ) : (
          collectionItems.map((item) => (
            <details className="group rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)]" key={item.id}>
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 p-4 font-bold text-[var(--sparkle-plum-deep)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sparkle-plum)]">
                <span className="min-w-0 truncate">{item.jewelryItem.name}</span>
                <span className="shrink-0 rounded-full bg-[var(--sparkle-blush-bg)] px-2.5 py-1 text-xs text-[var(--sparkle-ink-muted)]">{item.visibility === "public" ? "Public" : "Private"}</span>
              </summary>
              <div className="grid gap-4 border-t border-[var(--sparkle-border)] p-4 lg:grid-cols-2">
                <form action={pieceFormAction} className="grid gap-3">
                  <input name="jewelryItemId" type="hidden" value={item.jewelryItemId} />
                  <input name="note" type="hidden" value={item.note} />
                  <div className="grid grid-cols-2 gap-3">
                    <label className="grid gap-1 text-sm font-bold">Status
                      <select className="min-h-11 rounded border border-[var(--sparkle-border)] bg-white px-3 font-normal" defaultValue={item.showcaseStatus ?? (item.state === "wishlist" ? "wishlist" : "owned")} name="showcaseStatus">
                        <option value="owned">Owned</option><option value="wishlist">Wishlist</option><option value="iso">Looking for</option><option value="private_note_only">Private note only</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm font-bold">Visibility
                      <select className="min-h-11 rounded border border-[var(--sparkle-border)] bg-white px-3 font-normal" defaultValue={item.visibility ?? "private"} name="visibility">
                        <option value="private">Private</option><option value="public">Public</option>
                      </select>
                    </label>
                  </div>
                  <label className="grid gap-1 text-sm font-bold">Reveal story
                    <textarea className="min-h-28 rounded border border-[var(--sparkle-border)] bg-white p-3 font-normal" defaultValue={item.revealStory ?? ""} maxLength={700} name="revealStory" placeholder="Tell the true story of this reveal in your own words." />
                  </label>
                  <label className="grid gap-1 text-sm font-bold">Personal piece photo
                    <input accept="image/jpeg,image/png,image/webp" className="min-h-11 rounded border border-[var(--sparkle-border)] bg-white p-2 font-normal" name="personalPhoto" type="file" />
                  </label>
                  <label className="flex min-h-11 items-center gap-2 text-sm font-bold"><input defaultChecked={item.isRarestReveal === true} name="isRarestReveal" type="checkbox" value="yes" /> Mark as a Rarest Reveal</label>
                  <SubmitButton disabled={disabled} pending={piecePending}>Save piece story</SubmitButton>
                </form>

                <div className="grid content-start gap-3 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-paper-soft)] p-4">
                  <p className="inline-flex items-center gap-2 font-bold text-[var(--sparkle-plum-deep)]"><FolderHeart aria-hidden="true" className="size-5" /> Showcase Collection</p>
                  {data.collections.length === 0 ? <p className="text-sm text-[var(--sparkle-ink-muted)]">Create a Showcase Collection above first.</p> : (
                    <form action={assignmentFormAction} className="grid gap-3">
                      <input name="collectionItemId" type="hidden" value={item.id} />
                      <select className="min-h-11 rounded border border-[var(--sparkle-border)] bg-white px-3" name="collectionId" required>
                        <option value="">Choose a collection</option>
                        {data.collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.title}</option>)}
                      </select>
                      <div className="grid grid-cols-2 gap-2">
                        <button className="min-h-11 rounded bg-[var(--sparkle-plum)] px-3 text-sm font-bold text-white disabled:opacity-50" disabled={disabled || assignmentPending} name="operation" type="submit" value="add">Add</button>
                        <button className="min-h-11 rounded border border-[var(--sparkle-border)] px-3 text-sm font-bold text-[var(--sparkle-plum)] disabled:opacity-50" disabled={disabled || assignmentPending} name="operation" type="submit" value="remove">Remove</button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </details>
          ))
        )}
        <ActionStatus state={pieceState} />
        <ActionStatus state={assignmentState} />
      </div>
    </section>
  );
}

function CollectionForm({ action, collection, disabled, pending }: { action: (formData: FormData) => void; collection?: ShowcaseCollection; disabled: boolean; pending: boolean }) {
  return (
    <form action={action} className="grid gap-3">
      {collection ? <input name="collectionId" type="hidden" value={collection.id} /> : null}
      <label className="grid gap-1 text-sm font-bold">Title<input className="min-h-11 rounded border border-[var(--sparkle-border)] bg-white px-3 font-normal" defaultValue={collection?.title} maxLength={80} name="title" placeholder="Purple Dreams" required /></label>
      <label className="grid gap-1 text-sm font-bold">Description<textarea className="min-h-20 rounded border border-[var(--sparkle-border)] bg-white p-3 font-normal" defaultValue={collection?.description} maxLength={240} name="description" placeholder="A short introduction to this group." /></label>
      <label className="grid gap-1 text-sm font-bold">Visibility<select className="min-h-11 rounded border border-[var(--sparkle-border)] bg-white px-3 font-normal" defaultValue={collection?.visibility ?? "private"} name="visibility"><option value="private">Private</option><option value="public">Public</option></select></label>
      <SubmitButton disabled={disabled} pending={pending}>{collection ? "Update collection" : "Create collection"}</SubmitButton>
    </form>
  );
}

function VisibilityChoice({ defaultChecked, icon, label, value }: { defaultChecked: boolean; icon: React.ReactNode; label: string; value: string }) {
  return <label className="flex min-h-11 items-center gap-2 rounded border border-[var(--sparkle-border)] bg-white px-3 text-sm font-bold"><input defaultChecked={defaultChecked} name="visibility" type="radio" value={value} />{icon}{label}</label>;
}

function SubmitButton({ children, disabled, pending }: { children: React.ReactNode; disabled: boolean; pending: boolean }) {
  return <button className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-4 text-sm font-bold text-white disabled:opacity-50" disabled={disabled || pending} type="submit">{pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Save aria-hidden="true" className="size-4" />}{children}</button>;
}

function ActionStatus({ state }: { state: SilverSaveActionState }) {
  if (state.status === "idle") return null;
  return <p className="text-sm font-bold text-[var(--sparkle-ink-muted)]" role="status"><Sparkles aria-hidden="true" className="mr-1 inline size-4 text-[var(--sparkle-coral)]" />{state.message}</p>;
}

async function disabledAction(): Promise<SilverSaveActionState> {
  return { status: "denied", message: "Sign in with Silver access to save Showcase updates." };
}
