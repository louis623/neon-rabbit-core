import Link from "next/link";
import { ArrowRight, Box, Gift, Headphones, PackageCheck, Smartphone, Sparkles } from "lucide-react";
import type { AffiliateShopItem } from "@/lib/sparkle-finder/types";

type AffiliateStripProps = {
  items: AffiliateShopItem[];
};

const affiliateIcons: Record<AffiliateShopItem["id"], typeof Sparkles> = {
  "shop-jewelry-care": Sparkles,
  "shop-livestream-gear": Headphones,
  "shop-packaging": Gift,
  "shop-phone-tech": Smartphone,
  "shop-storage-display": Box,
};

export function AffiliateStrip({ items }: AffiliateStripProps) {
  return (
    <section
      className="border-b border-[var(--sparkle-border)] bg-[rgba(255,254,253,0.94)]"
      data-smoke="affiliate-strip"
      id="shop"
    >
      <div className="mx-auto grid max-w-[112rem] gap-4 px-5 py-4 sm:px-8 lg:grid-cols-[16rem_minmax(0,1fr)_13rem] lg:items-center lg:px-10">
        <div className="flex items-center gap-4">
          <PackageCheck aria-hidden="true" className="size-9 shrink-0 text-[var(--sparkle-plum)]" strokeWidth={1.7} />
          <div>
            <h2 className="font-[var(--font-playfair)] text-2xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
              Collector Essentials
            </h2>
            <p className="mt-1 text-sm leading-5 text-[var(--sparkle-ink-muted)]">Affiliate picks for your sparkle setup.</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
          {items.map((item) => {
            const Icon = affiliateIcons[item.id] ?? Sparkles;

            return (
              <article
                key={item.id}
                className="flex min-h-16 items-center gap-3 border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-3 shadow-[var(--sparkle-shadow-sm)] sm:rounded-[var(--sparkle-radius-sm)] lg:border-l lg:bg-transparent lg:shadow-none"
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-blush-bg)] text-[var(--sparkle-plum)]">
                  <Icon aria-hidden="true" className="size-6" strokeWidth={1.7} />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-[var(--sparkle-plum-deep)]">{item.title}</h3>
                  <p className="truncate text-xs leading-5 text-[var(--sparkle-ink-muted)]">{item.body}</p>
                </div>
              </article>
            );
          })}
        </div>

        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-transparent px-4 text-sm font-bold text-[var(--sparkle-rose)] transition hover:border-[var(--sparkle-border)] hover:bg-[var(--sparkle-paper-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
          href="/shop"
        >
          Shop affiliate picks
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </section>
  );
}
