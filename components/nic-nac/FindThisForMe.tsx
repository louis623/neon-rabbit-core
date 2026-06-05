import Link from "next/link";
import { CalendarClock, Search, Sparkles } from "lucide-react";
import { findNicNacMatchesForItem } from "@/lib/sparkle-finder/nic-nac";
import { getSparkleFinderAccountEntitlements } from "@/lib/sparkle-finder/entitlements";
import { getLocalRepBoardHref, getLocalRepHref } from "@/lib/sparkle-finder/route-hrefs";
import type { SparkleFinderAccountState } from "@/lib/sparkle-finder/auth";
import type { NicNacFindMatch } from "@/lib/sparkle-finder/nic-nac";

type FindThisForMeProps = {
  accountState: SparkleFinderAccountState;
  jewelryItemId?: string;
  compact?: boolean;
};

export function FindThisForMe({ accountState, jewelryItemId, compact = false }: FindThisForMeProps) {
  const entitlements = getSparkleFinderAccountEntitlements(accountState);

  if (!entitlements.canUseNicNacFindRequests) {
    return <NicNacUpgradePrompt compact={compact} />;
  }

  if (!jewelryItemId) {
    return <NicNacEmptyPrompt compact={compact} />;
  }

  const result = findNicNacMatchesForItem(accountState, jewelryItemId);

  if (!result.ok) {
    return <NicNacEmptyPrompt compact={compact} />;
  }

  return (
    <article className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
      <div className={compact ? "grid gap-3" : "flex flex-wrap items-start justify-between gap-4"}>
        <div>
          <div className="mx-auto mb-3 grid size-20 place-items-center rounded-full border border-[var(--sparkle-border)] bg-[radial-gradient(circle,#ffe2df_0_48%,#fff8f5_49%)] text-[var(--sparkle-plum)]">
            <Search aria-hidden="true" className="size-9" strokeWidth={1.5} />
          </div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[var(--sparkle-plum-deep)]">
            Nic-Nac, find this for me
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            Exact item leads show first, followed by same collection and type from rep-hosted boards.
          </p>
        </div>
        <span className="inline-flex min-h-9 items-center rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-blush-bg)] px-3 text-xs font-bold text-[var(--sparkle-ink-muted)]">
          {result.results.length} fixture {result.results.length === 1 ? "lead" : "leads"}
        </span>
      </div>

      <div className="mt-4 grid gap-3">
        {result.results.length > 0 ? (
          result.results.map((match) => <NicNacMatchCard key={match.listing.id} match={match} />)
        ) : (
          <p className="rounded border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] p-3 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            {result.emptyState}
          </p>
        )}
      </div>
    </article>
  );
}

function NicNacUpgradePrompt({ compact }: { compact: boolean }) {
  return (
    <article className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
      <div className={compact ? "grid gap-3" : "grid gap-4"}>
        <div className="mx-auto grid size-20 place-items-center rounded-full border border-[var(--sparkle-border)] bg-[radial-gradient(circle,#ffe2df_0_48%,#fff8f5_49%)] text-[var(--sparkle-plum)]">
          <Sparkles aria-hidden="true" className="size-7" strokeWidth={1.6} />
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[var(--sparkle-plum-deep)]">
            Nic-Nac, find this for me
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            Browse for free. Let Nic-Nac hunt for you with Silver.
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            Silver opens focused matching across fixture-backed rep boards and next-show context.
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border-strong)] px-4 text-sm font-bold text-[var(--sparkle-plum)] transition hover:bg-[var(--sparkle-paper-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
          href="/silver"
        >
          <Sparkles aria-hidden="true" className="size-4" />
          Open Silver preview
        </Link>
      </div>
    </article>
  );
}

function NicNacEmptyPrompt({ compact }: { compact: boolean }) {
  return (
    <article className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
      <div className={compact ? "grid gap-3" : "grid gap-4"}>
        <div className="mx-auto grid size-20 place-items-center rounded-full border border-[var(--sparkle-border)] bg-[radial-gradient(circle,#ffe2df_0_48%,#fff8f5_49%)] text-[var(--sparkle-plum)]">
          <Search aria-hidden="true" className="size-7" strokeWidth={1.6} />
        </div>
        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[var(--sparkle-plum-deep)]">
            Nic-Nac, find this for me
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            Add an existing library record to your collection or watchlist, then Nic-Nac can check saved rep board paths and next shows.
          </p>
        </div>
      </div>
    </article>
  );
}

function NicNacMatchCard({ match }: { match: NicNacFindMatch }) {
  return (
    <div className="rounded border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[var(--sparkle-plum-deep)]">{match.rep.businessName}</p>
          <p className="mt-1 text-xs font-bold text-[var(--sparkle-coral)]">{match.confidenceLabel}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            {match.matchedItem.name} / {match.matchedItem.collectionName}
          </p>
        </div>
        <span className="rounded border border-[var(--sparkle-border)] bg-white px-3 py-1 text-xs font-bold text-[var(--sparkle-ink-muted)]">
          {formatMatchType(match.matchType)}
        </span>
      </div>

      <div className="mt-3 grid gap-2 text-sm text-[var(--sparkle-ink-muted)]">
        <p className="inline-flex items-center gap-2">
          <CalendarClock aria-hidden="true" className="size-4 text-[var(--sparkle-rose)]" />
          <span>
            <strong className="text-[var(--sparkle-plum-deep)]">Next show:</strong> {match.nextLiveShow.title}
          </span>
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--sparkle-rose)] hover:underline"
          href={getLocalRepBoardHref(match.listing.boardUrl)}
        >
          Open rep board path
        </Link>
        <Link
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--sparkle-rose)] hover:underline"
          href={getLocalRepHref(match.rep.siteUrl)}
        >
          Open rep profile
        </Link>
      </div>
    </div>
  );
}

function formatMatchType(value: string) {
  const label = value.replaceAll("_", " ");

  return label.charAt(0).toUpperCase() + label.slice(1);
}
