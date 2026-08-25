import Link from "next/link";
import { Layers3 } from "lucide-react";
import { ShareShowcaseButton } from "./ShareShowcaseButton";
import { buildShowcaseCollectionPath } from "@/lib/sparkle-finder/showcase-sharing";
import type { ShowcaseCollectionWithPieces } from "@/lib/sparkle-finder/showcase-types";

type ShowcaseCollectionRailProps = {
  collections: ShowcaseCollectionWithPieces[];
  handle: string;
};

export function ShowcaseCollectionRail({ collections, handle }: ShowcaseCollectionRailProps) {
  if (collections.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-4" data-smoke="showcase-collections">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">More ways to browse</p>
        <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[var(--sparkle-plum-deep)]">
          Showcase Collections
        </h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {collections.map((collection) => (
          <article
            className="grid gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-4 shadow-[var(--sparkle-shadow-sm)] transition hover:border-[var(--sparkle-rose)]"
            key={collection.id}
          >
            <Link className="grid gap-3" href={`/showcase/${handle}/showcase-collections/${collection.slug}`}>
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-blush-bg)] text-[var(--sparkle-rose)]">
                  <Layers3 aria-hidden="true" className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--sparkle-plum-deep)]">{collection.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--sparkle-ink-muted)]">{collection.description}</p>
                </div>
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--sparkle-coral)]">
                {collection.pieces.length} {collection.pieces.length === 1 ? "piece" : "pieces"} in this Showcase Collection
              </p>
            </Link>
            <ShareShowcaseButton
              isPublic={collection.visibility === "public"}
              label={`Share ${collection.title}`}
              pathname={buildShowcaseCollectionPath(handle, collection.slug)}
              shareText={`See the ${collection.title} Showcase Collection on Sparkle Finder.`}
              shareTitle={`${collection.title} Showcase Collection`}
              tone="secondary"
            />
          </article>
        ))}
      </div>
    </section>
  );
}
