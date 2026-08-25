import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Heart, Sparkles } from "lucide-react";
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
import type {
  FinderAvailabilityMatch,
  FinderAvailabilityPageInfo,
  FinderAvailabilityResult,
} from "@/lib/sparkle-finder/catalog-service";
import type { JewelryItem } from "@/lib/sparkle-finder/types";

type ItemDetailPageProps = {
  params: Promise<{
    itemId: string;
  }>;
  searchParams?: Promise<{
    exactCursor?: string | string[];
    similarCursor?: string | string[];
  }>;
};

type AvailabilityCursorState = {
  exactCursor: string;
  similarCursor: string;
};

const emptyAvailabilityCursors: AvailabilityCursorState = {
  exactCursor: "",
  similarCursor: "",
};

export default async function ItemDetailPage({ params, searchParams }: ItemDetailPageProps) {
  const [cookieStore, resolvedParams, resolvedSearchParams] = await Promise.all([
    cookies(),
    params,
    searchParams ?? Promise.resolve({}),
  ]);
  const authMode = parseSparkleFinderAuthMode(cookieStore.get(sparkleFinderAuthCookieName)?.value);
  const availabilityCursors = normalizeAvailabilityCursors(resolvedSearchParams);
  const useFixtureFallback = shouldUseCatalogFixtureFallback();
  const catalogOptions = {
    useFixtureFallback,
    exactCursor: availabilityCursors.exactCursor,
    similarCursor: availabilityCursors.similarCursor,
  };
  const [accountState, item] = await Promise.all([
    getCurrentSparkleFinderAccount({ localPreviewAuthMode: authMode }),
    getCatalogJewelryItemById(resolvedParams.itemId, catalogOptions),
  ]);
  const availability = item ? await getFinderAvailabilityForJewelryItem(item.id, catalogOptions) : undefined;

  return renderItemDetailPageContent(
    resolvedParams,
    accountState,
    item,
    availability,
    availabilityCursors,
    useFixtureFallback,
  );
}

export function renderItemDetailPageContent(
  params: Awaited<ItemDetailPageProps["params"]>,
  accountState: SparkleFinderAccountState,
  resolvedItem?: JewelryItem,
  availability?: FinderAvailabilityResult,
  availabilityCursors: AvailabilityCursorState = emptyAvailabilityCursors,
  allowFixtureAvailabilityFallback = resolvedItem === undefined,
) {
  const item = resolvedItem ?? getJewelryItemById(params.itemId);

  if (!item) {
    notFound();
  }

  const safeAvailability = isRenderableAvailability(availability, item.id) ? availability : undefined;
  const exactAvailabilityRows = safeAvailability
    ? safeAvailability.exactMatches.map((match) => ({ ...match, matchType: "exact_item" as const }))
    : [];
  const similarAvailabilityRows = safeAvailability
    ? safeAvailability.similarMatches.map((match) => ({ ...match, matchType: "same_collection_type" as const }))
    : [];
  const fixtureMatches = !safeAvailability && allowFixtureAvailabilityFallback
    ? matchJewelryItemToRepBoardListings(item.id)
    : [];

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
        <article
          className="scroll-mt-4 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]"
          id="known-dancer-leads"
        >
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
            Known dancer leads
          </h2>
          {safeAvailability ? (
            <>
              <AvailabilityTotals availability={safeAvailability} />
              <div className="mt-4 grid gap-5">
                <AvailabilityBucket
                  cursors={availabilityCursors}
                  item={item}
                  label="Exact dancer leads"
                  matches={exactAvailabilityRows}
                  matchType="exact_item"
                  pageInfo={safeAvailability.exactPageInfo}
                />
                <AvailabilityBucket
                  cursors={availabilityCursors}
                  item={item}
                  label="Similar dancer leads"
                  matches={similarAvailabilityRows}
                  matchType="same_collection_type"
                  pageInfo={safeAvailability.similarPageInfo}
                />
              </div>
            </>
          ) : fixtureMatches.length > 0 ? (
            <div className="mt-4 grid gap-3">
              <div
                className="rounded-[var(--sparkle-radius-sm)] border border-[rgba(238,44,155,0.2)] bg-[var(--sparkle-blush-bg)] p-3"
                data-smoke="availability-total-summary"
                role="status"
              >
                <p className="text-sm font-black text-[var(--sparkle-plum-deep)]">
                  {formatLeadCount(fixtureMatches.length)} · {formatDancerCount(fixtureMatches.length)}
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--sparkle-ink-muted)]">
                  Preview leads count as one dancer each.
                </p>
              </div>
              {fixtureMatches.map((match) => {
                const rep = getRepById(match.repId);

                return (
                  <article
                    className="rounded border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] p-3"
                    data-listing-id={match.listingId}
                    data-smoke="dancer-lead-card"
                    key={match.listingId}
                  >
                    <p className="text-sm font-bold text-[var(--sparkle-plum-deep)]">{rep?.businessName}</p>
                    <p className="mt-1 text-xs font-bold text-[var(--sparkle-coral)]">
                      {formatMatchType(match.matchType)}
                    </p>
                    <p className="mt-2 text-sm font-black text-[var(--sparkle-plum-deep)]">1 dancer available</p>
                    <a
                      className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-[var(--sparkle-rose)] hover:underline"
                      href={getLocalRepBoardHref(match.boardUrl)}
                    >
                      Open Dance Floor
                    </a>
                  </article>
                );
              })}
            </div>
          ) : availability ? (
            <p
              className="mt-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm leading-6 text-amber-950"
              data-smoke="availability-unavailable"
              role="status"
            >
              Dancer availability is temporarily unavailable because the latest Dance Floor response could not be read safely.
            </p>
          ) : allowFixtureAvailabilityFallback ? (
            <p className="mt-4 text-sm leading-6 text-[var(--sparkle-ink-muted)]">No dancer leads yet.</p>
          ) : (
            <p
              className="mt-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm leading-6 text-amber-950"
              data-smoke="availability-unavailable"
              role="status"
            >
              Dancer availability is temporarily unavailable. Your saved piece and its exact design details are unchanged.
            </p>
          )}
        </article>

        <FindThisForMe accountState={accountState} availability={safeAvailability} compact jewelryItemId={item.id} />
      </aside>
    </section>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatMatchType(value: string) {
  return value === "exact_item" ? "Exact dancer lead" : "Similar dancer lead";
}

function AvailabilityTotals({ availability }: { availability: FinderAvailabilityResult }) {
  const totalLeadCount = availability.exactPageInfo.totalLeadCount + availability.similarPageInfo.totalLeadCount;
  const totalDancerCount = availability.exactPageInfo.totalDancerCount + availability.similarPageInfo.totalDancerCount;

  return (
    <div
      className="mt-4 rounded-[var(--sparkle-radius-sm)] border border-[rgba(238,44,155,0.2)] bg-[var(--sparkle-blush-bg)] p-3"
      data-smoke="availability-total-summary"
      role="status"
    >
      <p className="text-sm font-black text-[var(--sparkle-plum-deep)]">
        {formatLeadCount(totalLeadCount)} · {formatDancerCount(totalDancerCount)}
      </p>
      <p className="mt-1 text-xs leading-5 text-[var(--sparkle-ink-muted)]">
        Rep leads count distinct Dance Floor opportunities. Dancers count the available physical pieces.
      </p>
    </div>
  );
}

function AvailabilityBucket({
  cursors,
  item,
  label,
  matches,
  matchType,
  pageInfo,
}: {
  cursors: AvailabilityCursorState;
  item: JewelryItem;
  label: string;
  matches: FinderAvailabilityMatch[];
  matchType: "exact_item" | "same_collection_type";
  pageInfo: FinderAvailabilityPageInfo;
}) {
  const currentDancerCount = matches.reduce((total, match) => total + match.quantityAvailable, 0);
  const currentCursor = matchType === "exact_item" ? cursors.exactCursor : cursors.similarCursor;
  const isSubsetPage = Boolean(currentCursor)
    || matches.length < pageInfo.totalLeadCount
    || currentDancerCount < pageInfo.totalDancerCount;

  return (
    <section aria-label={label} className="grid gap-3" data-smoke={`availability-${matchType}-bucket`}>
      <div>
        <h3 className="text-sm font-black text-[var(--sparkle-plum-deep)]">{label}</h3>
        <p className="mt-1 text-xs leading-5 text-[var(--sparkle-ink-muted)]">
          {formatLeadCount(pageInfo.totalLeadCount)} · {formatDancerCount(pageInfo.totalDancerCount)}
        </p>
        {isSubsetPage ? (
          <p className="mt-1 text-xs font-semibold text-amber-900" data-smoke="availability-partial-state">
            This page shows {formatLeadCount(matches.length)} and {formatDancerCount(currentDancerCount)}.
            {pageInfo.hasMore ? " More are available on the next page." : " This is the final page."}
          </p>
        ) : null}
      </div>

      {matches.length > 0 ? (
        matches.map((match) => (
          <AvailabilityLeadCard key={match.listingId} match={match} matchType={matchType} />
        ))
      ) : (
        <p className="rounded border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] p-3 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
          No {matchType === "exact_item" ? "exact" : "similar"} dancer leads on this page.
        </p>
      )}

      {pageInfo.hasMore && pageInfo.nextCursor ? (
        <Link
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border-strong)] bg-white px-4 text-center text-sm font-black text-[var(--sparkle-plum)] hover:bg-[var(--sparkle-paper-soft)]"
          data-smoke={`availability-${matchType}-next`}
          href={buildAvailabilityContinuationHref(item.id, cursors, matchType, pageInfo.nextCursor)}
        >
          Next page of {matchType === "exact_item" ? "exact" : "similar"} leads
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ) : null}
    </section>
  );
}

function AvailabilityLeadCard({
  match,
  matchType,
}: {
  match: FinderAvailabilityMatch;
  matchType: "exact_item" | "same_collection_type";
}) {
  const photoRole = match.photoSource ?? "availability";
  const photoName = match.photoSource === "listing"
    ? `${match.item.name} listing photo from ${match.repFirstName}`
    : match.photoSource === "canonical"
      ? `${match.item.name} catalog photo`
      : `${match.item.name} Dance Floor photo`;

  return (
    <article
      className="overflow-hidden rounded border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)]"
      data-design-id={match.item.id}
      data-listing-id={match.listingId}
      data-smoke="dancer-lead-card"
    >
      {match.photoUrl ? (
        <div
          className="aspect-[4/3] overflow-hidden border-b border-[var(--sparkle-border)]"
          data-photo-role={photoRole}
        >
          <JewelryImageFrame
            imageUrl={match.photoUrl}
            jewelryType={match.item.jewelryType}
            name={photoName}
          />
        </div>
      ) : null}
      <div className="p-3">
        <p className="text-sm font-bold text-[var(--sparkle-plum-deep)]">{match.showName}</p>
        <p className="mt-1 text-sm text-[var(--sparkle-ink-muted)]">Rep: {match.repFirstName}</p>
        <p className="mt-1 text-xs font-bold text-[var(--sparkle-coral)]">{formatMatchType(matchType)}</p>
        <p className="mt-2 text-sm font-black text-[var(--sparkle-plum-deep)]">
          {formatDancerCount(match.quantityAvailable)}
        </p>
        {matchType === "same_collection_type" ? (
          <VariantLeadContext label="Similar design" match={match} />
        ) : (
          <VariantLeadContext label="Exact design" match={match} />
        )}
        <p className="mt-2 text-sm text-[var(--sparkle-ink-muted)]">
          {match.nextShow.status === "live" ? (
            "Live now"
          ) : (
            <>
              Next show: <CustomerShowTime value={match.nextShow.startsAt} />
            </>
          )}
        </p>
        <a
          className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-[var(--sparkle-rose)] hover:underline"
          href={match.customerSiteUrl}
        >
          Visit Rep Site
        </a>
      </div>
    </article>
  );
}

function VariantLeadContext({ label, match }: { label: string; match: FinderAvailabilityMatch }) {
  const variantFacts = [match.item.mainStone, match.item.material]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  return (
    <div className="mt-1 text-xs leading-5 text-[var(--sparkle-ink-muted)]">
      <p>{label}: {match.item.name} · Item {match.item.itemNumber}</p>
      {variantFacts.length > 0 ? <p>{variantFacts.join(" · ")}</p> : null}
    </div>
  );
}

function normalizeAvailabilityCursors(
  searchParams: Awaited<NonNullable<ItemDetailPageProps["searchParams"]>>,
): AvailabilityCursorState {
  return {
    exactCursor: getFirstSearchParam(searchParams.exactCursor)?.trim() ?? "",
    similarCursor: getFirstSearchParam(searchParams.similarCursor)?.trim() ?? "",
  };
}

function getFirstSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function buildAvailabilityContinuationHref(
  itemId: string,
  cursors: AvailabilityCursorState,
  matchType: "exact_item" | "same_collection_type",
  nextCursor: string,
): string {
  const params = new URLSearchParams();
  if (matchType === "exact_item") {
    params.set("exactCursor", nextCursor);
    if (cursors.similarCursor) params.set("similarCursor", cursors.similarCursor);
  } else {
    if (cursors.exactCursor) params.set("exactCursor", cursors.exactCursor);
    params.set("similarCursor", nextCursor);
  }
  return `/library/${encodeURIComponent(itemId)}?${params.toString()}#known-dancer-leads`;
}

function isRenderableAvailability(
  availability: FinderAvailabilityResult | undefined,
  requestedItemId: string,
): availability is FinderAvailabilityResult {
  if (
    !availability
    || availability.schemaVersion !== 2
    || availability.requestedItem.id !== requestedItemId
    || !isRenderablePageInfo(availability.exactPageInfo)
    || !isRenderablePageInfo(availability.similarPageInfo)
  ) {
    return false;
  }

  const allMatches = [...availability.exactMatches, ...availability.similarMatches];
  const listingIds = new Set<string>();
  for (const match of allMatches) {
    if (
      !match.listingId.trim()
      || listingIds.has(match.listingId)
      || !match.item.id.trim()
      || !Number.isInteger(match.quantityAvailable)
      || match.quantityAvailable < 1
    ) {
      return false;
    }
    listingIds.add(match.listingId);
  }
  if (availability.exactMatches.some((match) => match.item.id !== requestedItemId)) {
    return false;
  }

  return pageMatchesFitTotals(availability.exactMatches, availability.exactPageInfo)
    && pageMatchesFitTotals(availability.similarMatches, availability.similarPageInfo);
}

function isRenderablePageInfo(pageInfo: FinderAvailabilityPageInfo): boolean {
  return Number.isInteger(pageInfo.totalLeadCount)
    && pageInfo.totalLeadCount >= 0
    && Number.isInteger(pageInfo.totalDancerCount)
    && pageInfo.totalDancerCount >= 0
    && pageInfo.totalDancerCount >= pageInfo.totalLeadCount
    && typeof pageInfo.hasMore === "boolean"
    && (pageInfo.nextCursor === null || typeof pageInfo.nextCursor === "string")
    && (!pageInfo.hasMore || Boolean(pageInfo.nextCursor?.trim()))
    && (pageInfo.hasMore || pageInfo.nextCursor === null);
}

function pageMatchesFitTotals(matches: FinderAvailabilityMatch[], pageInfo: FinderAvailabilityPageInfo): boolean {
  return matches.length <= pageInfo.totalLeadCount
    && matches.reduce((total, match) => total + match.quantityAvailable, 0) <= pageInfo.totalDancerCount;
}

function formatLeadCount(count: number): string {
  return `${count} ${count === 1 ? "rep lead" : "rep leads"}`;
}

function formatDancerCount(count: number): string {
  return `${count} ${count === 1 ? "dancer available" : "dancers available"}`;
}
