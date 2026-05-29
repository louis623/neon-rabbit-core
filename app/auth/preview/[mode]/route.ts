import { NextResponse } from "next/server";
import {
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
  const redirectPath = authMode === "anonymous" ? "/auth/sign-in" : "/dashboard";
  const response = NextResponse.redirect(new URL(redirectPath, _request.url));

  response.cookies.set(sparkleFinderAuthCookieName, authMode, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return response;
}
