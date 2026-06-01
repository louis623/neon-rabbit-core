import { Gem } from "lucide-react";
import type { SparkleSuiteRepIdentity } from "@/lib/sparkle-finder/types";

type RepBadgeProps = {
  repIdentity?: SparkleSuiteRepIdentity | null;
  className?: string;
};

export function RepBadge({ repIdentity, className = "" }: RepBadgeProps) {
  if (!repIdentity) {
    return null;
  }

  return (
    <span
      className={`inline-flex min-h-7 max-w-full items-center gap-1.5 rounded-[var(--sparkle-radius-sm)] border border-[#d7bfdc] bg-[#fbf5ff] px-2.5 py-1 text-xs font-bold leading-4 text-[var(--sparkle-plum-deep)] ${className}`}
      title={repIdentity.businessName}
    >
      <Gem aria-hidden="true" className="size-3.5 shrink-0 text-[var(--sparkle-plum)]" strokeWidth={1.8} />
      <span className="truncate">Sparkle Suite rep</span>
      <span className="sr-only">: {repIdentity.businessName}</span>
    </span>
  );
}
