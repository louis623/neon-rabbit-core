import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSparkleFinderCanonicalRedirect } from "@/lib/sparkle-finder/canonical-domain";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const canonicalUrl = getSparkleFinderCanonicalRedirect(request.nextUrl);
  if (canonicalUrl) {
    return NextResponse.redirect(canonicalUrl, 308);
  }

  return await updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:avif|gif|ico|jpg|jpeg|png|svg|webp)$).*)"],
};
