import Link from "next/link";
import type { CSSProperties } from "react";
import { BookOpen, Camera, CheckCircle2, Gem, Heart, MapPin, Search, ShieldCheck, Sparkles } from "lucide-react";
import { RepBadge } from "@/components/account/RepBadge";
import { FindThisForMe } from "@/components/nic-nac/FindThisForMe";
import { getLocalDevAuthState } from "@/lib/sparkle-finder/auth";
import { getSparkleFinderEntitlements } from "@/lib/sparkle-finder/entitlements";
import type { SparkleFinderAccountState } from "@/lib/sparkle-finder/auth";
import type { CollectionItem, CustomerAccount, JewelryItem, SilverProfile } from "@/lib/sparkle-finder/types";

export type SilverCollectionPreviewItem = CollectionItem & {
  jewelryItem: JewelryItem;
};

type SilverCollectorSpaceProps = {
  customer: CustomerAccount;
  profile?: SilverProfile;
  collectionItems: SilverCollectionPreviewItem[];
  accountState?: SparkleFinderAccountState;
};

export function SilverCollectorSpace({ customer, profile, collectionItems, accountState }: SilverCollectorSpaceProps) {
  const entitlements = getSparkleFinderEntitlements(customer);
  const nicNacAccountState = accountState ?? getLocalDevAuthState(customer.tier);
  const nicNacPreviewItemId = collectionItems[0]?.jewelryItemId;
  const ownedCount = collectionItems.filter((item) => item.state === "owned").length;
  const wishlistCount = collectionItems.filter((item) => item.state === "wishlist").length;
  const highlightedCount = collectionItems.filter((item) => item.isHighlighted).length;
  const isProfileReady = Boolean(profile?.bio.trim() || profile?.tiktokHandle.trim());
  const profilePhotoUrl = profile?.photoUrl?.trim();

  return (
    <section
      className="border-b border-[var(--sparkle-border-strong)] bg-[linear-gradient(180deg,rgba(255,254,253,0.98),rgba(255,246,250,0.78))]"
      data-smoke="collector-profile-panel"
      id="silver"
    >
      <div className="mx-auto grid max-w-[112rem] gap-4 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(18rem,0.74fr)_minmax(0,1.55fr)_minmax(23rem,0.9fr)] lg:items-stretch lg:px-10 lg:py-7">
        <article className="grid min-h-[24rem] content-start gap-4 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
          <div className="flex items-start justify-between gap-3 text-[var(--sparkle-ink-muted)]">
            <div className="flex items-center gap-3">
              <Sparkles aria-hidden="true" className="size-7 text-[var(--sparkle-plum)]" strokeWidth={1.6} />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Collector profile</p>
                <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-[1.55rem] font-semibold leading-tight text-[var(--sparkle-plum-deep)]">Your Finder Space</h2>
              </div>
            </div>
            <span className="rounded-full border border-[var(--sparkle-border)] bg-[var(--sparkle-blush-bg)] px-3 py-1 text-xs font-black text-[var(--sparkle-plum)]">
              Trial access
            </span>
          </div>

          <div className="flex gap-4 border-b border-[var(--sparkle-border)] pb-4">
            <div
              aria-label={`${customer.displayName} avatar`}
              className="grid size-[5.25rem] shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--sparkle-border)] bg-[linear-gradient(135deg,#fff8f5,#eeeeee)] font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[var(--sparkle-plum)] shadow-inner"
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
            <div className="min-w-0 pt-1">
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
              {profile?.tiktokHandle ? (
                <p className="mt-1 truncate text-sm text-[var(--sparkle-ink-muted)]">{profile.tiktokHandle}</p>
              ) : (
                <p className="mt-1 truncate text-sm text-[var(--sparkle-ink-muted)]">TikTok handle not added</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ProfileMetric icon={Gem} label="Owned pieces" value={ownedCount} />
            <ProfileMetric icon={Heart} label="Wishlist / watchlist" value={wishlistCount} />
            <ProfileMetric icon={ShieldCheck} label="Highlighted" value={highlightedCount} />
            <ProfileMetric icon={CheckCircle2} label={isProfileReady ? "Profile ready" : "Profile details"} value={isProfileReady ? "Ready" : "Add"} />
          </div>

          <div className="grid gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] p-3">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--sparkle-ink-muted)]">Collector tools</p>
            <FeatureLine>Save collection and pieces you are looking for.</FeatureLine>
            <FeatureLine>Build a Sparkle Showcase from owned pieces.</FeatureLine>
            <FeatureLine>Ask Nic-Nac for bounded rep and next-show leads.</FeatureLine>
          </div>

          {entitlements.canUseSilverProfileActions ? (
            <Link
              className="inline-flex min-h-10 w-full items-center justify-center rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border-strong)] px-4 text-sm font-bold text-[var(--sparkle-plum)] transition hover:bg-[var(--sparkle-paper-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
              href="/silver"
            >
              View / Edit Profile
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] px-4 text-sm font-bold text-[var(--sparkle-ink-muted)]"
              role="link"
            >
              Profile preview
            </span>
          )}
        </article>

        <article className="grid min-h-[24rem] content-start gap-4 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
                Your Collector Space
              </p>
              <h2 className="mt-1 text-base font-medium leading-tight text-[var(--sparkle-plum-deep)]">
                My Collection Preview
              </h2>
            </div>
            <span className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-blush-bg)] px-3 py-1 text-xs font-bold text-[var(--sparkle-ink-muted)]">
              All your sparkle, in one place.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {collectionItems.slice(0, 6).map((item) => (
              <CollectionPreviewCard key={item.id} item={item} />
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.75fr)]">
            <div className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] p-4">
              <h3 className="text-sm font-black uppercase tracking-[0.14em] text-[var(--sparkle-ink-muted)]">Collection next steps</h3>
              <div className="mt-3 grid gap-2">
                <FeatureLine>Highlight rare owned pieces for your Sparkle Showcase.</FeatureLine>
                <FeatureLine>Mark pieces you are looking for so Nic-Nac has a clear target.</FeatureLine>
                <FeatureLine>Use clean light-box photos before Showcase Studio review.</FeatureLine>
              </div>
            </div>
            <div className="grid content-start gap-2">
              <CommandLink href="/library" icon={Search} label="Find a library piece" />
              <CommandLink href="/silver#add-to-sparkle-showcase" icon={Sparkles} label="Build Showcase" />
              <CommandLink href="/silver#showcase-studio" icon={Camera} label="Open Showcase Studio" />
              <CommandLink href="/photo-setup" icon={BookOpen} label="Photo setup guide" />
            </div>
          </div>
        </article>

        <FindThisForMe accountState={nicNacAccountState} compact jewelryItemId={nicNacPreviewItemId} />
      </div>
    </section>
  );
}

function ProfileMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gem;
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex min-h-16 items-center gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white p-3">
      <Icon aria-hidden="true" className="size-5 shrink-0 text-[var(--sparkle-coral)]" strokeWidth={1.7} />
      <div>
        <p className="text-base font-bold leading-none text-[var(--sparkle-plum-deep)]">{value}</p>
        <p className="mt-1 text-xs leading-4 text-[var(--sparkle-ink-muted)]">{label}</p>
      </div>
    </div>
  );
}

function FeatureLine({ children }: { children: string }) {
  return (
    <p className="flex items-start gap-2 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
      <CheckCircle2 aria-hidden="true" className="mt-1 size-4 shrink-0 text-[var(--sparkle-coral)]" />
      <span>{children}</span>
    </p>
  );
}

function CommandLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Search;
  label: string;
}) {
  return (
    <Link
      className="inline-flex min-h-11 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-black text-[var(--sparkle-plum)] transition hover:bg-[var(--sparkle-paper-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
      href={href}
    >
      <Icon aria-hidden="true" className="size-4 text-[var(--sparkle-coral)]" />
      {label}
    </Link>
  );
}

function CollectionPreviewCard({ item }: { item: SilverCollectionPreviewItem }) {
  const gemColorByLabel = {
    diamond: "#8fcfd5",
    unicorn: "#c37ac6",
    standard: "#e8899d",
  } satisfies Record<SilverCollectionPreviewItem["jewelryItem"]["bpLabel"], string>;

  return (
    <Link
      aria-label={`${item.jewelryItem.name} from ${item.jewelryItem.collectionName}`}
      className="group grid min-h-[10.25rem] content-start rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] p-2 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[var(--sparkle-shadow-sm)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
      href={`/library/${item.jewelryItemId}`}
    >
      <div
        className="sparkle-jewel-tile grid aspect-[4/3] place-items-center rounded-[var(--sparkle-radius-sm)] border border-[rgba(239,201,201,0.72)] bg-[linear-gradient(135deg,#fffefd,#fff3f0)]"
        style={{ "--gem-color": gemColorByLabel[item.jewelryItem.bpLabel] } as CSSProperties}
      >
        <span
          aria-hidden="true"
          className="sparkle-jewel-piece"
          data-kind={item.jewelryItem.jewelryType}
        />
      </div>
      <div className="mt-2 flex items-start justify-between gap-2">
        {item.isHighlighted ? <ShieldCheck aria-hidden="true" className="size-5 shrink-0 text-[var(--sparkle-coral)]" /> : null}
      </div>
      <div className="mt-1 flex flex-wrap gap-2">
        <StateBadge state={item.state} />
        {item.isHighlighted ? <span className="rounded border border-[#e7be77] bg-[#fff3cf] px-2 py-1 text-[0.68rem] font-bold leading-none text-[#704b11]">Featured</span> : null}
      </div>
    </Link>
  );
}

function StateBadge({ state }: { state: CollectionItem["state"] }) {
  const labelByState: Record<CollectionItem["state"], string> = {
    owned: "Owned",
    private_note_only: "Private note",
    wishlist: "Wishlist",
  };

  const toneByState: Record<CollectionItem["state"], string> = {
    owned: "border-[#a8d8d1] bg-[#e5fbf6] text-[#0f665d]",
    private_note_only: "border-[var(--sparkle-border)] bg-[var(--sparkle-blush-bg)] text-[var(--sparkle-ink-muted)]",
    wishlist: "border-[#efb5c7] bg-[#fff0f5] text-[var(--sparkle-plum)]",
  };

  return <span className={`rounded border px-2 py-1 text-xs font-bold leading-none ${toneByState[state]}`}>{labelByState[state]}</span>;
}

function getInitials(displayName: string): string {
  return displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
