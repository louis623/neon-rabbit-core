import { AffiliateStrip } from "@/components/shop/AffiliateStrip";
import { getAffiliateShopItems } from "@/lib/sparkle-finder/service";

export default function ShopPage() {
  const affiliateShopItems = getAffiliateShopItems();

  return (
    <section className="grid gap-6">
      <div>
        <h1 className="font-[var(--font-playfair)] text-4xl font-semibold text-[var(--sparkle-plum-deep)]">
          Collector Essentials
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--sparkle-ink-muted)]">
          Gear picks for collection care, storage, and livestream setup basics.
        </p>
      </div>
      <AffiliateStrip items={affiliateShopItems} />
    </section>
  );
}
