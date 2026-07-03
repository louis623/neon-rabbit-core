import Link from "next/link";
import { BookOpen, Bot, Camera, Gem, Heart, MapPin, Search, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { RepBadge } from "@/components/account/RepBadge";
import { FindThisForMe } from "@/components/nic-nac/FindThisForMe";
import type { SVGProps } from "react";
import type { SparkleFinderAccountState } from "@/lib/sparkle-finder/auth";
import type { CustomerAccount, SilverProfile } from "@/lib/sparkle-finder/types";
import type { HomepageBlingVaultModel } from "@/lib/sparkle-finder/homepage-bling-vault";

type FinderCommandCenterProps = {
  accountState: SparkleFinderAccountState;
  customer: CustomerAccount;
  model: HomepageBlingVaultModel;
  profile?: SilverProfile;
};

export function FinderCommandCenter({ accountState, customer, model, profile }: FinderCommandCenterProps) {
  const profilePhotoUrl = profile?.photoUrl.trim();
  const nicNacItemId = model.wishlistItems[0]?.jewelryItemId ?? model.heroItem?.jewelryItemId;
  const isProfileReady = Boolean(profile?.bio.trim() || profile?.tiktokHandle.trim());

  return (
    <section
      className="border-b border-[var(--sparkle-border-strong)] bg-[linear-gradient(180deg,rgba(255,248,245,0.9),rgba(255,246,250,0.72))]"
      data-smoke="finder-command-center"
      id="finder-command-center"
    >
      <div className="mx-auto grid max-w-[112rem] gap-4 px-5 py-5 sm:px-8 lg:grid-cols-[minmax(17rem,0.72fr)_minmax(0,1.1fr)_minmax(22rem,0.78fr)] lg:px-10 lg:py-6">
        <article className="grid content-start gap-4 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-4 shadow-[var(--sparkle-shadow-sm)]">
          <div className="flex items-start gap-3">
            <Sparkles aria-hidden="true" className="mt-1 size-7 text-[var(--sparkle-rose)]" strokeWidth={1.6} />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Collector profile</p>
              <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
                Your Finder Space
              </h2>
            </div>
          </div>

          <div className="flex gap-3 border-b border-[var(--sparkle-border)] pb-4">
            <div
              aria-label={`${customer.displayName} avatar`}
              className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--sparkle-border)] bg-[linear-gradient(135deg,#fff8f5,#eeeeee)] font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[var(--sparkle-plum)] shadow-inner"
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
                <h3 className="truncate font-[family-name:var(--font-playfair)] text-lg font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
                  {customer.displayName}
                </h3>
                <RepBadge repIdentity={customer.repIdentity} />
              </div>
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-[var(--sparkle-ink-muted)]">
                <MapPin aria-hidden="true" className="size-4" />
                {customer.state}, USA
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--sparkle-ink-muted)]">
                {isProfileReady ? "Profile ready" : "Profile details ready for a quick edit"}
              </p>
              {profile?.tiktokHandle ? (
                <TikTokHandleLink value={profile.tiktokHandle} />
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <MiniMetric icon={Gem} label="Owned" value={model.counts.owned} />
            <MiniMetric icon={Heart} label="Wishlist" value={model.counts.wishlist} />
            <MiniMetric icon={Sparkles} label="Diamonds" value={model.counts.diamonds} />
            <MiniMetric icon={ShieldCheck} label="Unicorns" value={model.counts.unicorns} />
            <MiniMetric className="col-span-2" icon={Sparkles} label="Found by Sparkle Finder" value={model.counts.finderFinds} />
          </div>
        </article>

        <article className="grid content-start gap-4 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-4 shadow-[var(--sparkle-shadow-sm)]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Nic-Nac Home</p>
            <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
              Ask Nic-Nac or tap a simple action.
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
              Keep the homepage calm: browse, find, edit, or jump straight into your Bling Vault.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <CommandLink href="/library" icon={BookOpen} label="Browse Library" />
            <CommandLink href="#bling-vault" icon={Gem} label="View Bling Vault" />
            <CommandLink href="#homepage-nic-nac" icon={Bot} label="Ask Nic-Nac" />
            <CommandLink href="/silver" icon={UserRound} label="Edit Profile" />
            <CommandLink href="/library" icon={Search} label="Find a library piece" />
            <CommandLink href="/silver#showcase-studio" icon={Camera} label="Open Showcase Studio" />
          </div>
        </article>

        <div id="homepage-nic-nac">
          <FindThisForMe accountState={accountState} compact jewelryItemId={nicNacItemId} />
        </div>
      </div>
    </section>
  );
}

function CommandLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof BookOpen;
  label: string;
}) {
  return (
    <Link
      className="inline-flex min-h-11 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-black text-[var(--sparkle-plum)] transition hover:border-[var(--sparkle-rose)] hover:bg-[var(--sparkle-paper-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
      href={href}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0 text-[var(--sparkle-coral)]" />
      <span>{label}</span>
    </Link>
  );
}

function MiniMetric({
  className = "",
  icon: Icon,
  label,
  value,
}: {
  className?: string;
  icon: typeof Gem;
  label: string;
  value: number;
}) {
  return (
    <div className={`flex min-h-14 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] px-3 ${className}`}>
      <Icon aria-hidden="true" className="size-4 shrink-0 text-[var(--sparkle-coral)]" strokeWidth={1.7} />
      <div>
        <p className="text-base font-black leading-none text-[var(--sparkle-plum-deep)]">{value}</p>
        <p className="mt-1 text-xs font-bold leading-none text-[var(--sparkle-ink-muted)]">{label}</p>
      </div>
    </div>
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
