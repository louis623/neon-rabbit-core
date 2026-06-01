"use client";

import { useActionState, useState } from "react";
import { Eye, LockKeyhole, Save, UserRound } from "lucide-react";
import { updateSilverProfilePreview } from "@/lib/sparkle-finder/customer-state";
import type { SparkleFinderAccountState } from "@/lib/sparkle-finder/auth";
import type { CustomerAccount, SilverProfile } from "@/lib/sparkle-finder/types";
import type { SilverSaveActionState } from "@/app/(hub)/silver/actions";

type ProfileEditorProps = {
  accountState: SparkleFinderAccountState;
  canSaveSilverActions: boolean;
  customer: CustomerAccount;
  isLocalPreview: boolean;
  profile: SilverProfile;
  saveAction?: (previousState: SilverSaveActionState, formData: FormData) => Promise<SilverSaveActionState>;
};

const realAccountInitialState: SilverSaveActionState = {
  status: "idle",
  message: "Profile ready.",
};

export function ProfileEditor({
  accountState,
  canSaveSilverActions,
  customer,
  isLocalPreview,
  profile,
  saveAction,
}: ProfileEditorProps) {
  const [previewProfile, setPreviewProfile] = useState(profile);
  const [localStatusMessage, setLocalStatusMessage] = useState(
    canSaveSilverActions ? "Local preview ready." : "Silver preview is required to save profile updates.",
  );
  const [actionState, formAction, isPending] = useActionState(saveAction ?? disabledProfileAction, realAccountInitialState);
  const statusMessage = isLocalPreview ? localStatusMessage : actionState.message;

  function handlePreviewSave(formData: FormData) {
    const result = updateSilverProfilePreview(accountState, previewProfile, {
      bio: String(formData.get("bio") ?? ""),
      tiktokHandle: String(formData.get("tiktokHandle") ?? ""),
      visibility: formData.get("visibility") === "sparkle_finder" ? "sparkle_finder" : "private",
    });

    if (!result.ok) {
      setLocalStatusMessage("Silver preview is required to save profile updates.");
      return;
    }

    setPreviewProfile(result.profile);
    setLocalStatusMessage("Profile preview saved locally.");
  }

  return (
    <section className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Profile form</p>
          <h2 className="mt-1 font-[var(--font-playfair)] text-3xl font-semibold text-[var(--sparkle-plum-deep)]">
            Silver Profile
          </h2>
        </div>
        <div className="grid size-16 place-items-center rounded-full border border-[var(--sparkle-border)] bg-[var(--sparkle-blush-bg)] text-[var(--sparkle-plum)]">
          <UserRound aria-hidden="true" className="size-8" strokeWidth={1.5} />
        </div>
      </div>

      <form
        action={isLocalPreview ? handlePreviewSave : formAction}
        className="mt-5 grid gap-4"
        aria-label={isLocalPreview ? "Silver profile preview form" : "Silver profile form"}
      >
        <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
          Display name
          <input
            className="min-h-11 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] px-3 text-sm font-normal text-[var(--sparkle-ink)]"
            defaultValue={customer.displayName}
            readOnly
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
          TikTok handle
          <input
            className="min-h-11 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-normal text-[var(--sparkle-ink)]"
            defaultValue={previewProfile.tiktokHandle}
            name="tiktokHandle"
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
          Collector notes
          <textarea
            className="min-h-28 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 py-3 text-sm font-normal leading-6 text-[var(--sparkle-ink)]"
            defaultValue={previewProfile.bio}
            name="bio"
          />
        </label>
        <fieldset className="grid gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] p-3">
          <legend className="px-1 text-sm font-bold text-[var(--sparkle-plum-deep)]">Visibility</legend>
          <label className="flex min-h-10 items-center gap-3 text-sm text-[var(--sparkle-ink-muted)]">
            <input defaultChecked={previewProfile.visibility === "private"} name="visibility" type="radio" value="private" />
            <LockKeyhole aria-hidden="true" className="size-4 text-[var(--sparkle-coral)]" />
            Private
          </label>
          <label className="flex min-h-10 items-center gap-3 text-sm text-[var(--sparkle-ink-muted)]">
            <input
              defaultChecked={previewProfile.visibility === "sparkle_finder"}
              name="visibility"
              type="radio"
              value="sparkle_finder"
            />
            <Eye aria-hidden="true" className="size-4 text-[var(--sparkle-coral)]" />
            Sparkle Finder preview
          </label>
        </fieldset>
        <button
          className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-55"
          disabled={!canSaveSilverActions || (!isLocalPreview && (!saveAction || isPending))}
          type="submit"
        >
          <Save aria-hidden="true" className="size-4" />
          {isLocalPreview ? "Preview save" : "Save profile"}
        </button>
        <p className="text-sm font-semibold text-[var(--sparkle-ink-muted)]" role="status">
          {statusMessage}
        </p>
      </form>
    </section>
  );
}

async function disabledProfileAction(): Promise<SilverSaveActionState> {
  return {
    status: "denied",
    message: "Silver access is required to save profile updates.",
  };
}
