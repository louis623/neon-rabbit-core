import Link from "next/link";
import { cookies } from "next/headers";
import { Crown, Gem, Sparkles } from "lucide-react";
import { FavoriteRepsPanel } from "@/components/favorites/FavoriteRepsPanel";
import { FinderNicNacWorkspace } from "@/components/nic-nac/FinderNicNacWorkspace";
import type { ManagedCollectionItem } from "@/components/silver/CollectionManager";
import { ProfileEditor } from "@/components/silver/ProfileEditor";
import { ShowcaseManager } from "@/components/showcase/ShowcaseManager";
import {
  saveShowcasePieceAction,
  saveSilverProfileAction,
  submitShowcaseStudioRequestAction,
} from "@/app/(hub)/silver/actions";
import { getCatalogJewelryItems, shouldUseCatalogFixtureFallback } from "@/lib/sparkle-finder/catalog-service";
import {
  getCollectionItemsByCustomerId,
  getJewelryItemById,
  getJewelryItems,
  getSilverProfileByCustomerId,
} from "@/lib/sparkle-finder/service";
import {
  getFavoriteRepCardsForUser,
  getPersistedFavoriteRepCardsForUser,
  type SupabaseFavoriteRepsReadClient,
} from "@/lib/sparkle-finder/favorite-reps-service";
import {
  parseSparkleFinderAuthMode,
  sparkleFinderAuthCookieName,
} from "@/lib/sparkle-finder/auth";
import { getCurrentSparkleFinderAccount } from "@/lib/sparkle-finder/account-service";
import { getSparkleFinderAccountEntitlements } from "@/lib/sparkle-finder/entitlements";
import { createClient } from "@/lib/supabase/server";
import type { SparkleFinderAccountState } from "@/lib/sparkle-finder/auth";
import type { FavoriteRepCard } from "@/lib/sparkle-finder/social-types";
import type { CollectionItem, JewelryItem, SilverProfile } from "@/lib/sparkle-finder/types";

type SilverPageAccountState = SparkleFinderAccountState & {
  silverProfile?: SilverProfile;
  isLocalPreview?: boolean;
};

export default async function SilverPage() {
  const cookieStore = await cookies();
  const authMode = parseSparkleFinderAuthMode(cookieStore.get(sparkleFinderAuthCookieName)?.value);
  const accountState = await getCurrentSparkleFinderAccount({ localPreviewAuthMode: authMode });
  const libraryItems = await getCatalogJewelryItems({ useFixtureFallback: shouldUseCatalogFixtureFallback() });
  const persistedCollectionItems =
    accountState.status === "authenticated" && accountState.isLocalPreview !== true
      ? await getPersistedCollectionItems(accountState.customer.id, libraryItems)
      : undefined;
  const persistedFavoriteRepCards =
    accountState.status === "authenticated" && accountState.isLocalPreview !== true
      ? await getPersistedFavoriteRepCards(accountState)
      : undefined;

  return renderSilverPageContent(accountState, persistedCollectionItems, libraryItems, persistedFavoriteRepCards);
}

export function renderSilverPageContent(
  accountState: SilverPageAccountState,
  persistedCollectionItems?: ManagedCollectionItem[],
  libraryItems: JewelryItem[] = getJewelryItems(),
  persistedFavoriteRepCards?: FavoriteRepCard[],
) {
  const entitlements = getSparkleFinderAccountEntitlements(accountState);
  const isLocalPreview = accountState.isLocalPreview === true;

  if (accountState.status !== "authenticated") {
    return <SilverUpgradePrompt accountState={accountState} />;
  }

  const customer = accountState.customer;
  const profile =
    accountState.silverProfile ?? getSilverProfileByCustomerId(customer.id) ?? createEmptySilverProfile(customer.id);
  const collectionItems =
    persistedCollectionItems ??
    getCollectionItemsByCustomerId(customer.id).flatMap((item) => {
      const jewelryItem = findLibraryItemById(item.jewelryItemId, libraryItems) ?? getJewelryItemById(item.jewelryItemId);

      return jewelryItem ? [{ ...item, jewelryItem }] : [];
    });
  const favoriteRepCards =
    persistedFavoriteRepCards ??
    getFavoriteRepCardsForUser({
      userId: customer.id,
      hasSilverAccess: entitlements.canUseNicNacFindRequests,
    });

  return (
    <section className="grid gap-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">
            My Sparkle Showcase
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-4xl font-semibold text-[var(--sparkle-plum-deep)]">
            {customer.displayName}&apos;s Sparkle Showcase
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--sparkle-ink-muted)]">
            {isLocalPreview
              ? "Stage owned pieces, pieces you are looking for, rare reveals, and profile details against Sparkle Finder's fixture-backed preview."
              : entitlements.canUseSilverProfileActions
                ? "Build, track, highlight, and share the pieces you own or hope to find, then use rep leads when a wanted piece appears."
                : "View your signed-in profile and saved library state. Silver access unlocks Sparkle Showcase saves."}
          </p>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[var(--sparkle-ink-muted)]">
            Sparkle Showcase is for discovery, tracking, highlighting, and sharing with rep-first find paths.
          </p>
        </div>
        <div className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-4 shadow-[var(--sparkle-shadow-sm)]">
          <div className="flex items-center gap-3">
            <Crown aria-hidden="true" className="size-7 text-[var(--sparkle-plum)]" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-bold text-[var(--sparkle-plum-deep)]">
                {isLocalPreview ? "Local fixture mode" : "Silver access active"}
              </p>
              <p className="text-sm leading-5 text-[var(--sparkle-ink-muted)]">
                {isLocalPreview ? "Preview-only state, ready for later actions." : "Your account can save Sparkle Showcase updates."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <FinderNicNacWorkspace
        collectionItems={collectionItems}
        displayName={customer.displayName}
        libraryItems={libraryItems}
        profile={profile}
      />

      <FavoriteRepsPanel cards={favoriteRepCards} isSilver={entitlements.canUseNicNacFindRequests} />

      <details className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] shadow-[var(--sparkle-shadow-sm)]">
        <summary className="cursor-pointer px-5 py-4 text-sm font-bold text-[var(--sparkle-plum-deep)]">
          Advanced profile and Showcase controls
        </summary>
        <div className="grid gap-6 border-t border-[var(--sparkle-border)] p-5 xl:grid-cols-[24rem_minmax(0,1fr)] xl:items-start">
          <ProfileEditor
            accountState={accountState}
            canSaveSilverActions={entitlements.canUseSilverProfileActions}
            customer={customer}
            isLocalPreview={isLocalPreview}
            profile={profile}
            saveAction={isLocalPreview ? undefined : saveSilverProfileAction}
          />
          <ShowcaseManager
            accountState={accountState}
            canSaveSilverActions={entitlements.canUseSilverCollectionActions}
            collectionItems={collectionItems}
            isLocalPreview={isLocalPreview}
            libraryItems={libraryItems}
            saveAction={isLocalPreview ? undefined : saveShowcasePieceAction}
            studioAction={isLocalPreview ? undefined : submitShowcaseStudioRequestAction}
          />
        </div>
      </details>
    </section>
  );
}

function SilverUpgradePrompt({ accountState }: { accountState: SilverPageAccountState }) {
  const isLocalPreview = accountState.isLocalPreview === true;

  return (
    <section className="mx-auto grid max-w-3xl gap-5 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-6 shadow-[var(--sparkle-shadow-sm)] sm:p-8">
      <div className="grid size-16 place-items-center rounded-full border border-[var(--sparkle-border)] bg-[var(--sparkle-blush-bg)] text-[var(--sparkle-plum)]">
        <Gem aria-hidden="true" className="size-8" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">
          {isLocalPreview ? "Silver preview needed" : "Silver access needed"}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-4xl font-semibold text-[var(--sparkle-plum-deep)]">
          {isLocalPreview ? "Open Silver to save Sparkle Showcase previews" : "Open Silver to view and stage your Sparkle Showcase"}
        </h1>
        <p className="mt-3 text-base leading-7 text-[var(--sparkle-ink-muted)]">
          {isLocalPreview
            ? "Free accounts can keep browsing the library. Silver preview accounts can stage profile edits, Sparkle Showcase records, and looking-for records against local fixture data."
            : "Free accounts can keep browsing the library. Silver accounts can view and stage profile details, Sparkle Showcase records, and looking-for records while persistent saves are still in progress."}
        </p>
      </div>
      <Link
        className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-5 text-sm font-bold text-white"
        href="/auth/sign-in"
      >
        <Sparkles aria-hidden="true" className="size-4" />
        {isLocalPreview ? "Choose preview account" : "Review access options"}
      </Link>
    </section>
  );
}

function createEmptySilverProfile(customerId: string): SilverProfile {
  return {
    customerId,
    photoUrl: "",
    tiktokHandle: "",
    bio: "",
    visibility: "private",
  };
}

async function getPersistedCollectionItems(userId: string, libraryItems: JewelryItem[]): Promise<ManagedCollectionItem[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sparkle_finder_collection_items")
      .select("id,user_id,jewelry_item_id,state,note,is_highlighted")
      .eq("user_id", userId);

    if (error || !Array.isArray(data)) {
      return [];
    }

    return data.flatMap((row) => {
      const item = mapPersistedCollectionItem(row);
      const jewelryItem = item ? findLibraryItemById(item.jewelryItemId, libraryItems) ?? getJewelryItemById(item.jewelryItemId) : null;

      return item && jewelryItem ? [{ ...item, jewelryItem }] : [];
    });
  } catch {
    return [];
  }
}

async function getPersistedFavoriteRepCards(
  accountState: SilverPageAccountState & { status: "authenticated" },
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

function findLibraryItemById(itemId: string, libraryItems: readonly JewelryItem[]): JewelryItem | undefined {
  return libraryItems.find((item) => item.id === itemId);
}

function mapPersistedCollectionItem(row: unknown): CollectionItem | null {
  if (!row || typeof row !== "object") {
    return null;
  }

  const record = row as Record<string, unknown>;
  const id = readString(record.id);
  const customerId = readString(record.user_id);
  const jewelryItemId = readString(record.jewelry_item_id);
  const state = readCollectionState(record.state);

  if (!id || !customerId || !jewelryItemId || !state) {
    return null;
  }

  return {
    id,
    customerId,
    jewelryItemId,
    state,
    note: readString(record.note),
    isHighlighted: record.is_highlighted === true,
  };
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readCollectionState(value: unknown): CollectionItem["state"] | null {
  if (value === "owned" || value === "wishlist" || value === "private_note_only") {
    return value;
  }

  return null;
}
