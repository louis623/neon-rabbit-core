import Link from "next/link";
import { Gem, Heart, Search, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { RepBadge } from "@/components/account/RepBadge";
import { BlingVaultMosaic } from "@/components/home/BlingVaultMosaic";
import { HeroPieceSpotlight } from "@/components/home/HeroPieceSpotlight";
import { WishlistRail } from "@/components/home/WishlistRail";
import type { HomepageBlingVaultModel } from "@/lib/sparkle-finder/homepage-bling-vault";
import type { CustomerAccount, SilverProfile } from "@/lib/sparkle-finder/types";
import type { LucideIcon } from "lucide-react";
import type { SVGProps } from "react";

type HomepageBlingVaultProps = {
  customer: CustomerAccount;
  model: HomepageBlingVaultModel;
  profile?: SilverProfile;
};

export function HomepageBlingVault({ customer, model, profile }: HomepageBlingVaultProps) {
  const profilePhotoUrl = profile?.photoUrl.trim();

  return (
    <section
      className="bg-[linear-gradient(180deg,rgba(245,237,255,0.74),rgba(251,247,255,0.98)_18%,rgba(255,250,253,0.86)_100%)]"
      data-smoke="homepage-bling-vault"
      id="bling-vault"
    >
      <div className="sparkle-finder-app-canvas mx-auto grid max-w-[34rem] gap-4 px-5 py-6 sm:px-8 lg:max-w-[56rem] lg:px-10">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">
              <Sparkles aria-hidden="true" className="size-4" />
              Bling Vault
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-[var(--sparkle-plum-deep)] sm:text-4xl">
              Build your collection.
            </h2>
          </div>
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border-strong)] bg-white px-4 text-sm font-black text-[var(--sparkle-plum)] transition hover:bg-[var(--sparkle-paper-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)] sm:w-fit"
            href="/silver"
          >
            <Gem aria-hidden="true" className="size-4 text-[var(--sparkle-coral)]" />
            Manage Collection
          </Link>
        </div>

        <div className="grid gap-3 rounded-[1.25rem] border border-[var(--sparkle-border)] bg-[rgba(255,255,255,0.94)] p-4 shadow-[var(--sparkle-shadow-sm)] sm:p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div
              aria-label={`${customer.displayName} avatar`}
              className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--sparkle-border)] bg-[linear-gradient(135deg,#ffffff,#f5edff)] font-[family-name:var(--font-playfair)] text-xl font-semibold text-[var(--sparkle-plum)] shadow-inner"
            >
              {profilePhotoUrl ? (
                <span
                  aria-hidden="true"
                  className="size-full bg-cover bg-center"
                  style={{ backgroundImage: `url("${profilePhotoUrl}")` }}
                />
              ) : (
                getInitials(customer.displayName)
              )}
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h3 className="min-w-0 break-words font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight text-[var(--sparkle-plum-deep)] [overflow-wrap:anywhere]">
                  {customer.displayName}&apos;s Collection
                </h3>
                <RepBadge repIdentity={customer.repIdentity} />
              </div>
              <p className="mt-1 text-sm font-semibold text-[var(--sparkle-ink-muted)]">
                {customer.state}, USA
              </p>
              {profile?.tiktokHandle ? <TikTokHandleLink value={profile.tiktokHandle} /> : null}
            </div>
          </div>
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border-strong)] bg-white px-4 text-sm font-black text-[var(--sparkle-plum)] transition hover:bg-[var(--sparkle-paper-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
            href="/account"
          >
            <UserRound aria-hidden="true" className="size-4" />
            Me
          </Link>
          <div className="grid grid-cols-2 gap-2 sm:col-span-2 sm:grid-cols-3" data-smoke="collection-stats">
            <CollectionMetric icon={Gem} label="Owned" value={model.counts.owned} />
            <CollectionMetric icon={Heart} label="Wishlist" value={model.counts.wishlist} />
            <CollectionMetric icon={Sparkles} label="Diamonds" value={model.counts.diamonds} />
            <CollectionMetric icon={ShieldCheck} label="Unicorns" value={model.counts.unicorns} />
            <CollectionMetric className="col-span-2 sm:col-span-2" icon={Search} label="Found by Sparkle Finder" value={model.counts.finderFinds} />
          </div>
        </div>

        <div className="grid gap-3">
          <HeroPieceSpotlight item={model.heroItem} />
          <WishlistRail items={model.wishlistItems} />
        </div>

        <BlingVaultMosaic items={model.mosaicItems} />
      </div>
    </section>
  );
}

function getInitials(displayName: string): string {
  return displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function TikTokHandleLink({ value }: { value: string }) {
  const profile = normalizeTikTokProfile(value);

  if (!profile) {
    return <p className="mt-1 truncate text-sm text-[var(--sparkle-ink-muted)]">{value}</p>;
  }

  return (
    <Link
      aria-label={`${profile.handle} on TikTok`}
      className="mt-1 inline-flex max-w-full items-center gap-1.5 text-sm font-semibold text-[var(--sparkle-ink-muted)] transition hover:text-[var(--sparkle-plum)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
      href={profile.href}
      rel="noreferrer"
      target="_blank"
    >
      <TikTokIcon aria-hidden="true" className="size-4 shrink-0" />
      <span className="truncate">{profile.handle}</span>
    </Link>
  );
}

function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      <path
        d="M14.9 3.5c.4 2.6 1.9 4.1 4.3 4.3v3.2a7.1 7.1 0 0 1-4.2-1.3v5.8c0 3.1-2.2 5.2-5.4 5.2-2.9 0-5-1.9-5-4.6 0-2.9 2.2-4.8 5.5-4.8.4 0 .7 0 1 .1v3.4a3.2 3.2 0 0 0-1.2-.2c-1.2 0-2 .6-2 1.6s.7 1.5 1.7 1.5c1.2 0 2-.7 2-2.1V3.5h3.3Z"
        fill="currentColor"
      />
    </svg>
  );
}

function normalizeTikTokProfile(value: string): { handle: string; href: string } | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  let candidate = trimmed;

  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);

    if (url.hostname.includes("tiktok.com")) {
      candidate = url.pathname.split("/").find((part) => part.startsWith("@")) ?? "";
    }
  } catch {
    candidate = trimmed;
  }

  const handle = candidate
    .replace(/^https?:\/\/(www\.)?tiktok\.com\//i, "")
    .replace(/^\/+/, "")
    .split(/[/?#]/)[0]
    .trim();

  if (!handle) {
    return null;
  }

  const displayHandle = handle.startsWith("@") ? handle : `@${handle}`;
  const encodedHandle = encodeURIComponent(displayHandle.slice(1));

  return {
    handle: displayHandle,
    href: `https://www.tiktok.com/@${encodedHandle}`,
  };
}

function CollectionMetric({
  className = "",
  icon: Icon,
  label,
  value,
}: {
  className?: string;
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div className={`flex min-h-14 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] px-3 ${className}`}>
      <Icon aria-hidden="true" className="size-4 shrink-0 text-[var(--sparkle-coral)]" strokeWidth={1.7} />
      <div>
        <p className="text-base font-black leading-none text-[var(--sparkle-plum-deep)]">{value}</p>
        <p className="mt-1 text-xs font-bold leading-tight text-[var(--sparkle-ink-muted)]">{label}</p>
      </div>
    </div>
  );
}
