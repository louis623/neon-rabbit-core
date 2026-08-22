import Link from "next/link";
import { JewelryImageFrame } from "@/components/library/JewelryImageFrame";
import { BombPartyLabelBadge, PieceStatusBadge, RarestRevealBadge } from "./ShowcaseBadges";
import type { SparkleShowcasePiece } from "@/lib/sparkle-finder/showcase-types";
import { qualifiesForRarestReveals } from "@/lib/sparkle-finder/showcase-rarity";

type RarestRevealsProps = {
  handle: string;
  pieces: SparkleShowcasePiece[];
};

export function RarestReveals({ handle, pieces }: RarestRevealsProps) {
  const ownedRarestReveals = pieces.filter(qualifiesForRarestReveals);

  return (
    <section className="grid gap-4" data-smoke="rarest-reveals">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Diamond and Unicorn favorites</p>
          <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[var(--sparkle-plum-deep)]">
            The Rarest of Reveals
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-[var(--sparkle-ink-muted)]">
          Diamonds, Unicorns, and the pieces this collector still cannot believe they found.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ownedRarestReveals.map((piece) => (
          <article
            className="overflow-hidden rounded-[var(--sparkle-radius-sm)] border border-[#e7be77] bg-white shadow-[0_18px_44px_rgba(112,75,17,0.1)]"
            key={piece.id}
          >
            <PieceImage piece={piece} />
            <div className="grid gap-3 p-4">
              <div className="flex flex-wrap gap-2">
                <BombPartyLabelBadge piece={piece} />
                <RarestRevealBadge piece={piece} />
                <PieceStatusBadge piece={piece} />
              </div>
              <div>
                <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
                  {piece.jewelryItem.name}
                </h3>
                <p className="mt-1 text-sm text-[var(--sparkle-ink-muted)]">
                  Bomb Party Collection: {piece.jewelryItem.collectionName}
                </p>
              </div>
              <p className="text-sm leading-6 text-[var(--sparkle-ink-muted)]">{piece.revealStory}</p>
              <Link className="text-sm font-bold text-[var(--sparkle-rose)] hover:underline" href={`/showcase/${handle}/pieces/${piece.jewelryItemId}`}>
                Open Reveal Spotlight
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function PieceImage({ piece }: { piece: SparkleShowcasePiece }) {
  const imageUrl = piece.personalPhotoUrl?.trim() || piece.jewelryItem.imageUrl;

  return (
    <div className="grid aspect-[4/3] place-items-center overflow-hidden border-b border-[var(--sparkle-border)] bg-[linear-gradient(135deg,#fffefd,#fff3f0)]">
      <JewelryImageFrame
        imageUrl={imageUrl}
        jewelryType={piece.jewelryItem.jewelryType}
        name={piece.jewelryItem.name}
      />
    </div>
  );
}
