import { cookies } from "next/headers";
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
import {
  parseSparkleFinderAuthMode,
  sparkleFinderAuthCookieName,
} from "@/lib/sparkle-finder/auth";
import { getCurrentSparkleFinderAccount } from "@/lib/sparkle-finder/account-service";

export default async function Home() {
  const cookieStore = await cookies();
  const authMode = parseSparkleFinderAuthMode(cookieStore.get(sparkleFinderAuthCookieName)?.value);
  const accountState = await getCurrentSparkleFinderAccount({ localPreviewAuthMode: authMode });
  const liveShows = getLiveShows();
  const reps = getReps();
  const affiliateShopItems = getAffiliateShopItems();
  const demoSilverCustomer = getCustomerById("customer-silver-sparkle-mama");
  const silverCustomer = accountState.status === "authenticated" ? accountState.customer : demoSilverCustomer;
  const silverProfile =
    accountState.status === "authenticated"
      ? accountState.silverProfile
      : getSilverProfileByCustomerId("customer-silver-sparkle-mama");
  const silverCollectionCustomerId =
    accountState.status === "authenticated" ? accountState.customer.id : "customer-silver-sparkle-mama";
  const silverCollectionItems = getCollectionItemsByCustomerId(silverCollectionCustomerId).flatMap((item) => {
    const jewelryItem = getJewelryItemById(item.jewelryItemId);

    return jewelryItem ? [{ ...item, jewelryItem }] : [];
  });

  return (
    <>
      <SparkleFinderNav accountState={accountState} />
      <main>
        <HeroAndAgenda liveShows={liveShows} reps={reps} />
        {silverCustomer ? (
          <SilverCollectorSpace
            accountState={accountState}
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
