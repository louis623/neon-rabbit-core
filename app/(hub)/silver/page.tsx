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
  getLocalDevAuthState,
  parseSparkleFinderAuthMode,
  sparkleFinderAuthCookieName,
} from "@/lib/sparkle-finder/auth";
import { getSparkleFinderAccountEntitlements } from "@/lib/sparkle-finder/entitlements";
import type { SparkleFinderAccountState } from "@/lib/sparkle-finder/auth";
import type { SilverProfile } from "@/lib/sparkle-finder/types";

export default async function SilverPage() {
  const cookieStore = await cookies();
  const authMode = parseSparkleFinderAuthMode(cookieStore.get(sparkleFinderAuthCookieName)?.value);

  return renderSilverPageContent(getLocalDevAuthState(authMode));
}

export function renderSilverPageContent(accountState: SparkleFinderAccountState) {
  const entitlements = getSparkleFinderAccountEntitlements(accountState);

  if (accountState.status !== "authenticated" || !entitlements.canUseSilverProfileActions) {
    return <SilverUpgradePrompt />;
  }

  const customer = accountState.customer;
  const profile = getSilverProfileByCustomerId(customer.id) ?? createEmptySilverProfile(customer.id);
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
            View and stage local profile, collection, and watchlist updates for Sparkle Finder&apos;s fixture-backed preview.
          </p>
        </div>
        <div className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-4 shadow-[var(--sparkle-shadow-sm)]">
          <div className="flex items-center gap-3">
            <Crown aria-hidden="true" className="size-7 text-[var(--sparkle-plum)]" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-bold text-[var(--sparkle-plum-deep)]">Local fixture mode</p>
              <p className="text-sm leading-5 text-[var(--sparkle-ink-muted)]">Preview-only state, ready for later actions.</p>
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

function SilverUpgradePrompt() {
  return (
    <section className="mx-auto grid max-w-3xl gap-5 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-6 shadow-[var(--sparkle-shadow-sm)] sm:p-8">
      <div className="grid size-16 place-items-center rounded-full border border-[var(--sparkle-border)] bg-[var(--sparkle-blush-bg)] text-[var(--sparkle-plum)]">
        <Gem aria-hidden="true" className="size-8" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Silver preview needed</p>
        <h1 className="mt-2 font-[var(--font-playfair)] text-4xl font-semibold text-[var(--sparkle-plum-deep)]">
          Open Silver to save profile and collection previews
        </h1>
        <p className="mt-3 text-base leading-7 text-[var(--sparkle-ink-muted)]">
          Free accounts can keep browsing the library. Silver preview accounts can stage profile edits, collection
          records, and watchlist records against local fixture data.
        </p>
      </div>
      <Link
        className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-5 text-sm font-bold text-white"
        href="/auth/sign-in"
      >
        <Sparkles aria-hidden="true" className="size-4" />
        Choose preview account
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
