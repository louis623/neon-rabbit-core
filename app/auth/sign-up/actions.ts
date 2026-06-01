"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUpWithPassword(formData: FormData) {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const privacyAcknowledged = formData.get("privacyAcknowledged") === "yes";
  const promotionalEmail = formData.get("promotionalEmail") === "yes";
  const promotionalSms = formData.get("promotionalSms") === "yes";

  if (!displayName || !email || !phone || !state || !password || !privacyAcknowledged) {
    redirect("/auth/sign-up?error=missing_required_fields");
  }

  let signupFailed = false;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          phone,
          state,
          privacy_acknowledged: privacyAcknowledged,
          promotional_email_opt_in: promotionalEmail,
          promotional_sms_opt_in: promotionalSms,
        },
      },
    });

    if (error) {
      signupFailed = true;
    }
  } catch {
    signupFailed = true;
  }

  if (signupFailed) {
    redirect("/auth/sign-up?error=signup_failed");
  }

  redirect("/auth/sign-in?message=check_email");
}
