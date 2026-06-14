import { FinderNicNacChatbot } from "@/components/nic-nac/FinderNicNacChatbot";
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
    <FinderNicNacChatbot
      compact={compact}
      intro="I can check this Finder piece against saved rep board paths and upcoming show context."
      leadCountLabel={formatLeadCount(result.results.length, result.dataSource)}
      leads={result.results.map((match) => buildLead(match, result.dataSource))}
      quickBubbles={[
        {
          label: "Check saved pieces",
          response:
            result.results.length > 0
              ? `I found ${result.results.length} bounded lead${result.results.length === 1 ? "" : "s"} for this saved Finder piece.`
              : result.emptyState,
        },
        {
          label: "Match rep leads",
          response: "Exact item leads show first, then I widen to same collection and jewelry type from known rep-hosted paths.",
        },
        {
          label: "Next show context",
          response: "I include the next known show when a matched rep has one, so you know where to look first.",
        },
      ]}
      status="ready"
    />
  );
}

function NicNacUpgradePrompt({ compact }: { compact: boolean }) {
  return (
    <FinderNicNacChatbot
      compact={compact}
      intro="Browse for free. Let Nic-Nac hunt for you with Silver."
      quickBubbles={[
        {
          label: "Check saved pieces",
          response: "Silver lets me check saved collection and ISO pieces for bounded Finder leads.",
        },
        {
          label: "Match rep leads",
          response: "With Silver, I can compare your target piece against known rep board paths.",
        },
        {
          label: "Show timing context",
          response: "When a match has a known upcoming show, I can point you there first.",
        },
      ]}
      status="upgrade"
    />
  );
}

function NicNacEmptyPrompt({ compact }: { compact: boolean }) {
  const emptyState =
    "Add an existing library record to your collection or watchlist, then Nic-Nac can check saved rep board paths and next shows.";

  return (
    <FinderNicNacChatbot
      compact={compact}
      emptyState={emptyState}
      intro={emptyState}
      quickBubbles={[
        {
          label: "Find a library piece",
          response: "Start in the master library, save the piece, then come back and ask me to check leads.",
        },
        {
          label: "Open Showcase Studio",
          response: "If the piece is missing, Showcase Studio can collect label evidence and a clean light-box photo for review.",
        },
        {
          label: "Next show context",
          response: "Once a saved piece has matches, I can include next-show context with the lead.",
        },
      ]}
      status="empty"
    />
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

function buildLead(match: NicNacFindMatch, dataSource: NicNacDataSource) {
  const isApi = dataSource === "api";

  return {
    id: match.listing.id,
    businessName: match.rep.businessName,
    collectionName: match.matchedItem.collectionName,
    confidenceLabel: match.confidenceLabel,
    matchTypeLabel: formatMatchType(match.matchType),
    matchedItemName: match.matchedItem.name,
    nextShowLabel: match.nextLiveShow?.title ?? "No upcoming show listed",
    primaryHref: isApi ? match.rep.siteUrl : getLocalRepBoardHref(match.listing.boardUrl),
    primaryLabel: isApi ? "Visit Rep Site" : "Open rep board path",
    repName: isApi ? match.rep.displayName : undefined,
    secondaryHref: isApi ? undefined : getLocalRepHref(match.rep.siteUrl),
    secondaryLabel: isApi ? undefined : "Open rep profile",
  };
}
