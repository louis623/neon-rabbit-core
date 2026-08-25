import { NextResponse } from "next/server";
import { sparkleFinderAuthCookieName } from "@/lib/sparkle-finder/auth";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const response = NextResponse.redirect(new URL("/", requestUrl.origin));

  response.cookies.set(sparkleFinderAuthCookieName, "anonymous", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
  });

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  return response;
}
