import Link from "next/link";
import { BookOpen, Gem, Search } from "lucide-react";
import type { HomepageBlingVaultModel } from "@/lib/sparkle-finder/homepage-bling-vault";
import type { CustomerAccount } from "@/lib/sparkle-finder/types";
import type { LucideIcon } from "lucide-react";

type SimpleFinderHomeProps = {
  customer: CustomerAccount;
  model: HomepageBlingVaultModel;
};

export function SimpleFinderHome({ customer, model }: SimpleFinderHomeProps) {
  return (
    <section
      className="border-b border-[var(--sparkle-border-strong)] bg-[linear-gradient(180deg,rgba(251,247,255,0.98),rgba(245,237,255,0.76))]"
      data-smoke="simple-finder-home"
      id="home"
    >
      <div className="sparkle-finder-app-canvas mx-auto grid max-w-[34rem] gap-3 px-5 py-5 sm:px-8 lg:max-w-[56rem] lg:px-10 lg:py-7">
        <article className="grid gap-4 rounded-[1.5rem] border border-[var(--sparkle-border)] bg-[rgba(255,255,255,0.94)] p-4 shadow-[var(--sparkle-shadow-sm)] sm:p-5">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Home</p>
            <p className="truncate text-xs font-black text-[var(--sparkle-ink-muted)]">{customer.displayName}</p>
          </div>

          <div className="grid gap-2">
            <h1 className="sparkle-display text-4xl font-semibold leading-[1.04] text-[var(--sparkle-plum-deep)] sm:text-5xl">
              Find the pieces you love.
            </h1>
            <p className="text-base font-semibold leading-7 text-[var(--sparkle-ink-muted)]">
              Build your collection with Sparkle Finder.
            </p>
          </div>

          <div className="grid gap-2">
            <HomeAction href="#find-a-piece" icon={Search} label="Find a Piece" primary />
            <div className="grid grid-cols-2 gap-2">
              <HomeAction href="#bling-vault" icon={Gem} label="My Collection" />
              <HomeAction href="/library" icon={BookOpen} label="Browse Library" />
            </div>
          </div>

          <Link
            className="grid gap-1 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] p-3 text-left transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
            href="#find-a-piece"
          >
            <span className="text-sm font-black text-[var(--sparkle-plum-deep)]">Wishlist check</span>
            <span className="text-xs font-semibold leading-5 text-[var(--sparkle-ink-muted)]">
              {model.counts.wishlist > 0
                ? `${model.counts.wishlist} pieces ready for Sparkle Finder to watch.`
                : "Add pieces you want, then Sparkle Finder can help watch for them."}
            </span>
          </Link>
        </article>
      </div>
    </section>
  );
}

function HomeAction({
  href,
  icon: Icon,
  label,
  primary = false,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      className={
        primary
          ? "sparkle-home-primary-cta inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] px-4 text-sm font-black shadow-[var(--sparkle-shadow-md)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
          : "inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-black text-[var(--sparkle-plum)] transition hover:bg-[var(--sparkle-paper-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)] sm:px-4"
      }
      href={href}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span className="min-w-0">{label}</span>
    </Link>
  );
}
