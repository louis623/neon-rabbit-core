import { AffiliateStrip } from "@/components/shop/AffiliateStrip";
import { affiliateDisclosureHref, affiliateIssueReportHref, affiliateIssueReportLabel } from "@/lib/sparkle-finder/affiliate-copy";
import { getAffiliateShopItems } from "@/lib/sparkle-finder/service";
import Link from "next/link";

export default function ShopPage() {
  const affiliateShopItems = getAffiliateShopItems();

  return (
    <section className="grid gap-6">
      <div>
        <h1 className="font-[var(--font-playfair)] text-4xl font-semibold text-[var(--sparkle-plum-deep)]">
          Collector Essentials
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--sparkle-ink-muted)]">
          Discovery categories for collection care, storage, and livestream setup basics. Sparkle Finder is not a
          jewelry marketplace and does not publish exact retailer selections, live prices, copied reviews, ratings, or
          product images here.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold">
          <Link className="text-[var(--sparkle-plum)] underline-offset-4 hover:underline" href={affiliateDisclosureHref}>
            Affiliate disclosure
          </Link>
          <a className="text-[var(--sparkle-plum)] underline-offset-4 hover:underline" href={affiliateIssueReportHref}>
            {affiliateIssueReportLabel}
          </a>
        </div>
      </div>
      <AffiliateStrip items={affiliateShopItems} showShopCta={false} />
    </section>
  );
}
