import Link from "next/link";
import { ArrowRight, CalendarClock, CheckCircle2, Search, Sparkles } from "lucide-react";
import { NicNacMark } from "@/components/nic-nac/NicNacMark";
import { findNicNacMatchesForItem } from "@/lib/sparkle-finder/nic-nac";
import { getSparkleFinderAccountEntitlements } from "@/lib/sparkle-finder/entitlements";
import { getLocalRepBoardHref, getLocalRepHref } from "@/lib/sparkle-finder/route-hrefs";
import type { SparkleFinderAccountState } from "@/lib/sparkle-finder/auth";
import type { FinderAvailabilityResult } from "@/lib/sparkle-finder/catalog-service";
import type { NicNacDataSource, NicNacFindMatch } from "@/lib/sparkle-finder/nic-nac";

type FindThisForMeProps = {
  accountState: SparkleFinderAccountState;
  jewelryItemId?: string;
  compact?: boolean;
  availability?: FinderAvailabilityResult;
};

export function FindThisForMe({ accountState, jewelryItemId, compact = false, availability }: FindThisForMeProps) {
  const entitlements = getSparkleFinderAccountEntitlements(accountState);

  if (!entitlements.canUseNicNacFindRequests) {
    return <NicNacUpgradePrompt compact={compact} />;
  }

  if (!jewelryItemId) {
    return <NicNacEmptyPrompt compact={compact} />;
  }

  const result = findNicNacMatchesForItem(accountState, jewelryItemId, availability);

  if (!result.ok) {
    return <NicNacEmptyPrompt compact={compact} />;
  }

  return (
    <article className="sparkle-nic-nac-panel grid gap-4 rounded-[var(--sparkle-radius-sm)] border border-[rgba(246,231,218,0.16)] bg-[var(--sparkle-panel)] p-5 text-[var(--sparkle-panel-text)] shadow-[var(--sparkle-shadow-sm)]">
      <div className={compact ? "grid gap-4" : "flex flex-wrap items-start justify-between gap-4"}>
        <div>
          <div className="mb-4 flex items-start gap-3">
            <NicNacMark size={44} />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ffd4ea]">
                Same Nic-Nac, focused on your Finder hunt.
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#fff6fa]">
                Nic-Nac, find this for me
              </h2>
            </div>
          </div>
          <p className="text-sm leading-6 text-[rgba(246,231,218,0.78)]">
            Exact item leads show first, followed by same collection and type from rep-hosted boards.
          </p>
        </div>
        <span className="inline-flex min-h-9 w-fit items-center rounded-[var(--sparkle-radius-sm)] border border-[rgba(246,231,218,0.2)] bg-[rgba(255,255,255,0.07)] px-3 text-xs font-bold text-[#fff6fa]">
          {formatLeadCount(result.results.length, result.dataSource)}
        </span>
      </div>

      <NicNacWorkflowChecklist />

      <div className="grid gap-3">
        {result.results.length > 0 ? (
          result.results.map((match) => (
            <NicNacMatchCard key={match.listing.id} match={match} dataSource={result.dataSource} />
          ))
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
    <article className="sparkle-nic-nac-panel grid gap-4 rounded-[var(--sparkle-radius-sm)] border border-[rgba(246,231,218,0.16)] bg-[var(--sparkle-panel)] p-5 text-[var(--sparkle-panel-text)] shadow-[var(--sparkle-shadow-sm)]">
      <div className={compact ? "grid gap-3" : "grid gap-4"}>
        <div className="flex items-start gap-3">
          <NicNacMark size={44} />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ffd4ea]">
              Same Nic-Nac, focused on your Finder hunt.
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#fff6fa]">
              Nic-Nac, find this for me
            </h2>
          </div>
        </div>
        <div>
          <p className="text-sm leading-6 text-[rgba(246,231,218,0.78)]">
            Browse for free. Let Nic-Nac hunt for you with Silver.
          </p>
          <p className="mt-2 text-sm leading-6 text-[rgba(246,231,218,0.78)]">
            Silver opens focused matching across known rep board paths and next-show context.
          </p>
        </div>
        <NicNacWorkflowChecklist finalLabel="Show timing context" />
        <Link
          className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[rgba(246,231,218,0.3)] bg-[rgba(255,255,255,0.08)] px-4 text-sm font-bold text-[#fff6fa] transition hover:bg-[rgba(255,255,255,0.13)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
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
    <article className="sparkle-nic-nac-panel grid gap-4 rounded-[var(--sparkle-radius-sm)] border border-[rgba(246,231,218,0.16)] bg-[var(--sparkle-panel)] p-5 text-[var(--sparkle-panel-text)] shadow-[var(--sparkle-shadow-sm)]">
      <div className={compact ? "grid gap-3" : "grid gap-4"}>
        <div className="flex items-start gap-3">
          <NicNacMark size={44} />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#ffd4ea]">
              Same Nic-Nac, focused on your Finder hunt.
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#fff6fa]">
              Nic-Nac, find this for me
            </h2>
          </div>
        </div>
        <div>
          <p className="text-sm leading-6 text-[rgba(246,231,218,0.78)]">
            Add an existing library record to your collection or watchlist, then Nic-Nac can check saved rep board paths and next shows.
          </p>
        </div>
        <NicNacWorkflowChecklist />
        <div className="grid gap-2">
          <Link className="sparkle-nic-nac-action" href="/library">
            <Search aria-hidden="true" className="size-4" />
            Find a library piece
            <ArrowRight aria-hidden="true" className="ml-auto size-4" />
          </Link>
          <Link className="sparkle-nic-nac-action" href="/silver#showcase-studio">
            <Sparkles aria-hidden="true" className="size-4" />
            Open Showcase Studio
            <ArrowRight aria-hidden="true" className="ml-auto size-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function NicNacWorkflowChecklist({ finalLabel = "Next show context" }: { finalLabel?: string }) {
  return (
    <div className="grid gap-2 rounded-[var(--sparkle-radius-sm)] border border-[rgba(246,231,218,0.16)] bg-[rgba(255,255,255,0.06)] p-3">
      {["Checking saved pieces", "Matching rep leads", finalLabel].map((label) => (
        <p key={label} className="inline-flex items-center gap-2 text-sm font-bold text-[rgba(246,231,218,0.86)]">
          <CheckCircle2 aria-hidden="true" className="size-4 text-[#ffd4ea]" />
          {label}
        </p>
      ))}
    </div>
  );
}

function NicNacMatchCard({ match, dataSource }: { match: NicNacFindMatch; dataSource: NicNacDataSource }) {
  return (
    <div className="rounded border border-[rgba(246,231,218,0.18)] bg-[rgba(255,255,255,0.08)] p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#fff6fa]">{match.rep.businessName}</p>
          {dataSource === "api" ? (
            <p className="mt-1 text-sm text-[rgba(246,231,218,0.72)]">Rep: {match.rep.displayName}</p>
          ) : null}
          <p className="mt-1 text-xs font-bold text-[#ffd4ea]">{match.confidenceLabel}</p>
          <p className="mt-2 text-sm leading-6 text-[rgba(246,231,218,0.72)]">
            {match.matchedItem.name} / {match.matchedItem.collectionName}
          </p>
        </div>
        <span className="rounded border border-[rgba(246,231,218,0.2)] bg-[rgba(255,255,255,0.08)] px-3 py-1 text-xs font-bold text-[rgba(246,231,218,0.78)]">
          {formatMatchType(match.matchType)}
        </span>
      </div>

      <div className="mt-3 grid gap-2 text-sm text-[rgba(246,231,218,0.72)]">
        <p className="inline-flex items-center gap-2">
          <CalendarClock aria-hidden="true" className="size-4 text-[#ffd4ea]" />
          <span>
            <strong className="text-[#fff6fa]">Next show:</strong>{" "}
            {match.nextLiveShow?.title ?? "No upcoming show listed"}
          </span>
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {dataSource === "api" ? (
          <Link
            className="inline-flex items-center gap-2 text-sm font-bold text-[#ffd4ea] hover:underline"
            href={match.rep.siteUrl}
          >
            Visit Rep Site
          </Link>
        ) : (
          <>
            <Link
              className="inline-flex items-center gap-2 text-sm font-bold text-[#ffd4ea] hover:underline"
              href={getLocalRepBoardHref(match.listing.boardUrl)}
            >
              Open rep board path
            </Link>
            <Link
              className="inline-flex items-center gap-2 text-sm font-bold text-[#ffd4ea] hover:underline"
              href={getLocalRepHref(match.rep.siteUrl)}
            >
              Open rep profile
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function formatLeadCount(count: number, dataSource: NicNacDataSource) {
  const sourceLabel = dataSource === "api" ? "Sparkle Suite" : "preview";
  const leadLabel = count === 1 ? "lead" : "leads";

  return `${count} ${sourceLabel} ${leadLabel}`;
}

function formatMatchType(value: string) {
  const label = value.replaceAll("_", " ");

  return label.charAt(0).toUpperCase() + label.slice(1);
}
