"use client";

import { useActionState } from "react";
import { Ban, Flag, LoaderCircle } from "lucide-react";
import type { CollectorSocialActionState } from "@/app/(hub)/collectors/actions";

type SocialSafetyControlsProps = {
  blockAction?: (previousState: CollectorSocialActionState, formData: FormData) => Promise<CollectorSocialActionState>;
  handle: string;
  isSelf: boolean;
  reportAction?: (previousState: CollectorSocialActionState, formData: FormData) => Promise<CollectorSocialActionState>;
  targetUserId: string;
  viewerUserId?: string | null;
};

const idleActionState: CollectorSocialActionState = {
  status: "idle",
  message: "",
};

export function SocialSafetyControls({
  blockAction,
  handle,
  isSelf,
  reportAction,
  targetUserId,
  viewerUserId,
}: SocialSafetyControlsProps) {
  const [reportState, reportFormAction, isReportPending] = useActionState(
    reportAction ?? disabledSafetyAction,
    idleActionState,
  );
  const [blockState, blockFormAction, isBlockPending] = useActionState(
    blockAction ?? disabledSafetyAction,
    idleActionState,
  );
  const statusMessage = isReportPending
    ? "Sending your report..."
    : isBlockPending
      ? "Blocking this collector..."
      : blockState.status !== "idle"
        ? blockState.message
        : reportState.status !== "idle"
          ? reportState.message
          : null;

  if (isSelf || !viewerUserId) {
    return null;
  }

  return (
    <div className="grid gap-2" data-smoke="collector-safety-controls">
      <div className="flex flex-wrap gap-2">
        <form action={reportFormAction} className="contents">
          <input name="targetUserId" type="hidden" value={targetUserId} />
          <input name="handle" type="hidden" value={handle} />
          <input name="reason" type="hidden" value="other" />
          <input name="details" type="hidden" value="Collector profile report" />
          <button
            aria-label={`Report @${handle}`}
            aria-busy={isReportPending}
            className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-xs font-bold text-[var(--sparkle-ink-muted)] transition hover:border-[var(--sparkle-rose)] hover:text-[var(--sparkle-plum)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isReportPending}
            type="submit"
          >
            {isReportPending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Flag aria-hidden="true" className="size-4" />}
            <span>Report</span>
          </button>
        </form>
        <form action={blockFormAction} className="flex flex-wrap items-center gap-2">
          <input name="targetUserId" type="hidden" value={targetUserId} />
          <input name="handle" type="hidden" value={handle} />
          <input name="reason" type="hidden" value="" />
          <label className="inline-flex min-h-10 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-xs font-bold text-[var(--sparkle-ink-muted)]">
            <input
              className="size-4 accent-[var(--sparkle-rose)]"
              disabled={isBlockPending}
              name="confirmBlock"
              required
              type="checkbox"
              value="yes"
            />
            <span>Confirm block</span>
          </label>
          <button
            aria-busy={isBlockPending}
            className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-xs font-bold text-[var(--sparkle-ink-muted)] transition hover:border-[var(--sparkle-rose)] hover:text-[var(--sparkle-plum)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isBlockPending}
            type="submit"
          >
            {isBlockPending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Ban aria-hidden="true" className="size-4" />}
            <span>Block collector</span>
          </button>
        </form>
      </div>
      {statusMessage ? (
        <p aria-live="polite" className="text-xs font-semibold text-[var(--sparkle-ink-muted)]" role="status">
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}

async function disabledSafetyAction(): Promise<CollectorSocialActionState> {
  return {
    status: "error",
    message: "Sign in to use these safety controls.",
  };
}
