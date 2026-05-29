import { describe, expect, it } from "vitest";
import { findSparkleFinderCopyViolations } from "../../lib/sparkle-finder/copy-guardrails";

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

  it("allows approved Sparkle Finder wording", () => {
    const copy =
      "Browse for free. Let Nic-Nac hunt for you with Silver. Rep Trade Boards / Dance Floors. Silver Membership. Diamonds & Unicorns Library. Bomb Party labels. Nic-Nac, find this for me.";

    expect(findSparkleFinderCopyViolations(copy)).toEqual([]);
  });
});
