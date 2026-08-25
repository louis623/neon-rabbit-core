"use client";

import { useState } from "react";
import { Edit3, Eye, LockKeyhole, UserRound, X } from "lucide-react";
import { ProfileEditor } from "@/components/silver/ProfileEditor";
import type { SilverSaveActionState } from "@/app/(hub)/silver/actions";
import type { SparkleFinderAccountState } from "@/lib/sparkle-finder/auth";
import type { CustomerAccount, SilverProfile } from "@/lib/sparkle-finder/types";

type ProfileSummaryPanelProps = {
  accountState: SparkleFinderAccountState;
  canSaveSilverActions: boolean;
  customer: CustomerAccount;
  isLocalPreview: boolean;
  profile: SilverProfile;
  saveAction?: (previousState: SilverSaveActionState, formData: FormData) => Promise<SilverSaveActionState>;
};

export function ProfileSummaryPanel({
  accountState,
  canSaveSilverActions,
  customer,
  isLocalPreview,
  profile,
  saveAction,
}: ProfileSummaryPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const photoUrl = profile.photoUrl.trim();
  const isPublicPreview = profile.visibility === "sparkle_finder";

  return (
    <section
      className="h-fit rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-4 shadow-[var(--sparkle-shadow-sm)]"
      data-smoke="profile-summary-card"
    >
      <div className="flex items-start gap-3">
        <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--sparkle-border)] bg-[var(--sparkle-blush-bg)] text-[var(--sparkle-plum)]">
          {photoUrl ? (
            <span
              aria-label={`${customer.displayName} profile photo`}
              className="size-full bg-cover bg-center"
              role="img"
              style={{ backgroundImage: `url("${photoUrl}")` }}
            />
          ) : (
            <UserRound aria-hidden="true" className="size-7" strokeWidth={1.5} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Your Showcase</p>
          <h2 className="mt-1 truncate font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
            {customer.displayName}
          </h2>
          <p className="mt-1 truncate text-sm font-semibold text-[var(--sparkle-ink-muted)]">
            {profile.tiktokHandle.trim() || "TikTok handle not added"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <span className="inline-flex min-h-9 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] px-3 text-sm font-bold text-[var(--sparkle-ink-muted)]">
          {isPublicPreview ? (
            <Eye aria-hidden="true" className="size-4 text-[var(--sparkle-coral)]" />
          ) : (
            <LockKeyhole aria-hidden="true" className="size-4 text-[var(--sparkle-coral)]" />
          )}
          {isPublicPreview ? "Sparkle Finder preview" : "Private"}
        </span>
        {profile.bio.trim() ? (
          <p className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 py-2 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            {profile.bio.trim()}
          </p>
        ) : null}
      </div>

      <button
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-4 text-sm font-bold text-white transition hover:bg-[var(--sparkle-plum-deep)]"
        onClick={() => setIsEditing(true)}
        type="button"
      >
        <Edit3 aria-hidden="true" className="size-4" />
        Edit Profile
      </button>

      {isEditing ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/35 p-0 sm:place-items-center sm:p-5">
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[var(--sparkle-radius-sm)] bg-[var(--sparkle-paper)] p-4 shadow-2xl sm:max-w-xl sm:rounded-[var(--sparkle-radius-sm)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[var(--sparkle-plum-deep)]">
                Edit Profile
              </h3>
              <button
                aria-label="Close profile editor"
                className="grid size-10 place-items-center rounded-full border border-[var(--sparkle-border)] bg-white text-[var(--sparkle-plum)]"
                onClick={() => setIsEditing(false)}
                type="button"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
            <ProfileEditor
              accountState={accountState}
              canSaveSilverActions={canSaveSilverActions}
              customer={customer}
              isLocalPreview={isLocalPreview}
              profile={profile}
              saveAction={saveAction}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
