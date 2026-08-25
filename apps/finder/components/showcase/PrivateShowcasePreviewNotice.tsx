import { EyeOff } from "lucide-react";

export function PrivateShowcasePreviewNotice() {
  return (
    <aside
      className="flex items-start gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-blush-bg)] p-4 text-[var(--sparkle-plum-deep)]"
      data-smoke="private-showcase-preview"
      role="status"
    >
      <EyeOff aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[var(--sparkle-rose)]" />
      <div>
        <p className="font-bold">Private Showcase preview</p>
        <p className="mt-1 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
          Only you can see this preview. Sharing, follows, and comments stay off until you make your Showcase public.
        </p>
      </div>
    </aside>
  );
}
