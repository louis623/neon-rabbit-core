import { cookies } from "next/headers";
import { FavoriteRepsDashboard } from "@/components/favorites/FavoriteRepsDashboard";
import { getCurrentSparkleFinderAccount } from "@/lib/sparkle-finder/account-service";
import { parseSparkleFinderAuthMode, sparkleFinderAuthCookieName, type SparkleFinderAccountState } from "@/lib/sparkle-finder/auth";
import { getSparkleFinderAccountEntitlements } from "@/lib/sparkle-finder/entitlements";
import {
  getFavoriteRepCardsForUser,
  getPersistedFavoriteRepCardsForUser,
  type SupabaseFavoriteRepsReadClient,
} from "@/lib/sparkle-finder/favorite-reps-service";
import { createClient } from "@/lib/supabase/server";
import type { FavoriteRepCard } from "@/lib/sparkle-finder/social-types";

export default async function FavoritesPage() {
  const cookieStore = await cookies();
  const authMode = parseSparkleFinderAuthMode(cookieStore.get(sparkleFinderAuthCookieName)?.value);
  const accountState = await getCurrentSparkleFinderAccount({ localPreviewAuthMode: authMode });
  const persistedFavoriteRepCards =
    accountState.status === "authenticated" && accountState.isLocalPreview !== true
      ? await getFavoriteRepCardsForRealAccount(accountState)
      : undefined;

  return renderFavoritesPageContent(accountState, persistedFavoriteRepCards);
}

export function renderFavoritesPageContent(accountState: SparkleFinderAccountState, persistedFavoriteRepCards?: FavoriteRepCard[]) {
  if (accountState.status !== "authenticated") {
    return (
      <section className="grid gap-4">
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-semibold text-[var(--sparkle-plum-deep)]">
          Favorites
        </h1>
        <p className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 text-sm font-semibold text-[var(--sparkle-ink-muted)] shadow-[var(--sparkle-shadow-sm)]">
          Sign in to view favorite reps.
        </p>
      </section>
    );
  }

  const entitlements = getSparkleFinderAccountEntitlements(accountState);
  const isSilver = entitlements.canUseNicNacFindRequests;
  const cards =
    persistedFavoriteRepCards ??
    getFavoriteRepCardsForUser({
      userId: accountState.customer.id,
      hasSilverAccess: isSilver,
    });

  return <FavoriteRepsDashboard cards={cards} isSilver={isSilver} />;
}

async function getFavoriteRepCardsForRealAccount(
  accountState: SparkleFinderAccountState & { status: "authenticated" },
): Promise<FavoriteRepCard[]> {
  try {
    const entitlements = getSparkleFinderAccountEntitlements(accountState);
    const supabase = await createClient();
    const readClient = supabase as unknown as SupabaseFavoriteRepsReadClient;
    const cards = await getPersistedFavoriteRepCardsForUser({
      supabase: readClient,
      userId: accountState.customer.id,
      hasSilverAccess: entitlements.canUseNicNacFindRequests,
    });

    return cards ?? [];
  } catch {
    return [];
  }
}
