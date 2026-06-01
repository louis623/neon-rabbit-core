import { NextResponse } from "next/server";
import {
  isLocalPreviewAuthEnabled,
  parseSparkleFinderAuthMode,
  sparkleFinderAuthCookieName,
} from "@/lib/sparkle-finder/auth";

type PreviewAuthRouteContext = {
  params: Promise<{
    mode: string;
  }>;
};

export async function GET(_request: Request, context: PreviewAuthRouteContext) {
  const { mode } = await context.params;
  const authMode = parseSparkleFinderAuthMode(mode);
  const redirectPath = authMode === "anonymous" ? "/" : "/dashboard";
  const requestUrl = new URL(_request.url);
  const requestHost =
    getSafeLocalHost(_request.headers.get("host")) ?? getSafeLocalHost(requestUrl.host) ?? "127.0.0.1:4310";
  const requestOrigin = `${requestUrl.protocol}//${requestHost}`;

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

function getSafeLocalHost(host: string | null): string | null {
  if (!host) {
    return null;
  }

  let parsedHost: URL;

  try {
    parsedHost = new URL(`http://${host}`);
  } catch {
    return null;
  }

  const hostname = parsedHost.hostname.replace(/^\[(.*)\]$/, "$1");

  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" ? host : null;
}
