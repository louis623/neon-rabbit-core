import { describe, expect, it } from "vitest";
import {
  calculateStudioImageDimensions,
  prepareShowcaseStudioImage,
} from "../../components/showcase/showcase-studio-image";

describe("Showcase Studio image preparation", () => {
  it("preserves portrait and landscape aspect ratios without square cropping", () => {
    expect(calculateStudioImageDimensions(3_024, 4_032)).toEqual({ width: 1_536, height: 2_048 });
    expect(calculateStudioImageDimensions(4_032, 3_024)).toEqual({ width: 2_048, height: 1_536 });
    expect(calculateStudioImageDimensions(900, 1_200)).toEqual({ width: 900, height: 1_200 });
  });

  it("rejects invalid dimensions", () => {
    expect(() => calculateStudioImageDimensions(0, 1_200)).toThrow("dimensions could not be read");
    expect(() => calculateStudioImageDimensions(Number.NaN, 1_200)).toThrow("dimensions could not be read");
  });

  it("rejects unsupported and oversized inputs before browser decoding", async () => {
    await expect(prepareShowcaseStudioImage(
      new File(["not-an-image"], "label.gif", { type: "image/gif" }),
    )).rejects.toThrow("JPG, PNG, or WebP");
    await expect(prepareShowcaseStudioImage(
      new File(["oversized"], "label.jpg", { type: "image/jpeg" }),
      { maxSourceBytes: 2 },
    )).rejects.toThrow("10 MB or smaller");
  });
});
