import Link from "next/link";
import { Gem, Sparkles } from "lucide-react";
import { BlingVaultMosaic } from "@/components/home/BlingVaultMosaic";
import { HeroPieceSpotlight } from "@/components/home/HeroPieceSpotlight";
import { WishlistRail } from "@/components/home/WishlistRail";
import type { HomepageBlingVaultModel } from "@/lib/sparkle-finder/homepage-bling-vault";

type HomepageBlingVaultProps = {
  model: HomepageBlingVaultModel;
};

export function HomepageBlingVault({ model }: HomepageBlingVaultProps) {
  return (
    <section
      className="bg-[linear-gradient(180deg,rgba(255,246,250,0.72),rgba(252,248,246,0.98)_18%,rgba(255,255,255,0.82)_100%)]"
      data-smoke="homepage-bling-vault"
      id="bling-vault"
    >
      <div className="mx-auto grid max-w-[112rem] gap-4 px-5 py-7 sm:px-8 lg:px-10 lg:py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">
              <Sparkles aria-hidden="true" className="size-4" />
              Bling Vault
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-[var(--sparkle-plum-deep)] sm:text-4xl">
              Browse your saved sparkle.
            </h2>
          </div>
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border-strong)] bg-white px-4 text-sm font-black text-[var(--sparkle-plum)] transition hover:bg-[var(--sparkle-paper-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
            href="/silver"
          >
            <Gem aria-hidden="true" className="size-4 text-[var(--sparkle-coral)]" />
            Manage full collection
          </Link>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.42fr)_minmax(20rem,0.58fr)] xl:items-stretch">
          <HeroPieceSpotlight item={model.heroItem} />
          <WishlistRail items={model.wishlistItems} />
        </div>

        <BlingVaultMosaic items={model.mosaicItems} />
      </div>
    </section>
  );
}
