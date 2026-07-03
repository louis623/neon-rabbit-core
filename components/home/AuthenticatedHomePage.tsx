import { HeroAndAgenda } from "@/components/home/HeroAndAgenda";
import { FinderCommandCenter } from "@/components/home/FinderCommandCenter";
import { HomepageBlingVault } from "@/components/home/HomepageBlingVault";
import { SparkleFinderFooter } from "@/components/layout/SparkleFinderFooter";
import { SparkleFinderNav } from "@/components/layout/SparkleFinderNav";
import {
  getCollectionItemsByCustomerId,
  getJewelryItemById,
  getLiveShows,
  getReps,
  getSilverProfileByCustomerId,
} from "@/lib/sparkle-finder/service";
import type { SparkleFinderAccountState } from "@/lib/sparkle-finder/auth";
import { buildHomepageBlingVaultModel, type HomepageBlingVaultItem } from "@/lib/sparkle-finder/homepage-bling-vault";
import type { SilverProfile } from "@/lib/sparkle-finder/types";

type AuthenticatedHomePageProps = {
  accountState: Extract<SparkleFinderAccountState, { status: "authenticated" }> & {
    silverProfile?: SilverProfile;
  };
  collectionItems?: HomepageBlingVaultItem[];
};

export function AuthenticatedHomePage({ accountState, collectionItems: persistedCollectionItems }: AuthenticatedHomePageProps) {
  const customer = accountState.customer;
  const collectionItems =
    persistedCollectionItems ??
    getCollectionItemsByCustomerId(customer.id).flatMap((item): HomepageBlingVaultItem[] => {
      const jewelryItem = getJewelryItemById(item.jewelryItemId);

      return jewelryItem ? [{ ...item, jewelryItem }] : [];
    });
  const profile = accountState.silverProfile ?? getSilverProfileByCustomerId(customer.id);
  const blingVaultModel = buildHomepageBlingVaultModel(collectionItems);

  return (
    <>
      <SparkleFinderNav accountState={accountState} />
      <main className="overflow-hidden bg-[var(--sparkle-warm-bg)]" data-smoke="authenticated-home">
        <HeroAndAgenda liveShows={getLiveShows()} reps={getReps()} />
        <FinderCommandCenter
          accountState={accountState}
          customer={customer}
          model={blingVaultModel}
          profile={profile}
        />
        <HomepageBlingVault model={blingVaultModel} />
      </main>
      <SparkleFinderFooter />
    </>
  );
}
