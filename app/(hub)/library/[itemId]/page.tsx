import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Heart, Sparkles } from "lucide-react";
import { JewelryImageFrame } from "@/components/library/JewelryImageFrame";
import { CustomerShowTime } from "@/components/live/CustomerShowTime";
import { FindThisForMe } from "@/components/nic-nac/FindThisForMe";
import {
  getCatalogJewelryItemById,
  getFinderAvailabilityForJewelryItem,
  shouldUseCatalogFixtureFallback,
} from "@/lib/sparkle-finder/catalog-service";
import { getCurrentSparkleFinderAccount } from "@/lib/sparkle-finder/account-service";
import {
  parseSparkleFinderAuthMode,
  sparkleFinderAuthCookieName,
} from "@/lib/sparkle-finder/auth";
import { getLocalRepBoardHref } from "@/lib/sparkle-finder/route-hrefs";
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
  const catalogOptions = { useFixtureFallback: shouldUseCatalogFixtureFallback() };
  const [accountState, item] = await Promise.all([
    getCurrentSparkleFinderAccount({ localPreviewAuthMode: authMode }),
    getCatalogJewelryItemById(resolvedParams.itemId, catalogOptions),
  ]);
  const availability = item ? await getFinderAvailabilityForJewelryItem(item.id, catalogOptions) : undefined;

  return renderItemDetailPageContent(resolvedParams, accountState, item, availability);
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

  const apiAvailabilityRows = availability
    ? [
        ...availability.exactMatches.map((match) => ({
          key: match.listingId,
          showName: match.showName,
          repFirstName: match.repFirstName,
          showTime: match.nextShow.startsAt,
          showStatus: match.nextShow.status,
          matchType: "exact_item",
          href: match.customerSiteUrl,
        })),
        ...availability.similarMatches.map((match) => ({
          key: match.listingId,
          showName: match.showName,
          repFirstName: match.repFirstName,
          showTime: match.nextShow.startsAt,
          showStatus: match.nextShow.status,
          matchType: "same_collection_type",
          href: match.customerSiteUrl,
        })),
      ]
    : [];
  const fixtureMatches = apiAvailabilityRows.length === 0 ? matchJewelryItemToRepBoardListings(item.id) : [];

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
      <article className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-6 shadow-[var(--sparkle-shadow-sm)]">
        <div className="grid aspect-[16/10] place-items-center overflow-hidden rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[linear-gradient(135deg,#fffefd,#fff3f0)]">
          <JewelryImageFrame imageUrl={item.imageUrl} jewelryType={item.jewelryType} name={item.name} variant="detail" />
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
            Save this piece
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            Add it to your owned pieces or Wishlist from Sparkle Showcase, then Nic-Nac can keep the hunt organized.
          </p>
          <div className="mt-4 grid gap-2">
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-4 text-sm font-bold text-white"
              href={`/silver?piece=${encodeURIComponent(item.id)}#add-to-sparkle-showcase`}
            >
              <Heart aria-hidden="true" className="size-4" />
              Save in Showcase
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-4 text-sm font-bold text-[var(--sparkle-rose)]"
              href="/silver#showcase-studio"
            >
              <Sparkles aria-hidden="true" className="size-4" />
              Missing-piece review
            </Link>
          </div>
        </article>

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
                  <p className="text-sm font-bold text-[var(--sparkle-plum-deep)]">{match.showName}</p>
                  <p className="mt-1 text-sm text-[var(--sparkle-ink-muted)]">Rep: {match.repFirstName}</p>
                  <p className="mt-1 text-xs font-bold text-[var(--sparkle-coral)]">
                    {formatMatchType(match.matchType)}
                  </p>
                  <p className="mt-2 text-sm text-[var(--sparkle-ink-muted)]">
                    {match.showStatus === "live" ? (
                      "Live now"
                    ) : (
                      <>
                        Next show: <CustomerShowTime value={match.showTime} />
                      </>
                    )}
                  </p>
                  <a
                    className="mt-3 inline-flex text-sm font-bold text-[var(--sparkle-rose)] hover:underline"
                    href={match.href}
                  >
                    Visit Rep Site
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
                      Open Dance Floor
                    </a>
                  </div>
                );
              })
            ) : (
              <p className="text-sm leading-6 text-[var(--sparkle-ink-muted)]">
                No dancer leads yet.
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
