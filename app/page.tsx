import { SparkleFinderNav } from "@/components/layout/SparkleFinderNav";
import { HeroAndAgenda } from "@/components/home/HeroAndAgenda";
import { SilverCollectorSpace } from "@/components/silver/SilverCollectorSpace";
import { AffiliateStrip } from "@/components/shop/AffiliateStrip";
import {
  getCollectionItemsByCustomerId,
  getAffiliateShopItems,
  getCustomerById,
  getJewelryItemById,
  getLiveShows,
  getReps,
  getSilverProfileByCustomerId,
} from "@/lib/sparkle-finder/service";

export default function Home() {
  const liveShows = getLiveShows();
  const reps = getReps();
  const affiliateShopItems = getAffiliateShopItems();
  const silverCustomer = getCustomerById("customer-silver-sparkle-mama");
  const silverProfile = getSilverProfileByCustomerId("customer-silver-sparkle-mama");
  const silverCollectionItems = getCollectionItemsByCustomerId("customer-silver-sparkle-mama").flatMap((item) => {
    const jewelryItem = getJewelryItemById(item.jewelryItemId);

    return jewelryItem ? [{ ...item, jewelryItem }] : [];
  });

  return (
    <>
      <SparkleFinderNav />
      <main>
        <HeroAndAgenda liveShows={liveShows} reps={reps} />
        {silverCustomer ? (
          <SilverCollectorSpace
            collectionItems={silverCollectionItems}
            customer={silverCustomer}
            profile={silverProfile}
          />
        ) : null}
        <AffiliateStrip items={affiliateShopItems} />
      </main>
    </>
  );
}
