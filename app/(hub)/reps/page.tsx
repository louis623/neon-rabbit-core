import { cookies } from "next/headers";
import { RepDirectory } from "@/components/reps/RepDirectory";
import { getCurrentSparkleFinderAccount } from "@/lib/sparkle-finder/account-service";
import { parseSparkleFinderAuthMode, sparkleFinderAuthCookieName } from "@/lib/sparkle-finder/auth";
import {
  getFavoriteRepCounts,
  getFavoriteRepCardsForUser,
  getPersistedFavoriteRepCounts,
  getPersistedFavoriteRepIdsForUser,
  type SupabaseFavoriteRepCountsClient,
  type SupabaseFavoriteRepsReadClient,
} from "@/lib/sparkle-finder/favorite-reps-service";
import {
  getFinderRepDirectoryData,
  shouldUseCatalogFixtureFallback,
  type FinderRepDirectoryStatus,
} from "@/lib/sparkle-finder/catalog-service";
import { buildRepDirectoryCards, type RepDirectoryView } from "@/lib/sparkle-finder/rep-directory";
import { createClient } from "@/lib/supabase/server";
import type { LiveShow, RepBoardListing, RepSummary } from "@/lib/sparkle-finder/types";

export type RepsPageSearchParams = {
  q?: string | string[];
  view?: string | string[];
};

type RepsPageProps = {
  searchParams?: Promise<RepsPageSearchParams>;
};

type RenderRepsPageContentOptions = {
  reps?: RepSummary[];
  liveShows?: LiveShow[];
  boardListings?: RepBoardListing[];
  favoriteRepIds?: Iterable<string>;
  favoriteCounts?: ReadonlyMap<string, number>;
  favoriteCountsAvailable?: boolean;
  status?: FinderRepDirectoryStatus;
  query?: string;
  now?: Date;
  view?: RepDirectoryView;
};

export default async function RepsPage({ searchParams }: RepsPageProps = {}) {
  const cookieStore = await cookies();
  const authMode = parseSparkleFinderAuthMode(cookieStore.get(sparkleFinderAuthCookieName)?.value);
  const accountState = await getCurrentSparkleFinderAccount({ localPreviewAuthMode: authMode });
  const resolvedSearchParams = await searchParams;
  const query = getFirstSearchParam(resolvedSearchParams?.q)?.trim() ?? "";
  const view = parseRepDirectoryView(getFirstSearchParam(resolvedSearchParams?.view));
  const directoryData = await getFinderRepDirectoryData({
    query,
    useFixtureFallback: shouldUseCatalogFixtureFallback(),
  });
  const favoriteDirectoryState =
    accountState.status === "authenticated"
      ? await getFavoriteDirectoryStateForAccount(
          accountState.customer.id,
          accountState.isLocalPreview === true,
          directoryData.reps.map((rep) => rep.id),
        )
      : { favoriteCounts: new Map<string, number>(), favoriteCountsAvailable: false, favoriteRepIds: [] };

  return renderRepsPageContent({ ...directoryData, ...favoriteDirectoryState, query, view });
}

export function renderRepsPageContent({
  reps = [],
  liveShows = [],
  boardListings = [],
  favoriteRepIds = [],
  favoriteCounts = new Map(),
  favoriteCountsAvailable = true,
  status = "empty",
  query = "",
  now,
  view = "all",
}: RenderRepsPageContentOptions = {}) {
  const cards = buildRepDirectoryCards({
    boardListings,
    favoriteCounts,
    favoriteRepIds,
    liveShows,
    now,
    query,
    reps,
    view,
  });

  return (
    <RepDirectory
      cards={cards}
      favoriteCountsAvailable={favoriteCountsAvailable}
      query={query}
      status={status}
      view={view}
    />
  );
}

async function getFavoriteDirectoryStateForAccount(
  userId: string,
  isLocalPreview: boolean,
  directoryRepIds: readonly string[],
): Promise<{ favoriteCounts: Map<string, number>; favoriteCountsAvailable: boolean; favoriteRepIds: string[] }> {
  if (isLocalPreview) {
    return {
      favoriteCounts: getFavoriteRepCounts(),
      favoriteCountsAvailable: true,
      favoriteRepIds: getFavoriteRepCardsForUser({ userId, hasSilverAccess: true }).map((card) => card.repId),
    };
  }

  try {
    const supabase = await createClient();
    const [favoriteRepIds, favoriteCounts] = await Promise.all([
      getPersistedFavoriteRepIdsForUser({
        supabase: supabase as unknown as SupabaseFavoriteRepsReadClient,
        userId,
      }),
      getPersistedFavoriteRepCounts(
        supabase as unknown as SupabaseFavoriteRepCountsClient,
        directoryRepIds,
      ),
    ]);

    return {
      favoriteCounts: favoriteCounts ?? new Map(),
      favoriteCountsAvailable: favoriteCounts !== null,
      favoriteRepIds: favoriteRepIds ?? [],
    };
  } catch {
    return { favoriteCounts: new Map(), favoriteCountsAvailable: false, favoriteRepIds: [] };
  }
}

function getFirstSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseRepDirectoryView(value: string | undefined): RepDirectoryView {
  return value === "live_now" || value === "live_today" || value === "upcoming" || value === "favorites"
    ? value
    : "all";
}
