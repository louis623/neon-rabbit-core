import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHubChrome } from "../../app/(hub)/layout";
import PrivacyPolicyPage from "../../app/privacy-policy/page";
import TermsAndConditionsPage from "../../app/terms-and-conditions/page";
import { renderHomeContent, renderPublicHomeContent } from "../../app/page";
import { renderAccountPageContent } from "../../app/account/page";
import { renderDashboardPageContent } from "../../app/(hub)/dashboard/page";
import { renderItemDetailPageContent } from "../../app/(hub)/library/[itemId]/page";
import { renderLibraryPageContent } from "../../app/(hub)/library/page";
import { renderLiveShowsPageContent } from "../../app/(hub)/live-shows/page";
import RepBoardsPage from "../../app/(hub)/rep-boards/page";
import PhotoSetupPage, { renderPhotoSetupPageContent } from "../../app/photo-setup/page";
import { renderSignInPageContent } from "../../app/auth/sign-in/page";
import { renderSignUpPageContent } from "../../app/auth/sign-up/page";
import { GET as previewAuthGET } from "../../app/auth/preview/[mode]/route";
import { renderSilverPageContent } from "../../app/(hub)/silver/page";
import type { CurrentSparkleFinderAccountState } from "../../lib/sparkle-finder/account-service";
import type { FinderAvailabilityResult, FinderLiveShow } from "../../lib/sparkle-finder/catalog-service";
import type { JewelryItem } from "../../lib/sparkle-finder/types";
import { getLocalDevAuthState } from "../../lib/sparkle-finder/auth";
import { findSparkleFinderCopyViolations } from "../../lib/sparkle-finder/copy-guardrails";
import {
  getLocalRepBoardHref,
  getLocalRepHref,
  getSparkleSuiteRepBoardHref,
  getSparkleSuiteRepHref,
} from "../../lib/sparkle-finder/route-hrefs";
import {
  sparkleFinderLegalFooterLinks,
  sparkleFinderPrivacyPolicyDocument,
  sparkleFinderTermsAndConditionsDocument,
} from "../../lib/sparkle-finder/legal-content";

const routes = [
  ["dashboard", () => renderToStaticMarkup(renderDashboardPageContent())],
  ["library", () => renderToStaticMarkup(renderLibraryPageContent())],
  ["live-shows", () => renderToStaticMarkup(renderLiveShowsPageContent(finderLiveShowItems()))],
  ["rep-boards", () => renderToStaticMarkup(createElement(RepBoardsPage))],
  ["silver", () => renderToStaticMarkup(renderSilverPageContent(getLocalDevAuthState("silver")))],
] as const;

const publicRoutes = [
  ["photo-setup", () => renderToStaticMarkup(createElement(PhotoSetupPage))],
] as const;

describe("Sparkle Finder hub routes", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders the shared hub shell around dashboard content", () => {
    const markup = renderToStaticMarkup(
      renderHubChrome(renderDashboardPageContent(), getLocalDevAuthState("silver")),
    );

    expect(markup).toContain("Sparkle Finder");
    expect(markup).toContain("Finder Dashboard");
    expect(markup).toContain("/library");
    expect(markup).toContain("/rep-boards");
    expect(markup).toContain("/live-shows");
    expect(markup).not.toContain("/shop");
  });

  it("renders app navigation in a hub mobile menu with logout for signed-in visitors", () => {
    const markup = renderToStaticMarkup(
      renderHubChrome(renderDashboardPageContent(), getLocalDevAuthState("silver")),
    );

    expect(markup).toContain("sparkle-finder-mobile-menu");
    expect(markup).toContain("<summary");
    expect(markup).toContain(">Menu<");
    expect(markup).toContain('href="/library"');
    expect(markup).toContain('href="/live-shows"');
    expect(markup).toContain('href="/rep-boards"');
    expect(markup).not.toContain('href="/shop"');
    expect(markup).toContain('href="/auth/sign-out"');
    expect(markup).toContain(">Log Out<");
  });

  it("shows a sign-in wall for anonymous hub visitors", () => {
    const markup = renderToStaticMarkup(
      renderHubChrome(renderDashboardPageContent(), getLocalDevAuthState("anonymous")),
    );

    expect(markup).toContain("Create a free Sparkle Finder account to open this tool.");
    expect(markup).toContain("/auth/sign-up");
    expect(markup).toContain("/auth/sign-in");
    expect(markup).not.toContain("Finder Dashboard");
  });

  it("labels the anonymous header account link as Sign In", () => {
    const markup = renderToStaticMarkup(
      renderHubChrome(renderDashboardPageContent(), getLocalDevAuthState("anonymous")),
    );

    expect(markup).toContain('href="/auth/sign-in"');
    expect(markup).toContain(">Sign In<");
    expect(markup).not.toContain(">Guest<");
  });

  it("renders the shared Sparkle Finder footer with Sparkle Suite links", () => {
    const publicMarkup = renderToStaticMarkup(renderPublicHomeContent(anonymousRouteAccountState()));
    const hubMarkup = renderToStaticMarkup(
      renderHubChrome(renderDashboardPageContent(), getLocalDevAuthState("anonymous")),
    );

    for (const markup of [publicMarkup, hubMarkup]) {
      expect(markup).toContain('class="sparkle-finder-site-footer"');
      expect(markup).toContain("Sparkle Finder");
      expect(markup).toContain("Footer links");
      expect(markup).toContain('href="/account"');
      expect(markup).not.toContain('href="/affiliate-disclosure"');
      expect(markup).toContain('href="/privacy-policy"');
      expect(markup).toContain(">Privacy Policy<");
      expect(markup).toContain('href="/terms-and-conditions"');
      expect(markup).toContain(">Terms and Conditions<");
      expect(markup).toContain('href="https://www.yoursparklesuite.com"');
      expect(markup).toContain(">Sparkle Suite<");
      expect(markup).toContain('class="sparkle-finder-site-footer__nav"');
      expect(markup).toContain('class="sparkle-finder-site-footer__brand-stack"');
      expect(markup).toContain('aria-label="Sparkle Finder social links"');
      expect(markup).toContain('href="https://www.tiktok.com/@yoursparklesuite"');
      expect(markup).toContain('aria-label="Sparkle Finder on TikTok"');
      expect(markup).toContain('class="sparkle-finder-site-footer__social-bubble"');
      expect(markup).not.toContain(">TikTok<");
      expect(markup).toContain('href="https://www.youtube.com/@yoursparklesuite"');
      expect(markup).toContain('aria-label="Sparkle Finder on YouTube"');
      expect(markup).not.toContain(">YouTube<");
      expect(markup).not.toContain(">Social<");
      expect(markup).toContain('href="https://neonrabbit.net"');
      expect(markup).toContain("Sparkle Finder is powered by Neon Rabbit Digital Services.");
    }
  });

  it("defines Sparkle Finder legal documents with customer-specific coverage", () => {
    expect(sparkleFinderLegalFooterLinks).toEqual([
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/terms-and-conditions", label: "Terms and Conditions" },
    ]);

    expect(sparkleFinderPrivacyPolicyDocument.pageTitle).toBe("Privacy Policy");
    expect(sparkleFinderPrivacyPolicyDocument.seoTitle).toContain("Sparkle Finder Privacy Policy");
    expect(sparkleFinderPrivacyPolicyDocument.description).toContain("Sparkle Finder customer accounts");
    expect(sparkleFinderPrivacyPolicyDocument.sections.map((section) => section.title)).toEqual([
      "What This Policy Covers",
      "Information Sparkle Finder Collects",
      "How Sparkle Finder Uses Information",
      "Sparkle Suite Data And Rep Links",
      "Sparkle Showcase Sharing And Moderation",
      "SMS And Email Choices",
      "Data Sharing",
      "Data Retention",
      "Your Rights And Choices",
      "Security",
      "Children's Privacy",
      "Changes To This Policy",
      "Contact",
    ]);

    expect(sparkleFinderTermsAndConditionsDocument.pageTitle).toBe("Terms and Conditions");
    expect(sparkleFinderTermsAndConditionsDocument.seoTitle).toContain("Sparkle Finder Terms");
    expect(sparkleFinderTermsAndConditionsDocument.description).toContain("Sparkle Finder customer discovery hub");
    expect(sparkleFinderTermsAndConditionsDocument.sections.map((section) => section.title)).toEqual([
      "Agreement To These Terms",
      "About Sparkle Finder",
      "Customer Accounts And Silver Access",
      "Library, Live Shows, Rep Boards, And Availability",
      "Sparkle Showcase, Profile, And Watchlist Tools",
      "Follows, Comments, Reports, And Moderation",
      "Third-Party Product Resources",
      "Acceptable Use",
      "Privacy",
      "Third-Party Services",
      "Payments, Trials, And Billing",
      "No Sales, Escrow, Or Fulfillment",
      "No Guarantees",
      "Intellectual Property",
      "Disclaimer Of Warranties",
      "Limitation Of Liability",
      "Changes To These Terms",
      "Contact",
    ]);
  });

  it("renders Sparkle Finder legal pages with Finder-specific content", () => {
    const privacyMarkup = renderToStaticMarkup(createElement(PrivacyPolicyPage));
    const termsMarkup = renderToStaticMarkup(createElement(TermsAndConditionsPage));

    expect(privacyMarkup).toContain("Sparkle Finder Legal Center");
    expect(privacyMarkup).toContain("Privacy Policy");
    expect(privacyMarkup).toContain("Sparkle Finder customer accounts");
    expect(privacyMarkup).toContain("We do not sell personal information.");
    expect(privacyMarkup).not.toContain("Affiliate And Shop Information");
    expect(privacyMarkup).toContain("Back to Sparkle Finder");

    expect(termsMarkup).toContain("Sparkle Finder Legal Center");
    expect(termsMarkup).toContain("Terms and Conditions");
    expect(termsMarkup).toContain("No Sales, Escrow, Or Fulfillment");
    expect(termsMarkup).toContain("Third-Party Product Resources");
    expect(termsMarkup).toContain("Sparkle Finder is a discovery hub");
    expect(termsMarkup).toContain(
      "not owned by, operated by, endorsed by, sponsored by, or officially affiliated with Bomb Party",
    );
    expect(termsMarkup).toContain('href="/privacy-policy"');
  });

  it("renders the selected trust-first public landing for anonymous visitors", () => {
    const markup = renderToStaticMarkup(renderPublicHomeContent(anonymousRouteAccountState()));

    expect(markup).toContain("Sparkle Finder");
    expect(markup).toContain("Start free Silver trial");
    expect(markup).toContain("Sign in");
    expect(markup).toContain("Sparkle Finder public navigation");
    expect(markup).toContain('data-smoke="public-hero-editorial"');
    expect(markup).toContain("Find it, favorite it, show it off.");
    expect(markup).not.toContain("Collector-first discovery");
    expect(markup).toContain("How Sparkle Finder works");
    expect(markup).toContain("sparkle-home-primary-cta");
    expect(markup).toContain("bg-[var(--sparkle-rose)]");
    expect(markup).toContain("Find pieces you like.");
    expect(markup).toContain("Check rep trade boards.");
    expect(markup).toContain("Live show calendar.");
    expect(markup).toContain("Save and show off.");
    expect(markup).toContain("Included tools");
    expect((markup.match(/data-tone="espresso"/g) ?? []).length).toBe(2);
    expect((markup.match(/data-tone="light"/g) ?? []).length).toBe(2);
    expect(markup).not.toContain("What Sparkle Finder helps with");
    expect(markup).not.toContain("Public preview");
    expect(markup).not.toContain("Start with this");
    expect(markup).not.toContain("Sparkle Finder primary navigation");
    expect(markup).not.toContain('href="/library"');
    expect(markup).not.toContain('href="/live-shows"');
    expect(markup).not.toContain('href="/rep-boards"');
    expect(markup).not.toContain('href="/shop"');
    expect(markup).not.toContain('href="/auth/sign-up?next=/library"');
    expect(markup).not.toContain('href="/auth/sign-up?next=/live-shows"');
    expect(markup).not.toContain('href="/auth/sign-up?next=/rep-boards"');
    expect(markup).not.toContain('href="/auth/sign-up?next=/shop"');
    expect(markup).toContain("Master Jewelry Library");
    expect(markup).toContain("Live Show Calendar");
    expect(markup).toContain("Rep Trade Boards / Dance Floors");
    expect(markup).toContain("Collection Showcase");
    expect(markup).toContain("Photo-ready uploads");
    expect(markup).toContain("Find the pieces you like, see which reps have them on trade boards");
    expect(markup).toContain("Start with your 45-day Silver Tier trial");
    expect(markup).toContain("Silver opens the full collector workflow");
    expect(markup).toContain("$4.99/month");
    expect(markup).toContain("Show off pieces you already own with a digital collection.");
    expect(markup).toContain("Get Started");
    expect(markup).not.toContain(">Free tier<");
    expect(markup).not.toContain(">Silver tier<");
    expect(markup).not.toContain("Create free account");
  });

  it("renders the main homepage with app navigation for signed-in customers", () => {
    const markup = renderToStaticMarkup(renderHomeContent(getLocalDevAuthState("silver")));

    expect(markup).toContain("Sparkle Finder primary navigation");
    expect(markup).toContain('href="/library"');
    expect(markup).toContain('href="/live-shows"');
    expect(markup).toContain('href="/rep-boards"');
    expect(markup).not.toContain('href="/shop"');
    expect(markup).toContain('href="/photo-setup"');
    expect(markup).toContain('href="/account"');
    expect(markup).toContain(">Silver<");
    expect(markup).toContain("Today across Sparkle Suite");
    expect(markup).toContain("Your Silver Collector Space");
    expect(markup).toContain("Photo Setup Guide");
    expect(markup).not.toContain("Sparkle Finder public navigation");
    expect(markup).not.toContain("Start free Silver trial");
    expect(markup).not.toContain(">Sign in<");
  });

  it("renders public landing independence and avoids live/demo jewelry data", () => {
    const markup = renderToStaticMarkup(renderPublicHomeContent(anonymousRouteAccountState()));

    expect(markup.indexOf("Master Jewelry Library")).toBeLessThan(markup.indexOf("Independent discovery hub"));
    expect(markup).toContain("Built for collectors, independently.");
    expect(markup).toContain("Sparkle Finder organizes the hunt");
    expect(markup).toContain("Sparkle Finder is not Bomb Party, a Bomb Party affiliate, or a Bomb Party rep.");
    expect(markup).not.toContain("Rainbow Crown Ring");
    expect(markup).not.toContain("Celestial Lights Preview");
    expect(markup).not.toContain("Sierra Sparkle Studio");
    expect(markup).not.toContain("Add to collection");
    expect(markup).not.toContain("Nic-Nac, find this for me");
  });

  it.each(["dashboard", "library", "live-shows", "rep-boards", "silver"] as const)(
    "gates anonymous visitors before rendering %s hub content",
    (routeName) => {
      const [, renderRoute] = routes.find(([name]) => name === routeName)!;
      const markup = renderToStaticMarkup(
        renderHubChrome(createElement("div", { dangerouslySetInnerHTML: { __html: renderRoute() } }), getLocalDevAuthState("anonymous")),
      );

      expect(markup).toContain("Create a free Sparkle Finder account to open this tool.");
      expect(markup).toContain("/auth/sign-up");
      expect(markup).toContain("/auth/sign-in");
    },
  );

  it("renders library search and fixture-backed jewelry cards", () => {
    const markup = renderToStaticMarkup(renderLibraryPageContent());

    expect(markup).toContain("Search the Jewelry Library");
    expect(markup).toContain("Rainbow Crown Ring");
    expect(markup).toContain("Celestial Lights");
    expect(markup).toContain("/library/jewel-rainbow-crown-ring");
  });

  it("labels dashboard live show stats from the Finder API and board stats as preview data", () => {
    const markup = renderToStaticMarkup(renderDashboardPageContent(undefined, 3));

    expect(markup).toContain("Live/upcoming shows");
    expect(markup).toContain(">3<");
    expect(markup).toContain("Preview board listings");
  });

  it("labels rep boards as preview-backed and renders API-shaped live shows", () => {
    const repBoardsMarkup = renderToStaticMarkup(createElement(RepBoardsPage));
    const liveShowsMarkup = renderToStaticMarkup(renderLiveShowsPageContent(finderLiveShowItems()));

    expect(repBoardsMarkup).toContain("Preview board data");
    expect(liveShowsMarkup).toContain("Demo Glow Show");
    expect(liveShowsMarkup).toContain("Rep: Demo");
    expect(liveShowsMarkup).toContain("Visit Rep Site");
    expect(liveShowsMarkup).not.toContain("Preview calendar data");
  });

  it("preserves selected library filters and only shows matching records", () => {
    const markup = renderToStaticMarkup(
      renderLibraryPageContent(libraryFilterItems(), { q: "rose", type: "ring", label: "diamond" }),
    );

    expect(markup).toContain('value="rose"');
    expect(markup).toContain("Type: ring");
    expect(markup).toContain("Label: diamond");
    expect(markup).toContain(">Filters<");
    expect(markup).toContain("Rose Crown Ring");
    expect(markup).not.toContain("Ocean Pearl Necklace");
  });

  it("renders shared catalog collection and material filters from Sparkle Suite metadata", () => {
    const markup = renderToStaticMarkup(
      renderLibraryPageContent(libraryFilterItems(), {
        q: "",
        type: "all",
        label: "all",
        collection: "Garden Glow",
        material: "Rose gold",
      }, libraryFacetOptions()),
    );

    expect(markup).toContain(">Filters<");
    expect(markup).toContain("Collections");
    expect(markup).toContain("Garden Glow");
    expect(markup).toContain("Materials");
    expect(markup).toContain("Rose gold");
    expect(markup).toContain("Rose Crown Ring");
    expect(markup).not.toContain("Ocean Pearl Necklace");
  });

  it("renders searchable dynamic facets, stones, active chips, and Nic-Nac search help", () => {
    const markup = renderToStaticMarkup(
      renderLibraryPageContent(libraryFilterItems(), {
        q: "rose",
        type: "ring",
        label: "diamond",
        collection: "Garden Glow",
        material: "Rose gold",
        stone: "Pink opal",
        year: "2026",
      }, libraryFacetOptions()),
    );

    expect(markup).toContain("Not sure what it is called?");
    expect(markup).toContain("Ask Nic-Nac");
    expect(markup).not.toContain("Need help hunting?");
    expect(markup).not.toContain("bg-[#fff8e6]");
    expect(markup).toContain("Selected filters");
    expect(markup).toContain("Pink opal");
    expect(markup).toContain("Stone / gem");
    expect(markup).toContain("Search collections");
    expect(markup).toContain("Search stones");
    expect(markup).toContain("Garden Glow");
    expect(markup).toContain("Rose gold");
    expect(markup).toContain("2026");
    expect(markup).toContain('href="/library?');
    expect(markup).not.toContain("Pearl");
  });

  it("offers a load-more path when the catalog result set reaches the current page limit", () => {
    const items = Array.from({ length: 24 }, (_, index): JewelryItem => ({
      id: `design-load-more-${index}`,
      name: `Load More Ring ${index}`,
      collectionName: "Garden Glow",
      collectionYear: 2026,
      jewelryType: "ring",
      material: "Rose gold",
      mainStone: "Pink opal",
      imageUrl: "",
      bpLabel: "standard",
      itemNumber: `RG-LM-${index}`,
      availableListingCount: 1,
      knownRepListingIds: [],
    }));

    const markup = renderToStaticMarkup(renderLibraryPageContent(items));

    expect(markup).toContain("Load more pieces");
    expect(markup).toContain("limit=48");
  });

  it("matches library searches by collection year", () => {
    const markup = renderToStaticMarkup(
      renderLibraryPageContent(libraryFilterItems(), { q: "2026", type: "necklace", label: "diamond" }),
    );

    expect(markup).toContain("Ocean Pearl Necklace");
    expect(markup).not.toContain("Rose Crown Ring");
    expect(markup).not.toContain("No library records match those filters.");
  });

  it("shows an empty library state when no records match selected filters", () => {
    const markup = renderToStaticMarkup(
      renderLibraryPageContent(libraryFilterItems(), { q: "ocean", type: "necklace", label: "standard" }),
    );

    expect(markup).toContain("No library records match those filters.");
    expect(markup).not.toContain("Rose Crown Ring");
    expect(markup).not.toContain("Ocean Pearl Necklace");
  });

  it("shows a no-match library state when a search query returns no catalog records", () => {
    const markup = renderToStaticMarkup(
      renderLibraryPageContent([], { q: "rose", type: "all", label: "all" }),
    );

    expect(markup).toContain("No library records match those filters.");
    expect(markup).not.toContain("The shared Sparkle Suite jewelry catalog is not available");
  });

  it("shows availability and optional catalog metadata on library cards", () => {
    const items: JewelryItem[] = [
      {
        id: "design-available",
        name: "Garden Gala Bracelet",
        collectionName: "Garden Gala",
        collectionYear: 2026,
        jewelryType: "bracelet",
        imageUrl: "",
        bpLabel: "standard",
        itemNumber: "BR1001",
        knownRepListingIds: [],
        searchTags: ["rose gold", "garden"],
        availableListingCount: 2,
      },
    ];

    const markup = renderToStaticMarkup(renderLibraryPageContent(items));

    expect(markup).toContain("2 available");
    expect(markup).toContain("2026");
    expect(markup).toContain("rose gold");
  });

  it("shows known rep lead metadata when library card counts are unknown but leads exist", () => {
    const singularItems: JewelryItem[] = [
      {
        id: "design-known-lead",
        name: "Garden Gala Ring",
        collectionName: "Garden Gala",
        jewelryType: "ring",
        imageUrl: "",
        bpLabel: "standard",
        itemNumber: "RG1001",
        knownRepListingIds: ["lead-1"],
      },
    ];
    const pluralItems: JewelryItem[] = [
      {
        id: "design-known-leads",
        name: "Garden Gala Necklace",
        collectionName: "Garden Gala",
        jewelryType: "necklace",
        imageUrl: "",
        bpLabel: "standard",
        itemNumber: "NK1001",
        knownRepListingIds: ["lead-1", "lead-2"],
      },
    ];

    const singularMarkup = renderToStaticMarkup(renderLibraryPageContent(singularItems));
    const pluralMarkup = renderToStaticMarkup(renderLibraryPageContent(pluralItems));

    expect(singularMarkup).toContain("Known rep lead");
    expect(singularMarkup).not.toContain("Known rep leads");
    expect(singularMarkup).not.toContain("No current listings");
    expect(pluralMarkup).toContain("Known rep leads");
    expect(pluralMarkup).not.toContain("No current listings");
  });

  it("shows availability unknown when library card counts and known leads are missing", () => {
    const items: JewelryItem[] = [
      {
        id: "design-unknown",
        name: "Garden Gala Earrings",
        collectionName: "Garden Gala",
        jewelryType: "earrings",
        imageUrl: "",
        bpLabel: "standard",
        itemNumber: "ER1001",
        knownRepListingIds: [],
      },
    ];

    const markup = renderToStaticMarkup(renderLibraryPageContent(items));

    expect(markup).toContain("Availability unknown");
    expect(markup).not.toContain("No current listings");
  });

  it("renders the item detail route with rep availability and focused Nic-Nac CTA", () => {
    const markup = renderToStaticMarkup(
      renderItemDetailPageContent({ itemId: "jewel-rainbow-crown-ring" }, getLocalDevAuthState("silver")),
    );

    expect(markup).toContain("Rainbow Crown Ring");
    expect(markup).toContain("Sierra Sparkle Studio");
    expect(markup).toContain("Nic-Nac, find this for me");
    expect(markup).toContain("Exact item");
    expect(markup).toContain("/rep-boards?listing=rainbow-crown");
    expect(markup).not.toContain("sparklesuite.example");
  });

  it("renders API-backed item detail availability with KISS rep site links", () => {
    const apiItem: JewelryItem = {
      id: "design-api",
      name: "API Garden Gala Ring",
      collectionName: "Garden Gala",
      collectionYear: 2026,
      jewelryType: "ring",
      imageUrl: "",
      bpLabel: "standard",
      itemNumber: "RG-API",
      knownRepListingIds: [],
      searchTags: ["garden"],
      availableListingCount: 1,
    };
    const availability: FinderAvailabilityResult = {
      requestedItem: apiItem,
      exactMatches: [
        {
          listingId: "listing-api",
          listedAt: null,
          photoUrl: null,
          item: apiItem,
          showName: "Demo Glow Show",
          repFirstName: "Demo",
          customerSiteUrl: "https://www.yoursparklesuite.com/demo-show?c=rep-demo",
          nextShow: {
            showId: "show-demo",
            showName: "Demo Glow Show",
            repFirstName: "Demo",
            startsAt: "2026-06-06T20:00:00.000Z",
            status: "scheduled",
            customerSiteUrl: "https://www.yoursparklesuite.com/demo-show?c=rep-demo",
          },
        },
      ],
      similarMatches: [],
    };

    const markup = renderToStaticMarkup(
      renderItemDetailPageContent({ itemId: "design-api" }, getLocalDevAuthState("silver"), apiItem, availability),
    );

    expect(markup).toContain("https://www.yoursparklesuite.com/demo-show?c=rep-demo");
    expect(markup).toContain("Demo Glow Show");
    expect(markup).toContain("Rep: Demo");
    expect(markup).toContain("Visit Rep Site");
    expect(markup).not.toContain("Open rep board path");
  });

  it("renders the item detail Silver prompt for Free customers", () => {
    const markup = renderToStaticMarkup(
      renderItemDetailPageContent({ itemId: "jewel-rainbow-crown-ring" }, getLocalDevAuthState("free")),
    );

    expect(markup).toContain("Browse for free. Let Nic-Nac hunt for you with Silver.");
    expect(markup).not.toContain("Exact item lead");
    expect(markup).not.toContain("Next show");
  });

  it("uses App Router notFound behavior for unknown library records", () => {
    expect(() =>
      renderToStaticMarkup(renderItemDetailPageContent({ itemId: "jewel-missing" }, getLocalDevAuthState("silver"))),
    ).toThrow();
  });

  it("renders rep board listings without customer action controls", () => {
    const markup = renderToStaticMarkup(createElement(RepBoardsPage));

    expect(markup).toContain("Rep Trade Boards / Dance Floors");
    expect(markup).toContain("Sierra Sparkle Studio");
    expect(markup).toContain("/rep-boards?listing=rainbow-crown");
    expect(markup).not.toContain("Offer Item");
    expect(markup).not.toContain("Swap With Customer");
    expect(markup).not.toContain("Post Message");
    expect(markup).not.toContain("sparklesuite.example");
  });

  it("renders live show route content from Finder API-shaped data", () => {
    const markup = renderToStaticMarkup(renderLiveShowsPageContent(finderLiveShowItems()));

    expect(markup).toContain("Master Live Calendar");
    expect(markup).toContain("Demo Glow Show");
    expect(markup).toContain("Rep: Demo");
    expect(markup).toContain("Visit Rep Site");
  });

  it("renders the public photo setup route with a plain light-box resource link", () => {
    const markup = renderToStaticMarkup(createElement(PhotoSetupPage));

    expect(markup).toContain("Sparkle Finder public navigation");
    expect(markup).toContain("Photo setup for jewelry uploads");
    expect(markup).toContain("you do not need this exact one");
    expect(markup).toContain("Any clean, well-lit light box can work.");
    expect(markup).toContain('href="https://www.amazon.com/dp/B0C7Z93NPR"');
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).not.toContain("commission");
    expect(markup).not.toContain("paid link");
    expect(markup).not.toContain("Affiliate Disclosure");
    expect(markup).not.toContain("Amazon Associate");
    expect(markup).not.toContain('rel="sponsored');
  });

  it("keeps photo setup publicly reachable without the anonymous hub sign-in wall", () => {
    const markup = renderToStaticMarkup(createElement(PhotoSetupPage));

    expect(markup).not.toContain("Create a free Sparkle Finder account to open this tool.");
    expect(markup).not.toContain("Sign in to open Sparkle Finder");
    expect(markup).toContain("Plain resource link");
    expect(markup).toContain("not an advertisement or storefront");
  });

  it("keeps the homepage photo setup card aligned to the new guidance route", async () => {
    const { DiscoveryCards } = await import("../../components/home/DiscoveryCards");
    const markup = renderToStaticMarkup(createElement(DiscoveryCards));

    expect(markup).toContain("Photo Setup Guide");
    expect(markup).toContain("Prep clean light-box photos for Showcase Studio review.");
    expect(markup).toContain('href="/photo-setup"');
    expect(markup).not.toContain('href="/shop"');
    expect(markup).not.toContain("Diamonds &amp; Unicorns Library");
  });

  it("renders photo setup content without affiliate or shop positioning", () => {
    const markup = renderToStaticMarkup(renderPhotoSetupPageContent());

    expect(markup).toContain("What Nic-Nac needs to see");
    expect(markup).toContain("The goal is a reviewable record, not a professional product shoot.");
    expect(markup).not.toContain("Shop");
    expect(markup).not.toContain("Affiliate");
    expect(markup).not.toContain("Amazon Associate");
  });

  it("renders Silver profile and Sparkle Showcase previews for Silver customers", () => {
    const markup = renderToStaticMarkup(renderSilverPageContent(getLocalDevAuthState("silver")));

    expect(markup).toContain("Sparkle Mama&#x27;s Sparkle Showcase");
    expect(markup).toContain("Build your Sparkle Showcase in four simple steps.");
    expect(markup).toContain("Start Building My Sparkle Showcase");
    expect(markup).toContain('href="#add-to-sparkle-showcase"');
    expect(markup).toContain('id="add-to-sparkle-showcase"');
    expect(markup).toContain("Step 1");
    expect(markup).toContain("Add pieces you own.");
    expect(markup).toContain("Mark pieces you are ISO.");
    expect(markup).toContain("Feature your rarest reveals.");
    expect(markup).toContain("Share your Sparkle Showcase.");
    expect(markup).toContain("Collector Profile");
    expect(markup).toContain("Sparkle Mama");
    expect(markup).toContain("Sparkle Showcase");
    expect(markup).toContain("The Rarest of Reveals");
    expect(markup).toContain("Showcase Collection");
    expect(markup).toContain("Rainbow Crown Ring");
    expect(markup).toContain("Add to Sparkle Showcase");
    expect(markup).toContain("Mark as ISO");
    expect(markup).toContain("Need a missing piece?");
    expect(markup).toContain("Showcase Studio");
    expect(markup).toContain('data-smoke="showcase-studio-intake"');
    expect(markup).toContain("Original Bomb Party label required");
    expect(markup).toContain("light-box photo");
    expect(markup).toContain("Nic-Nac checks every image");
    expect(markup).toContain("Original label photo");
    expect(markup).toContain("Light-box jewelry photo");
    expect(markup).toContain('name="originalLabelPhoto"');
    expect(markup).toContain('name="jewelryFrontPhoto"');
    expect(markup).toContain('name="itemNumber"');
    expect(markup).toContain("Submit to Nic-Nac review");
    expect(markup).toContain('href="/photo-setup"');
    expect(markup).not.toContain("Silver Space");
    expect(markup).not.toContain("Catalog actions");
    expect(markup).not.toContain("Future catalog request path");
  });

  it("renders real Silver account profile details without local fixture page copy", () => {
    const accountState: CurrentSparkleFinderAccountState = {
      status: "authenticated",
      tier: "silver",
      displayName: "Casey Collector",
      email: "casey@example.com",
      customer: {
        id: "user-123",
        displayName: "Casey Collector",
        email: "casey@example.com",
        state: "PA",
        tier: "silver",
      },
      communicationConsent: {
        accountEmailRequired: true,
        accountSmsAllowed: true,
        promotionalEmailOptIn: false,
        promotionalSmsOptIn: false,
        accountSmsConsentedAt: "2026-05-31T12:00:00.000Z",
        promotionalEmailConsentedAt: null,
        promotionalSmsConsentedAt: null,
        privacyAcknowledgedAt: "2026-05-31T00:00:00.000Z",
      },
      silverProfile: {
        customerId: "user-123",
        photoUrl: "",
        tiktokHandle: "@caseyfinds",
        bio: "Looking for jewel tones and unicorns.",
        visibility: "sparkle_finder",
      },
    };

    const markup = renderToStaticMarkup(renderSilverPageContent(accountState));

    expect(markup).toContain("@caseyfinds");
    expect(markup).toContain("Looking for jewel tones and unicorns.");
    expect(markup).toContain(
      "Build, track, highlight, and share the pieces you own or hope to find, then use rep leads when a wanted piece appears.",
    );
    expect(markup).toContain("Save profile");
    expect(markup).not.toContain("Manage your Sparkle Finder profile, collection, and watchlist details from your signed-in account.");
    expect(markup).not.toContain("fixture-backed preview");
    expect(markup).not.toContain("Local fixture mode");
  });

  it("keeps local fixture wording for Silver local preview accounts", () => {
    const markup = renderToStaticMarkup(
      renderSilverPageContent({ ...getLocalDevAuthState("silver"), isLocalPreview: true }),
    );

    expect(markup).toContain("fixture-backed preview");
    expect(markup).toContain("Local fixture mode");
  });

  it("renders limited Silver route state for Free customers without enabled write controls", () => {
    const markup = renderToStaticMarkup(
      renderSilverPageContent({ ...getLocalDevAuthState("free"), isLocalPreview: true }),
    );

    expect(markup).toContain("Collector Profile");
    expect(markup).toContain("Silver preview is required to save profile updates.");
    expect(markup).toContain("aria-busy=\"false\"");
    expect(markup).toContain("disabled");
    expect(markup).not.toContain("Silver preview needed");
  });

  it("keeps hub route copy inside Sparkle Finder guardrails", () => {
    const copy = [...routes, ...publicRoutes].map(([, renderRoute]) => renderRoute()).join(" ");

    expect(findSparkleFinderCopyViolations(copy)).toEqual([]);
  });

  it("does not render placeholder external Sparkle Suite URLs on hub route pages", () => {
    const markup = [
      ...routes.map(([, renderRoute]) => renderRoute()),
      renderToStaticMarkup(
        renderItemDetailPageContent({ itemId: "jewel-rainbow-crown-ring" }, getLocalDevAuthState("silver")),
      ),
      renderToStaticMarkup(renderSignInPageContent()),
    ].join(" ");

    expect(markup).not.toContain("sparklesuite.example");
  });

  it("renders sign-in choices for Guest, Free preview, and Silver preview", () => {
    const markup = renderToStaticMarkup(renderSignInPageContent());

    expect(markup).toContain("Guest preview keeps the public view anonymous");
    expect(markup).toContain("/auth/preview/anonymous");
    expect(markup).toContain("/auth/preview/free");
    expect(markup).toContain("/auth/preview/silver");
    expect(markup).not.toContain("Free preview keeps Guest preview");
  });

  it("renders the real sign-in form and sign-up link", () => {
    const markup = renderToStaticMarkup(renderSignInPageContent());

    expect(markup).toContain("Email");
    expect(markup).toContain("Password");
    expect(markup).toContain("Sign in");
    expect(markup).toContain("Continue with Google");
    expect(markup).toContain('href="/auth/sign-up"');
  });

  it("renders readable sign-in notices", () => {
    const checkEmailMarkup = renderToStaticMarkup(renderSignInPageContent({ message: "check_email" }));
    const missingCodeMarkup = renderToStaticMarkup(
      renderSignInPageContent({ error: "missing_oauth_code" }),
    );
    const exchangeFailedMarkup = renderToStaticMarkup(
      renderSignInPageContent({ error: "oauth_exchange_failed" }),
    );

    expect(checkEmailMarkup).toContain("Check your email for the Sparkle Finder sign-in link.");
    expect(missingCodeMarkup).toContain("Google sign-in did not return a valid authorization code.");
    expect(exchangeFailedMarkup).toContain("Google sign-in could not be completed. Please try again.");
  });

  it("renders a sign-up route with 45-day Silver trial copy", async () => {
    const markup = renderToStaticMarkup(renderSignUpPageContent());

    expect(markup).toContain("45-day Silver trial");
  });

  it("renders sign-up choices for password or magic link", async () => {
    const markup = renderToStaticMarkup(renderSignUpPageContent());

    expect(markup).toContain('name="authMethod"');
    expect(markup).toContain('value="password"');
    expect(markup).toContain('value="magic-link"');
    expect(markup).toContain("Use a password");
    expect(markup).toContain("Email me a magic sign-in link");
  });

  it("renders sign-up Google auth and remaining account details copy", async () => {
    const markup = renderToStaticMarkup(renderSignUpPageContent());

    expect(markup).toContain("Continue with Google");
    expect(markup).toContain(
      "After Google sign-up, Sparkle Finder may ask for the remaining account details needed for your Silver trial.",
    );
  });

  it("renders sign-up phone and privacy copy", async () => {
    const markup = renderToStaticMarkup(renderSignUpPageContent());

    expect(markup).toContain(
      "Used for account verification, recovery, and trial protection. Not sold. Marketing texts are optional.",
    );
    expect(markup).toContain("I acknowledge");
    expect(markup).toContain("privacy");
    expect(markup).toContain('href="/privacy-policy"');
    expect(markup).toContain("Sparkle Finder privacy terms");
  });

  it("renders anonymous account prompts and 45-day Silver trial account copy", () => {
    const anonymousMarkup = renderToStaticMarkup(renderAccountPageContent(anonymousRouteAccountState()));
    const trialMarkup = renderToStaticMarkup(
      renderAccountPageContent(activeTrialRouteAccountState(), new Date("2026-06-01T12:00:00.000Z")),
    );

    expect(anonymousMarkup).toContain("Sign in to manage your Sparkle Finder account");
    expect(anonymousMarkup).toContain("Silver trial details");
    expect(anonymousMarkup).toContain("/auth/sign-up");
    expect(trialMarkup).toContain("45-day Silver trial");
    expect(trialMarkup).toContain("Trial ends June 10, 2026");
    expect(trialMarkup).toContain("9 days left");
  });

  it("renders account phone privacy copy and leaves promotional SMS unchecked by default", () => {
    const markup = renderToStaticMarkup(renderAccountPageContent(activeTrialRouteAccountState()));

    expect(markup).toContain("Phone is used for account identification, recovery, trial protection, and security notices.");
    expect(markup).toContain("We do not sell your phone number.");
    expect(markup).toContain("Marketing texts are optional and separate from account/security notices.");
    expect(markup).toContain('name="promotionalSms"');
    expect(markup).not.toContain('name="promotionalSms" checked');
  });

  it("leaves promotional SMS unchecked by default on the sign-up route", async () => {
    const markup = renderToStaticMarkup(renderSignUpPageContent());

    expect(markup).toContain('name="promotionalSms"');
    expect(markup).not.toContain('name="promotionalSms" checked=""');
    expect(markup).not.toContain('name="promotionalSms" checked');
  });

  it("links sign-in visitors to the sign-up route", () => {
    const markup = renderToStaticMarkup(renderSignInPageContent());

    expect(markup).toContain('href="/auth/sign-up"');
  });

  it("hides local preview links in production when preview auth is disabled", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SPARKLE_FINDER_ENABLE_PREVIEW_AUTH", "");

    const markup = renderToStaticMarkup(renderSignInPageContent());

    expect(markup).not.toContain("/auth/preview/anonymous");
    expect(markup).not.toContain("/auth/preview/free");
    expect(markup).not.toContain("/auth/preview/silver");
  });

  it("shows local preview links when preview auth is enabled", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SPARKLE_FINDER_ENABLE_PREVIEW_AUTH", "true");

    const markup = renderToStaticMarkup(renderSignInPageContent());

    expect(markup).toContain("/auth/preview/anonymous");
    expect(markup).toContain("/auth/preview/free");
    expect(markup).toContain("/auth/preview/silver");
  });

  it("keeps local preview redirects on safe local request hosts", async () => {
    const freeResponse = await previewAuthGET(
      new Request("http://localhost:4310/auth/preview/free", {
        headers: { host: "127.0.0.1:4310" },
      }),
      {
        params: Promise.resolve({ mode: "free" }),
      },
    );
    const silverResponse = await previewAuthGET(new Request("http://localhost:4310/auth/preview/silver"), {
      params: Promise.resolve({ mode: "silver" }),
    });
    const anonymousResponse = await previewAuthGET(new Request("http://127.0.0.1:4310/auth/preview/anonymous"), {
      params: Promise.resolve({ mode: "anonymous" }),
    });

    expect(freeResponse.headers.get("location")).toBe("http://127.0.0.1:4310/");
    expect(silverResponse.headers.get("location")).toBe("http://localhost:4310/");
    expect(anonymousResponse.headers.get("location")).toBe("http://127.0.0.1:4310/");
  });

  it("blocks local preview auth cookies in production without the preview flag", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SPARKLE_FINDER_ENABLE_PREVIEW_AUTH", "");

    const response = await previewAuthGET(new Request("http://localhost:4310/auth/preview/silver"), {
      params: Promise.resolve({ mode: "silver" }),
    });

    expect(response.headers.get("location")).toBe("http://localhost:4310/auth/sign-in");
    expect(response.headers.get("set-cookie") ?? "").not.toContain("sparkle_finder_auth_mode");
  });

  it("allows local preview auth cookies in production when the preview flag is enabled", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SPARKLE_FINDER_ENABLE_PREVIEW_AUTH", "true");

    const response = await previewAuthGET(new Request("http://localhost:4310/auth/preview/silver"), {
      params: Promise.resolve({ mode: "silver" }),
    });

    expect(response.headers.get("location")).toBe("http://localhost:4310/");
    expect(response.headers.get("set-cookie") ?? "").toContain("sparkle_finder_auth_mode=silver");
  });

  it("ignores an untrusted Host header when the request URL host is local", async () => {
    const response = await previewAuthGET(
      new Request("http://localhost:4310/auth/preview/free", {
        headers: { host: "evil.example" },
      }),
      {
        params: Promise.resolve({ mode: "free" }),
      },
    );

    expect(response.headers.get("location")).toBe("http://localhost:4310/");
  });

  it("uses a fixed safe local fallback when Host and request URL are untrusted", async () => {
    const response = await previewAuthGET(new Request("http://evil.example/auth/preview/free"), {
      params: Promise.resolve({ mode: "free" }),
    });

    expect(response.headers.get("location")).toBe("http://127.0.0.1:4310/");
  });

  it("uses a safe local Host header even when the request URL host is untrusted", async () => {
    const response = await previewAuthGET(
      new Request("http://evil.example/auth/preview/free", {
        headers: { host: "localhost:4310" },
      }),
      {
        params: Promise.resolve({ mode: "free" }),
      },
    );

    expect(response.headers.get("location")).toBe("http://localhost:4310/");
  });

  it("preserves bracketed IPv6 localhost Host redirects", async () => {
    const response = await previewAuthGET(
      new Request("http://localhost:4310/auth/preview/free", {
        headers: { host: "[::1]:4310" },
      }),
      {
        params: Promise.resolve({ mode: "free" }),
      },
    );

    expect(response.headers.get("location")).toBe("http://[::1]:4310/");
  });

  it("maps fixture rep URLs to local route hrefs", () => {
    expect(getLocalRepBoardHref("https://sparklesuite.example/reps/sierra/board/rainbow-crown")).toBe(
      "/rep-boards?listing=rainbow-crown",
    );
    expect(getLocalRepHref("https://sparklesuite.example/reps/sierra")).toBe("/rep-boards?rep=sierra");
  });

  it("converts Sparkle Suite API rep paths into customer-safe external hrefs", () => {
    expect(getSparkleSuiteRepBoardHref("/amethyst/trade?c=rep-demo", "https://suite.example")).toBe(
      "https://suite.example/amethyst/trade?c=rep-demo",
    );
    expect(getSparkleSuiteRepHref("/amethyst?c=rep-demo", "https://suite.example/")).toBe(
      "https://suite.example/amethyst?c=rep-demo",
    );
    expect(getSparkleSuiteRepBoardHref("https://suite.example/amethyst/trade?c=rep-demo", "https://ignored.example")).toBe(
      "https://suite.example/amethyst/trade?c=rep-demo",
    );
    expect(getSparkleSuiteRepHref("https://suite.example/amethyst?c=rep-demo", "https://ignored.example")).toBe(
      "https://suite.example/amethyst?c=rep-demo",
    );
  });
});

function anonymousRouteAccountState(): CurrentSparkleFinderAccountState {
  return {
    status: "anonymous",
    tier: "anonymous",
    displayName: "Guest",
    email: null,
    customer: null,
    communicationConsent: {
      accountEmailRequired: true,
      accountSmsAllowed: false,
      promotionalEmailOptIn: false,
      promotionalSmsOptIn: false,
      accountSmsConsentedAt: null,
      promotionalEmailConsentedAt: null,
      promotionalSmsConsentedAt: null,
      privacyAcknowledgedAt: null,
    },
  };
}

function activeTrialRouteAccountState(): CurrentSparkleFinderAccountState {
  return {
    status: "authenticated",
    tier: "silver",
    displayName: "Casey Collector",
    email: "casey@example.com",
    customer: {
      id: "user-123",
      displayName: "Casey Collector",
      email: "casey@example.com",
      state: "PA",
      tier: "silver",
    },
    membership: {
      accountId: "user-123",
      personId: "user-123",
      accessState: "silver_trial",
      silverSource: "trial",
      trialStartedAt: "2026-04-26T12:00:00.000Z",
      trialEndsAt: "2026-06-10T12:00:00.000Z",
      silverStartedAt: "2026-04-26T12:00:00.000Z",
      silverEndsAt: "2026-06-10T12:00:00.000Z",
      effectiveState: "silver_trial",
      hasSilverAccess: true,
      isTrialActive: true,
      isTrialExpired: false,
    },
    communicationConsent: {
      accountEmailRequired: true,
      accountSmsAllowed: false,
      promotionalEmailOptIn: false,
      promotionalSmsOptIn: false,
      accountSmsConsentedAt: null,
      promotionalEmailConsentedAt: null,
      promotionalSmsConsentedAt: null,
      privacyAcknowledgedAt: "2026-04-26T12:00:00.000Z",
    },
  };
}

function libraryFilterItems(): JewelryItem[] {
  return [
    {
      id: "jewel-rose-crown-ring",
      name: "Rose Crown Ring",
      collectionName: "Garden Glow",
      collectionYear: 2026,
      jewelryType: "ring",
      material: "Rose gold",
      mainStone: "Pink opal",
      imageUrl: "/fixtures/rose-crown-ring.jpg",
      bpLabel: "diamond",
      itemNumber: "RCR-001",
      searchTags: ["rose", "crown"],
      availableListingCount: 1,
      knownRepListingIds: [],
    },
    {
      id: "jewel-ocean-pearl-necklace",
      name: "Ocean Pearl Necklace",
      collectionName: "Tide Line",
      collectionYear: 2026,
      jewelryType: "necklace",
      material: "Sterling silver",
      mainStone: "Pearl",
      imageUrl: "/fixtures/ocean-pearl-necklace.jpg",
      bpLabel: "diamond",
      itemNumber: "OPN-002",
      searchTags: ["ocean", "pearl"],
      availableListingCount: 1,
      knownRepListingIds: [],
    },
  ];
}

function libraryFacetOptions() {
  return {
    collections: [{ value: "Garden Glow", count: 1 }],
    materials: [{ value: "Rose gold", count: 1 }],
    stones: [{ value: "Pink opal", count: 1 }],
    types: [{ value: "ring", count: 1 }],
    labels: [{ value: "diamond", count: 1 }],
    years: [{ value: "2026", count: 1 }],
  };
}

function finderLiveShowItems(): FinderLiveShow[] {
  return [
    {
      showId: "show-demo",
      showName: "Demo Glow Show",
      repFirstName: "Demo",
      startsAt: "2026-06-06T20:00:00.000Z",
      status: "scheduled",
      customerSiteUrl: "https://www.yoursparklesuite.com/demo-show?c=rep-demo",
    },
  ];
}
