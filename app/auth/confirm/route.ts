import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { safeSparkleFinderNextPath } from "@/lib/sparkle-finder/safe-redirect";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL("/auth/sign-in?error=confirmation_failed", requestUrl.origin));
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error) {
      return NextResponse.redirect(new URL("/auth/sign-in?error=confirmation_failed", requestUrl.origin));
    }
  } catch {
    return NextResponse.redirect(new URL("/auth/sign-in?error=confirmation_failed", requestUrl.origin));
  }

  const postLoginUrl = new URL("/auth/post-login", requestUrl.origin);
  postLoginUrl.searchParams.set("next", safeSparkleFinderNextPath(requestUrl.searchParams.get("next")));

  return NextResponse.redirect(postLoginUrl);
}
