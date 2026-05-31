import type { Metadata } from "next";
import Link from "next/link";
import {
  affiliateIssueReportEmail,
  affiliateIssueReportHref,
  affiliateIssueReportLabel,
  affiliateLinkLabelCopy,
  affiliateReviewActionCopy,
  amazonAssociateDisclosure,
} from "@/lib/sparkle-finder/affiliate-copy";

export const metadata: Metadata = {
  title: "Affiliate Disclosure | Sparkle Finder",
  description: "How Sparkle Finder handles affiliate links, disclosures, and product issue reports.",
};

export default function AffiliateDisclosurePage() {
  return (
    <main className="min-h-screen bg-[var(--sparkle-warm-bg)] px-5 py-10 sm:px-8 lg:px-10">
      <section className="mx-auto grid max-w-4xl gap-8">
        <div className="grid gap-4">
          <Link className="w-fit text-sm font-bold text-[var(--sparkle-plum)] underline-offset-4 hover:underline" href="/">
            Back to Sparkle Finder
          </Link>
          <div className="grid gap-3">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--sparkle-coral)]">
              Credibility first
            </p>
            <h1 className="font-[var(--font-playfair)] text-4xl font-semibold text-[var(--sparkle-plum-deep)]">
              Affiliate Disclosure
            </h1>
            <p className="max-w-3xl text-base leading-7 text-[var(--sparkle-ink-muted)]">
              Sparkle Finder is a discovery hub, not a jewelry marketplace. We may organize categories of useful
              collector and livestream supplies, but we do not sell jewelry, process transactions between customers,
              publish live retailer prices, copy retailer reviews, or represent that a product is right for every person.
            </p>
          </div>
        </div>

        <div className="grid gap-5 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-6 shadow-[var(--sparkle-shadow-sm)]">
          <h2 className="font-[var(--font-playfair)] text-2xl font-semibold text-[var(--sparkle-plum-deep)]">
            How Affiliate Links Work
          </h2>
          <p className="text-base leading-7 text-[var(--sparkle-ink-muted)]">
            If Sparkle Finder includes a retailer affiliate link, Sparkle Suite may earn a commission when you make a
            qualifying purchase after using that link. That potential commission does not make the retailer, product, or
            company an official Sparkle Suite partner, and it does not change the goal of this page: help collectors
            discover supply categories carefully.
          </p>
          <p className="text-base font-bold leading-7 text-[var(--sparkle-plum-deep)]">{amazonAssociateDisclosure}</p>
          <p className="text-base leading-7 text-[var(--sparkle-ink-muted)]">
            Amazon affiliate links should use the required associate statement above. Link-level disclosure should also
            be clear and conspicuous, close to the recommendation, and visible near the link, using wording such as{" "}
            {affiliateLinkLabelCopy}.
          </p>
        </div>

        <div className="grid gap-5 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-6 shadow-[var(--sparkle-shadow-sm)]">
          <h2 className="font-[var(--font-playfair)] text-2xl font-semibold text-[var(--sparkle-plum-deep)]">
            Bomb Party Relationship
          </h2>
          <p className="text-base leading-7 text-[var(--sparkle-ink-muted)]">
            Sparkle Finder and Sparkle Suite are not officially affiliated with Bomb Party. Bomb Party names and labels
            may appear only as collector-facing reference terms where they help people understand what they are browsing.
          </p>
        </div>

        <div className="grid gap-5 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-6 shadow-[var(--sparkle-shadow-sm)]">
          <h2 className="font-[var(--font-playfair)] text-2xl font-semibold text-[var(--sparkle-plum-deep)]">
            {affiliateIssueReportLabel}
          </h2>
          <p className="text-base leading-7 text-[var(--sparkle-ink-muted)]">
            Customers and reps can email{" "}
            <a className="font-bold text-[var(--sparkle-plum)] underline-offset-4 hover:underline" href={affiliateIssueReportHref}>
              {affiliateIssueReportEmail}
            </a>{" "}
            about a product, retailer, brand, or company concern. Because there is no automated reporting workflow yet,
            email is the review path. Sparkle Finder can then {affiliateReviewActionCopy}.
          </p>
        </div>
      </section>
    </main>
  );
}
