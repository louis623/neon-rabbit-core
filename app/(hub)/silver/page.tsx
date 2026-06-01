import Link from "next/link";
import { cookies } from "next/headers";
import { Crown, Gem, Sparkles } from "lucide-react";
import { CollectionManager } from "@/components/silver/CollectionManager";
import { ProfileEditor } from "@/components/silver/ProfileEditor";
import {
  getCollectionItemsByCustomerId,
  getJewelryItemById,
  getJewelryItems,
  getSilverProfileByCustomerId,
} from "@/lib/sparkle-finder/service";
import {
  parseSparkleFinderAuthMode,
  sparkleFinderAuthCookieName,
} from "@/lib/sparkle-finder/auth";
import { getCurrentSparkleFinderAccount } from "@/lib/sparkle-finder/account-service";
import { getSparkleFinderAccountEntitlements } from "@/lib/sparkle-finder/entitlements";
import type { SparkleFinderAccountState } from "@/lib/sparkle-finder/auth";
import type { SilverProfile } from "@/lib/sparkle-finder/types";

type SilverPageAccountState = SparkleFinderAccountState & {
  silverProfile?: SilverProfile;
  isLocalPreview?: boolean;
};

export default async function SilverPage() {
  const cookieStore = await cookies();
  const authMode = parseSparkleFinderAuthMode(cookieStore.get(sparkleFinderAuthCookieName)?.value);

  return renderSilverPageContent(await getCurrentSparkleFinderAccount({ localPreviewAuthMode: authMode }));
}

export function renderSilverPageContent(accountState: SilverPageAccountState) {
  const entitlements = getSparkleFinderAccountEntitlements(accountState);
  const isLocalPreview = accountState.isLocalPreview === true;

  if (accountState.status !== "authenticated" || !entitlements.canUseSilverProfileActions) {
    return <SilverUpgradePrompt accountState={accountState} />;
  }

  const customer = accountState.customer;
  const profile =
    accountState.silverProfile ?? getSilverProfileByCustomerId(customer.id) ?? createEmptySilverProfile(customer.id);
  const collectionItems = getCollectionItemsByCustomerId(customer.id).flatMap((item) => {
    const jewelryItem = getJewelryItemById(item.jewelryItemId);

    return jewelryItem ? [{ ...item, jewelryItem }] : [];
  });

  return (
    <section className="grid gap-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">
            Silver Membership
          </p>
          <h1 className="mt-2 font-[var(--font-playfair)] text-4xl font-semibold text-[var(--sparkle-plum-deep)]">
            {customer.displayName}&apos;s Silver Space
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--sparkle-ink-muted)]">
            {isLocalPreview
              ? "View and stage local profile, collection, and watchlist updates for Sparkle Finder's fixture-backed preview."
              : "View your signed-in Silver workspace and stage profile, collection, and watchlist updates. Persistent account-backed saves are coming in a later update."}
          </p>
        </div>
        <div className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-4 shadow-[var(--sparkle-shadow-sm)]">
          <div className="flex items-center gap-3">
            <Crown aria-hidden="true" className="size-7 text-[var(--sparkle-plum)]" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-bold text-[var(--sparkle-plum-deep)]">
                {isLocalPreview ? "Local fixture mode" : "Account Silver access"}
              </p>
              <p className="text-sm leading-5 text-[var(--sparkle-ink-muted)]">
                {isLocalPreview ? "Preview-only state, ready for later actions." : "Your access is checked from the signed-in account."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
        <ProfileEditor accountState={accountState} customer={customer} profile={profile} />
        <CollectionManager
          accountState={accountState}
          collectionItems={collectionItems}
          libraryItems={getJewelryItems()}
        />
      </div>
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
        <h1 className="mt-2 font-[var(--font-playfair)] text-4xl font-semibold text-[var(--sparkle-plum-deep)]">
          {isLocalPreview ? "Open Silver to save profile and collection previews" : "Open Silver to view and stage your workspace"}
        </h1>
        <p className="mt-3 text-base leading-7 text-[var(--sparkle-ink-muted)]">
          {isLocalPreview
            ? "Free accounts can keep browsing the library. Silver preview accounts can stage profile edits, collection records, and watchlist records against local fixture data."
            : "Free accounts can keep browsing the library. Silver accounts can view and stage profile details, collection records, and watchlist records while persistent saves are still in progress."}
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
