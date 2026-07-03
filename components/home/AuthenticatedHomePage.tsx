import { FindPiecePanel } from "@/components/home/FindPiecePanel";
import { HomepageBlingVault } from "@/components/home/HomepageBlingVault";
import { SimpleFinderHome } from "@/components/home/SimpleFinderHome";
import { SparkleFinderNav } from "@/components/layout/SparkleFinderNav";
import {
  getCollectionItemsByCustomerId,
  getJewelryItemById,
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
      <main
        className="overflow-hidden bg-[var(--sparkle-warm-bg)] pb-[calc(5.75rem+env(safe-area-inset-bottom))] lg:pb-0"
        data-layout="mobile-first-app"
        data-smoke="authenticated-home"
      >
        <SimpleFinderHome customer={customer} model={blingVaultModel} profile={profile} />
        <FindPiecePanel accountState={accountState} model={blingVaultModel} />
        <HomepageBlingVault model={blingVaultModel} />
      </main>
    </>
  );
}
