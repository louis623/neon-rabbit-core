import { NextResponse } from "next/server";
import {
  isLocalPreviewAuthEnabled,
  parseSparkleFinderAuthMode,
  sparkleFinderAuthCookieName,
} from "@/lib/sparkle-finder/auth";
import { getSparkleFinderOriginFromValue } from "@/lib/sparkle-finder/oauth-redirect";

type PreviewAuthRouteContext = {
  params: Promise<{
    mode: string;
  }>;
};

export async function GET(_request: Request, context: PreviewAuthRouteContext) {
  const { mode } = await context.params;
  const authMode = parseSparkleFinderAuthMode(mode);
  const redirectPath = "/";
  const requestUrl = new URL(_request.url);
  const requestOrigin = getSafeRequestOrigin(_request, requestUrl) ?? "http://127.0.0.1:4310";

  if (!isLocalPreviewAuthEnabled()) {
    return NextResponse.redirect(new URL("/auth/sign-in", requestOrigin));
  }

  const response = NextResponse.redirect(new URL(redirectPath, requestOrigin));

  response.cookies.set(sparkleFinderAuthCookieName, authMode, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return response;
}

function getSafeRequestOrigin(request: Request, requestUrl: URL): string | null {
  return (
    getSafeOriginFromHost(request.headers.get("host"), requestUrl.protocol) ??
    getSparkleFinderOriginFromValue(requestUrl.origin)
  );
}

function getSafeOriginFromHost(host: string | null, protocol: string): string | null {
  if (!host) {
    return null;
  }

  let parsedHost: URL;

  try {
    parsedHost = new URL(`http://${host}`);
  } catch {
    return null;
  }

  const safeProtocol = protocol === "https:" ? "https:" : "http:";

  return getSparkleFinderOriginFromValue(`${safeProtocol}//${parsedHost.host}`);
}
