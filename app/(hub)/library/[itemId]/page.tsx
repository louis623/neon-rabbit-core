import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Gem } from "lucide-react";
import { FindThisForMe } from "@/components/nic-nac/FindThisForMe";
import {
  getCatalogJewelryItemById,
  getFinderAvailabilityForJewelryItem,
  getSparkleSuiteFinderPublicBaseUrl,
} from "@/lib/sparkle-finder/catalog-service";
import {
  getLocalDevAuthState,
  parseSparkleFinderAuthMode,
  sparkleFinderAuthCookieName,
} from "@/lib/sparkle-finder/auth";
import { getLocalRepBoardHref, getSparkleSuiteRepBoardHref } from "@/lib/sparkle-finder/route-hrefs";
import { getJewelryItemById, getRepById, matchJewelryItemToRepBoardListings } from "@/lib/sparkle-finder/service";
import type { SparkleFinderAccountState } from "@/lib/sparkle-finder/auth";
import type { FinderAvailabilityResult } from "@/lib/sparkle-finder/catalog-service";
import type { JewelryItem } from "@/lib/sparkle-finder/types";

type ItemDetailPageProps = {
  params: Promise<{
    itemId: string;
  }>;
};

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const cookieStore = await cookies();
  const authMode = parseSparkleFinderAuthMode(cookieStore.get(sparkleFinderAuthCookieName)?.value);
  const resolvedParams = await params;
  const item = await getCatalogJewelryItemById(resolvedParams.itemId);
  const availability = item ? await getFinderAvailabilityForJewelryItem(item.id) : undefined;

  return renderItemDetailPageContent(resolvedParams, getLocalDevAuthState(authMode), item, availability);
}

export function renderItemDetailPageContent(
  params: Awaited<ItemDetailPageProps["params"]>,
  accountState: SparkleFinderAccountState,
  resolvedItem?: JewelryItem,
  availability?: FinderAvailabilityResult,
) {
  const item = resolvedItem ?? getJewelryItemById(params.itemId);

  if (!item) {
    notFound();
  }

  const sparkleSuiteBaseUrl = getSparkleSuiteFinderPublicBaseUrl();
  const apiAvailabilityRows = availability
    ? [
        ...availability.exactMatches.map((match) => ({
          key: match.listingId,
          businessName: match.rep.businessName,
          matchType: "exact_item",
          href: getSparkleSuiteRepBoardHref(match.rep.tradeBoardPath, sparkleSuiteBaseUrl),
        })),
        ...availability.similarMatches.map((match) => ({
          key: match.listingId,
          businessName: match.rep.businessName,
          matchType: "same_collection_type",
          href: getSparkleSuiteRepBoardHref(match.rep.tradeBoardPath, sparkleSuiteBaseUrl),
        })),
      ]
    : [];
  const fixtureMatches = apiAvailabilityRows.length === 0 ? matchJewelryItemToRepBoardListings(item.id) : [];

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <article className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-6 shadow-[var(--sparkle-shadow-sm)]">
        <div className="grid aspect-[16/10] place-items-center overflow-hidden rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[linear-gradient(135deg,#fffefd,#fff3f0)] text-[var(--sparkle-plum)]">
          {item.imageUrl ? (
            <div
              aria-label={item.name}
              className="size-full bg-cover bg-center"
              role="img"
              style={{ backgroundImage: `url("${item.imageUrl}")` }}
            />
          ) : (
            <Gem aria-hidden="true" className="size-20" strokeWidth={1.2} />
          )}
        </div>
        <p className="mt-5 text-sm font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">
          {item.collectionName}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-4xl font-semibold text-[var(--sparkle-plum-deep)]">
          {item.name}
        </h1>
        <p className="mt-3 text-base leading-7 text-[var(--sparkle-ink-muted)]">
          {item.itemNumber} / {item.jewelryType} /{" "}
          {item.bpLabel === "standard" ? "Standard library label" : `${capitalize(item.bpLabel)} label`}
        </p>
      </article>

      <aside className="grid gap-4">
        <article className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[var(--sparkle-plum-deep)]">
            Known rep availability
          </h2>
          <div className="mt-4 grid gap-3">
            {apiAvailabilityRows.length > 0 ? (
              apiAvailabilityRows.map((match) => (
                <div
                  className="rounded border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] p-3"
                  key={match.key}
                >
                  <p className="text-sm font-bold text-[var(--sparkle-plum-deep)]">{match.businessName}</p>
                  <p className="mt-1 text-xs font-bold text-[var(--sparkle-coral)]">
                    {formatMatchType(match.matchType)}
                  </p>
                  <a
                    className="mt-3 inline-flex text-sm font-bold text-[var(--sparkle-rose)] hover:underline"
                    href={match.href}
                  >
                    Open rep board path
                  </a>
                </div>
              ))
            ) : fixtureMatches.length > 0 ? (
              fixtureMatches.map((match) => {
                const rep = getRepById(match.repId);

                return (
                  <div
                    className="rounded border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] p-3"
                    key={match.listingId}
                  >
                    <p className="text-sm font-bold text-[var(--sparkle-plum-deep)]">{rep?.businessName}</p>
                    <p className="mt-1 text-xs font-bold text-[var(--sparkle-coral)]">
                      {formatMatchType(match.matchType)}
                    </p>
                    <a
                      className="mt-3 inline-flex text-sm font-bold text-[var(--sparkle-rose)] hover:underline"
                      href={getLocalRepBoardHref(match.boardUrl)}
                    >
                      Open rep board path
                    </a>
                  </div>
                );
              })
            ) : (
              <p className="text-sm leading-6 text-[var(--sparkle-ink-muted)]">
                No rep board leads yet.
              </p>
            )}
          </div>
        </article>

        <FindThisForMe accountState={accountState} availability={availability} compact jewelryItemId={item.id} />
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
