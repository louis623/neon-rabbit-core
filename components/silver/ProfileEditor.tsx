"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, ImagePlus, LoaderCircle, LockKeyhole, UserRound } from "lucide-react";
import { updateSilverProfilePreview } from "@/lib/sparkle-finder/customer-state";
import type { SparkleFinderAccountState } from "@/lib/sparkle-finder/auth";
import type { CustomerAccount, SilverProfile } from "@/lib/sparkle-finder/types";
import type { SilverSaveActionState } from "@/app/(hub)/silver/actions";
import type { ChangeEvent, PointerEvent } from "react";

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
  message: "Changes auto-save.",
};

const profilePhotoSourceMaxBytes = 10 * 1024 * 1024;
const profilePhotoDataUrlMaxCharacters = 700_000;
const profilePhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const profileCropFrameSize = 160;
const profileCropOutputSize = 320;
const profileAutosaveDelayMs = 900;
const profilePhotoDecodeTimeoutMs = 2500;

type ProfilePhotoCropState = {
  height: number;
  name: string;
  offsetX: number;
  offsetY: number;
  scale: number;
  sourceFile?: File;
  src: string;
  width: number;
};

type CropDragState = {
  crop: ProfilePhotoCropState;
  pointerX: number;
  pointerY: number;
};

type ProfileDraftState = {
  bio: string;
  displayName: string;
  tiktokHandle: string;
  visibility: SilverProfile["visibility"];
};

type ProfileSaveStatus = {
  message: string;
  tone: "idle" | "saving" | "saved" | "error";
};

export function ProfileEditor({
  accountState,
  canSaveSilverActions,
  customer,
  isLocalPreview,
  profile,
  saveAction,
}: ProfileEditorProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const hiddenSubmitRef = useRef<HTMLButtonElement>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cropDragRef = useRef<CropDragState | null>(null);
  const [previewCustomer, setPreviewCustomer] = useState(customer);
  const [previewProfile, setPreviewProfile] = useState(profile);
  const [profileDraft, setProfileDraft] = useState<ProfileDraftState>(() => ({
    bio: profile.bio,
    displayName: customer.displayName,
    tiktokHandle: profile.tiktokHandle,
    visibility: profile.visibility,
  }));
  const [profilePhotoCrop, setProfilePhotoCrop] = useState<ProfilePhotoCropState | null>(null);
  const [selectedProfilePhoto, setSelectedProfilePhoto] = useState<{ name: string; url: string } | null>(null);
  const [profilePhotoMessage, setProfilePhotoMessage] = useState("JPG, PNG, or WebP.");
  const [autosaveMessage, setAutosaveMessage] = useState<string | null>(null);
  const [localStatusMessage, setLocalStatusMessage] = useState(
    canSaveSilverActions ? "Changes auto-save." : "Silver preview is required to save profile updates.",
  );
  const [actionState, formAction, isPending] = useActionState(handleProfileFormAction, realAccountInitialState);
  const saveStatus = getProfileSaveStatus({
    actionState,
    autosaveMessage,
    isLocalPreview,
    isPending,
    localStatusMessage,
  });
  const profilePhotoInputId = useId();
  const activeProfilePhotoUrl = selectedProfilePhoto?.url ?? previewProfile.photoUrl;

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  function scheduleProfileAutosave(delayMs = profileAutosaveDelayMs) {
    if (!canSaveSilverActions) {
      setLocalStatusMessage("Silver preview is required to save profile updates.");
      return;
    }

    cancelPendingProfileAutosave();

    if (isLocalPreview) {
      setLocalStatusMessage("Saving changes...");
    } else {
      setAutosaveMessage("Saving changes...");
    }

    autosaveTimerRef.current = setTimeout(() => {
      autosaveTimerRef.current = null;
      void submitProfileAutosave();
    }, delayMs);
  }

  function cancelPendingProfileAutosave() {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
  }

  function updateProfileDraft<Field extends keyof ProfileDraftState>(
    field: Field,
    value: ProfileDraftState[Field],
    delayMs = profileAutosaveDelayMs,
  ) {
    setProfileDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
    scheduleProfileAutosave(delayMs);
  }

  async function handleProfileFormAction(
    previousState: SilverSaveActionState,
    formData: FormData,
  ): Promise<SilverSaveActionState> {
    const result = saveAction
      ? await saveAction(previousState, formData)
      : await disabledProfileAction();

    setAutosaveMessage(result.status === "saved" ? "Saved just now." : null);

    return result;
  }

  async function submitProfileAutosave() {
    const form = formRef.current;

    if (!form) {
      return;
    }

    if (isLocalPreview) {
      await handlePreviewSave(new FormData(form));
      return;
    }

    if (!saveAction) {
      setAutosaveMessage("Sign in to auto-save profile updates.");
      return;
    }

    form.requestSubmit(hiddenSubmitRef.current ?? undefined);
  }

  async function handlePreviewSave(formData: FormData) {
    const displayName = String(formData.get("displayName") ?? "").trim();

    if (!displayName) {
      setLocalStatusMessage("Display name is required.");
      return;
    }

    const profilePhoto = await readPreparedProfilePhotoDataUrl(
      formData.get("profilePhotoDataUrl"),
      formData.get("profilePhoto"),
    );

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
    setLocalStatusMessage("Saved just now.");
  }

  async function handleProfilePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    cancelPendingProfileAutosave();

    if (!file) {
      setProfilePhotoCrop(null);
      setSelectedProfilePhoto(null);
      setProfilePhotoMessage("JPG, PNG, or WebP.");
      return;
    }

    setSelectedProfilePhoto({
      name: file.name,
      url: activeProfilePhotoUrl || previewProfile.photoUrl,
    });
    setProfilePhotoMessage("Preparing preview...");
    const profilePhoto = await prepareProfilePhotoCrop(file);
    input.value = "";

    if (!profilePhoto.ok) {
      setProfilePhotoCrop(null);
      setSelectedProfilePhoto(null);
      setProfilePhotoMessage(profilePhoto.message);
      setLocalStatusMessage(profilePhoto.message);
      return;
    }

    setProfilePhotoCrop(profilePhoto.crop);
    setSelectedProfilePhoto({
      name: file.name,
      url: profilePhoto.photoUrl,
    });
    setProfilePhotoMessage("Drag photo to center. Auto-saved.");

    scheduleProfileAutosave(300);
  }

  function handleCropPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!profilePhotoCrop) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    cropDragRef.current = {
      crop: profilePhotoCrop,
      pointerX: event.clientX,
      pointerY: event.clientY,
    };
    setProfilePhotoMessage("Release to auto-save the new center.");
  }

  function handleCropPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = cropDragRef.current;

    if (!drag) {
      return;
    }

    setProfilePhotoCrop(getDraggedCrop(drag, event.clientX, event.clientY));
  }

  async function handleCropPointerUp(event: PointerEvent<HTMLDivElement>) {
    const drag = cropDragRef.current;

    if (!drag) {
      return;
    }

    cropDragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    const crop = getDraggedCrop(drag, event.clientX, event.clientY);
    setProfilePhotoCrop(crop);
    await applyProfilePhotoCrop(crop);
  }

  async function applyProfilePhotoCrop(crop: ProfilePhotoCropState) {
    const profilePhoto = await cropProfilePhoto(crop);

    if (!profilePhoto.ok) {
      setProfilePhotoMessage(profilePhoto.message);
      setLocalStatusMessage(profilePhoto.message);
      return;
    }

    setSelectedProfilePhoto({
      name: crop.name,
      url: profilePhoto.photoUrl,
    });
    setProfilePhotoMessage("Centered and auto-saved.");
    scheduleProfileAutosave(300);
  }

  return (
    <section className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Profile form</p>
          <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[var(--sparkle-plum-deep)]">
            Collector Profile
          </h2>
          <ProfileSaveStatusBadge status={saveStatus} />
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
        ref={formRef}
      >
        <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
          Display name
          <input
            className="min-h-11 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] px-3 text-sm font-normal text-[var(--sparkle-ink)]"
            maxLength={80}
            name="displayName"
            onChange={(event) => updateProfileDraft("displayName", event.target.value)}
            required
            value={profileDraft.displayName}
          />
        </label>
        <div className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
          <span>Profile photo</span>
          <input name="photoUrl" readOnly type="hidden" value={previewProfile.photoUrl} />
          <input name="profilePhotoDataUrl" readOnly type="hidden" value={selectedProfilePhoto?.url ?? ""} />
          <div className="grid justify-items-center gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-4 py-5 text-center">
            {profilePhotoCrop ? (
              <div
                aria-label="Drag profile photo to center"
                className="relative size-40 touch-none overflow-hidden rounded-full border border-[var(--sparkle-border)] bg-[var(--sparkle-blush-bg)] text-[var(--sparkle-plum)] shadow-inner"
                onPointerDown={handleCropPointerDown}
                onPointerMove={handleCropPointerMove}
                onPointerUp={handleCropPointerUp}
                role="img"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  className="pointer-events-none absolute max-w-none select-none"
                  src={profilePhotoCrop.src}
                  style={{
                    height: profilePhotoCrop.height * profilePhotoCrop.scale,
                    transform: `translate(${profilePhotoCrop.offsetX}px, ${profilePhotoCrop.offsetY}px)`,
                    width: profilePhotoCrop.width * profilePhotoCrop.scale,
                  }}
                />
              </div>
            ) : (
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
            )}
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
              <p className="text-xs font-semibold text-[var(--sparkle-ink-muted)]" role="status">
                {profilePhotoMessage}
              </p>
            </div>
          </div>
        </div>
        <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
          TikTok handle
          <input
            className="min-h-11 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-normal text-[var(--sparkle-ink)]"
            name="tiktokHandle"
            onChange={(event) => updateProfileDraft("tiktokHandle", event.target.value)}
            value={profileDraft.tiktokHandle}
          />
        </label>
        <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
          Collector notes
          <textarea
            className="min-h-28 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 py-3 text-sm font-normal leading-6 text-[var(--sparkle-ink)]"
            name="bio"
            onChange={(event) => updateProfileDraft("bio", event.target.value)}
            value={profileDraft.bio}
          />
        </label>
        <fieldset className="grid gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] p-3">
          <legend className="px-1 text-sm font-bold text-[var(--sparkle-plum-deep)]">Visibility</legend>
          <label className="flex min-h-10 items-center gap-3 text-sm text-[var(--sparkle-ink-muted)]">
            <input
              checked={profileDraft.visibility === "private"}
              name="visibility"
              onChange={() => updateProfileDraft("visibility", "private", 200)}
              type="radio"
              value="private"
            />
            <LockKeyhole aria-hidden="true" className="size-4 text-[var(--sparkle-coral)]" />
            Private
          </label>
          <label className="flex min-h-10 items-center gap-3 text-sm text-[var(--sparkle-ink-muted)]">
            <input
              checked={profileDraft.visibility === "sparkle_finder"}
              name="visibility"
              onChange={() => updateProfileDraft("visibility", "sparkle_finder", 200)}
              type="radio"
              value="sparkle_finder"
            />
            <Eye aria-hidden="true" className="size-4 text-[var(--sparkle-coral)]" />
            Sparkle Finder preview
          </label>
        </fieldset>
        <button className="sr-only" disabled={!canSaveSilverActions || (!isLocalPreview && !saveAction)} ref={hiddenSubmitRef} type="submit">
          Auto-save profile
        </button>
      </form>
    </section>
  );
}

function ProfileSaveStatusBadge({ status }: { status: ProfileSaveStatus }) {
  const Icon = status.tone === "error" ? AlertCircle : status.tone === "saved" ? CheckCircle2 : status.tone === "saving" ? LoaderCircle : CheckCircle2;
  const toneClassName =
    status.tone === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : status.tone === "saved"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : status.tone === "saving"
          ? "border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] text-[var(--sparkle-plum)]"
          : "border-[var(--sparkle-border)] bg-[var(--sparkle-blush-bg)] text-[var(--sparkle-ink-muted)]";

  return (
    <p
      className={`mt-3 inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-sm font-bold ${toneClassName}`}
      role="status"
    >
      <Icon aria-hidden="true" className={`size-4 ${status.tone === "saving" ? "animate-spin" : ""}`} />
      {status.message}
    </p>
  );
}

function getProfileSaveStatus({
  actionState,
  autosaveMessage,
  isLocalPreview,
  isPending,
  localStatusMessage,
}: {
  actionState: SilverSaveActionState;
  autosaveMessage: string | null;
  isLocalPreview: boolean;
  isPending: boolean;
  localStatusMessage: string;
}): ProfileSaveStatus {
  if (isPending) {
    return { message: "Saving changes...", tone: "saving" };
  }

  if (isLocalPreview) {
    return {
      message: localStatusMessage,
      tone: getStatusTone(localStatusMessage, "idle"),
    };
  }

  if (autosaveMessage) {
    return {
      message: autosaveMessage,
      tone: getStatusTone(autosaveMessage, "saving"),
    };
  }

  if (actionState.status === "saved") {
    return { message: "Saved just now.", tone: "saved" };
  }

  if (actionState.status === "error" || actionState.status === "denied") {
    return { message: actionState.message, tone: "error" };
  }

  return { message: actionState.message, tone: "idle" };
}

function getStatusTone(message: string, fallback: ProfileSaveStatus["tone"]): ProfileSaveStatus["tone"] {
  if (/could not|required|sign in|silver preview|silver access/i.test(message)) {
    return "error";
  }

  if (/saved/i.test(message)) {
    return "saved";
  }

  if (/saving/i.test(message)) {
    return "saving";
  }

  return fallback;
}

async function disabledProfileAction(): Promise<SilverSaveActionState> {
  return {
    status: "denied",
    message: "Silver access is required to save profile updates.",
  };
}

async function readPreparedProfilePhotoDataUrl(
  preparedValue: FormDataEntryValue | null,
  fileValue: FormDataEntryValue | null,
): Promise<{ ok: true; photoUrl?: string } | { ok: false; message: string }> {
  const preparedPhotoUrl = typeof preparedValue === "string" ? preparedValue.trim() : "";

  if (preparedPhotoUrl) {
    return validatePreparedProfilePhotoDataUrl(preparedPhotoUrl);
  }

  if (!(fileValue instanceof File) || fileValue.size === 0) {
    return { ok: true };
  }

  const prepared = await prepareProfilePhotoCrop(fileValue);

  return prepared.ok ? { ok: true, photoUrl: prepared.photoUrl } : prepared;
}

async function prepareProfilePhotoCrop(
  file: File,
): Promise<{ ok: true; crop: ProfilePhotoCropState; photoUrl: string } | { ok: false; message: string }> {
  if (!profilePhotoTypes.has(file.type)) {
    return { ok: false, message: "Upload a JPG, PNG, or WebP profile photo." };
  }

  if (file.size > profilePhotoSourceMaxBytes) {
    return { ok: false, message: "Profile photo must be 10 MB or smaller." };
  }

  try {
    const objectUrl = URL.createObjectURL(file);
    const image = await loadProfilePhotoBitmap(file);
    try {
      const crop = createInitialProfilePhotoCrop(file.name, objectUrl, image.width, image.height, file);
      const cropped = await cropProfilePhoto(crop);

      return cropped.ok ? { ok: true, crop, photoUrl: cropped.photoUrl } : cropped;
    } finally {
      image.close();
    }
  } catch {
    return { ok: false, message: "Profile photo could not be previewed. Try a JPG, PNG, or WebP." };
  }
}

async function cropProfilePhoto(crop: ProfilePhotoCropState | null): Promise<{ ok: true; photoUrl: string } | { ok: false; message: string }> {
  if (!crop) {
    return { ok: false, message: "Profile photo could not be prepared." };
  }

  let bitmap: ImageBitmap | null = null;
  let image: CanvasImageSource;

  if (crop.sourceFile) {
    bitmap = await loadProfilePhotoBitmap(crop.sourceFile);
    image = bitmap;
  } else {
    image = await loadImage(crop.src);
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    bitmap?.close();
    return { ok: false, message: "Profile photo could not be previewed." };
  }

  canvas.width = profileCropOutputSize;
  canvas.height = profileCropOutputSize;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, profileCropOutputSize, profileCropOutputSize);
  context.drawImage(
    image,
    (crop.offsetX * profileCropOutputSize) / profileCropFrameSize,
    (crop.offsetY * profileCropOutputSize) / profileCropFrameSize,
    (crop.width * crop.scale * profileCropOutputSize) / profileCropFrameSize,
    (crop.height * crop.scale * profileCropOutputSize) / profileCropFrameSize,
  );
  bitmap?.close();

  for (const quality of [0.86, 0.78, 0.7, 0.62]) {
    const photoUrl = canvas.toDataURL("image/jpeg", quality);
    const validated = validatePreparedProfilePhotoDataUrl(photoUrl);

    if (validated.ok) {
      return validated as { ok: true; photoUrl: string };
    }
  }

  return { ok: false, message: "Profile photo is still too large after resizing. Try a smaller image." };
}

function createInitialProfilePhotoCrop(
  name: string,
  src: string,
  width: number,
  height: number,
  sourceFile?: File,
): ProfilePhotoCropState {
  const scale = Math.max(profileCropFrameSize / width, profileCropFrameSize / height);

  return clampProfilePhotoCrop({
    height,
    name,
    offsetX: (profileCropFrameSize - width * scale) / 2,
    offsetY: (profileCropFrameSize - height * scale) / 2,
    scale,
    sourceFile,
    src,
    width,
  });
}

function getDraggedCrop(drag: CropDragState, pointerX: number, pointerY: number): ProfilePhotoCropState {
  return clampProfilePhotoCrop({
    ...drag.crop,
    offsetX: drag.crop.offsetX + pointerX - drag.pointerX,
    offsetY: drag.crop.offsetY + pointerY - drag.pointerY,
  });
}

function clampProfilePhotoCrop(crop: ProfilePhotoCropState): ProfilePhotoCropState {
  const renderedWidth = crop.width * crop.scale;
  const renderedHeight = crop.height * crop.scale;
  const minX = Math.min(0, profileCropFrameSize - renderedWidth);
  const minY = Math.min(0, profileCropFrameSize - renderedHeight);

  return {
    ...crop,
    offsetX: Math.min(0, Math.max(minX, crop.offsetX)),
    offsetY: Math.min(0, Math.max(minY, crop.offsetY)),
  };
}

function loadProfilePhotoBitmap(file: File): Promise<ImageBitmap> {
  if (!("createImageBitmap" in window)) {
    return Promise.reject(new Error("Profile photo preview is not supported in this browser."));
  }

  return Promise.race([
    window.createImageBitmap(file),
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error("Profile photo image decode timed out.")), profilePhotoDecodeTimeoutMs);
    }),
  ]);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timeoutId = window.setTimeout(() => {
      reject(new Error("Profile photo image preview timed out."));
    }, 5000);

    image.addEventListener("load", () => {
      window.clearTimeout(timeoutId);
      resolve(image);
    });
    image.addEventListener("error", () => {
      window.clearTimeout(timeoutId);
      reject(new Error("Profile photo image could not be loaded."));
    });
    image.src = src;
  });
}

function validatePreparedProfilePhotoDataUrl(
  photoUrl: string,
): { ok: true; photoUrl: string } | { ok: false; message: string } {
  if (!photoUrl) {
    return { ok: true, photoUrl };
  }

  if (!photoUrl.startsWith("data:image/")) {
    return { ok: false, message: "Profile photo could not be prepared." };
  }

  if (photoUrl.length > profilePhotoDataUrlMaxCharacters) {
    return { ok: false, message: "Profile photo is too large. Try a smaller image." };
  }

  return { ok: true, photoUrl };
}
