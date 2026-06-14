"use client";

import { useActionState, useId, useState } from "react";
import { Eye, ImagePlus, LoaderCircle, LockKeyhole, Save, UserRound } from "lucide-react";
import { updateSilverProfilePreview } from "@/lib/sparkle-finder/customer-state";
import type { SparkleFinderAccountState } from "@/lib/sparkle-finder/auth";
import type { CustomerAccount, SilverProfile } from "@/lib/sparkle-finder/types";
import type { SilverSaveActionState } from "@/app/(hub)/silver/actions";
import type { ChangeEvent } from "react";

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
  message: "Profile ready to save.",
};

const profilePhotoMaxBytes = 500 * 1024;
const profilePhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function ProfileEditor({
  accountState,
  canSaveSilverActions,
  customer,
  isLocalPreview,
  profile,
  saveAction,
}: ProfileEditorProps) {
  const [previewCustomer, setPreviewCustomer] = useState(customer);
  const [previewProfile, setPreviewProfile] = useState(profile);
  const [selectedProfilePhoto, setSelectedProfilePhoto] = useState<{ name: string; url: string } | null>(null);
  const [profilePhotoMessage, setProfilePhotoMessage] = useState("JPG, PNG, or WebP.");
  const [localStatusMessage, setLocalStatusMessage] = useState(
    canSaveSilverActions ? "Local preview ready." : "Silver preview is required to save profile updates.",
  );
  const [actionState, formAction, isPending] = useActionState(saveAction ?? disabledProfileAction, realAccountInitialState);
  const statusMessage = isLocalPreview ? localStatusMessage : actionState.message;
  const profilePhotoInputId = useId();
  const activeProfilePhotoUrl = selectedProfilePhoto?.url ?? previewProfile.photoUrl;

  async function handlePreviewSave(formData: FormData) {
    const displayName = String(formData.get("displayName") ?? "").trim();

    if (!displayName) {
      setLocalStatusMessage("Display name is required.");
      return;
    }

    const profilePhoto = await readProfilePhotoDataUrl(formData.get("profilePhoto"));

    if (!profilePhoto.ok) {
      setLocalStatusMessage(profilePhoto.message);
      return;
    }

    const result = updateSilverProfilePreview(accountState, previewProfile, {
      bio: String(formData.get("bio") ?? ""),
      displayName,
      photoUrl: profilePhoto.photoUrl ?? String(formData.get("photoUrl") ?? ""),
      tiktokHandle: String(formData.get("tiktokHandle") ?? ""),
      visibility: formData.get("visibility") === "sparkle_finder" ? "sparkle_finder" : "private",
    });

    if (!result.ok) {
      setLocalStatusMessage("Silver preview is required to save profile updates.");
      return;
    }

    setPreviewProfile(result.profile);
    setPreviewCustomer((currentCustomer) => ({
      ...currentCustomer,
      displayName,
    }));
    setSelectedProfilePhoto(null);
    setProfilePhotoMessage("JPG, PNG, or WebP.");
    setLocalStatusMessage("Profile preview saved locally.");
  }

  async function handleProfilePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      setSelectedProfilePhoto(null);
      setProfilePhotoMessage("JPG, PNG, or WebP.");
      return;
    }

    const profilePhoto = await readProfilePhotoDataUrl(file);

    if (!profilePhoto.ok) {
      event.currentTarget.value = "";
      setSelectedProfilePhoto(null);
      setProfilePhotoMessage(profilePhoto.message);
      setLocalStatusMessage(profilePhoto.message);
      return;
    }

    setSelectedProfilePhoto({
      name: file.name,
      url: profilePhoto.photoUrl ?? "",
    });
    setProfilePhotoMessage("Ready to save.");

    if (isLocalPreview) {
      setLocalStatusMessage("Profile photo ready to preview save.");
    }
  }

  return (
    <section className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Profile form</p>
          <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[var(--sparkle-plum-deep)]">
            Collector Profile
          </h2>
        </div>
        <div className="grid size-16 place-items-center overflow-hidden rounded-full border border-[var(--sparkle-border)] bg-[var(--sparkle-blush-bg)] text-[var(--sparkle-plum)]">
          {activeProfilePhotoUrl ? (
            <span
              aria-label={`${previewCustomer.displayName} profile photo`}
              className="size-full bg-cover bg-center"
              role="img"
              style={{ backgroundImage: `url("${activeProfilePhotoUrl}")` }}
            />
          ) : (
            <UserRound aria-hidden="true" className="size-8" strokeWidth={1.5} />
          )}
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
            defaultValue={previewCustomer.displayName}
            maxLength={80}
            name="displayName"
            required
          />
        </label>
        <div className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
          <span>Profile photo</span>
          <input name="photoUrl" readOnly type="hidden" value={previewProfile.photoUrl} />
          <div className="grid justify-items-center gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-4 py-5 text-center">
            <div className="grid size-16 place-items-center overflow-hidden rounded-full border border-[var(--sparkle-border)] bg-[var(--sparkle-blush-bg)] text-[var(--sparkle-plum)]">
              {activeProfilePhotoUrl ? (
                <span
                  aria-label={`${previewCustomer.displayName} selected profile photo`}
                  className="size-full bg-cover bg-center"
                  role="img"
                  style={{ backgroundImage: `url("${activeProfilePhotoUrl}")` }}
                />
              ) : (
                <UserRound aria-hidden="true" className="size-8" strokeWidth={1.5} />
              )}
            </div>
            <div className="grid w-full justify-items-center gap-2">
              <input
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                id={profilePhotoInputId}
                name="profilePhoto"
                onChange={handleProfilePhotoChange}
                type="file"
              />
              <label
                className="inline-flex min-h-10 w-full max-w-48 cursor-pointer items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-4 text-sm font-bold text-white transition hover:bg-[var(--sparkle-plum-deep)] active:translate-y-px"
                htmlFor={profilePhotoInputId}
              >
                <ImagePlus aria-hidden="true" className="size-4" />
                Upload photo
              </label>
              <span className="max-w-full truncate text-xs font-semibold text-[var(--sparkle-ink-muted)]">
                {selectedProfilePhoto?.name ?? (activeProfilePhotoUrl ? "Current photo" : "No photo selected")}
              </span>
              <p className="text-xs font-semibold text-[var(--sparkle-ink-muted)]">{profilePhotoMessage}</p>
            </div>
          </div>
        </div>
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
          aria-busy={!isLocalPreview && isPending}
          className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-4 text-sm font-bold text-white transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55"
          disabled={!canSaveSilverActions || (!isLocalPreview && (!saveAction || isPending))}
          type="submit"
        >
          {!isLocalPreview && isPending ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Save aria-hidden="true" className="size-4" />
          )}
          {isLocalPreview ? "Preview save" : isPending ? "Saving profile..." : "Save profile"}
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

async function readProfilePhotoDataUrl(
  value: FormDataEntryValue | null,
): Promise<{ ok: true; photoUrl?: string } | { ok: false; message: string }> {
  if (!(value instanceof File) || value.size === 0) {
    return { ok: true };
  }

  if (!profilePhotoTypes.has(value.type)) {
    return { ok: false, message: "Upload a JPG, PNG, or WebP profile photo." };
  }

  if (value.size > profilePhotoMaxBytes) {
    return { ok: false, message: "Profile photo must be 500 KB or smaller." };
  }

  try {
    return {
      ok: true,
      photoUrl: await fileToDataUrl(value),
    };
  } catch {
    return { ok: false, message: "Profile photo could not be read." };
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
    reader.addEventListener("error", () => reject(new Error("Profile photo could not be read.")));
    reader.readAsDataURL(file);
  });
}
