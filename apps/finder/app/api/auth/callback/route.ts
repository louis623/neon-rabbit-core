import { NextResponse } from "next/server";
import { safeSparkleFinderNextPath } from "@/lib/sparkle-finder/safe-redirect";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/auth/sign-in?error=missing_oauth_code", requestUrl.origin));
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.warn("Sparkle Finder OAuth exchange failed", {
        name: error.name,
        message: error.message,
        status: "status" in error ? error.status : undefined,
        code: "code" in error ? error.code : undefined,
      });
      return NextResponse.redirect(new URL("/auth/sign-in?error=oauth_exchange_failed", requestUrl.origin));
    }
  } catch (error) {
    console.warn("Sparkle Finder OAuth exchange threw", {
      name: error instanceof Error ? error.name : undefined,
      message: error instanceof Error ? error.message : undefined,
    });
    return NextResponse.redirect(new URL("/auth/sign-in?error=oauth_exchange_failed", requestUrl.origin));
  }

  const postLoginUrl = new URL("/auth/post-login", requestUrl.origin);
  postLoginUrl.searchParams.set("next", safeSparkleFinderNextPath(requestUrl.searchParams.get("next")));

  return NextResponse.redirect(postLoginUrl);
}
