"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type SignupDetails = {
  displayName: string;
  email: string;
  phone: string;
  state: string;
  password: string;
  privacyAcknowledged: boolean;
  promotionalEmail: boolean;
  promotionalSms: boolean;
};

export async function signUpWithPassword(formData: FormData) {
  const details = getSignupDetails(formData);

  if (!details.displayName || !details.email || !details.phone || !details.state || !details.password || !details.privacyAcknowledged) {
    redirect("/auth/sign-up?error=missing_required_fields");
  }

  let signupFailed = false;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email: details.email,
      password: details.password,
      options: {
        data: getDisplayMetadata(details),
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

export async function requestMagicLink(formData: FormData) {
  const details = getSignupDetails(formData);

  if (!details.displayName || !details.email || !details.phone || !details.state || !details.privacyAcknowledged) {
    redirect("/auth/sign-up?error=missing_required_fields");
  }

  let magicLinkFailed = false;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: details.email,
      options: {
        emailRedirectTo: getEmailRedirectTo(),
        data: getDisplayMetadata(details),
      },
    });

    if (error) {
      magicLinkFailed = true;
    }
  } catch {
    magicLinkFailed = true;
  }

  if (magicLinkFailed) {
    redirect("/auth/sign-up?error=magic_link_failed");
  }

  redirect("/auth/sign-in?message=check_email");
}

function getSignupDetails(formData: FormData): SignupDetails {
  return {
    displayName: String(formData.get("displayName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    state: String(formData.get("state") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    privacyAcknowledged: formData.get("privacyAcknowledged") === "yes",
    promotionalEmail: formData.get("promotionalEmail") === "yes",
    promotionalSms: formData.get("promotionalSms") === "yes",
  };
}

function getDisplayMetadata(details: SignupDetails) {
  return {
    display_name: details.displayName,
    phone: details.phone,
    state: details.state,
    privacy_acknowledged: details.privacyAcknowledged,
    promotional_email_opt_in: details.promotionalEmail,
    promotional_sms_opt_in: details.promotionalSms,
  };
}

function getEmailRedirectTo() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const origin = siteUrl.replace(/\/+$/, "");
  const next = encodeURIComponent("/silver?from=signup");

  return `${origin}/auth/confirm?next=${next}`;
}
