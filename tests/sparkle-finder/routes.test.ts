import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderHubChrome } from "../../app/(hub)/layout";
import DashboardPage from "../../app/(hub)/dashboard/page";
import DiamondsUnicornsPage from "../../app/(hub)/diamonds-unicorns/page";
import ItemDetailPage from "../../app/(hub)/library/[itemId]/page";
import LibraryPage from "../../app/(hub)/library/page";
import LiveShowsPage from "../../app/(hub)/live-shows/page";
import RepBoardsPage from "../../app/(hub)/rep-boards/page";
import ShopPage from "../../app/(hub)/shop/page";
import { renderSilverPageContent } from "../../app/(hub)/silver/page";
import { getLocalDevAuthState } from "../../lib/sparkle-finder/auth";
import { findSparkleFinderCopyViolations } from "../../lib/sparkle-finder/copy-guardrails";

const routes = [
  ["dashboard", () => renderToStaticMarkup(createElement(DashboardPage))],
  ["library", () => renderToStaticMarkup(createElement(LibraryPage))],
  ["diamonds-unicorns", () => renderToStaticMarkup(createElement(DiamondsUnicornsPage))],
  ["live-shows", () => renderToStaticMarkup(createElement(LiveShowsPage))],
  ["rep-boards", () => renderToStaticMarkup(createElement(RepBoardsPage))],
  ["shop", () => renderToStaticMarkup(createElement(ShopPage))],
  ["silver", () => renderToStaticMarkup(renderSilverPageContent(getLocalDevAuthState("silver")))],
] as const;

describe("Sparkle Finder hub routes", () => {
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
      createElement(ItemDetailPage, { params: { itemId: "jewel-rainbow-crown-ring" } }),
    );

    expect(markup).toContain("Rainbow Crown Ring");
    expect(markup).toContain("Sierra Sparkle Studio");
    expect(markup).toContain("Nic-Nac, find this for me");
    expect(markup).toContain("Exact item");
  });

  it("uses App Router notFound behavior for unknown library records", () => {
    expect(() =>
      renderToStaticMarkup(createElement(ItemDetailPage, { params: { itemId: "jewel-missing" } })),
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
    expect(markup).not.toContain("Offer Item");
    expect(markup).not.toContain("Swap With Customer");
    expect(markup).not.toContain("Post Message");
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

  it("renders Silver profile and collection previews for Silver customers", () => {
    const markup = renderToStaticMarkup(renderSilverPageContent(getLocalDevAuthState("silver")));

    expect(markup).toContain("Silver Profile");
    expect(markup).toContain("Sparkle Mama");
    expect(markup).toContain("Rainbow Crown Ring");
    expect(markup).toContain("Add to collection");
    expect(markup).toContain("Add to watchlist");
    expect(markup).toContain("Future catalog request path");
  });

  it("renders the Silver route upgrade prompt for Free customers", () => {
    const markup = renderToStaticMarkup(renderSilverPageContent(getLocalDevAuthState("free")));

    expect(markup).toContain("Silver preview needed");
    expect(markup).toContain("/auth/sign-in");
    expect(markup).not.toContain("Profile form");
  });

  it("keeps hub route copy inside Sparkle Finder guardrails", () => {
    const copy = routes.map(([, renderRoute]) => renderRoute()).join(" ");

    expect(findSparkleFinderCopyViolations(copy)).toEqual([]);
  });
});
