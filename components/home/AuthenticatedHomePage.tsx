import { HeroAndAgenda } from "@/components/home/HeroAndAgenda";
import { SilverCollectorSpace, type SilverCollectionPreviewItem } from "@/components/silver/SilverCollectorSpace";
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
import type { SilverProfile } from "@/lib/sparkle-finder/types";

type AuthenticatedHomePageProps = {
  accountState: Extract<SparkleFinderAccountState, { status: "authenticated" }> & {
    silverProfile?: SilverProfile;
  };
};

export function AuthenticatedHomePage({ accountState }: AuthenticatedHomePageProps) {
  const customer = accountState.customer;
  const collectionItems = getCollectionItemsByCustomerId(customer.id).flatMap((item): SilverCollectionPreviewItem[] => {
    const jewelryItem = getJewelryItemById(item.jewelryItemId);

    return jewelryItem ? [{ ...item, jewelryItem }] : [];
  });

  return (
    <>
      <SparkleFinderNav accountState={accountState} />
      <main className="overflow-hidden bg-[var(--sparkle-warm-bg)]" data-smoke="authenticated-home">
        <HeroAndAgenda liveShows={getLiveShows()} reps={getReps()} />
        <SilverCollectorSpace
          accountState={accountState}
          collectionItems={collectionItems}
          customer={customer}
          profile={accountState.silverProfile ?? getSilverProfileByCustomerId(customer.id)}
        />
      </main>
      <SparkleFinderFooter />
    </>
  );
}
