import Link from "next/link";
import type { CSSProperties } from "react";
import { Crown, Gem, Heart, MapPin, ShieldCheck } from "lucide-react";
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
  const wishlistCount = collectionItems.filter((item) => item.state === "wishlist").length;

  return (
    <section
      className="border-b border-[var(--sparkle-border-strong)] bg-[rgba(255,254,253,0.96)]"
      data-smoke="silver"
      id="silver"
    >
      <div className="mx-auto grid max-w-[112rem] gap-4 px-5 py-4 sm:px-8 lg:grid-cols-[19.5rem_minmax(0,1fr)_24rem] lg:items-stretch lg:px-10">
        <article className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-4 shadow-[var(--sparkle-shadow-sm)]">
          <div className="mb-3 flex items-center gap-3 text-[var(--sparkle-ink-muted)]">
            <Crown aria-hidden="true" className="size-6 text-[var(--sparkle-plum)]" strokeWidth={1.6} />
            <h2 className="font-[var(--font-playfair)] text-[1.35rem] font-semibold leading-tight">Silver Membership</h2>
          </div>

          <div className="flex gap-4 border-b border-[var(--sparkle-border)] pb-3">
            <div
              aria-label={`${customer.displayName} avatar`}
              className="grid size-[4.5rem] shrink-0 place-items-center rounded-full border border-[var(--sparkle-border)] bg-[linear-gradient(135deg,#fff8f5,#eeeeee)] font-[var(--font-playfair)] text-2xl font-semibold text-[var(--sparkle-plum)] shadow-inner"
            >
              {getInitials(customer.displayName)}
            </div>
            <div className="min-w-0 pt-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h3 className="truncate font-[var(--font-playfair)] text-lg font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
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

          <div className="grid grid-cols-2 gap-3 py-3">
            <ProfileMetric icon={Gem} label="Collection" value={collectionItems.length} />
            <ProfileMetric icon={Heart} label="Wishlist / watchlist" value={wishlistCount} />
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
              Silver profile preview
            </span>
          )}
        </article>

        <article className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-4 shadow-[var(--sparkle-shadow-sm)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-[var(--font-playfair)] text-2xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
                Your Silver Collector Space
              </p>
              <h2 className="mt-1 text-base font-medium leading-tight text-[var(--sparkle-plum-deep)]">
                My Collection Preview
              </h2>
            </div>
            <span className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-blush-bg)] px-3 py-1 text-xs font-bold text-[var(--sparkle-ink-muted)]">
              All your sparkle, in one place.
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {collectionItems.slice(0, 6).map((item) => (
              <CollectionPreviewCard key={item.id} item={item} />
            ))}
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
  value: number;
}) {
  return (
    <div className="flex min-h-14 items-center gap-3">
      <Icon aria-hidden="true" className="size-5 shrink-0 text-[var(--sparkle-coral)]" strokeWidth={1.7} />
      <div>
        <p className="text-base font-bold leading-none text-[var(--sparkle-plum-deep)]">{value}</p>
        <p className="mt-1 text-xs leading-4 text-[var(--sparkle-ink-muted)]">{label}</p>
      </div>
    </div>
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
      className="group rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] p-2 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[var(--sparkle-shadow-sm)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
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
      <div className="sr-only">
        <h3>{item.jewelryItem.name}</h3>
        <p>{item.jewelryItem.collectionName}</p>
      </div>
      <div className="mt-2 flex items-start justify-between gap-2">
        {item.isHighlighted ? <ShieldCheck aria-hidden="true" className="size-5 shrink-0 text-[var(--sparkle-coral)]" /> : null}
      </div>
      <div className="mt-1 flex flex-wrap gap-2">
        <StateBadge state={item.state} />
        {item.isHighlighted ? <span className="rounded border border-[#e7be77] bg-[#fff3cf] px-3 py-1 text-xs font-bold text-[#704b11]">Highlighted</span> : null}
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

  return <span className={`rounded border px-3 py-1 text-xs font-bold ${toneByState[state]}`}>{labelByState[state]}</span>;
}

function getInitials(displayName: string): string {
  return displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
