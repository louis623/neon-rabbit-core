import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { renderLiveShowsPageContent } from "../../app/(hub)/live-shows/page";
import { FinderLink } from "../../components/navigation/FinderLink";

describe("Sparkle Finder outbound links", () => {
  it("opens external websites in a protected new tab", () => {
    const markup = renderToStaticMarkup(
      createElement(FinderLink, { href: "https://www.yoursparklesuite.com/demo" }, "Visit Rep Site"),
    );

    expect(markup).toContain('href="https://www.yoursparklesuite.com/demo"');
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noopener noreferrer"');
  });

  it("keeps Sparkle Finder routes in the current tab", () => {
    const markup = renderToStaticMarkup(
      createElement(FinderLink, { href: "/rep-boards?rep=demo" }, "Local preview"),
    );

    expect(markup).toContain('href="/rep-boards?rep=demo"');
    expect(markup).not.toContain('target="_blank"');
    expect(markup).not.toContain('rel="noopener noreferrer"');
  });

  it("applies the outbound behavior to live rep links", () => {
    const markup = renderToStaticMarkup(renderLiveShowsPageContent([{
      showId: "show-demo",
      showName: "Demo Glow Show",
      repFirstName: "Demo",
      startsAt: "2026-08-26T20:00:00.000Z",
      status: "scheduled",
      customerSiteUrl: "https://www.yoursparklesuite.com/demo",
    }]));

    expect(markup).toContain('href="https://www.yoursparklesuite.com/demo"');
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noopener noreferrer"');
  });
});
