import type { CSSProperties } from "react";

export type SparkleFinderAppearance = {
  schemaVersion: 1;
  preset: string;
  label: string;
  description: string;
  tokens: {
    background: string;
    backgroundSoft: string;
    surface: string;
    surfaceSoft: string;
    foreground: string;
    foregroundMuted: string;
    primary: string;
    primaryStrong: string;
    accent: string;
    border: string;
    borderStrong: string;
    panel: string;
    panelText: string;
    headingFont: string;
    bodyFont: string;
  };
};

export const defaultSparkleFinderAppearance: SparkleFinderAppearance = {
  schemaVersion: 1,
  preset: "amethyst",
  label: "Amethyst",
  description: "The default high-sparkle Amethyst look with lavender, hot pink, and glossy cards.",
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
};

type AppearanceFetch = typeof fetch;

export async function loadSparkleFinderAppearance({
  apiBaseUrl = getSparkleSuiteApiBaseUrl(),
  fetcher = fetch,
}: {
  apiBaseUrl?: string;
  fetcher?: AppearanceFetch;
} = {}): Promise<SparkleFinderAppearance> {
  try {
    const response = await fetcher(`${apiBaseUrl.replace(/\/+$/, "")}/api/public/finder/appearance`, {
      headers: { accept: "application/json" },
      next: { revalidate: 30 },
    });
    if (!response.ok) return defaultSparkleFinderAppearance;
    const value = await response.json() as unknown;
    return isSparkleFinderAppearance(value) ? value : defaultSparkleFinderAppearance;
  } catch {
    return defaultSparkleFinderAppearance;
  }
}

export function toSparkleFinderThemeStyle(
  appearance: SparkleFinderAppearance,
): CSSProperties & Record<`--${string}`, string> {
  const { tokens } = appearance;
  return {
    "--background": tokens.background,
    "--foreground": tokens.foreground,
    "--sparkle-warm-bg": tokens.background,
    "--sparkle-blush-bg": tokens.backgroundSoft,
    "--sparkle-paper": tokens.surface,
    "--sparkle-paper-soft": tokens.surfaceSoft,
    "--sparkle-plum": tokens.primary,
    "--sparkle-plum-deep": tokens.primaryStrong,
    "--sparkle-ink-muted": tokens.foregroundMuted,
    "--sparkle-blush": tokens.backgroundSoft,
    "--sparkle-rose": tokens.accent,
    "--sparkle-coral": tokens.accent,
    "--sparkle-border": tokens.border,
    "--sparkle-border-strong": tokens.borderStrong,
    "--sparkle-panel": tokens.panel,
    "--sparkle-panel-text": tokens.panelText,
    "--finder-heading-font": fontVariable(tokens.headingFont, "heading"),
    "--finder-body-font": fontVariable(tokens.bodyFont, "body"),
  };
}

function getSparkleSuiteApiBaseUrl() {
  return (
    process.env.SPARKLE_SUITE_FINDER_API_BASE_URL
    ?? process.env.NEXT_PUBLIC_SPARKLE_SUITE_FINDER_API_BASE_URL
    ?? "https://www.yoursparklesuite.com"
  ).trim();
}

function fontVariable(value: string, kind: "heading" | "body") {
  if (value === "italiana") return "var(--font-italiana)";
  if (value === "inter") return "var(--font-inter)";
  return kind === "heading" ? "var(--font-playfair)" : "var(--font-dm-sans)";
}

function isSparkleFinderAppearance(value: unknown): value is SparkleFinderAppearance {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SparkleFinderAppearance>;
  if (candidate.schemaVersion !== 1 || typeof candidate.preset !== "string") return false;
  if (typeof candidate.label !== "string" || typeof candidate.description !== "string") return false;
  if (!candidate.tokens || typeof candidate.tokens !== "object") return false;
  const tokenValues = Object.values(candidate.tokens);
  return tokenValues.length === 15 && tokenValues.every((entry) => typeof entry === "string" && entry.length > 0);
}
