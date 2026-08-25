import { describe, expect, it } from "vitest";
import { getSparkleFinderCanonicalRedirect } from "../../lib/sparkle-finder/canonical-domain";

describe("Sparkle Finder canonical production domain", () => {
  it.each([
    "https://sparkle-finder-dev.vercel.app/showcase/sparkle-mama?share=1",
    "https://sparkle-finder-abc123-louis-projects.vercel.app/showcase/sparkle-mama?share=1",
    "https://www.yoursparklefinder.com/showcase/sparkle-mama?share=1",
  ])("permanently canonicalizes alternate production hosts without losing the path or query", (requestUrl) => {
    expect(getSparkleFinderCanonicalRedirect(new URL(requestUrl), "production")?.toString()).toBe(
      "https://yoursparklefinder.com/showcase/sparkle-mama?share=1",
    );
  });

  it.each([
    "https://yoursparklefinder.com/account",
    "http://localhost:3000/account",
    "https://evil.example/account",
  ])("does not redirect canonical, local, or unrelated hosts", (requestUrl) => {
    expect(getSparkleFinderCanonicalRedirect(new URL(requestUrl), "production")).toBeNull();
  });

  it("keeps preview deployments available for private verification", () => {
    const requestUrl = new URL("https://sparkle-finder-preview.vercel.app/account");
    expect(getSparkleFinderCanonicalRedirect(requestUrl, "preview")).toBeNull();
  });
});
