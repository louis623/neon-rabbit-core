export const sparkleFinderPublicOrigin = "https://yoursparklefinder.com";

export type PublicShareOutcome =
  | { status: "shared"; method: "native" }
  | { status: "copied"; method: "clipboard" | "legacy" }
  | { status: "cancelled"; method: "native" }
  | { status: "error"; method: "none" };

type ShareNavigator = {
  clipboard?: {
    writeText(text: string): Promise<void>;
  };
  share?: (data: ShareData) => Promise<void>;
};

type LegacyCopyDocument = Pick<Document, "body" | "createElement" | "execCommand">;

type PublicShareDependencies = {
  document?: LegacyCopyDocument | null;
  navigator?: ShareNavigator | null;
};

export function buildSparkleShowcasePath(handle: string): string {
  return `/showcase/${encodePublicSegment(handle)}`;
}

export function buildShowcaseCollectionPath(handle: string, collectionSlug: string): string {
  return `${buildSparkleShowcasePath(handle)}/showcase-collections/${encodePublicSegment(collectionSlug)}`;
}

export function buildRevealSpotlightPath(handle: string, pieceId: string): string {
  return `${buildSparkleShowcasePath(handle)}/pieces/${encodePublicSegment(pieceId)}`;
}

export function getCanonicalShowcaseUrl(
  pathname: string,
  configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL,
): string | null {
  if (!isPublicShowcasePath(pathname)) {
    return null;
  }

  const origin = normalizePublicOrigin(configuredOrigin) ?? sparkleFinderPublicOrigin;
  const url = new URL(pathname, `${origin}/`);

  if (url.pathname !== pathname) {
    return null;
  }

  return url.toString();
}

export async function sharePublicShowcaseLink(
  data: ShareData,
  dependencies: PublicShareDependencies = {},
): Promise<PublicShareOutcome> {
  const shareNavigator = dependencies.navigator ?? getBrowserNavigator();
  const shareDocument = dependencies.document === undefined ? getBrowserDocument() : dependencies.document;

  if (shareNavigator?.share) {
    try {
      await shareNavigator.share(data);
      return { status: "shared", method: "native" };
    } catch (error) {
      if (isShareCancellation(error)) {
        return { status: "cancelled", method: "native" };
      }
    }
  }

  if (data.url && shareNavigator?.clipboard?.writeText) {
    try {
      await shareNavigator.clipboard.writeText(data.url);
      return { status: "copied", method: "clipboard" };
    } catch {
      // Continue to the bounded legacy copy fallback below.
    }
  }

  if (data.url && copyWithLegacyDocument(data.url, shareDocument)) {
    return { status: "copied", method: "legacy" };
  }

  return { status: "error", method: "none" };
}

function encodePublicSegment(value: string): string {
  const normalized = value.trim();

  if (!normalized || normalized === "." || normalized === "..") {
    throw new Error("Public Showcase links require non-empty route segments.");
  }

  return encodeURIComponent(normalized);
}

function isPublicShowcasePath(pathname: string): boolean {
  if (
    !/^\/showcase\/[^/]+(?:\/(?:pieces|showcase-collections)\/[^/]+)?$/.test(pathname) ||
    pathname.includes("?") ||
    pathname.includes("#") ||
    pathname.includes("\\")
  ) {
    return false;
  }

  let segments: string[];

  try {
    segments = pathname.split("/").filter(Boolean).map((segment) => decodeURIComponent(segment));
  } catch {
    return false;
  }

  return segments.every((segment) => segment !== "." && segment !== ".." && !segment.includes("/") && !segment.includes("\\"));
}

function normalizePublicOrigin(value: string | undefined): string | null {
  if (!value?.trim()) {
    return null;
  }

  try {
    const url = new URL(value);
    const isLocalHttp = url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");

    if (url.protocol !== "https:" && !isLocalHttp) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

function isShareCancellation(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function copyWithLegacyDocument(text: string, document: LegacyCopyDocument | null): boolean {
  if (!document) {
    return false;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("aria-hidden", "true");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  textArea.style.pointerEvents = "none";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textArea.remove();
  }
}

function getBrowserNavigator(): ShareNavigator | null {
  return typeof navigator === "undefined" ? null : navigator;
}

function getBrowserDocument(): LegacyCopyDocument | null {
  return typeof document === "undefined" ? null : document;
}
