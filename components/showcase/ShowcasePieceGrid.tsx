import Link from "next/link";
import { BombPartyLabelBadge, PieceStatusBadge, RarestRevealBadge } from "./ShowcaseBadges";
import { PieceImage } from "./RarestReveals";
import type { SparkleShowcasePiece } from "@/lib/sparkle-finder/showcase-types";
import { getShowcaseSpotlightLabel } from "@/lib/sparkle-finder/showcase-rarity";

type ShowcasePieceGridProps = {
  handle: string;
  pieces: SparkleShowcasePiece[];
  title?: string;
};

export function ShowcasePieceGrid({ handle, pieces, title = "Sparkle Showcase Pieces" }: ShowcasePieceGridProps) {
  return (
    <section className="grid gap-4" data-smoke="showcase-piece-grid">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Public pieces</p>
        <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[var(--sparkle-plum-deep)]">
          {title}
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {pieces.map((piece) => (
          <article className="overflow-hidden rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] shadow-[var(--sparkle-shadow-sm)]" key={piece.id}>
            <PieceImage piece={piece} />
            <div className="grid gap-3 p-4">
              <div className="flex flex-wrap gap-2">
                <PieceStatusBadge piece={piece} />
                <BombPartyLabelBadge piece={piece} />
                <RarestRevealBadge piece={piece} />
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
                  {piece.jewelryItem.name}
                </h3>
                <p className="mt-1 text-sm text-[var(--sparkle-ink-muted)]">
                  Bomb Party Collection: {piece.jewelryItem.collectionName}
                </p>
              </div>
              <p className="line-clamp-3 text-sm leading-6 text-[var(--sparkle-ink-muted)]">{piece.revealStory}</p>
              <Link className="text-sm font-bold text-[var(--sparkle-rose)] hover:underline" href={`/showcase/${handle}/pieces/${piece.jewelryItemId}`}>
                Open {getShowcaseSpotlightLabel(piece)}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
