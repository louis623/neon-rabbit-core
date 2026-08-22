import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createShowcaseCommentAction, deleteShowcaseCommentAction, editShowcaseCommentAction, reportShowcaseTargetAction } from "@/app/showcase/actions";
import { BombPartyLabelBadge, PieceStatusBadge, RarestRevealBadge } from "./ShowcaseBadges";
import { ShowcaseComments } from "./ShowcaseComments";
import { PieceImage } from "./RarestReveals";
import { RepLeadPanel } from "./RepLeadPanel";
import { ShareShowcaseButton } from "./ShareShowcaseButton";
import { buildRevealSpotlightPath } from "@/lib/sparkle-finder/showcase-sharing";
import type { RevealSpotlight as RevealSpotlightData } from "@/lib/sparkle-finder/showcase-types";

type RevealSpotlightProps = {
  spotlight: RevealSpotlightData;
  viewerUserId?: string | null;
};

export function RevealSpotlight({ spotlight, viewerUserId }: RevealSpotlightProps) {
  const { piece, showcase } = spotlight;

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]" data-smoke="reveal-spotlight">
      <article className="overflow-hidden rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] shadow-[var(--sparkle-shadow-sm)]">
        <PieceImage piece={piece} />
        <div className="grid gap-4 p-5 lg:p-7">
          <Link
            className="inline-flex w-fit items-center gap-2 text-sm font-bold text-[var(--sparkle-rose)] hover:underline"
            href={`/showcase/${showcase.profile.handle}`}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to Sparkle Showcase
          </Link>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Reveal Spotlight</p>
            <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
              {piece.jewelryItem.name}
            </h1>
            <p className="mt-2 text-base leading-7 text-[var(--sparkle-ink-muted)]">
              Bomb Party Collection: {piece.jewelryItem.collectionName}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PieceStatusBadge piece={piece} />
            <BombPartyLabelBadge piece={piece} />
            <RarestRevealBadge piece={piece} />
          </div>
          <p className="text-base leading-7 text-[var(--sparkle-ink-muted)]">{piece.revealStory}</p>
          <ShareShowcaseButton
            isPublic
            label="Share Reveal Spotlight"
            pathname={buildRevealSpotlightPath(showcase.profile.handle, piece.jewelryItemId)}
            shareText={`See ${piece.jewelryItem.name} in ${showcase.profile.customer.displayName}'s Sparkle Showcase.`}
            shareTitle={`${piece.jewelryItem.name} Reveal Spotlight`}
          />
        </div>
      </article>

      <aside className="grid gap-4">
        <RepLeadPanel piece={piece} />
        <ShowcaseComments
          comments={spotlight.comments}
          createAction={createShowcaseCommentAction}
          deleteAction={deleteShowcaseCommentAction}
          editAction={editShowcaseCommentAction}
          handle={showcase.profile.handle}
          reportAction={reportShowcaseTargetAction}
          showcaseUserId={showcase.profile.customer.id}
          targetId={piece.id}
          targetType="piece"
          viewerUserId={viewerUserId}
        />
      </aside>
    </section>
  );
}
