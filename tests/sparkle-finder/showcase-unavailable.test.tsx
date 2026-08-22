import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import NotFound, { metadata } from "../../app/not-found";

describe("Sparkle Finder unavailable page", () => {
  it("renders a generic branded response without echoing route details", () => {
    const markup = renderToStaticMarkup(<NotFound />);

    expect(markup).toContain("Sparkle Finder");
    expect(markup).toContain("This page isn&#x27;t available.");
    expect(markup).toContain("The page may be private or unavailable");
    expect(markup).toContain("Browse collectors");
    expect(markup).toContain("Sign in");
    expect(markup).not.toContain("unknown-handle");
    expect(metadata.robots).toEqual({ follow: false, index: false });
  });
});
