import { describe, expect, it } from "vitest";
import { findSparkleFinderCopyViolations } from "../../lib/sparkle-finder/copy-guardrails";

function violationPhrases(copy: string): string[] {
  return findSparkleFinderCopyViolations(copy).map((violation) => violation.phrase);
}

describe("findSparkleFinderCopyViolations", () => {
  it("flags banned Sparkle Finder public-copy positioning", () => {
    const copy = [
      "Buy, sell, and trade in the marketplace with customer-to-customer trading.",
      "Official Bomb Party partnership for Amethyst collectors.",
      "Annual Silver plan includes unlimited AI and open-ended Nic-Nac chat.",
      "Join the social feed and message board.",
    ].join(" ");

    expect(findSparkleFinderCopyViolations(copy)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ phrase: "buy, sell" }),
        expect.objectContaining({ phrase: "marketplace" }),
        expect.objectContaining({ phrase: "customer-to-customer" }),
        expect.objectContaining({ phrase: "official bomb party partnership" }),
        expect.objectContaining({ phrase: "amethyst" }),
        expect.objectContaining({ phrase: "annual silver plan" }),
        expect.objectContaining({ phrase: "unlimited ai" }),
        expect.objectContaining({ phrase: "open-ended nic-nac chat" }),
        expect.objectContaining({ phrase: "social feed" }),
        expect.objectContaining({ phrase: "message board" }),
      ]),
    );
  });

  it("flags broader locked guardrail violations", () => {
    const copy = [
      "The rarity score tells you what to chase.",
      "Annual Silver membership unlocks collector automation.",
      "Try open-ended Nic-Nac search for every question.",
      "The official Bomb Party finder is here.",
      "Customer trading helps collectors swap directly.",
    ].join(" ");

    expect(findSparkleFinderCopyViolations(copy)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ phrase: "rarity score" }),
        expect.objectContaining({ phrase: "annual silver membership" }),
        expect.objectContaining({ phrase: "open-ended nic-nac search" }),
        expect.objectContaining({ phrase: "official bomb party finder" }),
        expect.objectContaining({ phrase: "customer trading" }),
      ]),
    );
  });

  it("flags hypey affiliate claims and official Bomb Party gear positioning", () => {
    const copy = [
      "The best ever organizer is guaranteed to be perfect for everyone.",
      "This official Bomb Party gear is a must-have, so buy now.",
    ].join(" ");

    expect(violationPhrases(copy)).toEqual([
      "best ever",
      "guaranteed",
      "perfect for everyone",
      "official bomb party gear",
      "must-have",
      "buy now",
    ]);
  });

  it("flags exact retailer affiliate and product URL patterns", () => {
    const copy = [
      "Amazon product URL: https://www.amazon.com/dp/B012345678?tag=sparkle-20",
      "Amazon affiliate URL: https://amzn.to/4abcdEF",
      "Walmart product URL: https://www.walmart.com/ip/123456789",
      "Target product URL: https://www.target.com/p/example/-/A-12345678",
      "Etsy product URL: https://www.etsy.com/listing/123456789/example",
    ].join(" ");

    expect(violationPhrases(copy)).toEqual([
      "amazon product url",
      "amazon affiliate url",
      "walmart product url",
      "target product url",
      "etsy product url",
    ]);
  });

  it("flags prohibited exact affiliate-content categories", () => {
    const copy = [
      "Live price: $24.99 today only.",
      "Copied retailer review: this stand arrived fast and looked amazing.",
      "2,431 customer reviews are already posted.",
      "Rated 4.8 out of 5 stars.",
      "Image source: Amazon retailer photo.",
      "Retailer image courtesy of Target.",
      "Exact product pick: Acrylic Gem Organizer Pro.",
      "Exact product selection for ring storage.",
    ].join(" ");

    expect(violationPhrases(copy)).toEqual([
      "live price",
      "copied retailer review",
      "review count",
      "star rating",
      "image source",
      "retailer image",
      "exact product pick",
      "exact product selection",
    ]);
  });

  it("allows normal affiliate disclaimer and compliance guidance", () => {
    const copy = [
      "Sparkle Finder is not a jewelry marketplace.",
      "Affiliate links must have clear disclosure.",
      "We do not call products guaranteed, perfect for everyone, or must-have.",
      "Do not use live prices, copied reviews, ratings, or retailer images.",
    ].join(" ");

    expect(findSparkleFinderCopyViolations(copy)).toEqual([]);
  });

  it("flags later promotional uses after allowed compliance guidance for the same phrase", () => {
    const copy = [
      "Do not call products guaranteed.",
      "This organizer is guaranteed.",
      "Do not use live prices or ratings.",
      "Live prices are updated hourly.",
      "Rated 4.9 out of 5 stars.",
    ].join(" ");

    expect(violationPhrases(copy)).toEqual(["guaranteed", "live price", "star rating"]);
  });

  it("allows approved Sparkle Finder wording", () => {
    const copy =
      "Browse for free. Let Nic-Nac hunt for you with Silver. Rep Trade Boards / Dance Floors. Silver Membership. Diamonds & Unicorns Library. Bomb Party labels. Nic-Nac, find this for me. Sparkle Finder is a discovery hub, not a jewelry marketplace. As an Amazon Associate I earn from qualifying purchases. Report a product or company concern.";

    expect(findSparkleFinderCopyViolations(copy)).toEqual([]);
  });
});
