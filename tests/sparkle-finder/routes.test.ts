import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHubChrome } from "../../app/(hub)/layout";
import AffiliateDisclosurePage from "../../app/affiliate-disclosure/page";
import DashboardPage from "../../app/(hub)/dashboard/page";
import DiamondsUnicornsPage from "../../app/(hub)/diamonds-unicorns/page";
import { renderItemDetailPageContent } from "../../app/(hub)/library/[itemId]/page";
import LibraryPage from "../../app/(hub)/library/page";
import LiveShowsPage from "../../app/(hub)/live-shows/page";
import RepBoardsPage from "../../app/(hub)/rep-boards/page";
import ShopPage from "../../app/(hub)/shop/page";
import SignInPage from "../../app/auth/sign-in/page";
import { GET as previewAuthGET } from "../../app/auth/preview/[mode]/route";
import { renderSilverPageContent } from "../../app/(hub)/silver/page";
import type { CurrentSparkleFinderAccountState } from "../../lib/sparkle-finder/account-service";
import {
  affiliateDisclosureHref,
  affiliateIssueReportHref,
  affiliateIssueReportLabel,
  affiliateLinkLabelCopy,
  affiliateReviewActionCopy,
  amazonAssociateDisclosure,
} from "../../lib/sparkle-finder/affiliate-copy";
import { getLocalDevAuthState } from "../../lib/sparkle-finder/auth";
import { findSparkleFinderCopyViolations } from "../../lib/sparkle-finder/copy-guardrails";
import { getLocalRepBoardHref, getLocalRepHref } from "../../lib/sparkle-finder/route-hrefs";

const routes = [
  ["dashboard", () => renderToStaticMarkup(createElement(DashboardPage))],
  ["library", () => renderToStaticMarkup(createElement(LibraryPage))],
  ["diamonds-unicorns", () => renderToStaticMarkup(createElement(DiamondsUnicornsPage))],
  ["live-shows", () => renderToStaticMarkup(createElement(LiveShowsPage))],
  ["rep-boards", () => renderToStaticMarkup(createElement(RepBoardsPage))],
  ["shop", () => renderToStaticMarkup(createElement(ShopPage))],
  ["silver", () => renderToStaticMarkup(renderSilverPageContent(getLocalDevAuthState("silver")))],
] as const;

const publicRoutes = [
  ["affiliate-disclosure", () => renderToStaticMarkup(createElement(AffiliateDisclosurePage))],
] as const;

describe("Sparkle Finder hub routes", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders the shared hub shell around dashboard content", () => {
    const markup = renderToStaticMarkup(
      renderHubChrome(createElement(DashboardPage), getLocalDevAuthState("silver")),
    );

    expect(markup).toContain("Sparkle Finder");
    expect(markup).toContain("Finder Dashboard");
    expect(markup).toContain("/library");
    expect(markup).toContain("/rep-boards");
    expect(markup).toContain("/live-shows");
    expect(markup).toContain("/diamonds-unicorns");
    expect(markup).toContain("/shop");
  });

  it("shows a sign-in wall for anonymous hub visitors", () => {
    const markup = renderToStaticMarkup(
      renderHubChrome(createElement(DashboardPage), getLocalDevAuthState("anonymous")),
    );

    expect(markup).toContain("Sign in to open Sparkle Finder");
    expect(markup).toContain("/auth/sign-in");
    expect(markup).not.toContain("Finder Dashboard");
  });

  it("renders library search and fixture-backed jewelry cards", () => {
    const markup = renderToStaticMarkup(createElement(LibraryPage));

    expect(markup).toContain("Search the Jewelry Library");
    expect(markup).toContain("Rainbow Crown Ring");
    expect(markup).toContain("Celestial Lights");
    expect(markup).toContain("/library/jewel-rainbow-crown-ring");
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

  it("uses only Bomb Party diamond and unicorn labels on the filtered route", () => {
    const markup = renderToStaticMarkup(createElement(DiamondsUnicornsPage));

    expect(markup).toContain("Diamond");
    expect(markup).toContain("Unicorn");
    expect(markup).not.toContain("Standard");
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

  it("renders live show route content from fixture data", () => {
    const markup = renderToStaticMarkup(createElement(LiveShowsPage));

    expect(markup).toContain("Master Live Calendar");
    expect(markup).toContain("Celestial Lights Preview");
    expect(markup).toContain("Sierra Sparkle Studio");
  });

  it("renders shop route content from fixture data", () => {
    const markup = renderToStaticMarkup(createElement(ShopPage));

    expect(markup).toContain("Collector Essentials");
    expect(markup).toContain("Storage &amp; Display");
    expect(markup).toContain("Livestream Gear");
  });

  it("renders shop affiliate disclosure and issue-reporting trust copy", () => {
    const markup = renderToStaticMarkup(createElement(ShopPage));

    expect(markup).toContain(affiliateLinkLabelCopy);
    expect(markup).toContain(amazonAssociateDisclosure);
    expect(markup).toContain(affiliateDisclosureHref);
    expect(markup).toContain(affiliateIssueReportLabel);
    expect(markup).toContain(affiliateIssueReportHref.replaceAll("&", "&amp;"));
    expect(markup).toContain(affiliateReviewActionCopy);
  });

  it("does not render a shop self-link CTA on the shop route", () => {
    const markup = renderToStaticMarkup(createElement(ShopPage));

    expect(markup).not.toContain('href="/shop"');
    expect(markup).not.toContain("Shop affiliate picks");
  });

  it("renders the public affiliate disclosure route with careful trust wording", () => {
    const markup = renderToStaticMarkup(createElement(AffiliateDisclosurePage));

    expect(markup).toContain("Affiliate Disclosure");
    expect(markup).toContain("Sparkle Finder is a discovery hub");
    expect(markup).toContain("not a jewelry marketplace");
    expect(markup).toContain("not officially affiliated with Bomb Party");
    expect(markup).toContain(amazonAssociateDisclosure);
    expect(markup).toContain("clear and conspicuous");
    expect(markup).toContain(affiliateLinkLabelCopy);
    expect(markup).toContain(affiliateIssueReportLabel);
    expect(markup).toContain(affiliateIssueReportHref.replaceAll("&", "&amp;"));
    expect(markup).toContain(affiliateReviewActionCopy);
  });

  it("renders Silver profile and collection previews for Silver customers", () => {
    const markup = renderToStaticMarkup(renderSilverPageContent(getLocalDevAuthState("silver")));

    expect(markup).toContain("Silver Profile");
    expect(markup).toContain("Sparkle Mama");
    expect(markup).toContain("Rainbow Crown Ring");
    expect(markup).toContain("Add to collection");
    expect(markup).toContain("Add to watchlist");
    expect(markup).toContain("Future catalog request path");
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
    expect(markup).toContain("View and save your signed-in Silver profile, collection, and watchlist updates.");
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

    expect(markup).toContain("Silver Profile");
    expect(markup).toContain("Silver preview is required to save profile updates.");
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
      renderToStaticMarkup(createElement(SignInPage)),
    ].join(" ");

    expect(markup).not.toContain("sparklesuite.example");
  });

  it("renders sign-in choices for Guest, Free preview, and Silver preview", () => {
    const markup = renderToStaticMarkup(createElement(SignInPage));

    expect(markup).toContain("Guest preview keeps the public view anonymous");
    expect(markup).toContain("Guest/public");
    expect(markup).toContain("/auth/preview/anonymous");
    expect(markup).toContain("/auth/preview/free");
    expect(markup).toContain("/auth/preview/silver");
    expect(markup).not.toContain("Free preview keeps Guest preview");
  });

  it("renders a sign-up route with 45-day Silver trial copy", async () => {
    const { default: SignUpPage } = await import("../../app/auth/sign-up/page");
    const markup = renderToStaticMarkup(createElement(SignUpPage));

    expect(markup).toContain("45-day Silver trial");
  });

  it("renders sign-up choices for password or magic link", async () => {
    const { default: SignUpPage } = await import("../../app/auth/sign-up/page");
    const markup = renderToStaticMarkup(createElement(SignUpPage));

    expect(markup).toContain('name="authMethod"');
    expect(markup).toContain('value="password"');
    expect(markup).toContain('value="magic-link"');
    expect(markup).toContain("Use a password");
    expect(markup).toContain("Email me a magic sign-in link");
  });

  it("renders sign-up phone and privacy copy", async () => {
    const { default: SignUpPage } = await import("../../app/auth/sign-up/page");
    const markup = renderToStaticMarkup(createElement(SignUpPage));

    expect(markup).toContain(
      "Used for account verification, recovery, and trial protection. Not sold. Marketing texts are optional.",
    );
    expect(markup).toContain("I acknowledge");
    expect(markup).toContain("privacy");
  });

  it("leaves promotional SMS unchecked by default on the sign-up route", async () => {
    const { default: SignUpPage } = await import("../../app/auth/sign-up/page");
    const markup = renderToStaticMarkup(createElement(SignUpPage));

    expect(markup).toContain('name="promotionalSms"');
    expect(markup).not.toContain('name="promotionalSms" checked=""');
    expect(markup).not.toContain('name="promotionalSms" checked');
  });

  it("links sign-in visitors to the sign-up route", () => {
    const markup = renderToStaticMarkup(createElement(SignInPage));

    expect(markup).toContain('href="/auth/sign-up"');
  });

  it("hides local preview links in production when preview auth is disabled", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SPARKLE_FINDER_ENABLE_PREVIEW_AUTH", "");

    const markup = renderToStaticMarkup(createElement(SignInPage));

    expect(markup).not.toContain("/auth/preview/anonymous");
    expect(markup).not.toContain("/auth/preview/free");
    expect(markup).not.toContain("/auth/preview/silver");
  });

  it("shows local preview links when preview auth is enabled", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SPARKLE_FINDER_ENABLE_PREVIEW_AUTH", "true");

    const markup = renderToStaticMarkup(createElement(SignInPage));

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

    expect(freeResponse.headers.get("location")).toBe("http://127.0.0.1:4310/dashboard");
    expect(silverResponse.headers.get("location")).toBe("http://localhost:4310/dashboard");
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

    expect(response.headers.get("location")).toBe("http://localhost:4310/dashboard");
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

    expect(response.headers.get("location")).toBe("http://localhost:4310/dashboard");
  });

  it("uses a fixed safe local fallback when Host and request URL are untrusted", async () => {
    const response = await previewAuthGET(new Request("http://evil.example/auth/preview/free"), {
      params: Promise.resolve({ mode: "free" }),
    });

    expect(response.headers.get("location")).toBe("http://127.0.0.1:4310/dashboard");
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

    expect(response.headers.get("location")).toBe("http://localhost:4310/dashboard");
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

    expect(response.headers.get("location")).toBe("http://[::1]:4310/dashboard");
  });

  it("maps fixture rep URLs to local route hrefs", () => {
    expect(getLocalRepBoardHref("https://sparklesuite.example/reps/sierra/board/rainbow-crown")).toBe(
      "/rep-boards?listing=rainbow-crown",
    );
    expect(getLocalRepHref("https://sparklesuite.example/reps/sierra")).toBe("/rep-boards?rep=sierra");
  });
});
