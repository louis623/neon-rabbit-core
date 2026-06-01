import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
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

  return NextResponse.redirect(new URL(getSafeNextPath(requestUrl.searchParams.get("next")), requestUrl.origin));
}

function getSafeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}
