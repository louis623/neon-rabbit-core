import { describe, expect, it, vi } from "vitest";

import {
  defaultSparkleFinderAppearance,
  loadSparkleFinderAppearance,
  toSparkleFinderThemeStyle,
} from "@/lib/sparkle-finder/appearance";

describe("Sparkle Finder appearance", () => {
  it("loads the Suite-owned public appearance contract", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      schemaVersion: 1,
      preset: "amethyst",
      label: "Amethyst",
      description: "Lavender, hot pink, and glossy cards.",
      tokens: {
        background: "#E8DFF5",
        backgroundSoft: "#F2EBFA",
        surface: "#FFFFFF",
        surfaceSoft: "#F7F0FF",
        foreground: "#2A1F40",
        foregroundMuted: "#5C576A",
        primary: "#5C0EFF",
        primaryStrong: "#480DDF",
        accent: "#FF1AC2",
        border: "rgba(72, 13, 223, 0.18)",
        borderStrong: "rgba(72, 13, 223, 0.32)",
        panel: "#1A1230",
        panelText: "#FFFFFF",
        headingFont: "italiana",
        bodyFont: "inter",
      },
    }), { status: 200 }));

    const result = await loadSparkleFinderAppearance({
      apiBaseUrl: "https://suite.example",
      fetcher,
    });

    expect(fetcher).toHaveBeenCalledWith(
      "https://suite.example/api/public/finder/appearance",
      expect.objectContaining({ next: { revalidate: 30 } }),
    );
    expect(result.preset).toBe("amethyst");
  });

  it("fails safely to Amethyst and exposes semantic CSS variables", async () => {
    const result = await loadSparkleFinderAppearance({
      apiBaseUrl: "https://suite.example",
      fetcher: vi.fn().mockRejectedValue(new Error("offline")),
    });

    expect(result).toEqual(defaultSparkleFinderAppearance);
    expect(toSparkleFinderThemeStyle(result)).toMatchObject({
      "--sparkle-warm-bg": "#E8DFF5",
      "--sparkle-plum": "#5C0EFF",
      "--sparkle-rose": "#FF1AC2",
    });
  });
});
