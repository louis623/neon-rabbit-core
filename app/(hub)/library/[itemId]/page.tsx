import Link from "next/link";
import { notFound } from "next/navigation";
import { Gem, Search } from "lucide-react";
import { getJewelryItemById, getRepById, matchJewelryItemToRepBoardListings } from "@/lib/sparkle-finder/service";

type ItemDetailPageProps = {
  params: {
    itemId: string;
  };
};

export default function ItemDetailPage({ params }: ItemDetailPageProps) {
  const item = getJewelryItemById(params.itemId);

  if (!item) {
    notFound();
  }

  const matches = matchJewelryItemToRepBoardListings(item.id);

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <article className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-6 shadow-[var(--sparkle-shadow-sm)]">
        <div className="grid aspect-[16/10] place-items-center rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[linear-gradient(135deg,#fffefd,#fff3f0)] text-[var(--sparkle-plum)]">
          <Gem aria-hidden="true" className="size-20" strokeWidth={1.2} />
        </div>
        <p className="mt-5 text-sm font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">
          {item.collectionName}
        </p>
        <h1 className="mt-2 font-[var(--font-playfair)] text-4xl font-semibold text-[var(--sparkle-plum-deep)]">
          {item.name}
        </h1>
        <p className="mt-3 text-base leading-7 text-[var(--sparkle-ink-muted)]">
          {item.itemNumber} · {item.jewelryType} · {item.bpLabel === "standard" ? "Standard library label" : `${capitalize(item.bpLabel)} label`}
        </p>
      </article>

      <aside className="grid gap-4">
        <article className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
          <h2 className="font-[var(--font-playfair)] text-2xl font-semibold text-[var(--sparkle-plum-deep)]">
            Known rep availability
          </h2>
          <div className="mt-4 grid gap-3">
            {matches.length > 0 ? (
              matches.map((match) => {
                const rep = getRepById(match.repId);

                return (
                  <div className="rounded border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] p-3" key={match.listingId}>
                    <p className="text-sm font-bold text-[var(--sparkle-plum-deep)]">{rep?.businessName}</p>
                    <p className="mt-1 text-xs font-bold text-[var(--sparkle-coral)]">
                      {formatMatchType(match.matchType)}
                    </p>
                    <Link className="mt-3 inline-flex text-sm font-bold text-[var(--sparkle-rose)] hover:underline" href={match.boardUrl}>
                      Open rep board path
                    </Link>
                  </div>
                );
              })
            ) : (
              <p className="text-sm leading-6 text-[var(--sparkle-ink-muted)]">
                No fixture-backed rep board leads yet.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
          <Search aria-hidden="true" className="size-8 text-[var(--sparkle-rose)]" />
          <h2 className="mt-3 font-[var(--font-playfair)] text-2xl font-semibold text-[var(--sparkle-plum-deep)]">
            Nic-Nac, find this for me
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            Silver will use focused matching to look for exact item leads first, then same collection and type.
          </p>
        </article>
      </aside>
    </section>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatMatchType(value: string) {
  const label = value.replaceAll("_", " ");

  return label.charAt(0).toUpperCase() + label.slice(1);
}
