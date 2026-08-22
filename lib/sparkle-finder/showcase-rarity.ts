import type { JewelryItem } from "./types";
import type { SparkleShowcaseItemStatus, SparkleShowcasePiece } from "./showcase-types";

type RarestRevealInput = {
  bpLabel?: JewelryItem["bpLabel"] | null;
  isRarestReveal: boolean;
  showcaseStatus: SparkleShowcaseItemStatus;
  state: SparkleShowcasePiece["state"];
};

export function canSelectRarestReveal(showcaseStatus: SparkleShowcaseItemStatus): boolean {
  return showcaseStatus === "owned";
}

export function normalizeRarestRevealSelection(
  showcaseStatus: SparkleShowcaseItemStatus,
  requested: boolean,
): boolean {
  return canSelectRarestReveal(showcaseStatus) && requested;
}

export function qualifiesForRarestReveals(input: RarestRevealInput): boolean {
  return input.state === "owned" &&
    input.showcaseStatus === "owned" &&
    (input.isRarestReveal || input.bpLabel === "diamond" || input.bpLabel === "unicorn");
}

export function isWantedShowcasePiece(piece: Pick<SparkleShowcasePiece, "showcaseStatus">): boolean {
  return piece.showcaseStatus === "wishlist" || piece.showcaseStatus === "iso";
}

export function getShowcaseSpotlightLabel(
  piece: Pick<SparkleShowcasePiece, "showcaseStatus">,
): "Piece Spotlight" | "Reveal Spotlight" {
  return isWantedShowcasePiece(piece) ? "Piece Spotlight" : "Reveal Spotlight";
}
