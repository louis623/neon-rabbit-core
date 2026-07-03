import { cookies } from "next/headers";
import { RepDirectory } from "@/components/reps/RepDirectory";
import { getCurrentSparkleFinderAccount } from "@/lib/sparkle-finder/account-service";
import { parseSparkleFinderAuthMode, sparkleFinderAuthCookieName } from "@/lib/sparkle-finder/auth";
import {
  getFavoriteRepCardsForUser,
  getPersistedFavoriteRepCardsForUser,
  type SupabaseFavoriteRepsReadClient,
} from "@/lib/sparkle-finder/favorite-reps-service";
import { getFinderRepDirectoryData, shouldUseCatalogFixtureFallback } from "@/lib/sparkle-finder/catalog-service";
import { buildRepDirectoryCards } from "@/lib/sparkle-finder/rep-directory";
import { createClient } from "@/lib/supabase/server";
import type { LiveShow, RepBoardListing, RepSummary } from "@/lib/sparkle-finder/types";

export type RepsPageSearchParams = {
  q?: string | string[];
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
  query?: string;
  now?: Date;
};

export default async function RepsPage({ searchParams }: RepsPageProps = {}) {
  const cookieStore = await cookies();
  const authMode = parseSparkleFinderAuthMode(cookieStore.get(sparkleFinderAuthCookieName)?.value);
  const accountState = await getCurrentSparkleFinderAccount({ localPreviewAuthMode: authMode });
  const favoriteRepIds =
    accountState.status === "authenticated"
      ? await getFavoriteRepIdsForAccount(accountState.customer.id, accountState.isLocalPreview === true)
      : [];
  const query = getFirstSearchParam((await searchParams)?.q)?.trim() ?? "";
  const directoryData = await getFinderRepDirectoryData({
    query,
    useFixtureFallback: shouldUseCatalogFixtureFallback(),
  });

  return renderRepsPageContent({ ...directoryData, favoriteRepIds, query });
}

export function renderRepsPageContent({
  reps = [],
  liveShows = [],
  boardListings = [],
  favoriteRepIds = [],
  favoriteCounts = new Map(),
  query = "",
  now,
}: RenderRepsPageContentOptions = {}) {
  const cards = buildRepDirectoryCards({
    boardListings,
    favoriteCounts,
    favoriteRepIds,
    liveShows,
    now,
    query,
    reps,
  });

  return <RepDirectory cards={cards} query={query} />;
}

async function getFavoriteRepIdsForAccount(userId: string, isLocalPreview: boolean): Promise<string[]> {
  if (isLocalPreview) {
    return getFavoriteRepCardsForUser({ userId, hasSilverAccess: true }).map((card) => card.repId);
  }

  try {
    const supabase = await createClient();
    const cards = await getPersistedFavoriteRepCardsForUser({
      supabase: supabase as unknown as SupabaseFavoriteRepsReadClient,
      userId,
      hasSilverAccess: true,
    });

    return cards?.map((card) => card.repId) ?? [];
  } catch {
    return [];
  }
}

function getFirstSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
