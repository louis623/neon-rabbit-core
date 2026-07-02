"use server";

import { redirect } from "next/navigation";
import { getSparkleFinderSiteOrigin } from "@/lib/sparkle-finder/oauth-redirect";
import { safeSparkleFinderNextPath } from "@/lib/sparkle-finder/safe-redirect";
import { createClient } from "@/lib/supabase/server";

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const nextPath = safeSparkleFinderNextPath(String(formData.get("next") ?? "/"));

  if (!email) {
    redirect(getForgotPasswordRedirect("missing_email", nextPath));
  }

  let resetFailed = false;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getPasswordRecoveryRedirectTo(nextPath),
    });

    if (error) {
      resetFailed = true;
    }
  } catch {
    resetFailed = true;
  }

  if (resetFailed) {
    redirect(getForgotPasswordRedirect("reset_failed", nextPath));
  }

  redirect(getForgotPasswordMessageRedirect("check_email", nextPath));
}

function getPasswordRecoveryRedirectTo(nextPath: string) {
  const origin = getSparkleFinderSiteOrigin();

  return `${origin}/auth/confirm?next=${encodeURIComponent(nextPath)}`;
}

function getForgotPasswordRedirect(error: string, nextPath: string): string {
  const params = new URLSearchParams();

  if (nextPath !== "/") {
    params.set("next", nextPath);
  }

  params.set("error", error);

  return `/auth/forgot-password?${params.toString()}`;
}

function getForgotPasswordMessageRedirect(message: string, nextPath: string): string {
  const params = new URLSearchParams({ message });

  if (nextPath !== "/") {
    params.set("next", nextPath);
  }

  return `/auth/forgot-password?${params.toString()}`;
}
