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

  it("flags social trading and marketplace drift in visible app copy", () => {
    const copy = [
      "Trade with this collector.",
      "Buy from this member.",
      "Sell your jewelry.",
      "Message seller.",
      "Customer marketplace.",
      "Send a friend request.",
      "DM me for details.",
      "Escrow is available.",
    ].join(" ");

    expect(findSparkleFinderCopyViolations(copy)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ phrase: "trade with this collector" }),
        expect.objectContaining({ phrase: "buy from this member" }),
        expect.objectContaining({ phrase: "sell your jewelry" }),
        expect.objectContaining({ phrase: "message seller" }),
        expect.objectContaining({ phrase: "customer marketplace" }),
        expect.objectContaining({ phrase: "friend request" }),
        expect.objectContaining({ phrase: "dm me" }),
        expect.objectContaining({ phrase: "escrow" }),
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

  it("allows a plain Amazon product resource URL without an affiliate tag", () => {
    const copy = "Photo setup resource: https://www.amazon.com/dp/B0C7Z93NPR";

    expect(findSparkleFinderCopyViolations(copy)).toEqual([]);
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

  it("allows product-resource compliance guidance without monetized placement copy", () => {
    const copy = [
      "Sparkle Finder is not a jewelry marketplace.",
      "Plain external resource links should avoid paid placement language.",
      "We do not call products guaranteed, perfect for everyone, or must-have.",
      "Do not use live prices, copied reviews, ratings, or retailer images.",
    ].join(" ");

    expect(findSparkleFinderCopyViolations(copy)).toEqual([]);
  });

  it("allows legal disclaimers only when they clearly say Sparkle Finder does not support social commerce", () => {
    const compliantCopy = [
      "Sparkle Finder does not support DMs, friend requests, customer-to-customer trading, customer marketplace features, escrow, payment, fulfillment, or disputes.",
      "Sparkle Finder does not support buying from members, selling your jewelry, or message seller workflows.",
    ].join(" ");
    const nonCompliantCopy = [
      "Sparkle Finder explains DMs, friend requests, customer marketplace features, escrow, and message seller workflows.",
      "Collectors can buy from this member or trade with this collector.",
    ].join(" ");

    expect(findSparkleFinderCopyViolations(compliantCopy)).toEqual([]);
    expect(violationPhrases(nonCompliantCopy)).toEqual(
      expect.arrayContaining([
        "customer marketplace",
        "escrow",
        "message seller",
        "buy from this member",
        "trade with this collector",
      ]),
    );
  });

  it("does not treat generic no copy as a social-commerce compliance disclaimer", () => {
    expect(violationPhrases("No fee customer marketplace for collectors.")).toContain("customer marketplace");
  });

  it("does not treat generic do-not marketing copy as a social-commerce compliance disclaimer", () => {
    expect(violationPhrases("Do not miss our customer marketplace for collectors.")).toContain(
      "customer marketplace",
    );
  });

  it("does not treat generic avoid marketing copy as a social-commerce compliance disclaimer", () => {
    expect(violationPhrases("Avoid escrow delays with our customer marketplace.")).toEqual(
      expect.arrayContaining(["escrow", "customer marketplace"]),
    );
  });

  it("only exempts the compliant banned phrase and still flags promotional mixed clauses", () => {
    expect(violationPhrases("Do not use DMs; use our customer marketplace for escrow.")).toEqual(
      expect.arrayContaining(["customer marketplace", "escrow"]),
    );
  });

  it("does not let comma-separated compliance phrasing hide later promotional clauses", () => {
    expect(violationPhrases("Do not use DMs, use our customer marketplace for escrow.")).toEqual(
      expect.arrayContaining(["customer marketplace", "escrow"]),
    );
  });

  it("does not let comma-separated compliance phrasing hide later try clauses", () => {
    expect(violationPhrases("Do not use DMs, try our customer marketplace for escrow.")).toEqual(
      expect.arrayContaining(["customer marketplace", "escrow"]),
    );
  });

  it("does not let comma-separated compliance phrasing hide later visit clauses", () => {
    expect(violationPhrases("Do not use DMs, visit our customer marketplace for escrow.")).toEqual(
      expect.arrayContaining(["customer marketplace", "escrow"]),
    );
  });

  it("does not let prior sentence compliance phrasing hide later promotional sentences", () => {
    expect(violationPhrases("Do not use DMs! Use our customer marketplace for escrow.")).toEqual(
      expect.arrayContaining(["customer marketplace", "escrow"]),
    );
  });

  it("does not treat generic not-a marketing copy as a social-commerce compliance disclaimer", () => {
    expect(violationPhrases("Not a boring customer marketplace for collectors.")).toContain(
      "customer marketplace",
    );
  });

  it("does not treat generic not-an escrow marketplace copy as a compliance disclaimer", () => {
    expect(violationPhrases("Not an escrow marketplace, a collector shortcut.")).toEqual(
      expect.arrayContaining(["escrow", "marketplace"]),
    );
  });

  it("does not treat generic must-not marketing copy as a social-commerce compliance disclaimer", () => {
    expect(violationPhrases("Must not miss our customer marketplace for collectors.")).toContain(
      "customer marketplace",
    );
  });

  it("does not treat generic prohibited marketing copy as a social-commerce compliance disclaimer", () => {
    expect(violationPhrases("The previously prohibited customer marketplace is now open.")).toContain(
      "customer marketplace",
    );
  });

  it("does not treat generic never-call marketing copy as a social-commerce compliance disclaimer", () => {
    expect(violationPhrases("Never call our customer marketplace boring.")).toContain(
      "customer marketplace",
    );
  });

  it("does not treat promotional does-not-support copy as a social-commerce compliance disclaimer", () => {
    expect(
      violationPhrases("Our customer marketplace does not support boring collector searches."),
    ).toContain("customer marketplace");
  });

  it("does not treat do-not-call customer marketplace copy as a compliance disclaimer", () => {
    expect(violationPhrases("Do not call our customer marketplace boring.")).toContain(
      "customer marketplace",
    );
  });

  it("does not treat do-not-call escrow marketplace copy as a compliance disclaimer", () => {
    expect(violationPhrases("Do not call our escrow marketplace boring.")).toEqual(
      expect.arrayContaining(["escrow", "marketplace"]),
    );
  });

  it("does not treat do-not-call prohibited customer marketplace copy as a compliance disclaimer", () => {
    expect(violationPhrases("Do not call this customer marketplace prohibited.")).toContain(
      "customer marketplace",
    );
  });

  it("does not treat unrelated Sparkle Finder does-not-support copy as a compliance disclaimer", () => {
    expect(
      violationPhrases("Sparkle Finder does not support boring collector searches in our customer marketplace."),
    ).toContain("customer marketplace");
  });

  it("does not treat previously prohibited Sparkle Finder copy as a compliance disclaimer", () => {
    expect(
      violationPhrases("Sparkle Finder says the previously prohibited customer marketplace is now open."),
    ).toContain("customer marketplace");
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
      "Nic-Nac. Rep Trade Boards / Dance Floors. Silver Membership. Diamonds & Unicorns Library. Bomb Party labels. Favorite Reps. Rep leads. Public Showcases. Sparkle Finder is a discovery hub, not a jewelry marketplace. Photo setup guidance can link to a plain external resource without paid placement language.";

    expect(findSparkleFinderCopyViolations(copy)).toEqual([]);
  });
});
