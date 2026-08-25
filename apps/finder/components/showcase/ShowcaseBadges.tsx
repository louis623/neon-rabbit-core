import { Gem, Search, ShieldCheck, Sparkles } from "lucide-react";
import type { SparkleShowcasePiece } from "@/lib/sparkle-finder/showcase-types";
import { isWantedShowcasePiece, qualifiesForRarestReveals } from "@/lib/sparkle-finder/showcase-rarity";

export function PieceStatusBadge({ piece }: { piece: SparkleShowcasePiece }) {
  const labels: Record<SparkleShowcasePiece["showcaseStatus"], string> = {
    iso: "Looking for",
    owned: "Owned",
    private_note_only: "Private",
    wishlist: "Wishlist",
  };

  const Icon = piece.showcaseStatus === "iso" || piece.showcaseStatus === "wishlist" ? Search : ShieldCheck;

  return (
    <span className="inline-flex items-center gap-1 rounded border border-[var(--sparkle-border)] bg-white px-2 py-1 text-xs font-bold text-[var(--sparkle-ink-muted)]">
      <Icon aria-hidden="true" className="size-3" />
      {labels[piece.showcaseStatus]}
    </span>
  );
}

export function BombPartyLabelBadge({ piece }: { piece: SparkleShowcasePiece }) {
  if (piece.jewelryItem.bpLabel === "standard") {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded border border-[#e7be77] bg-[#fff3cf] px-2 py-1 text-xs font-bold text-[#704b11]">
      <Gem aria-hidden="true" className="size-3" />
      {piece.jewelryItem.bpLabel === "diamond" ? "Diamond" : "Unicorn"} {isWantedShowcasePiece(piece) ? "piece I’m hunting" : "Reveal"}
    </span>
  );
}

export function RarestRevealBadge({ piece }: { piece: SparkleShowcasePiece }) {
  if (!qualifiesForRarestReveals(piece)) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded border border-[rgba(238,44,155,0.32)] bg-[var(--sparkle-blush-bg)] px-2 py-1 text-xs font-bold text-[var(--sparkle-rose)]">
      <Sparkles aria-hidden="true" className="size-3" />
      The Rarest of Reveals
    </span>
  );
}
