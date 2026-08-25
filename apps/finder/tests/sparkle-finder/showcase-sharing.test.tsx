import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ShareShowcaseButton } from "../../components/showcase/ShareShowcaseButton";
import {
  buildRevealSpotlightPath,
  buildShowcaseCollectionPath,
  buildSparkleShowcasePath,
  getCanonicalShowcaseUrl,
  sharePublicShowcaseLink,
} from "../../lib/sparkle-finder/showcase-sharing";

describe("Sparkle Showcase sharing", () => {
  it("builds encoded, canonical public links for all three sharing levels", () => {
    expect(buildSparkleShowcasePath("sparkle mama")).toBe("/showcase/sparkle%20mama");
    expect(buildShowcaseCollectionPath("sparkle-mama", "never leaving")).toBe(
      "/showcase/sparkle-mama/showcase-collections/never%20leaving",
    );
    expect(buildRevealSpotlightPath("sparkle-mama", "rainbow crown")).toBe(
      "/showcase/sparkle-mama/pieces/rainbow%20crown",
    );
    expect(getCanonicalShowcaseUrl("/showcase/sparkle-mama", "https://yoursparklefinder.com/account"))
      .toBe("https://yoursparklefinder.com/showcase/sparkle-mama");
  });

  it("refuses non-public, malformed, and query-bearing paths", () => {
    expect(getCanonicalShowcaseUrl("/silver", "https://yoursparklefinder.com")).toBeNull();
    expect(getCanonicalShowcaseUrl("/showcase/sparkle-mama?preview=private", "https://yoursparklefinder.com"))
      .toBeNull();
    expect(getCanonicalShowcaseUrl("https://malicious.example/showcase/sparkle-mama", "https://yoursparklefinder.com"))
      .toBeNull();
    expect(getCanonicalShowcaseUrl("/showcase/..", "https://yoursparklefinder.com")).toBeNull();
    expect(getCanonicalShowcaseUrl("/showcase/%2e%2e", "https://yoursparklefinder.com")).toBeNull();
    expect(getCanonicalShowcaseUrl("/showcase/sparkle-mama/pieces/%2Faccount", "https://yoursparklefinder.com"))
      .toBeNull();
  });

  it("uses native phone sharing when the browser supports it", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const outcome = await sharePublicShowcaseLink(
      {
        title: "Sparkle Mama's Sparkle Showcase",
        url: "https://yoursparklefinder.com/showcase/sparkle-mama",
      },
      { document: null, navigator: { share } },
    );

    expect(outcome).toEqual({ method: "native", status: "shared" });
    expect(share).toHaveBeenCalledWith(expect.objectContaining({
      url: "https://yoursparklefinder.com/showcase/sparkle-mama",
    }));
  });

  it("copies the canonical URL when native sharing is unavailable or fails", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const outcome = await sharePublicShowcaseLink(
      { url: "https://yoursparklefinder.com/showcase/sparkle-mama" },
      { document: null, navigator: { clipboard: { writeText } } },
    );

    expect(outcome).toEqual({ method: "clipboard", status: "copied" });
    expect(writeText).toHaveBeenCalledWith("https://yoursparklefinder.com/showcase/sparkle-mama");
  });

  it("falls back to copying when the native share sheet fails to open", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const outcome = await sharePublicShowcaseLink(
      { url: "https://yoursparklefinder.com/showcase/sparkle-mama" },
      {
        document: null,
        navigator: {
          clipboard: { writeText },
          share: vi.fn().mockRejectedValue(new Error("share unavailable")),
        },
      },
    );

    expect(outcome).toEqual({ method: "clipboard", status: "copied" });
    expect(writeText).toHaveBeenCalledOnce();
  });

  it("does not copy after a customer cancels the native share sheet", async () => {
    const cancellation = new Error("cancelled");
    cancellation.name = "AbortError";
    const writeText = vi.fn();
    const outcome = await sharePublicShowcaseLink(
      { url: "https://yoursparklefinder.com/showcase/sparkle-mama" },
      {
        document: null,
        navigator: {
          clipboard: { writeText },
          share: vi.fn().mockRejectedValue(cancellation),
        },
      },
    );

    expect(outcome).toEqual({ method: "native", status: "cancelled" });
    expect(writeText).not.toHaveBeenCalled();
  });

  it("returns a bounded error when no share or copy mechanism is available", async () => {
    const outcome = await sharePublicShowcaseLink(
      { url: "https://yoursparklefinder.com/showcase/sparkle-mama" },
      { document: null, navigator: null },
    );

    expect(outcome).toEqual({ method: "none", status: "error" });
  });

  it("uses and cleans up the legacy copy fallback on older browsers", async () => {
    const textArea = {
      focus: vi.fn(),
      remove: vi.fn(),
      select: vi.fn(),
      setAttribute: vi.fn(),
      style: {} as CSSStyleDeclaration,
      value: "",
    };
    const appendChild = vi.fn();
    const execCommand = vi.fn().mockReturnValue(true);
    const legacyDocument = {
      body: { appendChild },
      createElement: vi.fn().mockReturnValue(textArea),
      execCommand,
    } as unknown as Document;
    const outcome = await sharePublicShowcaseLink(
      { url: "https://yoursparklefinder.com/showcase/sparkle-mama" },
      { document: legacyDocument, navigator: null },
    );

    expect(outcome).toEqual({ method: "legacy", status: "copied" });
    expect(textArea.value).toBe("https://yoursparklefinder.com/showcase/sparkle-mama");
    expect(appendChild).toHaveBeenCalledWith(textArea);
    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(textArea.remove).toHaveBeenCalledOnce();
  });

  it("renders a keyboard-operable control with a polite status region", () => {
    const markup = renderToStaticMarkup(
      <ShareShowcaseButton
        isPublic
        label="Share Showcase"
        pathname="/showcase/sparkle-mama"
        shareText="See this public collection."
        shareTitle="Sparkle Mama's Sparkle Showcase"
      />,
    );

    expect(markup).toContain("<button");
    expect(markup).toContain('type="button"');
    expect(markup).toContain("Share Showcase");
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('role="status"');
    expect(markup).not.toContain("href=");
  });
});
