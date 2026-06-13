import Link from "next/link";
import {
  BadgeCheck,
  Box,
  Camera,
  Gift,
  Headphones,
  Heart,
  LampDesk,
  PackageCheck,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SparkleFinderFooter } from "@/components/layout/SparkleFinderFooter";
import { SparkleFinderNav } from "@/components/layout/SparkleFinderNav";
import {
  affiliateDisclosureHref,
  affiliateIssueReportEmail,
  affiliateIssueReportHref,
  affiliateIssueReportLabel,
  affiliateLinkLabelCopy,
  affiliateReviewActionCopy,
  amazonAssociateDisclosure,
} from "@/lib/sparkle-finder/affiliate-copy";
import { getAffiliateProductRecommendations, getAffiliateShopItems } from "@/lib/sparkle-finder/service";
import type { AffiliateProductRecommendation, AffiliateShopItem } from "@/lib/sparkle-finder/types";

type Need = {
  title: string;
  body: string;
  href: string;
  icon: LucideIcon;
};

type RecommendationSlot = {
  title: string;
  category: string;
  lane: "Collectors" | "Reps";
  why: string;
  status: "Researching picks" | "Louis review required";
  icon: LucideIcon;
};

const needs: Need[] = [
  {
    title: "Clean & maintain jewelry",
    body: "Gentle care supplies for keeping pieces photo-ready.",
    href: "#collector-care",
    icon: Sparkles,
  },
  {
    title: "Store a collection",
    body: "Trays, cases, and organizers for growing collections.",
    href: "#collector-storage",
    icon: Box,
  },
  {
    title: "Display favorites",
    body: "Simple ways to show pieces while Sparkle Finder stays focused on discovery.",
    href: "#collector-display",
    icon: Heart,
  },
  {
    title: "Photograph pieces",
    body: "Lighting and small setup basics for clearer collection photos.",
    href: "#collector-photo",
    icon: Camera,
  },
  {
    title: "Build a live setup",
    body: "Lights, mounts, mics, and phone gear for smoother shows.",
    href: "#rep-live",
    icon: Headphones,
  },
  {
    title: "Pack and ship orders",
    body: "Supplies that support rep operations without fulfillment promises.",
    href: "#rep-shipping",
    icon: Truck,
  },
];

const recommendationSlots: RecommendationSlot[] = [
  {
    title: "Soft cleaning cloth set",
    category: "Jewelry care",
    lane: "Collectors",
    why: "Useful for everyday shine and collection photos without making care guarantees.",
    status: "Louis review required",
    icon: Sparkles,
  },
  {
    title: "Stackable ring tray or organizer",
    category: "Storage & Display",
    lane: "Collectors",
    why: "Helps collectors sort pieces by collection, color, type, or wishlist priority.",
    status: "Researching picks",
    icon: Box,
  },
  {
    title: "Small jewelry travel case",
    category: "Travel & gifting",
    lane: "Collectors",
    why: "A practical option for keeping pieces protected for travel, gifting, or swaps.",
    status: "Researching picks",
    icon: Gift,
  },
  {
    title: "Compact photo light box",
    category: "Photo setup",
    lane: "Collectors",
    why: "Worth reviewing for clearer collection photos without promising professional results.",
    status: "Researching picks",
    icon: Camera,
  },
  {
    title: "Compact ring light or panel light",
    category: "Livestream lighting",
    lane: "Reps",
    why: "Better visibility can make live shows easier for customers to follow.",
    status: "Louis review required",
    icon: LampDesk,
  },
  {
    title: "Adjustable phone tripod",
    category: "Phone & tech",
    lane: "Reps",
    why: "A stable phone setup is one of the simplest upgrades for a live show table.",
    status: "Researching picks",
    icon: Smartphone,
  },
  {
    title: "USB microphone starter option",
    category: "Audio",
    lane: "Reps",
    why: "Clearer audio helps viewers understand reveals, queues, and show flow.",
    status: "Researching picks",
    icon: Headphones,
  },
  {
    title: "Thermal label printer or label supplies",
    category: "Shipping workflow",
    lane: "Reps",
    why: "Can support a cleaner packing flow while Sparkle Suite stays out of fulfillment.",
    status: "Researching picks",
    icon: PackageCheck,
  },
];

const laneSummaries = [
  {
    title: "Collector Essentials",
    body: "Care, storage, display, travel, gifting, and photo-ready setup categories for people building a collection.",
    icon: Heart,
  },
  {
    title: "Rep Essentials",
    body: "Livestream, phone, audio, lighting, shipping, and table setup categories for reps running shows.",
    icon: BadgeCheck,
  },
];

export default function ShopPage() {
  const affiliateShopItems = getAffiliateShopItems();
  const productRecommendations = getAffiliateProductRecommendations();
  const collectorSlots = recommendationSlots.filter((slot) => slot.lane === "Collectors");
  const repSlots = recommendationSlots.filter((slot) => slot.lane === "Reps");

  return (
    <>
      <SparkleFinderNav variant="public" />
      <main className="min-h-screen bg-[var(--sparkle-warm-bg)]">
        <div className="mx-auto max-w-[112rem] px-5 py-8 sm:px-8 lg:px-10">
          <ShopPageContent
            affiliateShopItems={affiliateShopItems}
            collectorSlots={collectorSlots}
            productRecommendations={productRecommendations}
            repSlots={repSlots}
          />
        </div>
      </main>
      <SparkleFinderFooter />
    </>
  );
}

export function renderShopPageContent({
  affiliateShopItems = getAffiliateShopItems(),
  productRecommendations = getAffiliateProductRecommendations(),
}: {
  affiliateShopItems?: AffiliateShopItem[];
  productRecommendations?: AffiliateProductRecommendation[];
}) {
  const collectorSlots = recommendationSlots.filter((slot) => slot.lane === "Collectors");
  const repSlots = recommendationSlots.filter((slot) => slot.lane === "Reps");

  return (
    <ShopPageContent
      affiliateShopItems={affiliateShopItems}
      collectorSlots={collectorSlots}
      productRecommendations={productRecommendations}
      repSlots={repSlots}
    />
  );
}

function ShopPageContent({
  affiliateShopItems,
  collectorSlots,
  productRecommendations,
  repSlots,
}: {
  affiliateShopItems: AffiliateShopItem[];
  collectorSlots: RecommendationSlot[];
  productRecommendations: AffiliateProductRecommendation[];
  repSlots: RecommendationSlot[];
}) {
  return (
    <section className="sparkle-shop grid gap-8 px-4 py-5 sm:px-6 sm:py-7 lg:px-8" data-smoke="shop-store">
      <div className="sparkle-shop-hero grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:p-8">
        <div className="grid gap-5">
          <div className="grid gap-3">
            <div className="flex items-center gap-3">
              <span className="sparkle-shop-rule" />
              <span className="sparkle-shop-eyebrow">Shop</span>
            </div>
            <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-tight sm:text-5xl">
              Collector & Rep Essentials
            </h1>
            <p className="max-w-3xl text-base leading-7 text-[var(--ss-shop-muted)]">
              This is the Sparkle Finder shop. We recommend useful products, explain why they fit, and label affiliate
              links clearly before you click. Exact products stay off the page until Louis approves the listing,
              placement, disclosure, and trust copy.
            </p>
          </div>

          <div className="flex flex-wrap gap-2" aria-label="Shop sections">
            {["Collectors", "Reps", "Livestream", "Shipping", "All"].map((label, index) => (
              <a
                className={`sparkle-shop-tab inline-flex min-h-10 items-center rounded-full px-4 text-sm font-bold ${
                  index === 0
                    ? "sparkle-shop-tab-primary"
                    : "sparkle-shop-tab-secondary"
                }`}
                href={index === 0 ? "#collector-care" : index === 1 ? "#rep-live" : index === 2 ? "#rep-live" : index === 3 ? "#rep-shipping" : "#all-picks"}
                key={label}
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        <aside className="sparkle-shop-trust grid content-start gap-4 p-5">
          <ShieldCheck aria-hidden="true" className="size-9 text-[var(--ss-shop-soft-pink)]" strokeWidth={1.8} />
          <div className="grid gap-2">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight text-[#fff2ea]">
              Honest affiliate shopping
            </h2>
            <p className="text-sm leading-6 text-[rgba(246,231,218,0.78)]">
              {affiliateLinkLabelCopy} means Sparkle Finder may earn a commission. Approved retailer links will open in
              a new tab, and weak products should not make it through review.
            </p>
          </div>
          <div className="grid gap-2 text-sm font-bold">
            <Link className="text-[var(--ss-shop-soft-pink)] underline-offset-4 hover:underline" href={affiliateDisclosureHref}>
              Affiliate disclosure
            </Link>
            <a className="text-[var(--ss-shop-soft-pink)] underline-offset-4 hover:underline" href={affiliateIssueReportHref}>
              {affiliateIssueReportLabel}
            </a>
          </div>
        </aside>
      </div>

      <section className="grid gap-4" aria-labelledby="shop-by-need">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold" id="shop-by-need">
              Shop by need
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--ss-shop-muted)]">
              Start with the job you are trying to solve, then review the product category before any exact pick goes
              live.
            </p>
          </div>
          <span className="sparkle-shop-chip rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.16em]">
            No live product links yet
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {needs.map((need) => {
            const Icon = need.icon;

            return (
              <a
                className="sparkle-shop-need group grid min-h-32 gap-3 p-5"
                href={need.href}
                key={need.title}
              >
                <Icon aria-hidden="true" className="size-7 text-[var(--ss-shop-pink)]" strokeWidth={1.8} />
                <div>
                  <h3 className="text-base font-bold">{need.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--ss-shop-muted)]">{need.body}</p>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4" id="all-picks" aria-labelledby="recommendation-lanes">
        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold" id="recommendation-lanes">
            Recommendation lanes
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--ss-shop-muted)]">
            The shop can feel like a normal store while staying careful: category first, product reason second, affiliate
            link only after approval.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {laneSummaries.map((lane) => {
            const Icon = lane.icon;

            return (
              <article className="sparkle-shop-lane grid gap-4 p-5" key={lane.title}>
                <div className="flex items-start gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[var(--ss-shop-paper-warm)] text-[var(--ss-shop-pink)]">
                    <Icon aria-hidden="true" className="size-6" strokeWidth={1.8} />
                  </span>
                  <div>
                    <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">{lane.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--ss-shop-muted)]">{lane.body}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4" aria-labelledby="approved-product-picks">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold" id="approved-product-picks">
              Approved product picks
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--ss-shop-muted)]">
              Exact affiliate links only become clickable after the product, retailer, placement, disclosure, and trust
              copy clear Louis review.
            </p>
          </div>
          <Link className="text-sm font-bold text-[var(--ss-shop-pink)] underline-offset-4 hover:underline" href={affiliateDisclosureHref}>
            Affiliate Disclosure
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {productRecommendations.map((product) => (
            <AffiliateProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <ShopLane
        description="For collectors who want practical supplies for care, organization, display, gifting, and photos."
        id="collector-care"
        secondaryIds={["collector-storage", "collector-display", "collector-photo"]}
        slots={collectorSlots}
        title="Collector Essentials"
      />
      <ShopLane
        description="For reps who want a cleaner show setup, clearer stream, and more organized packing workflow."
        id="rep-live"
        secondaryIds={["rep-shipping"]}
        slots={repSlots}
        title="Rep Essentials"
      />

      <section className="sparkle-shop-index grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:p-6">
        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">Current category index</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--ss-shop-muted)]">
            These are the current shop categories from the affiliate tracker. They are planning categories, not approved
            exact product recommendations.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {affiliateShopItems.map((item) => (
            <div className="sparkle-shop-mini px-4 py-3" key={item.id}>
              <div className="text-sm font-bold">{item.title}</div>
              <div className="text-xs leading-5 text-[var(--ss-shop-muted)]">{item.body}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="grid gap-3 border-t border-[var(--ss-shop-hairline)] pt-5 text-xs leading-5 text-[var(--ss-shop-muted)]">
        <p>
          {amazonAssociateDisclosure} Future retailer links may be affiliate links and should be labeled near the link as{" "}
          {affiliateLinkLabelCopy}.
        </p>
        <p>
          {affiliateIssueReportLabel}: email{" "}
          <a className="font-bold text-[var(--ss-shop-ink)] underline-offset-4 hover:underline" href={affiliateIssueReportHref}>
            {affiliateIssueReportEmail}
          </a>{" "}
          so Sparkle Finder can {affiliateReviewActionCopy}.
        </p>
      </footer>
    </section>
  );
}

function AffiliateProductCard({ product }: { product: AffiliateProductRecommendation }) {
  const isLive = product.status === "live" && product.affiliateUrl;
  const isAmazon = product.retailerProgram.toLowerCase().includes("amazon");

  return (
    <article className="sparkle-shop-rec grid min-h-[25rem] content-start gap-4 p-5">
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ss-shop-tertiary)]">
            {product.lane === "collector" ? "Collectors" : "Reps"} / {product.category}
          </p>
          <span className="sparkle-shop-status rounded-full px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em]">
            {formatAffiliateStatus(product.status)}
          </span>
        </div>
        <h3 className="text-lg font-bold leading-6">{product.title}</h3>
        <p className="text-sm leading-6 text-[var(--ss-shop-muted)]">{product.shortDescription}</p>
      </div>

      <p className="text-sm leading-6 text-[var(--ss-shop-muted)]">
        <strong className="text-[var(--ss-shop-ink)]">Why it helps:</strong> {product.whyItHelps}
      </p>

      <div className="grid gap-2 text-xs leading-5 text-[var(--ss-shop-muted)]">
        <p>
          <strong className="text-[var(--ss-shop-ink)]">Retailer/program:</strong> {product.retailerProgram}
        </p>
        <p>
          <strong className="text-[var(--ss-shop-ink)]">Placement:</strong> {product.placement}
        </p>
        {product.approvedByLouisAt ? (
          <p className="font-bold text-[var(--ss-shop-ink)]">
            Approved by Louis on {formatApprovalDate(product.approvedByLouisAt)}
          </p>
        ) : null}
      </div>

      <div className="mt-auto grid gap-3">
        {isLive ? (
          <a
            className="sparkle-shop-live-link inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-bold"
            href={product.affiliateUrl}
            rel="sponsored noopener noreferrer"
            target="_blank"
          >
            Open paid link
          </a>
        ) : (
          <button
            className="sparkle-shop-disabled-link inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-full px-4 text-sm font-bold"
            disabled
            type="button"
          >
            Affiliate link after approval
          </button>
        )}

        <div className="grid gap-2 text-xs leading-5 text-[var(--ss-shop-muted)]">
          <p>{product.disclosure}</p>
          {isAmazon ? <p>{amazonAssociateDisclosure}</p> : null}
          <p>
            {product.trustCopy}{" "}
            <a className="font-bold text-[var(--ss-shop-ink)] underline-offset-4 hover:underline" href={affiliateIssueReportHref}>
              {affiliateIssueReportLabel}
            </a>
            .
          </p>
        </div>
      </div>
    </article>
  );
}

function formatAffiliateStatus(status: AffiliateProductRecommendation["status"]): string {
  const labels: Record<AffiliateProductRecommendation["status"], string> = {
    approved: "Approved",
    live: "Live",
    needs_louis_review: "Louis review required",
    paused: "Paused",
    research: "Researching picks",
  };

  return labels[status];
}

function formatApprovalDate(dateText: string): string {
  const [year, month, day] = dateText.split("-").map(Number);

  if (!year || !month || !day) {
    return dateText;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function ShopLane({
  description,
  id,
  secondaryIds,
  slots,
  title,
}: {
  description: string;
  id: string;
  secondaryIds: string[];
  slots: RecommendationSlot[];
  title: string;
}) {
  return (
    <section className="grid gap-4" id={id} aria-labelledby={`${id}-heading`}>
      {secondaryIds.map((secondaryId) => (
        <span aria-hidden="true" id={secondaryId} key={secondaryId} />
      ))}
      <div>
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-semibold" id={`${id}-heading`}>
          {title}
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--ss-shop-muted)]">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {slots.map((slot) => (
          <RecommendationCard key={slot.title} slot={slot} />
        ))}
      </div>
    </section>
  );
}

function RecommendationCard({ slot }: { slot: RecommendationSlot }) {
  const Icon = slot.icon;

  return (
    <article className="sparkle-shop-rec grid min-h-[22rem] content-start gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--ss-shop-paper-warm)] text-[var(--ss-shop-pink)]">
          <Icon aria-hidden="true" className="size-6" strokeWidth={1.8} />
        </span>
        <span className="sparkle-shop-status rounded-full px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em]">
          {slot.status}
        </span>
      </div>
      <div className="grid gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--ss-shop-tertiary)]">{slot.category}</p>
        <h3 className="text-lg font-bold leading-6">{slot.title}</h3>
        <p className="text-sm leading-6 text-[var(--ss-shop-muted)]">
          <strong className="text-[var(--ss-shop-ink)]">Why it helps:</strong> {slot.why}
        </p>
      </div>
      <div className="mt-auto grid gap-3">
        <button
          className="sparkle-shop-disabled-link inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-full px-4 text-sm font-bold"
          disabled
          type="button"
        >
          Affiliate link after approval
        </button>
        <p className="text-xs leading-5 text-[var(--ss-shop-muted)]">
          Affiliate pick. Tell us if this product or company gives you trouble.
        </p>
      </div>
    </article>
  );
}
